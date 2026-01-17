'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { DUMMY_SUBMISSION } from '@/lib/dashboardHelpers'
import Link from 'next/link'
import { Canvas } from '@react-three/fiber'
import { AmbientParticles } from '@/components/3D/ParticleScene'
import { useEffect, useState } from 'react'
import { Upload, ExternalLink, CheckCircle } from 'lucide-react'

export default function SubmissionPage() {
  const supabase = createClient()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    ppt_url: '',
    github_url: '',
    deployment_url: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      // Load dummy submission data
      setFormData({
        ppt_url: DUMMY_SUBMISSION.ppt_url,
        github_url: DUMMY_SUBMISSION.github_url,
        deployment_url: DUMMY_SUBMISSION.deployment_url
      })
      setSubmitted(DUMMY_SUBMISSION.status === 'submitted')
      setLoading(false)
    }
    getUser()
  }, [supabase])

  if (loading || !user) return null

  const submissionDeadline = new Date('2026-01-17T22:00:00Z')
  const isDeadlinePassed = new Date() > submissionDeadline
  const timeRemaining = Math.max(0, submissionDeadline - new Date())
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60))
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.ppt_url || !formData.github_url || !formData.deployment_url) {
      setSubmitError('All fields are required')
      return
    }

    if (isDeadlinePassed) {
      setSubmitError('Submission deadline has passed')
      return
    }

    // In production, save to Supabase
    setSubmitted(true)
    setSubmitError('')
  }

  return (
    <DashboardLayout user={user}>
      {/* 3D Background */}
      <div className="fixed inset-0 -z-10 h-full w-full opacity-20 pointer-events-none">
        <Canvas camera={{ position: [0, 3, 6] }}>
          <AmbientParticles />
        </Canvas>
      </div>

      <div className="min-h-screen p-4 md:p-8 lg:p-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-[#23e6ff] hover:text-[#00ffff] text-sm font-semibold mb-4 inline-flex items-center gap-2">
            ← Back
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff2fd3] to-[#23e6ff] bg-clip-text text-transparent mb-2">
            Project Submission
          </h1>
          <p className="text-slate-400">Submit your project links and assets</p>
        </div>

        {/* Deadline Status */}
        <div className={`mb-8 p-4 rounded-lg border ${isDeadlinePassed ? 'bg-[#ff5c8a]/10 border-[#ff5c8a]/50 text-[#ff5c8a]' : 'bg-[#12f7c0]/10 border-[#12f7c0]/50 text-[#12f7c0]'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{isDeadlinePassed ? 'Submission Closed' : 'Submission Open'}</p>
              <p className="text-sm mt-1">
                {isDeadlinePassed 
                  ? 'The submission deadline has passed' 
                  : `${hoursRemaining}h ${minutesRemaining}m remaining`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="card glass">
              <h2 className="text-xl font-bold text-white mb-6">Project Details</h2>

              {submitError && (
                <div className="mb-6 p-4 rounded-lg bg-[#ff5c8a]/10 border border-[#ff5c8a]/50 text-[#ff5c8a] text-sm">
                  {submitError}
                </div>
              )}

              {submitted && (
                <div className="mb-6 p-4 rounded-lg bg-[#12f7c0]/10 border border-[#12f7c0]/50 text-[#12f7c0] flex items-center gap-3">
                  <CheckCircle size={20} />
                  <div>
                    <p className="font-semibold">Submission Received</p>
                    <p className="text-sm">Your project has been submitted successfully. You can update it until the deadline.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* PPT Upload */}
                <div>
                  <label htmlFor="ppt" className="text-sm font-semibold text-white block mb-3">
                    Presentation Deck
                  </label>
                  <div className="flex gap-2 items-center mb-2">
                    <input
                      type="url"
                      id="ppt"
                      name="ppt_url"
                      placeholder="https://docs.google.com/presentation/d/..."
                      value={formData.ppt_url}
                      onChange={handleInputChange}
                      disabled={isDeadlinePassed && submitted}
                      className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-[#ff2fd3] focus:outline-none transition-all"
                    />
                    {formData.ppt_url && (
                      <a href={formData.ppt_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-[#23e6ff]/20 border border-[#23e6ff]/50 text-[#23e6ff] hover:bg-[#23e6ff]/30 transition-all">
                        <ExternalLink size={20} />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Share a Google Slides link or upload to a storage service</p>
                </div>

                {/* GitHub Link */}
                <div>
                  <label htmlFor="github" className="text-sm font-semibold text-white block mb-3">
                     GitHub Repository
                  </label>
                  <div className="flex gap-2 items-center mb-2">
                    <input
                      type="url"
                      id="github"
                      name="github_url"
                      placeholder="https://github.com/username/project"
                      value={formData.github_url}
                      onChange={handleInputChange}
                      disabled={isDeadlinePassed && submitted}
                      className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-[#ff2fd3] focus:outline-none transition-all"
                    />
                    {formData.github_url && (
                      <a href={formData.github_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-[#23e6ff]/20 border border-[#23e6ff]/50 text-[#23e6ff] hover:bg-[#23e6ff]/30 transition-all">
                        <ExternalLink size={20} />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Make sure your repository is public and includes a README</p>
                </div>

                {/* Deployment Link */}
                <div>
                  <label htmlFor="deployment" className="text-sm font-semibold text-white block mb-3">
                    Live Deployment
                  </label>
                  <div className="flex gap-2 items-center mb-2">
                    <input
                      type="url"
                      id="deployment"
                      name="deployment_url"
                      placeholder="https://my-project.vercel.app"
                      value={formData.deployment_url}
                      onChange={handleInputChange}
                      disabled={isDeadlinePassed && submitted}
                      className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-[#ff2fd3] focus:outline-none transition-all"
                    />
                    {formData.deployment_url && (
                      <a href={formData.deployment_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-[#23e6ff]/20 border border-[#23e6ff]/50 text-[#23e6ff] hover:bg-[#23e6ff]/30 transition-all">
                        <ExternalLink size={20} />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Link to your live project (Vercel, Netlify, Heroku, etc.)</p>
                </div>

                {/* Submit Button */}
                {!isDeadlinePassed && (
                  <button
                    type="submit"
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[#ff2fd3] to-[#23e6ff] text-white font-bold hover:shadow-[0_0_24px_rgba(255,47,211,0.55),0_0_48px_rgba(35,230,255,0.35)] transition-all flex items-center justify-center gap-2"
                  >
                    <Upload size={18} />
                    {submitted ? 'Update Submission' : 'Submit Project'}
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            {/* Submission Status */}
            <div className="card glass">
              <h3 className="text-lg font-bold text-white mb-4">Status</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${submitted ? 'bg-[#12f7c0]' : 'bg-slate-600'}`}></div>
                  <span className="text-sm text-slate-300">{submitted ? 'Submitted' : 'Not Submitted'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${formData.ppt_url ? 'bg-[#12f7c0]' : 'bg-slate-600'}`}></div>
                  <span className="text-sm text-slate-300">Presentation Deck</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${formData.github_url ? 'bg-[#12f7c0]' : 'bg-slate-600'}`}></div>
                  <span className="text-sm text-slate-300">GitHub Repository</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${formData.deployment_url ? 'bg-[#12f7c0]' : 'bg-slate-600'}`}></div>
                  <span className="text-sm text-slate-300">Live Deployment</span>
                </div>
              </div>
            </div>

            {/* Requirements 
            <div className="card glass">
              <h3 className="text-lg font-bold text-white mb-4">Requirements</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#12f7c0] font-bold mt-0.5">•</span>
                  <span>All links must be publicly accessible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#12f7c0] font-bold mt-0.5">•</span>
                  <span>GitHub repo must include README</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#12f7c0] font-bold mt-0.5">•</span>
                  <span>Live demo must be working</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#12f7c0] font-bold mt-0.5">•</span>
                  <span>Submit before deadline</span>
                </li>
              </ul>
            </div>*/}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
