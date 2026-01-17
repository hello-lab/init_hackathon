import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { DUMMY_TRACKS } from '@/lib/dashboardHelpers'
import TracksClient from './TracksClient'

export default async function TracksPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Dummy data - in production, fetch from DB
  const selectedTrack = null // user has not selected a track yet
  const hackathonStatus = 'live'
  const adminAllowsSelection = true

  const isSelectionEnabled = hackathonStatus === 'live' && adminAllowsSelection

  return (
    <TracksClient
      user={user}
      tracks={DUMMY_TRACKS}
      selectedTrack={selectedTrack}
      isSelectionEnabled={isSelectionEnabled}
    />
  )
}
