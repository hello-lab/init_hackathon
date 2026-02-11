'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { createClient } from '@/lib/supabase/client'

export default function MergeClient({ user, initiatorTeam, initiatorTeamId, targetTeam, isLeader }) {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [initiatorState, setInitiatorState] = useState(initiatorTeam)
  const [initiatorIdState, setInitiatorIdState] = useState(initiatorTeamId)
  const [targetState, setTargetState] = useState(targetTeam)
  const [isWorking, setIsWorking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState('')
  const [check, setCheck] = useState(null)

  useEffect(() => {
    if (initiatorTeamId) {
      setInitiatorIdState(initiatorTeamId)
      return
    }

    const idFromQuery =
      searchParams.get('mergeteam') ||
      searchParams.get('teamId') ||
      searchParams.get('team') ||
      searchParams.get('id')

    if (idFromQuery) {
      setInitiatorIdState(idFromQuery)
    }
  }, [searchParams, initiatorTeamId])

  useEffect(() => {
    let isMounted = true

    async function loadInitiator() {
      if (!initiatorIdState || initiatorState) return
      setIsLoading(true)

      try {
        const { data, error: fetchError } = await supabase
          .from('teams')
          .select('id, name, team_members, member_emails, is_merged')
          .eq('id', initiatorIdState)
          .single()

        if (fetchError) throw fetchError

        if (isMounted) {
          setInitiatorState(data || null)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load merge request.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInitiator()

    return () => {
      isMounted = false
    }
  }, [initiatorIdState, initiatorState, targetState?.id])

  useEffect(() => {
    if (initiatorTeam) setInitiatorState(initiatorTeam)
  }, [initiatorTeam])

  useEffect(() => {
    if (targetTeam) setTargetState(targetTeam)
  }, [targetTeam])

  useEffect(() => {
    if (!initiatorIdState || !targetState?.id || !isLeader) return

    let isActive = true

    const runCheck = async () => {
      setError('')
      setIsChecking(true)
      try {
        const response = await fetch('/api/team/merge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'check',
            initiatorTeamId: initiatorIdState,
            targetTeamId: targetState.id,
          }),
        })

        const payload = await response.json().catch(() => null)

        if (!response.ok) {
          if (isActive) {
            setError(payload?.error || 'Unable to check merge request.')
          }
          return
        }

        if (isActive) {
          setCheck(payload)
        }
      } catch (checkError) {
        if (isActive) {
          setError('Unable to check merge request.')
        }
      } finally {
        if (isActive) {
          setIsChecking(false)
        }
      }
    }

    runCheck()

    return () => {
      isActive = false
    }
  }, [initiatorIdState, targetState?.id, isLeader])

  async function handleMerge() {
    if (!initiatorIdState || !targetState?.id) return

    try {
      setIsWorking(true)
      setError('')

      const response = await fetch('/api/team/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'merge',
          initiatorTeamId: initiatorIdState,
          targetTeamId: targetState.id,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        setError(payload?.error || 'Unable to merge teams.')
        return
      }

      router.push('/dashboard/team')
    } catch (mergeError) {
      setError(mergeError.message || 'Unable to merge teams.')
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <DashboardLayout user={user}>
      <div className="min-h-screen p-4 md:p-8 lg:p-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff2fd3] to-[#23e6ff] bg-clip-text text-transparent mb-4">
            Merge Teams
          </h1>

          {!initiatorIdState ? (
            <div className="card glass p-6 text-slate-300">
              Merge link is missing. Please check your link.
            </div>
          ) : !targetState ? (
            <div className="card glass p-6 text-slate-300">
              You need to be on a team to accept a merge request.
            </div>
          ) : !isLeader ? (
            <div className="card glass p-6 text-slate-300">
              Only team leaders can approve a merge.
            </div>
          ) : (
            <div className="card glass p-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Teams</p>
                <p className="text-xl font-semibold text-white">
                  {initiatorState?.name || 'Initiator team'} + {targetState?.name || 'Your team'}
                </p>
                <p className="text-sm text-slate-400">Initiator UUID: {initiatorIdState}</p>
              </div>

              {isLoading || isChecking ? (
                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                  Checking merge eligibility...
                </div>
              ) : check ? (
                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                  Combined members: {check.combinedCount} / {check.limit}
                </div>
              ) : null}

              {check?.ok ? (
                <button
                  onClick={handleMerge}
                  disabled={isWorking || isLoading || isChecking}
                  className="w-full rounded-md bg-gradient-to-r from-[#ff2fd3] to-[#23e6ff] py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {isWorking ? 'Merging...' : 'Merge teams'}
                </button>
              ) : check ? (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
                  Combined team size exceeds the limit of 6.
                </div>
              ) : null}

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
