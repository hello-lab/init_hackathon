'use client'

import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import { Canvas } from '@react-three/fiber'
import { ParticleScene } from '@/components/3D/ParticleScene'
import { getStatusLabel, getStatusColor } from '@/lib/dashboardHelpers'

export default function DashboardClient({ user, dashboardData }) {
  if (!user) return null

  const teamName = dashboardData.team?.name || 'No team yet'
  const teamCreated = dashboardData.team?.created_at
    ? new Date(dashboardData.team.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '--'

  return (
    <DashboardLayout user={user}>
      {/* 3D Background */}
      <div className="fixed inset-0 -z-10 h-full w-full opacity-30 pointer-events-none">
        <Canvas
           camera={{ position: [0, 0, 0] }}>
          <ParticleScene />
        </Canvas>
      </div>

      <div className="min-h-screen p-4 md:p-8 lg:p-12 ">
        {/* Header */}
        <div className="mb-8  ml-12 md:ml-0">
          <p className="text-xs uppercase tracking-[0.2em] text-white mb-2">Welcome Back</p>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff2fd3] to-[#23e6ff] bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-slate-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

          {/* Hackathon Status */}
          <div className="card glass mb-6">
            <div className="flex items-center justify-between mb-2">
              <div><span className="text-3xl uppercase  text-white">Status : </span>
            <span className="text-2xl font-bold text-[#23e6ff]">STARTED</span></div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(dashboardData.hackathonStatus)}`}>
                {getStatusLabel(dashboardData.hackathonStatus)}
              </div>
            </div>
            
            <p className="text-xs text-slate-400 mt-2">Hackathon is currently online</p>
          </div>

          

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Team Info */}
          <div className="lg:col-span-2">
            <Link href="/dashboard/team"><div className="card glass">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Team Details </h2>
                <h3>Manage →</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-slate-400 mb-1">Team Name</p>
                  <p className="text-lg font-bold text-white">{teamName}</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-slate-400 mb-1">Created</p>
                  <p className="text-lg font-bold text-white">{teamCreated}</p>
                </div>
              </div>
            </div></Link>
          </div>

          {/* Track Status */}
          <div className="card glass">
            <h3 className="text-lg font-bold text-white mb-4">Your Track</h3>
            {dashboardData.team?.track_info ? (
              <div className="p-4 rounded-lg bg-gradient-to-br from-[#ff2fd3]/20 to-[#23e6ff]/20 border border-[#ff2fd3]/50 text-center">
                <p className="text-sm font-semibold text-white mb-1">{dashboardData.team.track_info.name || dashboardData.team.track_info.title || dashboardData.team.track_info.slug || dashboardData.team.track}</p>
                {dashboardData.team.track_info.emoji ? (
                  <div className="text-3xl">{dashboardData.team.track_info.emoji}</div>
                ) : null}
                {dashboardData.team.track_info.description ? (
                  <p className="text-xs text-slate-400 mt-2">{dashboardData.team.track_info.description}</p>
                ) : null}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-gradient-to-br from-[#ff2fd3]/20 to-[#23e6ff]/20 border border-[#ff2fd3]/50 text-center">
                <p className="text-xs text-slate-400 mb-2">Not Assigned Yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Members Section */}
        <div className="card glass">
          <h2 className="text-xl font-bold text-white mb-6">Team Members</h2>
          <div className="space-y-3">
            {dashboardData.members.length === 0 ? (
              <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-slate-400">
                No team members yet. Create or join a team to get started.
              </div>
            ) : (
              dashboardData.members.map((member) => {
                const displayName = member.full_name || member.username || 'Member'
                const initial = displayName.charAt(0).toUpperCase()

                return (
                  <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-[#ff2fd3]/50 transition-all hover:bg-white/10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff2fd3] to-[#23e6ff] flex items-center justify-center text-white font-bold text-sm">
                      {initial}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{displayName}</p>
                      {member.username ? (
                        <p className="text-xs text-slate-400">@{member.username}</p>
                      ) : null}
                    </div>
                    {member.team_role === 'leader' && (
                      <div className="px-3 py-1 rounded-full bg-[#12f7c0]/20 border border-[#12f7c0]/50 text-xs font-semibold text-[#12f7c0]">
                        Leader
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
