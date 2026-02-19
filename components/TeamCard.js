'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TeamCard({ team, joinUrl }) {
  const supabase = createClient()
  const [memberCount, setMemberCount] = useState(0)

  useEffect(() => {
    getMemberCount()
  }, [team.id])

  async function getMemberCount() {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', team.id)

      if (error) {
        console.error('Error fetching team members:', error)
        setMemberCount(0)
        return
      }
      
      setMemberCount(count || 0)
    } catch (error) {
      console.error('Error fetching members:', error)
      setMemberCount(0)
    }
  }

  return (
    <div className="team-card">
      <h3>{team.name}</h3>
      <div className="team-info">
        <p>
          <strong>Track:</strong> {team.track || 'Not selected'}
        </p>
        <p>
          <strong>Members:</strong> {memberCount}
        </p>
        <p>
          <strong>Team UUID:</strong> {team.id}
        </p>
      </div>
      {joinUrl ? (
        <a className="btn btn-primary" href={joinUrl}>
          Join Link
        </a>
      ) : null}
    </div>
  )
}