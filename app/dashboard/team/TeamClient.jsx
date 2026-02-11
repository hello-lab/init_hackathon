'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Canvas } from '@react-three/fiber'
import { AmbientParticles } from '@/components/3D/ParticleScene'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function TeamClient({ user, team, members, isLeader }) {
  const supabase = createClient()
  const [teamState, setTeamState] = useState(team)
  const [membersState, setMembersState] = useState(members || [])
  const [leaderState, setLeaderState] = useState(isLeader)
  const [teamName, setTeamName] = useState('')
  const [teamIdInput, setTeamIdInput] = useState('')
  const [formError, setFormError] = useState('')
  const [isWorking, setIsWorking] = useState(false)
  const [joinCopied, setJoinCopied] = useState(false)
  const [joinUrl, setJoinUrl] = useState('')
  const [mergeUrl, setMergeUrl] = useState('')
  const [mergeCopied, setMergeCopied] = useState(false)

  const hasTeam = !!teamState

  useEffect(() => {
    if (!hasTeam || !teamState?.id) {
      setJoinUrl('')
      setMergeUrl('')
      return
    }

    if (typeof window !== 'undefined') {
      setJoinUrl(`${window.location.origin}/dashboard/team/join?teamId=${teamState.id}`)
      setMergeUrl(`${window.location.origin}/dashboard/team/merge?mergeteam=${teamState.id}`)
    }
  }, [hasTeam, teamState?.id])

  if (!user) return null

 async function fetchMembers(teamId) {
  const teamIdString = String(teamId)
  
  // First, get the team with its members
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('team_members')
    .eq('id', teamIdString)
    .single()

  if (teamError) {
    console.error('Error fetching team:', teamError)
    throw teamError
  }
  
  if (!team || !team.team_members || team.team_members.length === 0) {
    return []
  }

  // Parse member IDs from JSONB
  const memberIds = Array.isArray(team.team_members) 
    ? team.team_members 
    : []

  // Fetch profile details for these members
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, team_role')
    .in('id', memberIds)

  if (error) {
    console.error('Error fetching profiles:', error)
    throw error
  }

  console.log(data)
  return data || []
}
  async function fetchProfileEmail(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data?.email || null
  }

  function normalizeMemberEmails(rawEmails) {
    if (Array.isArray(rawEmails)) return rawEmails
    if (typeof rawEmails === 'string') {
      try {
        const parsed = JSON.parse(rawEmails)
        return Array.isArray(parsed) ? parsed : null
      } catch {
        return null
      }
    }
    if (rawEmails && Array.isArray(rawEmails.emails)) return rawEmails.emails
    return null
  }

  async function handleCreateTeam(event) {
    event.preventDefault()
    setFormError('')

    const trimmedName = teamName.trim()
    if (!trimmedName) {
      setFormError('Team name is required.')
      return
    }

    try {
      setIsWorking(true)
      const profileEmail = await fetchProfileEmail(user.id)
      const createPayload = {
        name: trimmedName,
        owner_id: user.id,
        team_members: [user.id],
      }
      if (profileEmail) {
        createPayload.member_emails = [profileEmail]
      }

      const { data: createdTeam, error: createError } = await supabase
        .from('teams')
        .insert(createPayload)
        .select('*')
        .single()

      if (createError) throw createError

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ team_id: createdTeam.id, team_role: 'leader' })
        .eq('id', user.id)

      if (profileError) throw profileError

      const nextMembers = await fetchMembers(createdTeam.id)
      setTeamState(createdTeam)
      setMembersState(nextMembers)
      setLeaderState(true)
      setTeamName('')

      await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId: createdTeam.id, action: 'sync', memberId: user.id }),
      })
    } catch (error) {
      const message = error?.message?.toLowerCase()?.includes('duplicate')
        ? 'Team name taken or already exists'
        : error.message || 'Unable to create team right now.'
      toast.error(message)
      setFormError(message)
    } finally {
      setIsWorking(false)
    }
  }

  async function handleJoinTeam(event) {
    event.preventDefault()
    setFormError('')

    const trimmedTeamId = teamIdInput.trim()
    if (!trimmedTeamId) {
      setFormError('Enter a valid team UUID.')
      return
    }

    try {
      setIsWorking(true)

      const checkResponse = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId: trimmedTeamId }),
      })

      if (!checkResponse.ok) {
        const payload = await checkResponse.json().catch(() => null)
        const message = payload?.error || 'Unable to check team size.'
        toast.error(message)
        setFormError(message)
        return
      }

      const checkPayload = await checkResponse.json()
      if (!checkPayload?.ok) {
        const limit = Number.isFinite(checkPayload?.limit) ? checkPayload.limit : 4
        toast.error(`Team is full (${limit} members max).`)
        return
      }

      const { data: foundTeam, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', trimmedTeamId)
        .single()

      if (teamError || !foundTeam) {
        throw teamError || new Error('Team not found.')
      }

      const existingMembers = Array.isArray(foundTeam.team_members)
        ? foundTeam.team_members
        : []
      const existingEmails = normalizeMemberEmails(foundTeam.member_emails)

      const profileEmail = await fetchProfileEmail(user.id)

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ team_id: foundTeam.id, team_role: 'member' })
        .eq('id', user.id)

      if (profileError) throw profileError

      if (!existingMembers.includes(user.id)) {
        const updatePayload = {
          team_members: [...existingMembers, user.id],
        }
        if (profileEmail && Array.isArray(existingEmails)) {
          updatePayload.member_emails = existingEmails.includes(profileEmail)
            ? existingEmails
            : [...existingEmails, profileEmail]
        }

        const { error: membersError } = await supabase
          .from('teams')
          .update(updatePayload)
          .eq('id', foundTeam.id)

        if (membersError) throw membersError
      }

      await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId: foundTeam.id, action: 'sync', memberId: user.id }),
      })

      const nextMembers = await fetchMembers(foundTeam.id)
      setTeamState(foundTeam)
      setMembersState(nextMembers)
      setLeaderState(false)
      setTeamIdInput('')
    } catch (error) {
      setFormError(error.message || 'Unable to join team right now.')
    } finally {
      setIsWorking(false)
    }
  }


  return (
    <DashboardLayout user={user}>
      {/* 3D Background */}
      <div className="fixed inset-0 -z-10 h-full w-full opacity-20 pointer-events-none">
        <Canvas camera={{ position: [0, 5, 8] }}>
          <AmbientParticles />
        </Canvas>
      </div>

      <div className="min-h-screen  p-4 md:p-8 lg:p-12">
        {/* Header */}
        <div className="flex flex-row justify-between  items-start mb-8 ml-12 md:ml-0">
          
          <div><h1 className="text-3xl  md:text-4xl font-bold bg-gradient-to-r from-[#ff2fd3] to-[#23e6ff] bg-clip-text text-transparent mb-2">
            Team Management
          </h1>
          <p className="text-slate-400">Manage your team details and members</p></div>
          
        </div>

        {hasTeam && leaderState && (
            <div className="card glass h-fit">
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-2">Team Leader</h3>
                <p className="text-sm text-slate-400 mb-4">You are the leader of this team and can manage settings and invite members.</p>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#12f7c0]/20 border border-[#12f7c0]/50 text-xs font-bold text-[#12f7c0]">
                  ✓ lead Access
                </div>
              </div>
            </div>
          )}
        {!hasTeam ? (
          <div className="card glass mt-6">
            <h2 className="text-xl font-bold text-white mb-6">Get Started</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form onSubmit={handleCreateTeam} className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
                  <p className="text-sm font-semibold text-white">Create a team</p>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value)}
                    placeholder="Team name"
                    className="w-full rounded-md bg-black/50 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#23e6ff]/60"
                  />
                  <button
                    type="submit"
                    disabled={isWorking}
                    className="w-full rounded-md bg-gradient-to-r from-[#ff2fd3] to-[#23e6ff] py-2 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {isWorking ? 'Creating...' : 'Create Team'}
                  </button>
                </form>

                <form onSubmit={handleJoinTeam} className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
                  <p className="text-sm font-semibold text-white">Join a team</p>
                  <input
                    type="text"
                    value={teamIdInput}
                    onChange={(event) => setTeamIdInput(event.target.value)}
                    placeholder="Team UUID"
                    className="w-full rounded-md bg-black/50 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ff2fd3]/60"
                  />
                  <button
                    type="submit"
                    disabled={isWorking}
                    className="w-full rounded-md border border-[#23e6ff] text-[#23e6ff] py-2 text-sm font-bold hover:bg-[#23e6ff]/10 disabled:opacity-60"
                  >
                    {isWorking ? 'Joining...' : 'Join Team'}
                  </button>
                </form>
              </div>

              {formError ? (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
                  {formError}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 mt-6">
            <div className="card glass flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white mb-6">Team Members ({membersState.length})</h2>

              <div className="space-y-3">
                {membersState.length === 0 ? (
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-slate-400">
                    No members yet. Ask teammates to join with the team UUID.
                  </div>
                ) : (
                  membersState.map((member) => {
                    const displayName = member.full_name || member.username || 'Member'
                    const initial = displayName.charAt(0).toUpperCase()

                    return (
                      <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-[#ff2fd3]/50 transition-all group hover:bg-white/10">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff2fd3] to-[#23e6ff] flex items-center justify-center text-white font-bold text-sm">
                          {initial}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white">{displayName}</p>
                            {member.team_role === 'leader' && (
                              <span className="px-2 py-0.5 rounded-full bg-[#12f7c0]/20 border border-[#12f7c0]/50 text-xs font-bold text-[#12f7c0]">Leader</span>
                            )}
                          </div>
                          {member.username ? (
                            <p className="text-xs text-slate-400">@{member.username}</p>
                          ) : null}
                        </div>

                        
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            <div className="card glass flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white mb-6">Team Information</h2>
              <div className="space-y-4 mb-4">
                  <div>
                    <label className="text-xs uppercase tracking-[0.15em] text-slate-500 block mb-2">Team Name</label>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-white font-semibold">
                      {teamState.name}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-[0.15em] text-slate-500 block mb-2">Team Number</label>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-white font-semibold">
                      {(teamState.number-4) ?? '--'}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-[0.15em] text-slate-500 block mb-2">Team Created</label>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-white font-semibold">
                      {teamState.created_at
                        ? new Date(teamState.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : '--'}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-[0.15em] text-slate-500 block mb-2">Member Count</label>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-white font-semibold">
                      {membersState.length} / 6
                    </div>
                      <p className='mt-4 break-words'>Note: If your team size is less than 3, your team might be merged with another team.
                      </p>
                  </div>

                  {leaderState ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <p className='text-xl font-semibold'>Member Invitation : </p>
                      <button
                        type="button"
                        onClick={async () => {
                          setJoinCopied(false)
                          if (!joinUrl) return
                          try {
                            await navigator.clipboard.writeText(joinUrl)
                            setJoinCopied(true)
                          } catch (error) {
                            setFormError('Unable to copy join link. Please copy it manually.')
                          }
                        }}
                        disabled={membersState.length >= 6}
                        title={membersState.length >= 6 ? 'Team full' : ''}
                        className="rounded-md border border-[#23e6ff] px-4 py-2 text-sm font-bold text-[#23e6ff] hover:bg-[#23e6ff]/10 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Copy join link
                      </button>
                      {joinCopied ? (
                        <span className="text-xs text-emerald-400">Copied!</span>
                      ) : null}
                    </div>
                  ) : null}

                  {leaderState ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <p className='text-xl font-semibold'>Merge Teams : </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={async () => {
                            setMergeCopied(false)
                            if (!mergeUrl) return
                            try {
                              await navigator.clipboard.writeText(mergeUrl)
                              setMergeCopied(true)
                            } catch (error) {
                              setFormError('Unable to copy merge link. Please copy it manually.')
                            }
                          }}
                          disabled={membersState.length >= 6}
                          title={membersState.length >= 6 ? 'Team full' : ''}
                          className="rounded-md border border-[#ff2fd3] px-4 py-2 text-sm font-bold text-[#ff2fd3] hover:bg-[#ff2fd3]/10 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Copy merge link
                        </button>
                        
                        {mergeCopied ? (
                          <span className="text-xs text-emerald-400">Copied!</span>
                        ) : null}
                      </div>
                      <p className='italic'>Share with leader of another team to initiate merge</p>
                    </div>
                  ) : null}

                </div>
              </div>
            </div>
        )} 
      </div>
    </DashboardLayout>
  )
}
