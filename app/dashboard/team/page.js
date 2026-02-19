import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile, getTeamData, getTeamMembers } from '@/lib/dashboardHelpers'
import TeamClient from './TeamClient'

export default async function TeamPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile(supabase, user.id)

  let team = null
  let members = []
  if (profile?.team_id) {
    team = await getTeamData(supabase, profile.team_id)
    if (team) {
      members = await getTeamMembers(supabase, team.id)
      console.log(team)

    }
  }

  const isLeader = !!team && (team.owner_id === user.id || profile?.team_role === 'leader')

  return <TeamClient user={user} team={team} members={members} isLeader={isLeader} />
}
