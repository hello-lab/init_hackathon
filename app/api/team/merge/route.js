import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { selectTeamByIdSafe } from '@/lib/dashboardHelpers'
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

async function loadTeam(supabase, teamId) {
  const { data, error } = await selectTeamByIdSafe(
    supabase,
    teamId,
    'id, name, number, owner_id, is_merged'
  )

  if (error || !data) {
    return { team: null, error: error || new Error('Team not found.') }
  }

  return { team: data, error: null }
}

export async function POST(request) {
  try {
    let payload = null

    try {
      payload = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 })
    }

    const initiatorTeamId = String(payload?.initiatorTeamId || '').trim()
    const targetTeamId = String(payload?.targetTeamId || '').trim()
    const action = String(payload?.action || 'check').trim().toLowerCase()

    if (!initiatorTeamId || !targetTeamId) {
      return NextResponse.json({ error: 'Missing team ids.' }, { status: 400 })
    }

    if (initiatorTeamId === targetTeamId) {
      return NextResponse.json({ error: 'Teams must be different.' }, { status: 400 })
    }

    const supabase = await createClient()

    const [{ team: initiatorTeam, error: initiatorError }, { team: targetTeam, error: targetError }] =
      await Promise.all([
        loadTeam(supabase, initiatorTeamId),
        loadTeam(supabase, targetTeamId),
      ])

    if (initiatorError || targetError || !initiatorTeam || !targetTeam) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 404 })
    }

    if (initiatorTeam.is_merged || targetTeam.is_merged) {
      return NextResponse.json({ error: 'One or both teams have already been merged into another team.' }, { status: 400 })
    }

    // Count members in both teams by querying profiles
    const [{ count: initiatorCount }, { count: targetCount }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', initiatorTeamId),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', targetTeamId),
    ])

    const combinedCount = (initiatorCount || 0) + (targetCount || 0)
    const isWithinLimit = combinedCount <= TEAM_MEMBER_LIMIT

    if (action === 'check') {
      return NextResponse.json({
        ok: isWithinLimit,
        combinedCount,
        limit: TEAM_MEMBER_LIMIT,
        initiatorTeam: { id: initiatorTeam.id, name: initiatorTeam.name },
        targetTeam: { id: targetTeam.id, name: targetTeam.name },
      })
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('team_id, team_role')
      .eq('id', user.id)
      .single()

    const isLeader =
      profile?.team_id === targetTeam.id &&
      profile?.team_role === 'leader'

    if (!isLeader) {
      return NextResponse.json({ error: 'Only team leaders can merge.' }, { status: 403 })
    }

    if (!isWithinLimit) {
      return NextResponse.json({
        error: `Combined team size exceeds ${TEAM_MEMBER_LIMIT}.`,
        combinedCount,
        limit: TEAM_MEMBER_LIMIT,
      })
    }

    const mergedName = `${initiatorTeam.name} + ${targetTeam.name}`

    const { error: updateInitiatorError } = await supabase
      .from('teams')
      .update({
        name: mergedName,
      })
      .eq('id', initiatorTeam.id)

    if (updateInitiatorError) {
      return NextResponse.json({ error: 'Unable to update initiator team.' }, { status: 500 })
    }

    const { error: markTargetMergedError } = await supabase
      .from('teams')
      .update({ is_merged: true })
      .eq('id', targetTeam.id)

    if (markTargetMergedError && markTargetMergedError.code !== '42703') {
      return NextResponse.json({ error: 'Unable to mark target team as merged.' }, { status: 500 })
    }

    // Update all members from target team to adopt initiator team's team_id
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ team_id: initiatorTeam.id, team_role: 'member' })
      .eq('team_id', targetTeam.id)

    if (profileUpdateError) {
      return NextResponse.json({ error: 'Unable to update member profiles.' }, { status: 500 })
    }

    const { error: leaderUpdateError } = await supabase
      .from('profiles')
      .update({ team_role: 'leader' })
      .eq('id', initiatorTeam.owner_id)

    if (leaderUpdateError) {
      return NextResponse.json({ error: 'Unable to set team leader.' }, { status: 500 })
    }

    const { data: updatedTeam } = await supabase
      .from('teams')
      .select('*')
      .eq('id', initiatorTeam.id)
      .single()

    const sheetId = process.env.SHEET_ID
    const range = process.env.TEAMS_SHEET_RANGE || DEFAULT_TEAMS_RANGE

    if (sheetId) {
      try {
        const accessToken = await getGoogleAccessToken()
        const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values`
        
        const getUrl = `${baseUrl}/${encodeURIComponent(range)}`
        const getResponse = await fetch(getUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (getResponse.ok) {
          const getData = await getResponse.json()
          const rows = getData?.values || []
          const updates = []

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            const rowTeamName = row[1]

            if (rowTeamName === initiatorTeam.name || rowTeamName === targetTeam.name) {
              const rowIndex = i + 1
              const memberEmail = row[2] || ''
              const updateRange = `Teams!A${rowIndex}:D${rowIndex}`
              
              updates.push({
                range: updateRange,
                values: [[
                  initiatorTeam.number ?? '',
                  mergedName,
                  memberEmail,
                  combinedCount,
                ]],
              })
            }
          }

          if (updates.length > 0) {
            const batchUpdateUrl = `${baseUrl}:batchUpdate`
            await fetch(batchUpdateUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                valueInputOption: 'USER_ENTERED',
                data: updates,
              }),
            })
          }
        }
      } catch (sheetError) {
        console.error('Sheet update failed:', sheetError)
      }
    }

    return NextResponse.json({ ok: true, team: updatedTeam || { id: initiatorTeam.id, name: mergedName } })
  } catch (unexpectedError) {
    return NextResponse.json(
      { error: unexpectedError.message || 'Unexpected error in merge API.' },
      { status: 500 }
    )
  }
}
