import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

import { createClient } from '@/lib/supabase/server'
import {
  getUserProfile,
  getTeamData,
  getTeamMembers,
  getHackathonStatus,
} from '@/lib/dashboardHelpers'

async function getDashboardData(supabase, user) {
  const profile = await getUserProfile(supabase, user.id)
  const hackathonMeta = await getHackathonStatus(supabase)
  const hackathonStatus = 'live'

  let team = null
  let members = []

  if (profile?.team_id) {
    team = await getTeamData(supabase, profile.team_id)
    if (team) {
      members = await getTeamMembers(supabase, team.id)
      // fetch track metadata for the team's assigned track (if any)
      if (team.track) {
        try {
          const { data: track } = await supabase.from('tracks').select('*').eq('id', team.track).single()
          if (track) team.track_info = track
        } catch (err) {
          // ignore track fetch errors
          console.warn('Failed to fetch track info for dashboard:', err)
        }
      }
    }
  }

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

  const dashboardData = await getDashboardData(supabase, user)

  return <DashboardClient user={user} dashboardData={dashboardData} />
}
