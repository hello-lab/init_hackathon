'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { createClient } from '@/lib/supabase/client'

export default function JoinClient({ user, team, teamId, alreadyOnTeam }) {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [teamState, setTeamState] = useState(team)
  const [teamIdState, setTeamIdState] = useState(teamId)
  const [isWorking, setIsWorking] = useState(false)
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)
  const [error, setError] = useState('')

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

  useEffect(() => {
    if (teamId) {
      setTeamIdState(teamId)
      return
    }

    const idFromQuery = searchParams.get('teamId') || searchParams.get('team') || searchParams.get('id')
    if (idFromQuery) {
      setTeamIdState(idFromQuery)
    }
  }, [searchParams, teamId])

  useEffect(() => {
    let isMounted = true

    async function loadTeam() {
      if (!teamIdState || teamState) return
      setIsLoadingTeam(true)

      try {
        const { data, error: teamError } = await supabase
          .from('teams')
          .select('id, name')
          .eq('id', teamIdState)
          .single()

        if (teamError) throw teamError

        if (isMounted) {
          setTeamState(data || null)
        }
      } catch (loadError) {
        if (isMounted) {
          setTeamState(null)
          setError(loadError.message || 'Unable to load team details.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingTeam(false)
        }
      }
    }

    loadTeam()

    return () => {
      isMounted = false
    }
  }, [supabase, teamIdState, teamState])

  async function handleJoin() {
    if (!teamIdState) return
    setError('')

    try {
      setIsWorking(true)
      const checkResponse = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId: teamIdState }),
      })

      if (!checkResponse.ok) {
        const payload = await checkResponse.json().catch(() => null)
        const message = payload?.error || 'Unable to check team size.'
        setError(message)
        return
      }

      const checkPayload = await checkResponse.json()
      if (!checkPayload?.ok) {
        const limit = Number.isFinite(checkPayload?.limit) ? checkPayload.limit : 4
        setError(`Team is full (${limit} members max).`)
        return
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ team_id: teamIdState, team_role: 'member' })
        .eq('id', user.id)

      if (profileError) throw profileError

      router.push('/dashboard/team')
    } catch (joinError) {
      setError(joinError.message || 'Unable to join this team right now.')
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <DashboardLayout user={user}>
      <div className="min-h-screen p-4 md:p-8 lg:p-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff2fd3] to-[#23e6ff] bg-clip-text text-transparent mb-4">
            Join Team
          </h1>

          {!teamIdState ? (
            <div className="card glass p-6 text-slate-300">
              Team UUID is missing. Please check your link.
            </div>
          ) : !teamState ? (
            <div className="card glass p-6 text-slate-300">
              {isLoadingTeam ? 'Loading team details...' : 'Team not found. Please check the UUID.'}
            </div>
          ) : (
            <div className="card glass p-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Team</p>
                <p className="text-xl font-semibold text-white">{teamState.name}</p>
                <p className="text-sm text-slate-400">UUID: {teamState.id}</p>
              </div>

              {alreadyOnTeam ? (
                <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-emerald-200">
                  You are already on a team. Visit your team page to manage it.
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={isWorking || isLoadingTeam}
                  className="w-full rounded-md bg-gradient-to-r from-[#ff2fd3] to-[#23e6ff] py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {isWorking ? 'Joining...' : 'Join this team'}
                </button>
              )}

              {error ? (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
                  {error}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
