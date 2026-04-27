"use client";
import Link from "next/link";
import { Shield, Search, GitBranch, Zap, Eye, Lock, Activity, Trophy } from "lucide-react";

const features = [
  {
    icon: <Search className="w-6 h-6 text-cyan-400" />,
    title: "AI Match Detection",
    desc: "Multimodal CLIP + SSIM identifies pirated sports broadcasts, highlight clips, and cropped game footage in milliseconds.",
  },
  {
    icon: <GitBranch className="w-6 h-6 text-purple-400" />,
    title: "Viral Propagation",
    desc: "Track how stolen game highlights spread across social networks like Twitter and TikTok with our real-time graph intelligence.",
  },
  {
    icon: <Eye className="w-6 h-6 text-sports-highlight" />,
    title: "Explainable Proof",
    desc: "Generate Grad-CAM heatmaps to visually prove copyright infringement down to the specific frame and player.",
  },
  {
    icon: <Lock className="w-6 h-6 text-cyan-400" />,
    title: "RAG Query System",
    desc: "Ask your AI agent natural questions: 'How many high-risk NBA clips were detected today?'",
  },
];

const stats = [
  { label: "Live Broadcast Accuracy", value: "98%" },
  { label: "Highlight Processing", value: "< 1.5s" },
  { label: "Platforms Monitored", value: "Cross-Platform" },
  { label: "AI Agents Deployed", value: "5 Active" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#020617] flex flex-col mesh-bg overflow-hidden relative">
      {/* Background Animated Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navbar */}
      <nav className="border-b border-white/5 px-8 py-5 flex items-center justify-between z-50 glass sticky top-0">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-cyan-400 animate-float" />
          <span className="font-bold text-xl tracking-tight text-white drop-shadow-md">MediaShield AI</span>
        </div>
        <div className="flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="/dashboard" className="hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all">Command Center</Link>
          <Link href="/detection" className="hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all">Live Detections</Link>
          <Link href="/graph" className="hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all">Propagation Graph</Link>
          <Link href="/insights" className="hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all">AI Insights</Link>
          <Link href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 glow-cyan transition-all relative overflow-hidden group">
            <span className="relative z-10">Launch App →</span>
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease] z-0" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col lg:flex-row items-center justify-center px-8 py-20 relative z-10 max-w-7xl mx-auto w-full gap-16">
        
        {/* Left Copy */}
        <div className="flex-1 text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold mb-8 animate-fade-in-up">
            <Trophy className="w-4 h-4 text-purple-400" /> Enterprise Sports Media Protection
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-[1.1] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-white drop-shadow-lg">Defend Your</span><br/>
            <span className="gradient-text animate-gradient bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 drop-shadow-xl">
              Digital Rights.
            </span>
          </h1>

          <p className="text-xl text-slate-300 mb-10 max-w-xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            We protect <strong className="text-cyan-400">₹50,000 crore</strong> of sports broadcast revenue that leaks annually via social media piracy. A multi-agent AI system that detects unauthorized media, tracks propagation velocity, and auto-generates legal evidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link href="/dashboard"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold hover:scale-105 transition-all glow-cyan text-lg relative overflow-hidden group">
              <span className="relative z-10 flex items-center gap-2"><Activity className="w-5 h-5"/> Start Monitoring</span>
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shine_1s_ease] z-0" />
            </Link>
            <Link href="/detection"
              className="px-8 py-4 rounded-xl glass border border-white/20 text-slate-200 hover:bg-white/5 hover:border-white/40 transition-all font-bold text-lg text-center">
              View Live Detections
            </Link>
          </div>
        </div>

        {/* Right 3D Isometric UI */}
        <div className="flex-1 perspective-container hidden lg:block animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="relative w-full h-[500px] isometric-layer animate-float">
            {/* Base Dashboard Mockup */}
            <div className="absolute inset-0 glass-premium p-6 rounded-2xl flex flex-col gap-4">
              <div className="w-full h-8 border-b border-white/10 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="w-full h-32 rounded-xl bg-slate-800/50 border border-white/5 flex items-center justify-center overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 opacity-50" />
                 <span className="text-cyan-400 font-mono text-sm font-bold z-10 flex items-center gap-2">
                   <Activity className="w-4 h-4 animate-pulse" /> SCANNING LIVE BROADCASTS
                 </span>
              </div>
              <div className="flex gap-4 h-full">
                <div className="flex-1 rounded-xl bg-slate-800/50 border border-white/5 p-4">
                  <div className="w-full h-2 bg-slate-700 rounded-full mb-3" />
                  <div className="w-3/4 h-2 bg-slate-700 rounded-full mb-3" />
                  <div className="w-1/2 h-2 bg-slate-700 rounded-full" />
                </div>
                <div className="flex-1 rounded-xl bg-slate-800/50 border border-white/5" />
              </div>
            </div>

            {/* Floating Alert Card */}
            <div className="absolute -right-8 -top-8 w-64 glass-premium p-4 rounded-xl border border-red-500/30 shadow-[0_0_30px_rgba(255,59,48,0.2)] animate-float-delayed">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-red-500/20 text-red-400"><Zap className="w-5 h-5"/></div>
                <div>
                  <h4 className="text-white font-bold text-sm">Match Detected!</h4>
                  <p className="text-slate-400 text-xs mt-1">98% SSIM Match found on TikTok.</p>
                </div>
              </div>
            </div>

             {/* Floating Embed Card */}
             <div className="absolute -left-12 top-32 w-48 glass-premium p-3 rounded-xl border border-cyan-500/30 animate-float" style={{ animationDelay: '1s' }}>
                <div className="text-cyan-400 font-mono text-xs mb-2">VECTOR_SEARCH</div>
                <div className="w-full h-1 bg-cyan-500/30 rounded-full mb-1" />
                <div className="w-full h-1 bg-cyan-500/30 rounded-full mb-1" />
                <div className="w-4/5 h-1 bg-cyan-500/30 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/10 py-10 px-8 relative z-10 bg-black/20 backdrop-blur-md">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={s.label} className="text-center animate-fade-in-up" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
              <div className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{s.value}</div>
              <div className="text-sm font-semibold text-slate-400 mt-2 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-32 px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-white">The Ultimate Defense Playbook</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              5 autonomous AI agents working in concert to secure your digital sporting assets.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={f.title} className="glass-premium p-8 tilt-card animate-fade-in-up" style={{ animationDelay: `${0.1 * i}s` }}>
                <div className="mb-6 p-4 rounded-2xl bg-slate-800/50 inline-block border border-white/5">{f.icon}</div>
                <h3 className="font-bold text-white text-xl mb-3">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-24 px-8 border-t border-white/5 relative z-10 bg-gradient-to-b from-transparent to-[#020617]/80">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-10 text-white">Powered by Multi-Agent Architecture</h2>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-mono">
            {["Ingestion", "→", "Detection", "→", "Propagation", "→", "RAG", "→", "Explainability"].map((item, i) => (
              <span key={i} className={item === "→" ? "text-slate-600 font-bold" :
                "px-5 py-2.5 rounded-xl glass-premium border-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]"}>
                {item}
              </span>
            ))}
          </div>
          <p className="text-slate-500 mt-10 text-sm font-medium">
            OpenCLIP · FAISS · sentence-transformers · Gemini Flash · NetworkX
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 px-8 text-center text-slate-500 text-sm font-medium z-10 relative bg-black/40">
        MediaShield AI © 2026 · Digital Sports Asset Protection
      </footer>
    </main>
  );
}
