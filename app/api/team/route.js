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
		const memberId = String(payload?.memberId || '').trim()
		const supabase = await createClient()
		const { data: team, error } = await supabase
			.from('teams')
			.select('id,number, name, team_members')
			.eq('id', teamId)
			.single()

		if (error || !team) {
			return NextResponse.json({ error: 'Team not found.' }, { status: 404 })
		}

		const members = Array.isArray(team.team_members) ? team.team_members : []
		const memberCount = members.length
		const isFull = memberCount >= TEAM_MEMBER_LIMIT

		if (action !== 'sync') {
			return NextResponse.json({
				ok: !isFull,
				memberCount,
				limit: TEAM_MEMBER_LIMIT,
			})
		}

		if (!memberId) {
			return NextResponse.json({ error: 'Missing memberId.' }, { status: 400 })
		}

		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('email')
			.eq('id', memberId)
			.single()

		if (profileError) {
			return NextResponse.json(
				{
					error: 'Unable to load member email.',
					code: profileError.code,
					details: profileError.details,
					hint: profileError.hint,
					message: profileError.message,
				},
				{ status: 500 }
			)
		}

		const memberEmail = String(profile?.email || '').trim()
		if (!memberEmail) {
			return NextResponse.json({ error: 'Member email not found.' }, { status: 400 })
		}

		const sheetId = process.env.SHEET_ID
		const range = process.env.TEAMS_SHEET_RANGE || DEFAULT_TEAMS_RANGE

		if (!sheetId) {
			return NextResponse.json({ error: 'Missing SHEET_ID' }, { status: 500 })
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

		const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values`
		const rowValues = [[team.number ?? '', team.name || '', memberEmail, memberCount]]

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
			return NextResponse.json(
				{ error: `Unable to append to Teams sheet. ${errorText}`.trim() },
				{ status: 500 }
			)
		}

		return NextResponse.json({ ok: true, memberCount, limit: TEAM_MEMBER_LIMIT })
	} catch (unexpectedError) {
		return NextResponse.json(
			{ error: unexpectedError.message || 'Unexpected error in team API.' },
			{ status: 500 }
		)
	}
}
