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

    // Check if current user is the team leader
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('team_id, team_role')
      .eq('id', user.id)
      .single()

    const isLeader =
      userProfile?.team_id === teamId &&
      userProfile?.team_role === 'leader'

    if (!isLeader) {
      return NextResponse.json({ error: 'Only team leaders can disband teams.' }, { status: 403 })
    }

    // Clear all members' team_id and team_role
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        team_id: null,
        team_role: null,
      })
      .eq('team_id', teamId)

    if (profileUpdateError) {
      return NextResponse.json({ error: 'Unable to update member profiles.' }, { status: 500 })
    }

    // Delete the team
    const { error: deleteError } = await supabase.from('teams').delete().eq('id', teamId)

    if (deleteError) {
      return NextResponse.json({ error: 'Unable to delete team.' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: 'Team disbanded successfully. All members have been removed.',
    })
  } catch (unexpectedError) {
    return NextResponse.json(
      { error: unexpectedError.message || 'Unexpected error in disband team API.' },
      { status: 500 }
    )
  }
}
