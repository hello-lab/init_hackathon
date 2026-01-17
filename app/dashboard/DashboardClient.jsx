'use client'

import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import { Canvas } from '@react-three/fiber'
import { FloatingCube } from '@/components/3D/FloatingModel'
import { AmbientParticles } from '@/components/3D/ParticleScene'
import { getStatusLabel, getStatusColor } from '@/lib/dashboardHelpers'

export default function DashboardClient({ user, dashboardData }) {
  if (!user) return null

  return (
    <DashboardLayout user={user}>
      {/* 3D Background */}
      <div className="fixed inset-0 -z-10 h-full w-full opacity-30 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 8] }}>
          <AmbientParticles />
          <FloatingCube scale={2} speed={3} rotationIntensity={0.3} />
        </Canvas>
      </div>

      <div className="min-h-screen p-4 md:p-8 lg:p-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-white mb-2">Welcome Back</p>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff2fd3] to-[#23e6ff] bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-slate-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Hackathon Status */}
          <div className="card glass">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm uppercase tracking-[0.15em] text-white">Status</span>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(dashboardData.hackathonStatus)}`}>
                {getStatusLabel(dashboardData.hackathonStatus)}
              </div>
            </div>
            <p className="text-2xl font-bold text-[#23e6ff]">LIVE</p>
            <p className="text-xs text-slate-400 mt-2">Hackathon is currently active</p>
          </div>

          {/* Team Members */}
          <div className="card glass">
            <p className="text-sm uppercase tracking-[0.15em] text-white mb-2">Team Size</p>
            <p className="text-4xl font-bold text-[#ff2fd3]">{dashboardData.members.length}</p>
            <p className="text-xs text-slate-400 mt-2">{dashboardData.team.name}</p>
          </div>

          {/* Quick Actions */}
          <div className="card glass flex flex-col justify-between">
            <p className="text-sm uppercase tracking-[0.15em] text-white mb-2">Quick Action</p>
            <Link href="/dashboard/submission" className="inline-flex items-center gap-2 text-[#ff2fd3] hover:text-[#ff7afc] transition-colors font-semibold">
              Submit Project <span>→</span>
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Team Info */}
          <div className="lg:col-span-2">
            <div className="card glass">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Team Details</h2>
                <Link href="/dashboard/team" className="text-[#23e6ff] hover:text-[#00ffff] text-sm font-semibold transition-colors">
                  Manage →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-slate-400 mb-1">Team Name</p>
                  <p className="text-lg font-bold text-white">{dashboardData.team.name}</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-slate-400 mb-1">Created</p>
                </div>
              </div>

              <Link href="/dashboard/team" className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#ff2fd3] to-[#23e6ff] text-white font-bold hover:shadow-[0_0_24px_rgba(255,47,211,0.55),0_0_48px_rgba(35,230,255,0.35)] transition-all">
                View Team Settings
              </Link>
            </div>
          </div>

          {/* Track Status */}
          <div className="card glass">
            <h3 className="text-lg font-bold text-white mb-4">Your Track</h3>
            <div className="p-4 rounded-lg bg-gradient-to-br from-[#ff2fd3]/20 to-[#23e6ff]/20 border border-[#ff2fd3]/50 text-center">
              <p className="text-xs text-slate-400 mb-2">Not Selected Yet</p>
              <Link href="/dashboard/tracks" className="inline-flex items-center justify-center w-full px-3 py-2 rounded-lg bg-[#ff2fd3] text-white text-sm font-bold hover:bg-[#c400a9] transition-colors mt-3">
                Select Track
              </Link>
            </div>
          </div>
        </div>

        {/* Team Members Section */}
        <div className="card glass">
          <h2 className="text-xl font-bold text-white mb-6">Team Members</h2>
          <div className="space-y-3">
            {dashboardData.members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-[#ff2fd3]/50 transition-all hover:bg-white/10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff2fd3] to-[#23e6ff] flex items-center justify-center text-white font-bold text-sm">
                  {member.full_name[0]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{member.full_name}</p>
                  <p className="text-xs text-slate-400">@{member.username}</p>
                </div>
                {member.role === 'leader' && (
                  <div className="px-3 py-1 rounded-full bg-[#12f7c0]/20 border border-[#12f7c0]/50 text-xs font-semibold text-[#12f7c0]">
                    Leader
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
