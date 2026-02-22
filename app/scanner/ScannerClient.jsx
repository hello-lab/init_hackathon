'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { createClient } from '@/lib/supabase/client'

export default function ScannerClient({ user }) {
  const supabase = createClient()
  const html5QrCodeRef = useRef(null)
  const lastCodeRef = useRef('')
  const [supported, setSupported] = useState(true)
  const [permissionError, setPermissionError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scanError, setScanError] = useState('')
  const [scanValue, setScanValue] = useState('')
  const [profile, setProfile] = useState(null)
  const [teamName, setTeamName] = useState('')
    const [teamNumber, setTeamNumber] = useState('')

  const [manualId, setManualId] = useState('')
  const [secureContext, setSecureContext] = useState(true)
  const [devices, setDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [autoStartAttempted, setAutoStartAttempted] = useState(false)
  const [permissionRequested, setPermissionRequested] = useState(false)
  const [marking, setMarking] = useState(false)
  const [markSuccess, setMarkSuccess] = useState('')
  const [alreadyPresent, setAlreadyPresent] = useState(false)
  const [checkingAttendance, setCheckingAttendance] = useState(false)

  const resetData = useCallback(() => {
    setScanError('')
    setScanValue('')
    setProfile(null)
    setTeamName('')
    setAlreadyPresent(false)
    setManualId('')
    setMarkSuccess('')
    lastCodeRef.current = ''
  }, [])

  const checkIfPresent = useCallback(async (userId) => {
    if (!userId) return false

    setCheckingAttendance(true)
    try {
      const response = await fetch('/api/scanner/check-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) return false

      const data = await response.json()
      return data.present || false
    } catch (error) {
      console.error('Error checking attendance:', error)
      return false
    } finally {
      setCheckingAttendance(false)
    }
  }, [])

  const markPresent = useCallback(async () => {
    if (!profile) return

    setMarking(true)
    setMarkSuccess('')

    try {
      const response = await fetch('/api/scanner/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          fullName: profile.full_name || 'Unknown',
          username: profile.username || '',
          teamName: teamName || 'No Team',
          userRole: profile.role || 'participant',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        setMarkSuccess(`Error: ${error.error || 'Failed to mark present'}`)
        return
      }

      setMarkSuccess(`✓ ${profile.full_name || 'User'} marked present at ${new Date().toLocaleTimeString()}`)
      setMarkSuccess('')
      // Reset data after successful marking
      setTimeout(() => resetData(), 500)
    } catch (error) {
      setMarkSuccess(`Error: ${error.message}`)
    } finally {
      setMarking(false)
    }
  }, [profile, teamName])

  const lookupUser = useCallback(async (userId) => {
    if (!userId) return
    setLoading(true)
    setScanError('')
    setProfile(null)
    setTeamName('')
    setTeamNumber('')
    setAlreadyPresent(false)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, team_id, team_role, role, avatar_url')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) {
      setScanError('User not found for this code.')
      setLoading(false)
      return
    }

    setProfile(data)

    if (data?.team_id) {
      const { data: teamData } = await supabase
        .from('teams')
        .select('name,number')
        .eq('id', data.team_id)
        .maybeSingle()

      if (teamData?.name) {
        setTeamName(teamData.name)
      }
      if (teamData?.number){
        setTeamNumber(teamData.number-4)
      }
    }

    // Check if user is already marked present
    const isPresent = await checkIfPresent(userId)
    setAlreadyPresent(isPresent)

    setLoading(false)
  }, [supabase, checkIfPresent])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.isSecureContext) {
      setSecureContext(false)
      setPermissionError('Camera access requires HTTPS or localhost.')
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setSupported(false)
      setPermissionError('Camera access is not available on this device/browser.')
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!navigator.mediaDevices?.enumerateDevices) return

    const loadDevices = async () => {
      try {
        const list = await navigator.mediaDevices.enumerateDevices()
        const videoInputs = list.filter((device) => device.kind === 'videoinput')
        setDevices(videoInputs)
        if (!selectedDeviceId && videoInputs.length) {
          setSelectedDeviceId(videoInputs[0].deviceId)
        }
      } catch (error) {
        setPermissionError('Unable to list camera devices. Check permissions.')
      }
    }

    loadDevices()
  }, [selectedDeviceId, permissionRequested])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (permissionRequested) return
    if (!secureContext || !supported) return
    if (!navigator.mediaDevices?.getUserMedia) return

    setPermissionRequested(true)

    const requestPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach((track) => track.stop())
        setPermissionError('')
      } catch (error) {
        if (error?.name === 'NotAllowedError') {
          setPermissionError('Camera permission blocked. Allow camera access in the browser settings.')
        } else if (error?.name === 'NotFoundError') {
          setPermissionError('No camera found or it is already in use by another app.')
        } else {
          setPermissionError(`Unable to request camera permission: ${error.message || 'Unknown error'}`)
        }
      }
    }

    requestPermission()
  }, [permissionRequested, secureContext, supported])

  const startScanning = useCallback(async () => {
    if (!selectedDeviceId) {
      setPermissionError('No camera selected')
      return
    }

    // First set camera enabled so the DOM renders
    setCameraEnabled(true)

    // Use setTimeout to ensure DOM is updated before accessing the element
    setTimeout(async () => {
      try {
        // Stop existing scanner if running
        if (html5QrCodeRef.current?.isScanning) {
          await html5QrCodeRef.current.stop()
        }

        // Create new scanner instance
        const html5QrCode = new Html5Qrcode('qr-reader')
        html5QrCodeRef.current = html5QrCode

        await html5QrCode.start(
          selectedDeviceId,
          {
            fps: 10, // Scan 10 times per second
            qrbox: { width: 250, height: 250 }, // Scanning box size
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Success callback - QR code detected
            const trimmedValue = decodedText.trim()
            if (trimmedValue) {
              setScanValue(trimmedValue)
              
              // Only lookup if it's a new code
              if (trimmedValue !== lastCodeRef.current) {
                lastCodeRef.current = trimmedValue
                setScanError('')
                setPermissionError('')
                lookupUser(trimmedValue)
              }
            }
          },
          (errorMessage) => {
            // Error callback - usually just "No QR code found"
            // We can ignore these as they're continuous
          }
        )

        setCameraReady(true)
        setPermissionError('')
      } catch (error) {
        console.error('Scanner error:', error)
        if (error?.name === 'NotAllowedError') {
          setPermissionError('Camera permission blocked. Allow camera access in the browser settings.')
        } else if (error?.name === 'NotFoundError') {
          setPermissionError('No camera found or it is already in use by another app.')
        } else {
          setPermissionError(`Unable to start scanner: ${error.message || 'Unknown error'}`)
        }
        setCameraEnabled(false)
      }
    }, 0)
  }, [selectedDeviceId, lookupUser])

  const stopScanning = useCallback(async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current = null
        setCameraReady(false)
        setCameraEnabled(false)
      } catch (error) {
        console.error('Error stopping scanner:', error)
      }
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error)
      }
    }
  }, [])

  // Restart scanner when device changes
  useEffect(() => {
    if (cameraEnabled && selectedDeviceId) {
      stopScanning().then(() => {
        startScanning()
      })
    }
  }, [selectedDeviceId, cameraEnabled, startScanning, stopScanning])

  useEffect(() => {
    if (autoStartAttempted) return
    if (!secureContext || !supported) return
    if (!selectedDeviceId) return

    setAutoStartAttempted(true)
    startScanning()
  }, [autoStartAttempted, secureContext, supported, selectedDeviceId, startScanning])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_18%,rgba(255,64,243,0.16),transparent_34%),radial-gradient(circle_at_78%_8%,rgba(33,246,255,0.2),transparent_36%),radial-gradient(circle_at_50%_80%,rgba(10,8,28,0.4),transparent_48%),#040008] px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Scanner</p>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff2fd3] to-[#23e6ff] bg-clip-text text-transparent">
            QR Check-in Scanner
          </h1>
          <p className="text-slate-400 mt-2">Scan participant hall IDs to fetch their profile data.</p>
        </header>

        {!secureContext && (
          <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-amber-200">
            Camera access requires HTTPS or localhost. Please open this page on a secure origin.
          </div>
        )}

        {!supported && (
          <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-amber-200">
            QR scanning is unavailable. Allow camera permissions or use a supported device/browser.
          </div>
        )}

        {permissionError && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
            {permissionError}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl">
            {devices.length > 1 && (
              <div className="mb-3 flex flex-col gap-2 text-sm text-slate-300">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Camera</label>
                <select
                  value={selectedDeviceId}
                  onChange={(event) => setSelectedDeviceId(event.target.value)}
                  className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                >
                  {devices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/50">
              <div className="relative">
                <div
                  id="qr-reader"
                  className="w-full"
                  style={{ minHeight: '300px' }}
                />
                <div className="pointer-events-none absolute inset-0 border-2 border-[#23e6ff]/40" />
              </div>
              {!cameraEnabled && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-sm text-slate-300">
                  <p>Camera preview is paused.</p>
                  <button
                    type="button"
                    onClick={startScanning}
                    disabled={!selectedDeviceId}
                    className="rounded-lg border border-[#23e6ff]/40 bg-[#23e6ff]/10 px-4 py-2 text-sm font-semibold text-[#9ff6ff] hover:bg-[#23e6ff]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Enable camera
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {cameraReady && (
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Scanner active</span>
                </div>
              )}
              <div className="text-sm text-slate-400">
                Latest scan: <span className="text-slate-100">{scanValue || 'Waiting for QR code…'}</span>
              </div>
              {cameraEnabled && (
                <button
                  type="button"
                  onClick={stopScanning}
                  className="text-xs text-red-300 hover:text-red-200 underline"
                >
                  Stop camera
                </button>
              )}
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <label className="block text-xs uppercase tracking-[0.18em] text-slate-400">Manual lookup</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={manualId}
                  onChange={(event) => setManualId(event.target.value)}
                  placeholder="Paste user ID"
                  className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => lookupUser(manualId.trim())}
                  className="rounded-lg border border-[#23e6ff]/40 bg-[#23e6ff]/10 px-4 py-2 text-sm font-semibold text-[#9ff6ff] hover:bg-[#23e6ff]/20"
                >
                  Lookup
                </button>
              </div>
              <button
                type="button"
                onClick={resetData}
                className="w-full rounded-lg border border-slate-400/40 bg-slate-500/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-500/20"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Participant Details</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              {loading && <p className="text-slate-400">Loading profile…</p>}
              {scanError && <p className="text-red-300">{scanError}</p>}
              {!loading && !scanError && !profile && (
                <p className="text-slate-400">Scan a QR code to display participant info.</p>
              )}
              {profile && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#ff2fd3] to-[#23e6ff] flex items-center justify-center text-lg font-semibold">
                      {(profile.full_name || profile.username || 'U')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">{profile.full_name || 'Unnamed participant'}</p>
                      <p className="text-xs text-slate-400">{profile.username || profile.id}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Role</p>
                    <p className="text-white font-semibold">{profile.role || 'participant'}</p>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Team</p>
                    <p className="text-white font-semibold">
                      {teamName || (profile.team_id ? 'Loading team…' : 'No team')}
                    </p>
                    <p className="text-xs text-slate-400">{profile.team_role || 'member'}</p>
                  </div>
<div className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Table Number</p>
                    <p className="text-white font-semibold">
                      {teamNumber }
                    </p>
                    
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">User ID</p>
                    <p className="text-white font-mono break-all">{profile.id}</p>
                  </div>

                  <button
                    type="button"
                    onClick={markPresent}
                    disabled={marking || alreadyPresent || checkingAttendance}
                    className={`w-full mt-4 rounded-lg border px-4 py-3 text-sm font-semibold transition-all ${
                      alreadyPresent
                        ? 'border-amber-400/40 bg-amber-500/10 text-amber-300 cursor-default'
                        : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {checkingAttendance ? 'Checking...' : alreadyPresent ? '⏱ Already Marked Present' : marking ? 'Marking...' : '✓ Mark Present'}
                  </button>

                  {markSuccess && (
                    <div className={`mt-3 rounded-lg p-3 text-sm font-medium ${
                      markSuccess.includes('Error') 
                        ? 'border border-red-400/40 bg-red-500/10 text-red-300'
                        : 'border border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                    }`}>
                      {markSuccess}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-10 text-xs text-slate-500">
          Logged in as {user?.email || 'authorized scanner'}.
        </footer>
      </div>
    </div>
  )
}