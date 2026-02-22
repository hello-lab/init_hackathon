import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const TEAM_ASSIGN_RANGE = 'TeamAssign!A:B'

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

    const teamName = String(payload?.teamName || '').trim()

    if (!teamName || teamName === 'No Team') {
      return NextResponse.json({ teamNumber: null })
    }

    const sheetId = process.env.SHEET_ID
    if (!sheetId) {
      return NextResponse.json({ error: 'Missing SHEET_ID' }, { status: 500 })
    }

    let accessToken = ''
    try {
      accessToken = await getGoogleAccessToken()
    } catch (tokenError) {
      return NextResponse.json(
        { error: tokenError.message || 'Failed to authenticate with Google.' },
        { status: 500 }
      )
    }

    // Try to read TeamAssign sheet
    let rows = []
    try {
      const getResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${TEAM_ASSIGN_RANGE}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (getResponse.ok) {
        const getData = await getResponse.json()
        rows = getData?.values || []
      }
    } catch (error) {
      console.error('Failed to read TeamAssign sheet:', error)
    }

    // Check if team already exists (skip header row)
    const existingTeam = rows.slice(1).find((row) => row[1] === teamName)
    if (existingTeam) {
      const teamNumber = parseInt(existingTeam[0])
      return NextResponse.json({ teamNumber: isNaN(teamNumber) ? null : teamNumber })
    }

    // Find the highest team number to determine next number
    let maxTeamNumber = 0
    for (let i = 1; i < rows.length; i++) {
      const teamNumber = parseInt(rows[i][0])
      if (!isNaN(teamNumber) && teamNumber > maxTeamNumber) {
        maxTeamNumber = teamNumber
      }
    }

    const nextTeamNumber = maxTeamNumber + 1

    return NextResponse.json({ teamNumber: nextTeamNumber, isNext: true })
  } catch (error) {
    console.error('Team number API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    )
  }
}
