import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import MergeClient from './MergeClient'
import { getUserProfile, selectTeamByIdSafe } from '@/lib/dashboardHelpers'

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
    const { data } = await selectTeamByIdSafe(
      supabase,
      initiatorTeamId,
      'id, name, is_merged'
    )

    initiatorTeam = data || null
  }

  const profile = await getUserProfile(supabase, user.id)
  const targetTeamId = profile?.team_id || ''
  let targetTeam = null

  if (targetTeamId) {
    const { data } = await selectTeamByIdSafe(
      supabase,
      targetTeamId,
      'id, name, owner_id, is_merged'
    )

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
