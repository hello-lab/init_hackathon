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
  const [kickingMemberId, setKickingMemberId] = useState(null)
  const [disbanding, setDisbanding] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)

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
    
    // Fetch all profiles that belong to this team
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, team_role, email')
      .eq('team_id', teamIdString)

    if (error) {
      console.error('Error fetching team members:', error)
      throw error
    }

    return data || []
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
      
      // Check if user already has a team
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single()
      
      if (userProfile?.team_id) {
        setFormError('You are already a member of a team. Leave your current team first to create a new one.')
        setIsWorking(false)
        return
      }

      const createPayload = {
        name: trimmedName,
        owner_id: user.id,
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
        .select('id, name')
        .eq('id', trimmedTeamId)
        .single()

      if (teamError || !foundTeam) {
        throw teamError || new Error('Team not found.')
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ team_id: foundTeam.id, team_role: 'member' })
        .eq('id', user.id)

      if (profileError) throw profileError

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

  async function handleKickMember(memberId) {
    if (!teamState?.id || !memberId) return

    const memberToKick = membersState.find((m) => m.id === memberId)
    
    setConfirmModal({
      title: 'Kick Member',
      message: `Are you sure you want to kick ${memberToKick?.full_name || memberToKick?.username || 'this member'} from the team?`,
      action: async () => {
        try {
          setKickingMemberId(memberId)

          const response = await fetch('/api/team/kick', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ teamId: teamState.id, memberId }),
          })

          const payload = await response.json()

          if (!response.ok || !payload?.ok) {
            toast.error(payload?.error || 'Unable to kick member.')
            return
          }

          toast.success('Member kicked successfully.')
          const nextMembers = await fetchMembers(teamState.id)
          setMembersState(nextMembers)
        } catch (error) {
          toast.error(error.message || 'Unable to kick member.')
        } finally {
          setKickingMemberId(null)
        }
      },
      confirmText: 'Kick',
      cancelText: 'Cancel',
      isDangerous: true,
    })
  }

  async function handleDisbandTeam() {
    if (!teamState?.id) return

    setConfirmModal({
      title: 'Disband Team',
      message: `Are you sure you want to disband the team "${teamState.name}" ? This will remove all members and delete the team. This action cannot be undone.`,
      action: async () => {
        try {
          setDisbanding(true)

          const response = await fetch('/api/team/disband', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ teamId: teamState.id }),
          })

          const payload = await response.json()

          if (!response.ok || !payload?.ok) {
            toast.error(payload?.error || 'Unable to disband team.')
            return
          }

          toast.success('Team disbanded successfully.')
          setTeamState(null)
          setMembersState([])
          setLeaderState(false)
        } catch (error) {
          toast.error(error.message || 'Unable to disband team.')
        } finally {
          setDisbanding(false)
        }
      },
      confirmText: 'Disband',
      cancelText: 'Cancel',
      isDangerous: true,
    })
  }

  async function handleLeaveTeam() {
    if (!teamState?.id) return

    setConfirmModal({
      title: 'Leave Team',
      message: `Are you sure you want to leave the team "${teamState.name}"?`,
      action: async () => {
        try {
          setLeaving(true)

          const response = await fetch('/api/team/leave', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ teamId: teamState.id }),
          })

          const payload = await response.json()

          if (!response.ok || !payload?.ok) {
            toast.error(payload?.error || 'Unable to leave team.')
            return
          }

          toast.success('You have left the team.')
          setTeamState(null)
          setMembersState([])
          setLeaderState(false)
        } catch (error) {
          toast.error(error.message || 'Unable to leave team.')
        } finally {
          setLeaving(false)
        }
      },
      confirmText: 'Leave',
      cancelText: 'Cancel',
      isDangerous: false,
    })
  }


  return (
    <DashboardLayout user={user}>
      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="card glass max-w-sm w-full mx-4 border-white/20">
            <h3 className="text-lg font-bold text-white mb-3">{confirmModal.title}</h3>
            <p className="text-slate-300 text-sm mb-6">{confirmModal.message}</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-all"
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  await confirmModal.action()
                  setConfirmModal(null)
                }}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
                  confirmModal.isDangerous
                    ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                    : 'bg-gradient-to-r from-[#ff2fd3] to-[#23e6ff] text-white hover:opacity-90'
                }`}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

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

                        {leaderState && member.id !== user.id && (
                          <button
                            onClick={() => handleKickMember(member.id)}
                            disabled={kickingMemberId === member.id}
                            className="px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-semibold hover:bg-red-500/20 disabled:opacity-50 transition-all"
                            title="Remove member from team"
                          >
                            {kickingMemberId === member.id ? 'Removing...' : 'Kick'}
                          </button>
                        )}

                        
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

                  {/*{leaderState ? (
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
                  ) : null}*/}

                  {!leaderState && (
                    <div className="pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={handleLeaveTeam}
                        disabled={leaving}
                        className="w-full rounded-md bg-yellow-500/10 border border-yellow-500/40 px-4 py-3 text-sm font-bold text-yellow-400 hover:bg-yellow-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        {leaving ? 'Leaving...' : 'Leave Team'}
                      </button>
                    </div>
                  )}

                  {leaderState && (
                    <div className="pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={handleDisbandTeam}
                        disabled={disbanding}
                        className="w-full rounded-md bg-red-500/10 border border-red-500/40 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        {disbanding ? 'Disbanding...' : 'Disband Team'}
                      </button>
                      <p className="mt-2 text-xs text-slate-400 italic">
                        This will remove all members and delete the team permanently.
                      </p>
                    </div>
                  )}

                </div>
              </div>
            </div>
        )} 
      </div>
    </DashboardLayout>
  )
}
