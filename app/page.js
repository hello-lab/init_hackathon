import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(255,64,243,0.14),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(33,246,255,0.18),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(10,8,28,0.4),transparent_45%),#040008]">
      <header className="sticky top-0 z-20 border-b border-slate-200/60 dark:border-slate-800/70 bg-white/70 dark:bg-black/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#ff40f3] to-[#21f6ff] flex items-center justify-center text-white font-bold shadow-[0_0_18px_rgba(255,64,243,0.6)]">I</div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Init Hackathon</p>
              <p className="text-base font-semibold text-slate-900 dark:text-white">Supabase Starter</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Link href="#features" className="neon-link">Features</Link>
            <Link href="/login" className="neon-link">Login</Link>
            <Link href="/account" className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff40f3] to-[#21f6ff] text-black font-semibold shadow-[0_0_20px_rgba(255,64,243,0.55)] hover:shadow-[0_0_28px_rgba(33,246,255,0.45)] transition">Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#ffe6fb] text-[#b500b4] dark:bg-[#2b123d] dark:text-[#ff7afc] text-sm font-semibold shadow-[0_0_14px_rgba(255,64,243,0.45)]">
              <span className="h-2 w-2 rounded-full bg-[#ff40f3] animate-pulse" />
              Live Supabase + Next.js 16
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-slate-900 dark:text-white">
              Build and ship secure apps faster.
            </h1>
            <p className="text-lg text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
              A polished starter with authentication, account management, and a cohesive design system. Perfect for hackathons or rapid product launches.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login" className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff40f3] via-[#ff5ccf] to-[#21f6ff] text-black font-semibold shadow-[0_0_28px_rgba(255,64,243,0.55)] hover:shadow-[0_0_34px_rgba(33,246,255,0.5)] transition transform hover:scale-[1.03]">
                Get started free
              </Link>
              <Link href="#features" className="px-6 py-3 rounded-xl border border-[#ff40f3] text-slate-800 dark:text-white font-semibold hover:text-[#ff40f3] dark:hover:text-[#ff7afc] hover:shadow-[0_0_18px_rgba(255,64,243,0.5)] transition neon-link">
                View features
              </Link>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex -space-x-3">
                {["/next.svg", "/vercel.svg"].map((src, i) => (
                  <div key={i} className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-md">
                    <Image src={src} alt="logo" width={18} height={18} className={src === "/next.svg" ? "dark:invert" : ""} />
                  </div>
                ))}
              </div>
              <p>Powered by Next.js 16 and Supabase.</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,64,243,0.35),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(33,246,255,0.28),transparent_42%)] blur-3xl" />
            <div className="relative card glass overflow-hidden">
              <div className="p-6 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Dashboard</p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">Analytics</p>
                </div>
                <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 font-semibold">Live</span>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: "Active users", value: "1,248", trend: "+12%" },
                  { label: "Conversion", value: "4.8%", trend: "+0.6%" },
                  { label: "MRR", value: "$12.4k", trend: "+8%" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 bg-white/80 dark:bg-black/70 shadow-[0_0_18px_rgba(255,64,243,0.25)]">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{item.value}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{item.trend}</span>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/70 text-sm text-slate-600 dark:text-slate-400">
                Real-time data powered by Supabase.
              </div>
            </div>
          </div>
        </div>

        <section id="features" className="mt-20 grid md:grid-cols-3 gap-6">
          {[{
            title: "Secure auth",
            desc: "Supabase auth with email/password flows ready to go.",
            icon: "🔒"
          }, {
            title: "Polished UI",
            desc: "Responsive components with Tailwind 4 and glassmorphism touches.",
            icon: "🎨"
          }, {
            title: "Fast ship",
            desc: "Next.js app router, layouts, and actions pre-wired for speed.",
            icon: "⚡"
          }].map((feature) => (
            <div key={feature.title} className="card">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-200/70 dark:border-slate-800/70 bg-white/60 dark:bg-black/70 backdrop-blur-xl py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-400">
          <p>© 2026 Init Hackathon. Built with Next.js & Supabase.</p>
          <div className="flex gap-4">
            <a href="https://nextjs.org" className="neon-link">Docs</a>
            <a href="https://supabase.com" className="neon-link">Supabase</a>
            <Link href="/login" className="neon-link">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
