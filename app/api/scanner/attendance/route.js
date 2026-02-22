import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const SHEET_RANGE = 'Attendance!A:G'
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

async function ensureAttendanceSheet(accessToken, sheetId) {
  // Get spreadsheet metadata to check if Attendance sheet exists
  const metadataResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!metadataResponse.ok) {
    throw new Error('Failed to get spreadsheet metadata.')
  }

  const spreadsheet = await metadataResponse.json()
  const sheets = spreadsheet.sheets || []
  const attendanceSheetExists = sheets.some((sheet) => sheet.properties.title === 'Attendance')

  if (!attendanceSheetExists) {
    // Create new sheet named "Attendance"
    const batchUpdateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Attendance',
                  index: sheets.length,
                },
              },
            },
          ],
        }),
      }
    )

    if (!batchUpdateResponse.ok) {
      const error = await batchUpdateResponse.json()
      throw new Error(`Failed to create Attendance sheet: ${JSON.stringify(error)}`)
    }

    // Add header row
    const headerResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Attendance!A1:G1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [['User ID', 'Full Name', 'Username', 'Email', 'Team Name', 'Role', 'Timestamp']],
        }),
      }
    )

    if (!headerResponse.ok) {
      const error = await headerResponse.json()
      throw new Error(`Failed to add headers to Attendance sheet: ${JSON.stringify(error)}`)
    }
  }
}

async function ensureTeamAssignSheet(accessToken, sheetId) {
  // Get spreadsheet metadata to check if TeamAssign sheet exists
  const metadataResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!metadataResponse.ok) {
    throw new Error('Failed to get spreadsheet metadata.')
  }

  const spreadsheet = await metadataResponse.json()
  const sheets = spreadsheet.sheets || []
  const teamAssignSheetExists = sheets.some((sheet) => sheet.properties.title === 'TeamAssign')

  if (!teamAssignSheetExists) {
    // Create new sheet named "TeamAssign"
    const batchUpdateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'TeamAssign',
                  index: sheets.length,
                },
              },
            },
          ],
        }),
      }
    )

    if (!batchUpdateResponse.ok) {
      const error = await batchUpdateResponse.json()
      throw new Error(`Failed to create TeamAssign sheet: ${JSON.stringify(error)}`)
    }

    // Add header row
    const headerResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/TeamAssign!A1:B1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [['Team Number', 'Team Name']],
        }),
      }
    )

    if (!headerResponse.ok) {
      const error = await headerResponse.json()
      throw new Error(`Failed to add headers to TeamAssign sheet: ${JSON.stringify(error)}`)
    }
  }
}

async function assignTeamNumber(accessToken, sheetId, teamName) {
  if (!teamName || teamName === 'No Team') {
    return // Skip teams with no name
  }

  try {
    // Ensure TeamAssign sheet exists
    await ensureTeamAssignSheet(accessToken, sheetId)

    // Get existing teams from TeamAssign sheet
    const getResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${TEAM_ASSIGN_RANGE}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!getResponse.ok) {
      throw new Error('Failed to read TeamAssign sheet.')
    }

    const getData = await getResponse.json()
    const rows = getData?.values || []

    // Check if team already exists (skip header row)
    const existingTeam = rows.slice(1).find((row) => row[1] === teamName)
    if (existingTeam) {
      return // Team already assigned, don't add again
    }

    // Find the highest team number
    let maxTeamNumber = 0
    for (let i = 1; i < rows.length; i++) {
      const teamNumber = parseInt(rows[i][0])
      if (!isNaN(teamNumber) && teamNumber > maxTeamNumber) {
        maxTeamNumber = teamNumber
      }
    }

    const newTeamNumber = maxTeamNumber + 1

    // Append new team
    const appendResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${TEAM_ASSIGN_RANGE}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[newTeamNumber, teamName]],
        }),
      }
    )

    if (!appendResponse.ok) {
      throw new Error('Failed to append to TeamAssign sheet.')
    }
  } catch (error) {
    console.error('TeamAssign error:', error)
    // Don't fail the entire request if team assignment fails
  }
}

export async function POST(request) {
  try {
    let payload = null

    try {
      payload = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 })
    }

    const userId = String(payload?.userId || '').trim()
    const fullName = String(payload?.fullName || 'Unknown').trim()
    const username = String(payload?.username || '').trim()
    const email = String(payload?.email || '').trim()
    const teamName = String(payload?.teamName || 'No Team').trim()
    const userRole = String(payload?.userRole || 'participant').trim()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId.' }, { status: 400 })
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

    // Ensure Attendance sheet exists
    try {
      await ensureAttendanceSheet(accessToken, sheetId)
    } catch (sheetError) {
      return NextResponse.json(
        { error: sheetError.message || 'Failed to ensure Attendance sheet exists.' },
        { status: 500 }
      )
    }

    const timestamp = new Date().toISOString()
    const values = [[userId, fullName, username, email, teamName, userRole, timestamp]]

    const appendResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${SHEET_RANGE}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values,
        }),
      }
    )

    if (!appendResponse.ok) {
      const errorData = await appendResponse.json()
      console.error('Google Sheets append error:', errorData)
      return NextResponse.json(
        {
          error: 'Failed to append to Google Sheets.',
          details: errorData,
        },
        { status: 500 }
      )
    }

    const result = await appendResponse.json()

    // Assign team number if this is the first member of the team to mark attendance
    await assignTeamNumber(accessToken, sheetId, teamName)

    return NextResponse.json({
      success: true,
      message: 'User marked as present.',
      updates: result.updates,
    })
  } catch (error) {
    console.error('Attendance API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error.' },
      { status: 500 }
    )
  }
}
