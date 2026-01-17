"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float ,Sparkles} from '@react-three/drei';
import { 
  Check, 
  Rocket, 
  Code, 
  Calendar, 
  MapPin, 
  Plus, 
  Minus, 
  ArrowRight,
  Github,
  Linkedin,
  Instagram,
  ChevronDown
} from 'lucide-react';
import { LiquidGlass } from '@liquidglass/react';

// --- 3D Components ---

function Brain() {
  const meshRef = useRef();
  
  useFrame((state, delta) => {
    // Revolving animation
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <group ref={meshRef} scale={[0.8, 0.8, 0.8]}>
      {/* Abstract Cyber Brain using TorusKnot for convoluted structure */}
     
      <mesh>
        {/* args: [radius, tube, tubularSegments, radialSegments, p, q] */}
        {/* p=3, q=4 creates a dense, knotted structure resembling brain folds */}
        <meshStandardMaterial 
          color="#1a0b2e" 
          roughness={0.5} 
          //roughness={0.9} 
          metalness={1.0} 
        />
      </mesh>
      {/* Wireframe Overlay for the "Tech" look */}
      <mesh>
        <torusKnotGeometry args={[9.52, 9.6, 500, 30, 11, 9]} />
        <meshStandardMaterial 
          wireframe 
          color="#9f38ff" 
          emissive="#bb00d7"
          emissiveIntensity={1.5}
          //color="#8400ff" 
          //emissive="#785d7d"
          //emissiveIntensity={1.5}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#d946ef" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />
      <Sparkles 
        count={100}
        scale={12}
        size={16}
        //size={6}
        speed={1}
        opacity={1}
        color="#f5ff64"
      />
      
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Brain />
      </Float>

      {/* Additional Sparkles for Background */}
      <Sparkles 
        scale={20} 
        count={50} 
        speed={0.3}
        position={[0, -10, 0]}
      />
      
      {/* Disable zoom to keep layout stable */}
      <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
    </>
  );
}

// Simple Typewriter component that accepts an array of tokens
function Typewriter({ tokens, speed = 20 }) {
  const [count, setCount] = React.useState(0);
  const total = React.useMemo(() => tokens.reduce((s, t) => s + t.text.length, 0), [tokens]);

  React.useEffect(() => {
    if (count >= total) return;
    const id = setInterval(() => {
      setCount(c => Math.min(total, c + 1));
    }, speed);
    return () => clearInterval(id);
  }, [count, total, speed]);

  // Render tokens up to `count` characters
  let remaining = count;
  const rendered = tokens.map((token, i) => {
    if (remaining <= 0) return React.createElement(React.Fragment, { key: i }, '');
    const take = Math.min(token.text.length, remaining);
    remaining -= take;
    const text = token.text.slice(0, take);
    return token.className ? (
      React.createElement('span', { key: i, className: token.className }, text)
    ) : (
      React.createElement(React.Fragment, { key: i }, text)
    );
  });

  return (
    <>
      {rendered}
      {/* caret */}
      {count < total ? <span className="text-purple-500 ml-1 animate-pulse">|</span> : null}
    </>
  );
}

// --- Main Page Component ---

export default function InitHackathon() {
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  // Parallax & Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      // Calculate scroll progress percentage
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);

      reveal();
    };
    
    window.addEventListener('scroll', handleScroll);
    reveal(); // Trigger on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reveal Animation Logic
  const reveal = () => {
    const reveals = document.querySelectorAll(".reveal");
    for (let i = 0; i < reveals.length; i++) {
      const windowHeight = window.innerHeight;
      const elementTop = reveals[i].getBoundingClientRect().top;
      const elementVisible = 100; // Lowered slightly for mobile
      if (elementTop < windowHeight - elementVisible) {
        reveals[i].classList.add("active");
      }
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Tokens for the code snippet (preserve syntax highlighting classes)
  const codeTokens = [
    { text: "const ", className: "text-fuchsia-400" },
    { text: "initHackathon", className: "text-blue-400" },
    { text: " = ", className: null },
    { text: "async", className: "text-yellow-300" },
    { text: " () => {\n  ", className: null },
    { text: "await", className: "text-fuchsia-400" },
    { text: " ", className: null },
    { text: "learn", className: "text-blue-400" },
    { text: "(", className: null },
    { text: "'Full Stack'", className: "text-purple-400" },
    { text: ");\n  ", className: null },
    { text: "await", className: "text-fuchsia-400" },
    { text: " ", className: null },
    { text: "build", className: "text-blue-400" },
    { text: "(", className: null },
    { text: "'MVP'", className: "text-purple-400" },
    { text: ");\n  ", className: null },
    { text: "await", className: "text-fuchsia-400" },
    { text: " ", className: null },
    { text: "deploy", className: "text-blue-400" },
    { text: "();\n\n  ", className: null },
    { text: "// Returns: A new career path\n  ", className: "text-gray-500" },
    { text: "return", className: "text-fuchsia-400" },
    { text: " ", className: null },
    { text: '"Builder"', className: "text-purple-400" },
    { text: ";\n}", className: null }
  ];

  return (
    <div className="bg-transparent text-white min-h-screen font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden relative z-[1]">
      {/* External Fonts & Icons */}
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;800&display=swap');

        :root {
          --neon-purple: #a855f7;
          --dark-bg: #0a0a0a;
        }

        body {
          font-family: 'Inter', sans-serif;
        }
        
        .font-mono {
          font-family: 'JetBrains Mono', monospace;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--neon-purple);
        }

        /* Glitch Effect */
        .glitch {
          position: relative;
        }
        .glitch::before,
        .glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .glitch::before {
          left: 2px;
          text-shadow: -1px 0 #d946ef; /* Fuchsia */
          clip: rect(44px, 450px, 56px, 0);
          animation: glitch-anim 5s infinite linear alternate-reverse;
        }
        .glitch::after {
          left: -2px;
          text-shadow: -1px 0 #a855f7; /* Purple */
          clip: rect(44px, 450px, 56px, 0);
          animation: glitch-anim2 5s infinite linear alternate-reverse;
        }

        @keyframes glitch-anim {
          0% { clip: rect(13px, 9999px, 81px, 0); }
          20% { clip: rect(78px, 9999px, 2px, 0); }
          40% { clip: rect(2px, 9999px, 49px, 0); }
          60% { clip: rect(22px, 9999px, 16px, 0); }
          80% { clip: rect(69px, 9999px, 92px, 0); }
          100% { clip: rect(54px, 9999px, 28px, 0); }
        }
        @keyframes glitch-anim2 {
          0% { clip: rect(65px, 9999px, 19px, 0); }
          20% { clip: rect(3px, 9999px, 86px, 0); }
          40% { clip: rect(51px, 9999px, 14px, 0); }
          60% { clip: rect(87px, 9999px, 67px, 0); }
          80% { clip: rect(5px, 9999px, 32px, 0); }
          100% { clip: rect(34px, 9999px, 12px, 0); }
        }

        /* Float Animation */
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out 3s infinite;
        }

        /* Sparkle Animation */
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        
        .sparkle {
          display: inline-block;
          animation: sparkle 2s ease-in-out infinite;
        }

        /* Reveal Animation Classes */
        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease-out;
        }
        .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }

        /* Timeline Connector - Desktop Only */
        @media (min-width: 768px) {
            .timeline-line::before {
                content: '';
                position: absolute;
                top: 0;
                bottom: 0;
                left: 50%;
                width: 2px;
                background: #333;
                transform: translateX(-50%);
                z-index: 0;
            }
        }
      `}</style>

      {/* --- BINDING ELEMENTS START --- */}
      
      {/* 1. The Spine: Fixed Vertical Progress Line (Left) */}
      <div className="fixed left-0 top-0 h-full w-[2px] bg-white/5 z-50 hidden md:block">
        <div 
          className="w-full bg-gradient-to-b from-purple-500 via-fuchsia-500 to-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)] transition-all duration-100 ease-out"
          style={{ height: `${scrollProgress}%` }}
        />
      </div>

      {/* 2. The Terminal: Fixed Status Widget (Bottom Right) */}
      <div className="fixed bottom-8 right-8 z-50 font-mono text-xs hidden md:flex flex-col items-end gap-2 text-purple-500/60 bg-black/40 p-4 border border-purple-500/10 rounded backdrop-blur-md hover:border-purple-500/40 transition-colors">
        <div className="flex justify-between w-full gap-8">
           <span>STATUS::ONLINE</span>
           <span className="animate-pulse text-purple-400">{Math.round(scrollProgress)}%</span>
        </div>
        <div className="w-40 h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-purple-500 shadow-[0_0_10px_#a855f7]" style={{ width: `${scrollProgress}%` }} />
        </div>
        <div className="flex justify-between w-full text-[10px] text-gray-500 pt-1 border-t border-white/5 mt-1">
           <span>COORD_Y: {Math.round(scrollY)}</span>
           <span>INIT_SEQ_V1.0</span>
        </div>
      </div>

      {/* --- BINDING ELEMENTS END --- */}

      {/* Parallax Background Layers */}
      <div 
        className="fixed top-0 left-0 w-full h-[120vh] pointer-events-none z-[0] opacity-50"
        style={{ 
          transform: `translateY(${scrollY * 0.5}px)`,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />
      <div 
        className="fixed top-0 left-0 w-full h-[120vh] pointer-events-none z-[0] opacity-30"
        style={{ 
          transform: `translateY(${scrollY * 0.3}px)`,
          backgroundImage: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }}
      />
       <div 
        className="fixed top-0 left-0 w-full h-[120vh] pointer-events-none z-[0]"
        style={{ 
          background: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.05), transparent 60%)'
        }}
      />

      {/* Hero Section */}
      <header className="relative h-screen flex items-center justify-center text-center px-4 overflow-hidden z-[1]">
        
        {/* 3D Brain Background */}
        <div className="absolute inset-0 w-full h-full z-0 opacity-40 pointer-events-none">
          <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
             <Scene />
          </Canvas>
        </div>

        {/* Parallax Content Wrapper - Moves slower than scroll */}
        <div 
          className="relative z-10 max-w-4xl mx-auto mt-16"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        >
          <p className="font-mono text-purple-500 mb-4 tracking-widest text-xs md:text-sm reveal active">
            &lt;event status="initializing" /&gt;
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-black mb-6 tracking-tighter glitch break-words" data-text="INIT() HACKATHON">
            INIT() HACKATHON
          </h1>
          <p className="text-lg md:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto px-4">
            24 Hours. ₹20,000 Prize Pool. <br className="hidden md:block"/>
           Initialize your <span className="text-white font-bold">Brain</span> . Execute your  <span className="text-purple-500 font-bold">Vision</span>.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center font-mono">
            <div className="flex items-center gap-2 text-sm bg-white/5 px-4 py-2 rounded border border-white/10 hover:bg-white/10 transition-colors bg-black/50 backdrop-blur-sm">
              <Calendar className="w-4 h-4 text-purple-500" /> Feb 12-13
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/5 px-4 py-2 rounded border border-white/10 hover:bg-white/10 transition-colors bg-black/50 backdrop-blur-sm">
              <MapPin className="w-4 h-4 text-purple-500" /> Kasturba Hall
            </div>
          </div>
         
          <div className="mt-12 ">
            <LiquidGlass
                        borderRadius={8}
                        blur={1}
                        contrast={1.5}
                        brightness={1.8}
                        saturation={1.2}
                        displacementScale={3}
                        elasticity={0.7}
                        className='w-[20vw] py-4 bg-black/20'
                      >
            <a href="/signup" className="inline-flex items-center gap-2  rounded text-lg font-bold tracking-widest text-purple-500  transition-all duration-300 group ">
              INITIALIZE SYSTEM
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a></LiquidGlass>

          <div className="mt-12">
            <a href="#" className="inline-flex items-center gap-2 px-8 py-4 rounded text-lg font-bold tracking-widest border border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-300 group bg-black/20 backdrop-blur-sm">
              INITIALIZE SYSTEM
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-gray-500">
          <ChevronDown className="w-6 h-6" />
        </div>
        </div>
      </header>
      {/* Philosophy Section */}
      <section id="about" className="py-16 md:py-24 relative z-[1] bg-gradient-to-b from-transparent via-black/20 to-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="reveal">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-mono">Democratizing the <span className="text-purple-500">Hack</span></h2>
              <p className="text-gray-400 mb-6 text-base md:text-lg leading-relaxed">
                Traditional hackathons can be intimidating. Init() is different. We are an 
                <strong className="text-white ml-1">educational accelerator</strong>. 
              </p>
              <p className="text-gray-400 mb-8 text-base md:text-lg leading-relaxed">
                We don't just tell you to build; we teach you how. With our mandatory "Zero to One" seminar, 
                even a student who has never written a backend line of code will deploy a full-stack app by the 24th hour.
              </p>
              <ul className="space-y-4 font-mono text-sm text-gray-300">
                {[
                  '24-Hour Sprint',
                  'Mandatory Bootcamp for Freshers',
                  'Midnight CTF Challenge'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-purple-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Added animate-float class here */}
            <div className="relative reveal delay-200 animate-float mt-8 md:mt-0">
              <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 rounded-full"></div>
              <div className="relative bg-gray-900 border border-white/10 p-6 md:p-8 rounded-xl shadow-2xl overflow-hidden">
                    <pre className="font-mono text-xs md:text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
                      <Typewriter tokens={codeTokens} speed={18} />
                    </pre>
                <pre className="font-mono text-xs md:text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
                  <span className="text-fuchsia-400">const</span> <span className="text-blue-400">initHackathon</span> = <span className="text-yellow-300">async</span> () ={'>'} {'{'}{'\n'}
                  {'  '}<span className="text-fuchsia-400">await</span> <span className="text-blue-400">learn</span>(<span className="text-purple-400">'Full Stack'</span>);{'\n'}
                  {'  '}<span className="text-fuchsia-400">await</span> <span className="text-blue-400">build</span>(<span className="text-purple-400">'MVP'</span>);{'\n'}
                  {'  '}<span className="text-fuchsia-400">await</span> <span className="text-blue-400">deploy</span>();{'\n'}
                  {'\n'}
                  {'  '}<span className="text-gray-500">// Returns: A new career path</span>{'\n'}
                  {'  '}<span className="text-fuchsia-400">return</span> <span className="text-purple-400">"Builder"</span>;{'\n'}
                  {'}'};
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tracks & Prizes */}
      <section id="tracks" className="py-16 md:py-24 bg-gradient-to-b from-black/50 via-black/70 to-black/50 relative z-[1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16 reveal">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-mono">Total Bounty: <span className="text-purple-500">₹20,000</span></h2>
            <p className="text-gray-400">Two tracks. Equal opportunity. Choose your league.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Freshers Track */}
            <div className="bg-[#111] p-6 md:p-8 rounded-xl border border-white/10 hover:border-purple-500/50 transition-colors reveal group">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-purple-500/10 text-purple-500 px-3 py-1 rounded text-xs font-mono uppercase tracking-widest border border-purple-500/20">
                  Freshers Only
                </div>
                <Rocket className="w-8 h-8 text-gray-600 group-hover:text-purple-500 transition-colors animate-float" />
              </div>
              <h3 className="text-2xl font-bold mb-2">The Rising Star</h3>
              <p className="text-gray-400 mb-8 h-12">For 1st year students. Move from static pages to dynamic web apps.</p>
              
              <div className="space-y-3 font-mono text-sm border-t border-white/10 pt-6">
                {[
                  { place: '1st Place', prize: '₹5,000' },
                  { place: '2nd Place', prize: '₹3,000' },
                  { place: '3rd Place', prize: '₹2,000' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-500">{item.place}</span>
                    <span className="text-white font-bold">{item.prize}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Open Track */}
            <div className="bg-[#111] p-6 md:p-8 rounded-xl border border-white/10 hover:border-fuchsia-500/50 transition-colors reveal delay-100 group">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-fuchsia-500/10 text-fuchsia-500 px-3 py-1 rounded text-xs font-mono uppercase tracking-widest border border-fuchsia-500/20">
                  Open League
                </div>
                <Code className="w-8 h-8 text-gray-600 group-hover:text-fuchsia-500 transition-colors animate-float-delayed" />
              </div>
              <h3 className="text-2xl font-bold mb-2">The Grand Init</h3>
              <p className="text-gray-400 mb-8 h-12">For experienced builders. Build scalable, market-ready MVPs.</p>
              
              <div className="space-y-3 font-mono text-sm border-t border-white/10 pt-6">
                {[
                  { place: '1st Place', prize: '₹5,000' },
                  { place: '2nd Place', prize: '₹3,000' },
                  { place: '3rd Place', prize: '₹2,000' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-500">{item.place}</span>
                    <span className="text-white font-bold">{item.prize}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section id="schedule" className="py-16 md:py-24 relative overflow-hidden z-[1] bg-gradient-to-b from-black/50 via-transparent to-black/50">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 md:mb-16 text-center font-mono">Run of Show</h2>
          
          <div className="relative timeline-line space-y-8 md:space-y-12">
            {[
              { time: '08:00 AM', title: 'Registration & Setup', desc: 'Wi-Fi configuration & Swag', color: 'purple', align: 'right' },
              { time: '09:30 AM', title: 'The Seminar', desc: 'Mandatory Zero-to-One Bootcamp', color: 'fuchsia', align: 'left' },
              { time: '12:00 PM', title: 'Hacking Begins', desc: 'Timer starts. Gong sounds.', color: 'red', align: 'right', pulse: true },
              { time: '01:00 AM', title: 'Midnight CTF', desc: 'Capture The Flag Challenge', color: 'blue', align: 'left' },
              { time: '15:00 PM', title: 'Awards Ceremony', desc: '₹20k Distributed', color: 'yellow', align: 'right' },
            ].map((item, idx) => {
              // Dynamic Tailwind classes based on item props
              const textColor = item.color === 'purple' ? 'text-purple-500' : 
                              item.color === 'fuchsia' ? 'text-fuchsia-500' :
                              item.color === 'red' ? 'text-red-500' :
                              item.color === 'blue' ? 'text-blue-500' : 'text-yellow-500';
              
              const bgColor = item.color === 'purple' ? 'bg-purple-500' : 
                            item.color === 'fuchsia' ? 'bg-fuchsia-500' :
                            item.color === 'red' ? 'bg-red-500' :
                            item.color === 'blue' ? 'bg-blue-500' : 'bg-yellow-500';

              const isRight = item.align === 'right';

              return (
                <div key={idx} className="relative flex flex-col md:flex-row items-center md:justify-between reveal">
                  {/* Mobile Layout: Stacked Centered */}
                  <div className="md:hidden text-center bg-[#111] p-6 rounded-xl border border-white/10 w-full hover:border-purple-500/30 transition-colors">
                     <span className={`font-mono ${textColor} font-bold text-lg block mb-2`}>{item.time}</span>
                     <h4 className="text-xl font-bold text-white mb-1">{item.title}</h4>
                     <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>

                  {/* Desktop Layout: Left Side */}
                  <div className={`hidden md:block w-5/12 ${isRight ? 'text-right pr-8' : 'pl-8 order-last'}`}>
                    {isRight ? (
                      <>
                        <h4 className="text-xl font-bold text-white">{item.title}</h4>
                        <p className="text-gray-400 text-sm">{item.desc}</p>
                      </>
                    ) : (
                      <span className={`font-mono ${textColor} font-bold`}>{item.time}</span>
                    )}
                  </div>

                  {/* Desktop Layout: Center Dot */}
                  <div className={`hidden md:block absolute left-1/2 transform -translate-x-1/2 w-4 h-4 ${bgColor} rounded-full border-4 border-black z-10 ${item.pulse ? 'animate-pulse w-6 h-6' : ''}`}></div>

                  {/* Desktop Layout: Right Side */}
                  <div className={`hidden md:block w-5/12 ${isRight ? 'pl-8' : 'text-right pr-8'}`}>
                    {isRight ? (
                      <span className={`font-mono ${textColor} font-bold`}>{item.time}</span>
                    ) : (
                      <>
                        <h4 className="text-xl font-bold text-white">{item.title}</h4>
                        <p className="text-gray-400 text-sm">{item.desc}</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24 bg-gradient-to-b from-black/50 via-black/70 to-black relative z-[1]">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center font-mono">Knowledge Base</h2>
          
          <div className="space-y-4">
            {[
              { q: 'Do I need a team?', a: 'You can register solo! We will have a team-formation mixer at 11:30 AM to help you find teammates.' },
              { q: "I'm a fresher and know nothing. Should I come?", a: 'YES! That is exactly why we created the "Freshers Track" and the morning Seminar. We will teach you what you need to know.' },
              { q: 'What should I bring?', a: 'Laptop, Charger, Extension Cord (recommended), Water Bottle, Toiletries, and a Hoodie (it gets cold at night).' },
              { q: 'Can I use pre-existing code?', a: 'No. You can use libraries and frameworks, but the core application code must be written during the 24 hours.' }
            ].map((faq, idx) => (
              <div key={idx} className="border border-white/10 rounded-lg overflow-hidden reveal">
                <button 
                  className="w-full text-left px-4 md:px-6 py-4 bg-[#111] hover:bg-[#1a1a1a] flex justify-between items-center transition-colors"
                  onClick={() => toggleFaq(idx)}
                >
                  <span className="font-semibold text-sm md:text-base pr-4">{faq.q}</span>
                  {openFaq === idx ? (
                    <Minus className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-4 md:px-6 py-4 text-sm md:text-base text-gray-400 bg-black/50 border-t border-white/5">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

   
    </div>
  );
}
