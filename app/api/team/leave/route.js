import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

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

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, team_id, team_role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
    }

    // Verify user is on the team
    if (userProfile.team_id !== teamId) {
      return NextResponse.json({ error: 'You are not on this team.' }, { status: 400 })
    }

    // Prevent leader from leaving (they should disband instead)
    if (userProfile.team_role === 'leader') {
      return NextResponse.json(
        { error: 'Team leaders cannot leave. Please disband the team or transfer leadership first.' },
        { status: 400 }
      )
    }

    // Clear user's team_id and team_role
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        team_id: null,
        team_role: null,
      })
      .eq('id', user.id)

    if (profileUpdateError) {
      return NextResponse.json({ error: 'Unable to update profile.' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: 'You have left the team successfully.',
    })
  } catch (unexpectedError) {
    return NextResponse.json(
      { error: unexpectedError.message || 'Unexpected error in leave team API.' },
      { status: 500 }
    )
  }
}
