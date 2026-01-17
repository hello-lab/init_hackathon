import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { DUMMY_TEAMS, DUMMY_MEMBERS } from '@/lib/dashboardHelpers'
import TeamClient from './TeamClient'

export default async function TeamPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const team = DUMMY_TEAMS[0]
  const members = DUMMY_MEMBERS
  const isLeader = members[0].id === user.id // First member is leader for demo

  return <TeamClient user={user} team={team} members={members} isLeader={isLeader} />
}
