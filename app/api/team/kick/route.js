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
    const memberId = String(payload?.memberId || '').trim()

    if (!teamId || !memberId) {
      return NextResponse.json({ error: 'Missing teamId or memberId.' }, { status: 400 })
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
      return NextResponse.json({ error: 'Only team leaders can kick members.' }, { status: 403 })
    }

    // Prevent kicking yourself
    if (user.id === memberId) {
      return NextResponse.json({ error: 'Cannot kick yourself. Use disband team instead.' }, { status: 400 })
    }

    // Get member to be kicked
    const { data: memberProfile, error: memberError } = await supabase
      .from('profiles')
      .select('id, team_id')
      .eq('id', memberId)
      .single()

    if (memberError || !memberProfile) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
    }

    // Verify member is on the team
    if (memberProfile.team_id !== teamId) {
      return NextResponse.json({ error: 'Member is not on this team.' }, { status: 400 })
    }

    // Clear member's team_id and team_role
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        team_id: null,
        team_role: null,
      })
      .eq('id', memberId)

    if (profileUpdateError) {
      return NextResponse.json({ error: 'Unable to update member profile.' }, { status: 500 })
    }

    // Count remaining team members
    const { count: memberCount, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)

    const finalCount = memberCount || 0

    return NextResponse.json({
      ok: true,
      message: 'Member kicked successfully.',
      memberCount: finalCount,
    })
  } catch (unexpectedError) {
    return NextResponse.json(
      { error: unexpectedError.message || 'Unexpected error in kick member API.' },
      { status: 500 }
    )
  }
}
