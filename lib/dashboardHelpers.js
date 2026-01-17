// Shared utilities for dashboard authentication and data fetching

export async function getDashboardUser(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw new Error('Failed to get user')
  return user
}

export async function getUserProfile(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function getTeamData(supabase, teamId) {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function getTeamMembers(supabase, teamId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, email, role')
    .eq('team_id', teamId)
  
  if (error) throw error
  return data || []
}

export async function getHackathonStatus(supabase) {
  const { data, error } = await supabase
    .from('hackathon_meta')
    .select('status, start_time, end_time')
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data || { status: 'not_started' }
}

export async function getSubmissionData(supabase, userId) {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function getUserSelectedTrack(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('selected_track_id')
    .eq('id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data?.selected_track_id || null
}

export function getStatusColor(status) {
  const colors = {
    'not_started': 'bg-slate-500 text-white',
    'live': 'bg-emerald-500 text-white',
    'ended': 'bg-slate-600 text-white'
  }
  return colors[status] || colors['not_started']
}

export function getStatusLabel(status) {
  const labels = {
    'not_started': 'Not Started',
    'live': 'Live',
    'ended': 'Ended'
  }
  return labels[status] || 'Unknown'
}

// Dummy data generators for demo
export const DUMMY_TEAMS = [
  { 
    id: 1, 
    name: 'CodeCrusaders', 
    created_at: '2026-01-10',
    member_count: 4
  },
  { 
    id: 2, 
    name: 'PixelForce', 
    created_at: '2026-01-11',
    member_count: 3
  }
]

export const DUMMY_MEMBERS = [
  { 
    id: '1', 
    full_name: 'Alex Chen', 
    username: 'alexchen',
    role: 'leader',
    avatar_url: 'https://avatar.vercel.sh/alexchen'
  },
  { 
    id: '2', 
    full_name: 'Sam Smith', 
    username: 'samsmith',
    role: 'member',
    avatar_url: 'https://avatar.vercel.sh/samsmith'
  },
  { 
    id: '3', 
    full_name: 'Jordan Lee', 
    username: 'jordanlee',
    role: 'member',
    avatar_url: 'https://avatar.vercel.sh/jordanlee'
  },
  { 
    id: '4', 
    full_name: 'Taylor Kim', 
    username: 'taylorkim',
    role: 'member',
    avatar_url: 'https://avatar.vercel.sh/taylorkim'
  }
]

export const DUMMY_TRACKS = [
  {
    id: 1,
    title: 'Web Development',
    description: 'Build responsive, modern web applications using React, Next.js, and cutting-edge frontend technologies.',
    emoji: '🌐',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 2,
    title: 'Mobile Development',
    description: 'Create innovative mobile apps for iOS and Android using Flutter, React Native, or native technologies.',
    emoji: '📱',
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 3,
    title: 'AI & Machine Learning',
    description: 'Develop intelligent solutions using machine learning, deep learning, and AI frameworks.',
    emoji: '🤖',
    color: 'from-pink-500 to-pink-600'
  },
  {
    id: 4,
    title: 'Blockchain & Web3',
    description: 'Build decentralized applications using blockchain technology, smart contracts, and Web3 protocols.',
    emoji: '⛓️',
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    id: 5,
    title: 'Cloud & DevOps',
    description: 'Design scalable cloud infrastructure, containerization, and deployment pipelines.',
    emoji: '☁️',
    color: 'from-cyan-500 to-cyan-600'
  }
]

export const DUMMY_SUBMISSION = {
  id: 'sub_1',
  ppt_url: 'https://docs.google.com/presentation/d/1example',
  github_url: 'https://github.com/example/project',
  deployment_url: 'https://example-hackathon.vercel.app',
  submitted_at: '2026-01-15T10:30:00Z',
  status: 'submitted'
}

export const DUMMY_UPDATES = [
  {
    id: 1,
    title: 'Welcome to Init Hackathon 2026!',
    content: 'We\'re excited to host the biggest hackathon yet. Get ready to build amazing projects!',
    created_by: 'bbe123d4-9c3d-45b6-9f84-db961a8238ba',
    created_at: '2026-01-14T09:00:00Z',
    status: 'published'
  },
  {
    id: 2,
    title: 'Track Selection is NOW LIVE',
    content: 'All participants can now select their preferred tracks. Choose wisely!',
    created_by: 'bbe123d4-9c3d-45b6-9f84-db961a8238ba',
    created_at: '2026-01-15T08:00:00Z',
    status: 'published'
  },
  {
    id: 3,
    title: 'Submission Deadline Extended',
    content: 'Due to popular request, we\'ve extended the deadline to 10 PM UTC tonight.',
    created_by: 'bbe123d4-9c3d-45b6-9f84-db961a8238ba',
    created_at: '2026-01-16T14:30:00Z',
    status: 'published'
  },
  {
    id: 4,
    title: 'API Keys & Documentation Released',
    content: 'Check out our new API docs for integrating with sponsorship services.',
    created_by: 'bbe123d4-9c3d-45b6-9f84-db961a8238ba',
    created_at: '2026-01-16T16:00:00Z',
    status: 'published'
  }
]
