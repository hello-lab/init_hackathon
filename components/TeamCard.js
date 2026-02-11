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
      const { data: teamData, error } = await supabase
        .from('teams')
        .select('team_members')
        .eq('id', team.id)
        .single()

      if (error) {
        console.error('Error fetching team:', error)
        setMemberCount(0)
        return
      }
      
      console.log(teamData?.team_members)
      
      // Parse team_members JSONB array and get its length
      const memberIds = Array.isArray(teamData?.team_members) 
        ? teamData.team_members 
        : []
      
      setMemberCount(memberIds.length)
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