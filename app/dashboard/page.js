import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

import { createClient } from '@/lib/supabase/server'
import { DUMMY_TEAMS, DUMMY_MEMBERS } from '@/lib/dashboardHelpers'

async function getDashboardData(user) {
  const hackathonStatus = 'live'
  const team = DUMMY_TEAMS[0]
  const members = DUMMY_MEMBERS

  return {
    user,
    team,
    members,
    hackathonStatus,
  }
}

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const dashboardData = await getDashboardData(user)

  return <DashboardClient user={user} dashboardData={dashboardData} />
}
