'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import { LiquidGlass } from '@liquidglass/react';


export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const isActive = (path) => pathname === path

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const closeMenu = () => setIsMenuOpen(false)

  return (
   
    <nav className="navbar fixed bottom-4 left-0 right-0 z-[100] ">
      <div className="nav-container w-full flex md:justify-center justify-between items-center px-4 py-3">
        
        {/* Logo/Brand */}
        <div className="nav-logo md:hidden">
          <a href="/" className="text-2xl font-bold"></a>
        </div>

        {/* Hamburger Menu Button - Mobile */}
        <div className="md:hidden z-50">
          <LiquidGlass
            borderRadius={8}
            blur={1}
            contrast={1.5}
            brightness={1.8}
            saturation={1.2}
            displacementScale={3}
            elasticity={0.7}
          >
            <button 
              className="flex flex-col gap-1.5 p-3"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <span className={`block w-6 h-0.5 bg-white transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block w-6 h-0.5 bg-white transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block w-6 h-0.5 bg-white transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>
          </LiquidGlass>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:block">
          <LiquidGlass
            borderRadius={100}
            blur={1}
            contrast={1.5}
            brightness={1.8}
            saturation={1.2}
            displacementScale={3}
            elasticity={0.7}
            className='sticky'
          >
            <ul className="nav-menu flex gap-6 text-xl p-3">
              <li>
                <a 
                  href="/" 
                  className={isActive('/') ? 'active' : ''}
                >
                  Home
                </a>
              </li>
              <li>
                <a 
                  href="/info" 
                  className={isActive('/info') ? 'active' : ''}
                >
                  Info
                </a>
              </li>
              <li>
                <a 
                  href="/updates" 
                  className={isActive('/updates') ? 'active' : ''}
                >
                  Updates
                </a>
              </li>
              
              {user ? (
                <li>
                  <a 
                    href="/dashboard" 
                    className="btn-dashboard"
                  >
                    Dashboard
                  </a>
                </li>
              ) : (
                <>
                  <li>
                    <a 
                      href="/login" 
                      className="btn-login"
                    >
                      Login
                    </a>
                  </li>
                  <li>
                    <a 
                      href="/signup" 
                      className="btn-signup"
                    >
                      Sign Up
                    </a>
                  </li>
                </>
              )}
            </ul>
          </LiquidGlass>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`fixed top-0 right-0 h-screen w-64 transform transition-transform duration-300 ease-in-out z-40 md:hidden ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <LiquidGlass
            borderRadius={0}
            blur={1}
            contrast={1.5}
            brightness={1.8}
            saturation={1.2}
            displacementScale={3}
            elasticity={0.7}
            className='h-full w-full'
          >
            <ul className="flex flex-col gap-6 text-xl p-8 mt-16">
              <li>
                <a 
                  href="/" 
                  className={`block ${isActive('/') ? 'active text-purple-400' : 'text-white'}`}
                  onClick={closeMenu}
                >
                  Home
                </a>
              </li>
              <li>
                <a 
                  href="/info" 
                  className={`block ${isActive('/info') ? 'active text-purple-400' : 'text-white'}`}
                  onClick={closeMenu}
                >
                  Info
                </a>
              </li>
              <li>
                <a 
                  href="/updates" 
                  className={`block ${isActive('/updates') ? 'active text-purple-400' : 'text-white'}`}
                  onClick={closeMenu}
                >
                  Updates
                </a>
              </li>
              
              {user ? (
                <li>
                  <a 
                    href="/account" 
                    className="block btn-dashboard text-white bg-purple-600 px-4 py-2 rounded-lg text-center"
                    onClick={closeMenu}
                  >
                    Dashboard
                  </a>
                </li>
              ) : (
                <>
                  <li>
                    <a 
                      href="/login" 
                      className="block btn-login text-white bg-purple-600 px-4 py-2 rounded-lg text-center"
                      onClick={closeMenu}
                    >
                      Login
                    </a>
                  </li>
                  <li>
                    <a 
                      href="/signup" 
                      className="block btn-signup text-white bg-purple-700 px-4 py-2 rounded-lg text-center"
                      onClick={closeMenu}
                    >
                      Sign Up
                    </a>
                  </li>
                </>
              )}
            </ul>
          </LiquidGlass>
        </div>

        {/* Overlay for mobile menu */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={closeMenu}
          ></div>
        )}
      </div>  
    </nav>
  )
}
