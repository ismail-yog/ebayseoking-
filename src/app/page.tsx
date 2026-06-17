"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, Zap, ArrowRight, Shield, RefreshCw, 
  Layers, ChevronRight, CheckCircle2
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-slate-800 select-none">
      {/* Floating Header */}
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? "py-4 bg-white border-b border-slate-200 shadow-md" : "py-6 bg-transparent"
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
            <a href="#stats" className="hover:text-primary transition-colors">Stats</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => openAuth("signup")}
              className="relative group overflow-hidden px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-bold transition-all duration-300 text-white cursor-pointer shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
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
          <div className="flex-1 text-center lg:text-left space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen eBay Automation Platform</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl font-black font-heading tracking-tight leading-[1.05] text-slate-950"
            >
              Automate your <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent-cyan bg-clip-text text-transparent">
                eBay Empire
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base md:text-lg text-slate-700 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium"
            >
              Rank higher, attract buyers, and skyrocket sales. SyncSell automatically fetches your active listings, rewrites them using Claude 4.6 Sonnet, and syncs updates to eBay in real-time.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <button
                onClick={() => openAuth("signup")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white font-bold shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </motion.div>
          </div>

          {/* Right Showcase Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 w-full relative"
          >
            {/* Main Mockup Box */}
            <div className="relative rounded-2xl bg-white border border-slate-350 p-6 overflow-hidden shadow-2xl shadow-slate-300/60 animate-float">
              {/* Top border decoration */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-accent-cyan" />
              
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
                <div className="p-3.5 bg-red-50/40 rounded-lg border border-red-100 text-xs font-mono text-slate-700 leading-normal">
                  Refurbished Apple iPhone 13 Pro Max - 128GB - Graphite - Good condition - fast ship
                </div>
              </div>

              {/* Claude AI Thinking Flow */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="w-full border-t border-dashed border-slate-300" />
                <div className="absolute bg-white px-4 py-2 rounded-full border border-slate-300 shadow-md flex items-center gap-2">
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
                <div className="p-3.5 bg-green-50/40 rounded-lg border border-green-200 text-xs font-mono text-slate-950 font-semibold shadow-inner leading-normal">
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
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-2xl filter blur-2xl -z-10 opacity-70" />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <h2 className="text-3xl font-black font-heading text-slate-950 tracking-tight">
              Built for Professional eBay Sellers
            </h2>
            <p className="text-sm text-slate-650 font-medium">
              SyncSell packs high-grade automation and cutting-edge artificial intelligence into a beautifully simple dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50 rounded-2xl p-7 border border-slate-200 hover:border-primary/40 hover:bg-white transition-all duration-300 group shadow-sm hover:shadow-lg">
              <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5 group-hover:scale-105 transition-transform shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black font-heading mb-2 text-slate-950">AI Title Optimizer</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Claude 4.6 Sonnet scans eBay search patterns, analyzes competitors, and structures your product titles for peak visibility and conversion.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 rounded-2xl p-7 border border-slate-200 hover:border-secondary/40 hover:bg-white transition-all duration-300 group shadow-sm hover:shadow-lg">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary mb-5 group-hover:scale-105 transition-transform shadow-inner">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black font-heading mb-2 text-slate-950">QStash Background Queue</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Never worry about server timeouts. Queue hundreds of listing optimizations safely using Upstash QStash’s serverless event router.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 rounded-2xl p-7 border border-slate-200 hover:border-accent-cyan/40 hover:bg-white transition-all duration-300 group shadow-sm hover:shadow-lg">
              <div className="w-12 h-12 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan mb-5 group-hover:scale-105 transition-transform shadow-inner">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black font-heading mb-2 text-slate-950">OAuth Secure Sync</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Seamless one-click integration with eBay. Your connection tokens are encrypted using military-grade AES-256-GCM encryption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-24 relative bg-slate-50 border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-2xl p-8 md:p-12 border border-slate-250 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-40 blur-2xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
              <div>
                <p className="text-4xl md:text-5xl font-black font-heading bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  82%
                </p>
                <p className="text-xs font-bold text-slate-600 mt-2">Avg. Search Rank Boost</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-black font-heading bg-gradient-to-r from-secondary to-accent-cyan bg-clip-text text-transparent">
                  {stats.listingsSynced}
                </p>
                <p className="text-xs font-bold text-slate-600 mt-2">Listings Synced</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-black font-heading bg-gradient-to-r from-accent-cyan to-accent-magenta bg-clip-text text-transparent">
                  2.4s
                </p>
                <p className="text-xs font-bold text-slate-600 mt-2">Optimization Speed</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-black font-heading bg-gradient-to-r from-accent-magenta to-primary bg-clip-text text-transparent">
                  {stats.listingsOptimized}
                </p>
                <p className="text-xs font-bold text-slate-600 mt-2">AI-Optimized Listings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-extrabold text-slate-800 font-heading">SyncSell © 2026</span>
          </div>
          <div className="flex gap-6 font-bold text-slate-600">
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
