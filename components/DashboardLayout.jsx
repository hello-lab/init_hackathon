'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Canvas } from '@react-three/fiber'
import { ParticleScene } from './3D/ParticleScene'

export default function DashboardLayout({ user, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '' },
    { href: '/dashboard/team', label: 'Team', icon: '' },
    { href: '/dashboard/tracks', label: 'Tracks', icon: '' },
    { href: '/dashboard/submission', label: 'Submission', icon: '' },
    { href: '/updates', label: 'Updates', icon: ' ' }
  ]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_18%,rgba(255,64,243,0.16),transparent_34%),radial-gradient(circle_at_78%_8%,rgba(33,246,255,0.2),transparent_36%),radial-gradient(circle_at_50%_80%,rgba(10,8,28,0.4),transparent_48%),#040008]">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 hover:border-[#ff2fd3]/50 transition-all"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:relative lg:w-64 w-64 h-screen bg-gradient-to-br from-[#0a0213] to-[#040008] 
          border-r border-[#2b123d] transition-transform duration-300 z-40
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* 3D Floating Model */}
          <div className="h-40 w-full relative">
            <Canvas camera={{ position: [0, 0, 3] }}>
              <ParticleScene />
            </Canvas>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-[#2b123d]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff2fd3] to-[#23e6ff] flex items-center justify-center text-white font-bold">
                {user?.email?.[0]?.toUpperCase() || 'P'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">Participant</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
            <div className="inline-block px-2 py-1 rounded-full bg-[#ff2fd3]/20 border border-[#ff2fd3]/50 text-xs font-semibold text-[#ff7afc]">
              Active
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all hover:border-l-2 hover:border-[#ff2fd3] group"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="absolute bottom-4 left-4 right-4">
            <Link
              href="/auth/signout"
              className="block w-full px-4 py-2 rounded-lg border border-[#ff5c8a] text-[#ff5c8a] hover:bg-[#ff5c8a]/10 transition-all text-center text-sm font-semibold"
            >
              Sign Out
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full lg:w-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
