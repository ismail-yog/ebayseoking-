"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, Zap, ArrowRight, Shield, RefreshCw, 
  Layers, ChevronRight, CheckCircle2, BarChart3, Bot
} from "lucide-react";
import { AuthModal } from "@/components/landing/AuthModal";

export default function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup" | "otp">("login");
  const [scrolled, setScrolled] = useState(false);
  const [stats, setStats] = useState({
    listingsSynced: "0",
    listingsOptimized: "0",
    usersCount: "0",
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.listingsSynced) setStats(data);
      })
      .catch((err) => console.error("Error loading live stats:", err));
  }, []);

  const openAuth = (tab: "login" | "signup" | "otp") => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-slate-800 select-none">
      {/* Floating Header */}
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? "py-3 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-lg shadow-slate-200/50" : "py-5 bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/30">
              <Zap className="w-5 h-5 text-white fill-white/10" />
            </div>
            <span className="text-2xl font-black font-heading text-slate-950 tracking-tight">
              SyncSell
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it Works</a>
            <a href="#stats" className="hover:text-primary transition-colors">Stats</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openAuth("login")}
              className="hidden sm:inline-flex px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:text-primary transition-colors cursor-pointer"
            >
              Log In
            </button>
            <button
              onClick={() => openAuth("signup")}
              className="relative group overflow-hidden px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-bold transition-all duration-300 text-white cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none btn-shimmer"
            >
              <span className="relative z-10 flex items-center gap-1">
                Get Started
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 md:pt-44 md:pb-28">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
          {/* Left Text */}
          <motion.div 
            className="flex-1 text-center lg:text-left space-y-6"
            variants={staggerChildren}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen eBay Automation Platform</span>
            </motion.div>

            <motion.h1 
              variants={fadeUp}
              className="text-4xl md:text-6xl font-black font-heading tracking-tight leading-[1.05] text-slate-950"
            >
              Automate your <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent-cyan bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">
                eBay Empire
              </span>
            </motion.h1>

            <motion.p 
              variants={fadeUp}
              className="text-base md:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium"
            >
              Rank higher, attract buyers, and skyrocket sales. SyncSell automatically fetches your active listings, rewrites them using Claude 4.6 Sonnet, and syncs updates to eBay in real-time.
            </motion.p>

            <motion.div 
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <button
                onClick={() => openAuth("signup")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white font-bold shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-1 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 btn-shimmer"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => openAuth("login")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-800 font-bold shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <span>View Demo</span>
              </button>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={fadeUp} className="flex items-center justify-center lg:justify-start gap-4 pt-4">
              <div className="flex -space-x-2">
                {["bg-indigo-400", "bg-purple-400", "bg-cyan-400", "bg-pink-400"].map((bg, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-white shadow-sm flex items-center justify-center text-[9px] font-bold text-white`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 font-bold">
                <span className="text-slate-900">500+</span> sellers optimizing with SyncSell
              </p>
            </motion.div>
          </motion.div>

          {/* Right Showcase Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex-1 w-full relative"
          >
            {/* Main Mockup Box */}
            <div className="relative rounded-2xl bg-white border-2 border-slate-200 p-6 overflow-hidden shadow-2xl shadow-slate-300/50 animate-float">
              {/* Top border decoration */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-secondary to-accent-cyan" />
              
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <div className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded border border-slate-200 font-mono">
                  syncsell_optimization_engine
                </div>
              </div>

              {/* Before Listing */}
              <div className="mb-6 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-md">
                    Original eBay Title
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">Search Rank: #42 (Page 3)</span>
                </div>
                <div className="p-3.5 bg-red-50/50 rounded-lg border border-red-200 text-xs font-mono text-slate-700 leading-normal">
                  Refurbished Apple iPhone 13 Pro Max - 128GB - Graphite - Good condition - fast ship
                </div>
              </div>

              {/* Claude AI Thinking Flow */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="w-full border-t border-dashed border-slate-300" />
                <div className="absolute bg-white px-4 py-2 rounded-full border-2 border-slate-200 shadow-md flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-secondary animate-spin" />
                  <span className="text-[10px] font-bold text-slate-800">Claude 4.6 Sonnet Rewriting...</span>
                </div>
              </div>

              {/* After Listing */}
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md">
                    AI-Optimized SEO Title
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                      SEO Score: 98/100
                    </span>
                  </div>
                </div>
                <div className="p-3.5 bg-green-50/50 rounded-lg border-2 border-green-200 text-xs font-mono text-slate-950 font-semibold shadow-inner leading-normal">
                  <span className="text-secondary font-extrabold">Apple iPhone 13 Pro Max</span> 128GB <span className="text-primary font-extrabold">Graphite Unlocked</span> Refurbished <span className="text-accent-cyan font-bold">Excellent Warranty</span>
                </div>
              </div>

              {/* Live Status Overlay */}
              <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-bold text-slate-700">Pushed to eBay via Trading API</span>
                </div>
                <div className="text-[10px] text-slate-500 font-bold">Processed in 1.2s</div>
              </div>
            </div>

            {/* Glowing Accent Ring behind */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.06] to-secondary/[0.06] rounded-2xl filter blur-2xl -z-10" />
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 relative bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-xs font-bold text-secondary">
              <Bot className="w-3.5 h-3.5" />
              <span>Simple 3-Step Process</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black font-heading text-slate-950 tracking-tight">
              How SyncSell Works
            </h2>
            <p className="text-sm text-slate-500 font-medium max-w-lg mx-auto">
              From eBay connection to rank-boosted listings in under 60 seconds.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-primary/20 via-secondary/40 to-accent-cyan/20" />
            
            {[
              { step: "01", title: "Connect Your Store", desc: "One-click OAuth login to securely link your eBay seller account. We encrypt everything with AES-256-GCM.", icon: Shield, color: "primary" },
              { step: "02", title: "Fetch & Select Listings", desc: "Pull all your active inventory. Select individual items or batch-select hundreds for optimization.", icon: Layers, color: "secondary" },
              { step: "03", title: "AI Optimizes & Syncs", desc: "Claude 4.6 Sonnet rewrites titles and descriptions. Optimized listings push back to eBay automatically.", icon: Sparkles, color: "accent-cyan" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative bg-slate-50 rounded-2xl p-8 border border-slate-200 hover:border-slate-300 hover:bg-white transition-all duration-300 group shadow-sm hover:shadow-lg hover-lift text-center"
              >
                <div className={`w-14 h-14 rounded-2xl bg-${item.color}/10 border border-${item.color}/20 flex items-center justify-center text-${item.color} mx-auto mb-5 group-hover:scale-110 transition-transform duration-200 shadow-inner`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2">Step {item.step}</div>
                <h3 className="text-lg font-black font-heading mb-2 text-slate-950">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative bg-bg-primary border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-xs font-bold text-accent-cyan">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Enterprise-Grade Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black font-heading text-slate-950 tracking-tight">
              Built for Professional eBay Sellers
            </h2>
            <p className="text-sm text-slate-500 font-medium max-w-lg mx-auto">
              SyncSell packs high-grade automation and cutting-edge artificial intelligence into a beautifully simple dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0 }}
              className="bg-white rounded-2xl p-7 border border-slate-200 hover:border-primary/40 transition-all duration-300 group shadow-sm hover:shadow-xl hover-lift"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black font-heading mb-2 text-slate-950">AI Title Optimizer</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Claude 4.6 Sonnet scans eBay search patterns, analyzes competitors, and structures your product titles for peak visibility and conversion.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl p-7 border border-slate-200 hover:border-secondary/40 transition-all duration-300 group shadow-sm hover:shadow-xl hover-lift"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary mb-5 group-hover:scale-110 transition-transform shadow-inner">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black font-heading mb-2 text-slate-950">QStash Background Queue</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Never worry about server timeouts. Queue hundreds of listing optimizations safely using Upstash QStash&apos;s serverless event router.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl p-7 border border-slate-200 hover:border-accent-cyan/40 transition-all duration-300 group shadow-sm hover:shadow-xl hover-lift"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan mb-5 group-hover:scale-110 transition-transform shadow-inner">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black font-heading mb-2 text-slate-950">OAuth Secure Sync</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Seamless one-click integration with eBay. Your connection tokens are encrypted using military-grade AES-256-GCM encryption.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-24 relative bg-white border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-8 md:p-12 border-2 border-slate-200 shadow-xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] via-secondary/[0.03] to-accent-cyan/[0.03]" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
              <div>
                <p className="text-4xl md:text-5xl font-black font-heading bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  82%
                </p>
                <p className="text-xs font-bold text-slate-500 mt-2">Avg. Search Rank Boost</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-black font-heading bg-gradient-to-r from-secondary to-accent-cyan bg-clip-text text-transparent">
                  {stats.listingsSynced}
                </p>
                <p className="text-xs font-bold text-slate-500 mt-2">Listings Synced</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-black font-heading bg-gradient-to-r from-accent-cyan to-accent-magenta bg-clip-text text-transparent">
                  2.4s
                </p>
                <p className="text-xs font-bold text-slate-500 mt-2">Optimization Speed</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-black font-heading bg-gradient-to-r from-accent-magenta to-primary bg-clip-text text-transparent">
                  {stats.listingsOptimized}
                </p>
                <p className="text-xs font-bold text-slate-500 mt-2">AI-Optimized Listings</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative bg-bg-primary">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-black font-heading text-slate-950 tracking-tight">
              Ready to Dominate eBay Search?
            </h2>
            <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
              Join hundreds of sellers who are already ranking higher, selling faster, and scaling smarter with SyncSell.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => openAuth("signup")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white font-bold shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-1 cursor-pointer btn-shimmer"
              >
                <Zap className="w-4.5 h-4.5" />
                <span>Start Free — No Credit Card</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-extrabold text-slate-800 font-heading">SyncSell © 2026</span>
          </div>
          <div className="flex gap-6 font-bold text-slate-500">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
            <a href="#" className="hover:text-primary transition-colors">API Status</a>
          </div>
        </div>
      </footer>

      {/* Unified Authentication Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        defaultTab={authModalTab}
      />
    </div>
  );
}
