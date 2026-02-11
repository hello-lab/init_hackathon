import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import MergeClient from './MergeClient'
import { getUserProfile } from '@/lib/dashboardHelpers'

export default async function MergeTeamPage({ searchParams }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const resolvedSearchParams = await searchParams
  const rawTeamId =
    resolvedSearchParams?.mergeteam ||
    resolvedSearchParams?.teamId ||
    resolvedSearchParams?.team ||
    resolvedSearchParams?.id
  const initiatorTeamId = Array.isArray(rawTeamId) ? rawTeamId[0] : rawTeamId || ''

  let initiatorTeam = null
  if (initiatorTeamId) {
    const { data } = await supabase
      .from('teams')
      .select('id, name, team_members, member_emails, is_merged')
      .eq('id', initiatorTeamId)
      .single()

    initiatorTeam = data || null
  }

  const profile = await getUserProfile(supabase, user.id)
  const targetTeamId = profile?.team_id || ''
  let targetTeam = null

  if (targetTeamId) {
    const { data } = await supabase
      .from('teams')
      .select('id, name, team_members, member_emails, owner_id, is_merged')
      .eq('id', targetTeamId)
      .single()

    targetTeam = data || null
  }

  const isLeader = !!targetTeam && (targetTeam.owner_id === user.id || profile?.team_role === 'leader')

  return (
    <MergeClient
      user={user}
      initiatorTeam={initiatorTeam}
      initiatorTeamId={initiatorTeamId}
      targetTeam={targetTeam}
      isLeader={isLeader}
    />
  )
}
