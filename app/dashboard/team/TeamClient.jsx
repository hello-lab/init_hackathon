'use client'

import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import { Canvas } from '@react-three/fiber'
import { FloatingLens } from '@/components/3D/FloatingModel'
import { AmbientParticles } from '@/components/3D/ParticleScene'
import { Copy, LogOut } from 'lucide-react'

export default function TeamClient({ user, team, members, isLeader }) {
  if (!user) return null

  return (
    <DashboardLayout user={user}>
      {/* 3D Background */}
      <div className="fixed inset-0 -z-10 h-full w-full opacity-20 pointer-events-none">
        <Canvas camera={{ position: [0, 5, 8] }}>
          <AmbientParticles />
          <FloatingLens scale={1.5} speed={1.5} />
        </Canvas>
      </div>

      <div className="min-h-screen p-4 md:p-8 lg:p-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-[#23e6ff] hover:text-[#00ffff] text-sm font-semibold mb-4 inline-flex items-center gap-2">
            ← Back
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff2fd3] to-[#23e6ff] bg-clip-text text-transparent mb-2">
            Team Management
          </h1>
          <p className="text-slate-400">Manage your team details and members</p>
        </div>

        {/* Team Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="card glass">
              <h2 className="text-xl font-bold text-white mb-6">Team Information</h2>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-xs uppercase tracking-[0.15em] text-slate-500 block mb-2">Team Name</label>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-white font-semibold">
                    {team.name}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.15em] text-slate-500 block mb-2">Team Created</label>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-white font-semibold">
                    {new Date(team.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.15em] text-slate-500 block mb-2">Member Count</label>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-white font-semibold">
                    {members.length} / 4
                  </div>
                </div>
              </div>



              {/* Action Buttons */}
              {!isLeader && (
                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-3 rounded-lg border border-[#ff5c8a] text-[#ff5c8a] hover:bg-[#ff5c8a]/10 font-bold transition-all flex items-center justify-center gap-2">
                    <LogOut size={18} />
                    Leave Team
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Leader Badge */}
          {isLeader && (
            <div className="card glass h-fit">
              <div className="text-center">
                <div className="text-4xl mb-3">👑</div>
                <h3 className="text-lg font-bold text-white mb-2">Team Leader</h3>
                <p className="text-sm text-slate-400 mb-4">You are the leader of this team and can manage settings and invite members.</p>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#12f7c0]/20 border border-[#12f7c0]/50 text-xs font-bold text-[#12f7c0]">
                  ✓ Admin Access
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Members Section */}
        <div className="card glass">
          <h2 className="text-xl font-bold text-white mb-6">Team Members ({members.length})</h2>
          
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-[#ff2fd3]/50 transition-all group hover:bg-white/10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff2fd3] to-[#23e6ff] flex items-center justify-center text-white font-bold text-sm">
                  {member.full_name[0]}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{member.full_name}</p>
                    {member.role === 'leader' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#12f7c0]/20 border border-[#12f7c0]/50 text-xs font-bold text-[#12f7c0]">Leader</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">@{member.username}</p>
                </div>

                {member.role === 'member' && isLeader && (
                  <button className="opacity-0 group-hover:opacity-100 px-3 py-1 rounded text-xs font-semibold text-[#ff5c8a] hover:bg-[#ff5c8a]/10 border border-[#ff5c8a]/50 transition-all">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {members.length < 4 && (
            <div className="mt-4 p-4 rounded-lg bg-[#23e6ff]/10 border border-[#23e6ff]/30 text-center">
              <p className="text-sm text-[#23e6ff]">Your team can have up to 4 members</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
