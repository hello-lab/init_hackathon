import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

const TEAM_MEMBER_LIMIT = 6
const DEFAULT_TEAMS_RANGE = 'Teams!A:D'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

function base64UrlEncode(value) {
	return Buffer.from(value)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/g, '')
}

async function getGoogleAccessToken() {
	const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
	const rawPrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
	const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : ''

	if (!clientEmail || !privateKey) {
		throw new Error('Missing service account credentials.')
	}

	const now = Math.floor(Date.now() / 1000)
	const header = { alg: 'RS256', typ: 'JWT' }
	const claimSet = {
		iss: clientEmail,
		scope: GOOGLE_SHEETS_SCOPE,
		aud: GOOGLE_TOKEN_URL,
		exp: now + 3600,
		iat: now,
	}

	const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
		JSON.stringify(claimSet)
	)}`
	const signer = crypto.createSign('RSA-SHA256')
	signer.update(unsignedToken)
	signer.end()
	const signature = signer.sign(privateKey)
	const jwt = `${unsignedToken}.${base64UrlEncode(signature)}`

	const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			assertion: jwt,
		}),
	})

	if (!tokenResponse.ok) {
		const errorText = await tokenResponse.text().catch(() => '')
		throw new Error(`Unable to fetch service account token. ${errorText}`.trim())
	}

	const tokenPayload = await tokenResponse.json()
	if (!tokenPayload?.access_token) {
		throw new Error('Missing access token from Google.')
	}

	return tokenPayload.access_token
}

export async function POST(request) {
	try {
		let payload = null

		try {
			payload = await request.json()
		} catch {
			return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 })
		}

		const teamId = String(payload?.teamId || '').trim()
		if (!teamId) {
			return NextResponse.json({ error: 'Missing teamId.' }, { status: 400 })
		}

		const action = String(payload?.action || 'check').trim().toLowerCase()
		const supabase = await createClient()

		// Verify team exists
		const { data: team, error: teamError } = await supabase
			.from('teams')
			.select('id, number, name')
			.eq('id', teamId)
			.single()

		if (teamError || !team) {
			return NextResponse.json({ error: 'Team not found.' }, { status: 404 })
		}

		// Count current team members
		const { count: memberCount, error: countError } = await supabase
			.from('profiles')
			.select('id', { count: 'exact', head: true })
			.eq('team_id', teamId)

		if (countError) {
			return NextResponse.json({ error: 'Unable to fetch member count.' }, { status: 500 })
		}

		const isFull = (memberCount || 0) >= TEAM_MEMBER_LIMIT

		// Mode 1: Check if team has capacity (used before joining)
		if (action !== 'sync') {
			return NextResponse.json({
				ok: !isFull,
				memberCount: memberCount || 0,
				limit: TEAM_MEMBER_LIMIT,
			})
		}

		// Mode 2: Sync to Google Sheets (used after joining/creating/merging)
		const memberId = String(payload?.memberId || '').trim()
		if (!memberId) {
			return NextResponse.json({ error: 'Missing memberId for sync action.' }, { status: 400 })
		}

		// Get authenticated user to prevent unauthorized syncs
		const { data: { user }, error: authError } = await supabase.auth.getUser()
		if (authError || !user) {
			return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
		}

		// Verify the memberId being synced is either the user or they're an admin (basic auth check)
		if (user.id !== memberId) {
			return NextResponse.json({ error: 'Cannot sync another user to sheets.' }, { status: 403 })
		}

		// Get member email for Google Sheets
		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('email')
			.eq('id', memberId)
			.single()

		if (profileError || !profile?.email) {
			return NextResponse.json({ error: 'Unable to load member email.' }, { status: 404 })
		}

		const memberEmail = String(profile.email).trim()

		const sheetId = process.env.SHEET_ID
		const range = process.env.TEAMS_SHEET_RANGE || DEFAULT_TEAMS_RANGE

		if (!sheetId) {
			return NextResponse.json({ error: 'Missing SHEET_ID configuration.' }, { status: 500 })
		}

		let accessToken = ''
		try {
			accessToken = await getGoogleAccessToken()
		} catch (tokenError) {
			return NextResponse.json(
				{ error: tokenError.message || 'Unable to authenticate with Google.' },
				{ status: 500 }
			)
		}

		// Append member to Google Sheets
		const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values`
		const rowValues = [[team.number ?? '', team.name || '', memberEmail, memberCount || 0]]

		const appendUrl = `${baseUrl}/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`
		const appendResponse = await fetch(appendUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify({ values: rowValues }),
		})

		if (!appendResponse.ok) {
			const errorText = await appendResponse.text().catch(() => '')
			console.error('Google Sheets append failed:', errorText)
			return NextResponse.json(
				{ error: `Unable to append to Teams sheet. ${errorText}`.trim() },
				{ status: 500 }
			)
		}

		return NextResponse.json({ ok: true, memberCount: memberCount || 0, limit: TEAM_MEMBER_LIMIT })
	} catch (unexpectedError) {
		console.error('Team API error:', unexpectedError)
		return NextResponse.json(
			{ error: unexpectedError.message || 'Unexpected error in team API.' },
			{ status: 500 }
		)
	}
}
