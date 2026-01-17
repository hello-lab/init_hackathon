'use client'

import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import { Canvas } from '@react-three/fiber'
import { FloatingIcosahedron } from '@/components/3D/FloatingModel'
import { AmbientParticles } from '@/components/3D/ParticleScene'
import { Lock } from 'lucide-react'

export default function TracksClient({ user, tracks, selectedTrack, isSelectionEnabled }) {
  if (!user) return null

  return (
    <DashboardLayout user={user}>
      {/* 3D Background */}
      <div className="fixed inset-0 -z-10 h-full w-full opacity-25 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 6] }}>
          <AmbientParticles />
          <FloatingIcosahedron scale={2} speed={2} />
        </Canvas>
      </div>

      <div className="min-h-screen p-4 md:p-8 lg:p-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-[#23e6ff] hover:text-[#00ffff] text-sm font-semibold mb-4 inline-flex items-center gap-2">
            ← Back
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff2fd3] to-[#23e6ff] bg-clip-text text-transparent mb-2">
            Select Your Track
          </h1>
          <p className="text-slate-400">Choose one track to focus on during the hackathon. This selection is permanent.</p>
        </div>

        {/* Status Messages */}
        {!isSelectionEnabled && (
          <div className="mb-8 p-4 rounded-lg bg-[#ff5c8a]/10 border border-[#ff5c8a]/50 text-[#ff5c8a]">
            <p className="font-semibold">Track selection is not available right now</p>
            <p className="text-sm mt-1">The hackathon must be live and admin approval is required.</p>
          </div>
        )}

        {selectedTrack && (
          <div className="mb-8 p-4 rounded-lg bg-[#12f7c0]/10 border border-[#12f7c0]/50">
            <p className="text-[#12f7c0] font-semibold">✓ You have already selected a track</p>
            <p className="text-sm text-slate-300 mt-1">Your selection is locked and cannot be changed.</p>
          </div>
        )}

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {tracks.map((track) => (
            <div
              key={track.id}
              className={`card glass group cursor-pointer transition-all duration-300 ${
                isSelectionEnabled && !selectedTrack
                  ? 'hover:shadow-[0_0_24px_rgba(255,47,211,0.55),0_0_48px_rgba(35,230,255,0.35)] hover:-translate-y-1'
                  : 'opacity-60'
              }`}
            >
              {/* Track Icon */}
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{track.emoji}</div>

              {/* Track Title */}
              <h3 className="text-xl font-bold text-white mb-3">{track.title}</h3>

              {/* Description */}
              <p className="text-sm text-slate-300 mb-6 line-clamp-3">{track.description}</p>

              {/* Selection Button */}
              {!selectedTrack && isSelectionEnabled ? (
                <button
                  className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-[#ff2fd3] to-[#23e6ff] text-white font-bold hover:shadow-[0_0_24px_rgba(255,47,211,0.55),0_0_48px_rgba(35,230,255,0.35)] transition-all group-hover:scale-105"
                >
                  Select This Track
                </button>
              ) : selectedTrack === track.id ? (
                <div className="w-full px-4 py-3 rounded-lg bg-[#12f7c0]/20 border border-[#12f7c0]/50 text-[#12f7c0] font-bold text-center flex items-center justify-center gap-2">
                  <span>✓</span>
                  <span>Selected</span>
                </div>
              ) : (
                <div className="w-full px-4 py-3 rounded-lg bg-slate-700/30 border border-slate-600/50 text-slate-400 font-bold text-center flex items-center justify-center gap-2 cursor-not-allowed">
                  <Lock size={16} />
                  <span>Locked</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="card glass">
          <h3 className="text-lg font-bold text-white mb-4">About Track Selection</h3>
          <div className="space-y-3 text-sm text-slate-300">
            <p>
              <span className="font-semibold text-[#ff2fd3]">One-Time Selection:</span> Once you select a track, your choice is permanent and cannot be changed.
            </p>
            <p>
              <span className="font-semibold text-[#23e6ff]">Collaboration:</span> Team members can select different tracks to build diverse solutions.
            </p>
            <p>
              <span className="font-semibold text-[#12f7c0]">Requirements:</span> To select, the hackathon must be live and your team must be eligible.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
