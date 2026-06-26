"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRight, Zap, TrendingUp, CheckCircle2, Lock
} from "lucide-react";
import { BetaApplicationModal } from "@/components/landing/BetaApplicationModal";
import { ShaderBackground } from "@/components/landing/ShaderBackground";

export default function LandingPage() {
  const [betaModalOpen, setBetaModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openBetaModal = () => {
    setBetaModalOpen(true);
  };

  return (
    <div className="bg-onyx-black text-pure-white font-body-md antialiased min-h-screen relative overflow-x-hidden selection:bg-metallic-gold selection:text-onyx-black select-none">
      {/* Background Shader */}
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-40 mix-blend-screen">
        <ShaderBackground />
      </div>

      {/* TopNavBar */}
      <nav className={`fixed top-0 w-full z-50 border-b border-white/10 transition-all duration-300 ${
        scrolled ? "bg-onyx-black/95 backdrop-blur-xl py-2" : "bg-onyx-black/80 backdrop-blur-md py-4"
      }`}>
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-unit h-20 max-w-container-max mx-auto">
          <Link className="font-display-xl-mobile text-headline-md tracking-tighter text-pure-white hover:text-metallic-gold transition-colors duration-300" href="/">
            SyncSell
          </Link>
          <button 
            onClick={openBetaModal}
            className="bg-metallic-gold text-onyx-black font-button-text text-button-text uppercase px-8 py-4 rounded-none hover:bg-primary-fixed-dim transition-colors active:scale-95 cursor-pointer font-bold"
          >
            Apply Now
          </button>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="pt-32 pb-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        {/* Hero Section */}
        <section className="min-h-[80vh] flex flex-col justify-center items-center text-center max-w-4xl mx-auto mb-section-gap pt-12">
          <span className="font-label-caps text-label-caps uppercase text-metallic-gold tracking-[0.2em] border border-metallic-gold/30 px-4 py-1.5 mb-8 rounded-sm bg-metallic-gold/5 backdrop-blur-sm">
            Exclusive Access Only
          </span>
          <h1 className="font-display-xl-mobile text-display-xl-mobile md:font-display-xl md:text-display-xl text-pure-white mb-8 leading-tight font-black tracking-tight">
            The Elite AI Growth Partner for High-Volume eBay Sellers.
          </h1>
          <p className="font-body-lg text-body-lg text-muted-silver mb-12 max-w-2xl mx-auto font-medium">
            Sophisticated neural infrastructure for stores managing $50k+ in monthly revenue.
          </p>
          <button 
            onClick={openBetaModal}
            className="bg-metallic-gold text-onyx-black font-button-text text-button-text uppercase px-12 py-5 rounded-none hover:bg-primary-fixed-dim hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all duration-300 active:scale-95 group flex items-center gap-3 cursor-pointer font-bold"
          >
            Apply For Beta
            <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </section>

        {/* Agitation Section */}
        <section className="mb-section-gap grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
          <div className="col-span-1 md:col-span-5 md:col-start-2">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-pure-white mb-6 leading-tight tracking-tight font-bold">
              You have the inventory. But the algorithm is beating you.
            </h2>
          </div>
          <div className="col-span-1 md:col-span-5 md:col-start-8">
            <div className="bg-graphite-surface p-10 border border-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-metallic-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <p className="font-body-lg text-body-lg text-muted-silver mb-6 relative z-10 leading-relaxed font-medium">
                Manual optimization is a leak in your revenue pipeline. While you manage logistics and sourcing, algorithmic suppression silently drains your visibility and conversions.
              </p>
              <p className="font-body-md text-body-md text-tertiary-container relative z-10 leading-relaxed">
                The true cost isn&apos;t just lost time; it&apos;s the premium placement yielded to competitors utilizing automated neural infrastructures. We engineer dominance.
              </p>
            </div>
          </div>
        </section>

        {/* The Mechanism (3 Steps) */}
        <section className="mb-section-gap">
          <div className="text-center mb-20">
            <span className="font-label-caps text-label-caps uppercase text-muted-silver tracking-[0.2em] mb-4 block font-bold">
              The Mechanism
            </span>
            <h2 className="font-headline-md text-headline-md text-pure-white tracking-tight font-bold">
              Architectural Dominance.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-gutter">
            {/* Step 1 */}
            <div className="bg-surface p-12 border-t border-metallic-gold/20 hover:border-metallic-gold transition-colors duration-500 flex flex-col items-start relative">
              <div className="text-metallic-gold mb-8 bg-onyx-black p-4 rounded-sm border border-white/5">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="font-headline-md text-headline-md text-pure-white text-[24px] leading-8 mb-4 font-bold">
                Secure Sync
              </h3>
              <p className="font-body-md text-body-md text-muted-silver leading-relaxed">
                Institutional-grade data encryption ensuring your proprietary store data remains sovereign and impenetrable.
              </p>
              <span className="absolute top-4 right-4 font-display-xl-mobile text-[48px] text-white/5 font-extrabold leading-none">
                01
              </span>
            </div>
            {/* Step 2 */}
            <div className="bg-surface p-12 border-t border-metallic-gold/20 hover:border-metallic-gold transition-colors duration-500 flex flex-col items-start relative">
              <div className="text-metallic-gold mb-8 bg-onyx-black p-4 rounded-sm border border-white/5">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="font-headline-md text-headline-md text-pure-white text-[24px] leading-8 mb-4 font-bold">
                AI SEO Overhaul
              </h3>
              <p className="font-body-md text-body-md text-muted-silver leading-relaxed">
                Neural keyword injection analyzing millions of buyer data points for top-tier search placement.
              </p>
              <span className="absolute top-4 right-4 font-display-xl-mobile text-[48px] text-white/5 font-extrabold leading-none">
                02
              </span>
            </div>
            {/* Step 3 */}
            <div className="bg-surface p-12 border-t border-metallic-gold/20 hover:border-metallic-gold transition-colors duration-500 flex flex-col items-start relative">
              <div className="text-metallic-gold mb-8 bg-onyx-black p-4 rounded-sm border border-white/5">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="font-headline-md text-headline-md text-pure-white text-[24px] leading-8 mb-4 font-bold">
                Auto-Push to Live
              </h3>
              <p className="font-body-md text-body-md text-muted-silver leading-relaxed">
                Seamless, instantaneous execution at scale. Your entire catalog optimized without manual intervention.
              </p>
              <span className="absolute top-4 right-4 font-display-xl-mobile text-[48px] text-white/5 font-extrabold leading-none">
                03
              </span>
            </div>
          </div>
        </section>

        {/* Pricing Anchor (The Core Offer) */}
        <section className="mb-section-gap max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-pure-white tracking-tight font-bold">
              Partnership Tiers
            </h2>
            <p className="font-body-lg text-body-lg text-muted-silver mt-4 font-medium">
              Applications reviewed on a strict qualitative basis.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Tier 1: Elite (Highlighted) */}
            <div className="bg-graphite-surface p-12 border border-metallic-gold/30 relative flex flex-col overflow-hidden">
              <div className="absolute top-0 right-0 bg-metallic-gold text-onyx-black font-label-caps text-label-caps uppercase px-6 py-2 tracking-widest font-extrabold text-[10px]">
                Core Offer
              </div>
              <h3 className="font-headline-md text-headline-md text-pure-white mb-2 font-bold">
                Elite
              </h3>
              <div className="flex items-baseline gap-2 mb-8 border-b border-white/10 pb-8">
                <span className="font-display-xl-mobile text-[48px] leading-none font-bold text-metallic-gold">
                  $1,497
                </span>
                <span className="font-label-caps text-label-caps text-muted-silver uppercase">
                  /mo
                </span>
              </div>
              <ul className="flex-1 space-y-4 mb-10 font-body-md text-body-md text-inverse-surface">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-metallic-gold w-4 h-4" /> Full Neural SEO Overhaul
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-metallic-gold w-4 h-4" /> Up to 10,000 Active Listings
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-metallic-gold w-4 h-4" /> Daily Algorithmic Realignment
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-metallic-gold w-4 h-4" /> Priority Support SLA
                </li>
              </ul>
              <button 
                onClick={openBetaModal}
                className="w-full bg-metallic-gold text-onyx-black font-button-text text-button-text uppercase px-8 py-4 rounded-none hover:bg-primary-fixed-dim transition-colors duration-300 active:scale-95 cursor-pointer font-bold"
              >
                See If You Qualify
              </button>
            </div>
            {/* Tier 2: Enterprise (Anchor) */}
            <div className="bg-surface p-12 border border-white/10 flex flex-col opacity-90 hover:opacity-100 transition-opacity">
              <h3 className="font-headline-md text-headline-md text-pure-white mb-2 font-bold">
                Enterprise
              </h3>
              <div className="flex items-baseline gap-2 mb-8 border-b border-white/10 pb-8">
                <span className="font-display-xl-mobile text-[48px] leading-none font-bold text-pure-white">
                  $4,997
                </span>
                <span className="font-label-caps text-label-caps text-muted-silver uppercase">
                  /mo
                </span>
              </div>
              <ul className="flex-1 space-y-4 mb-10 font-body-md text-body-md text-muted-silver">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-pure-white w-4 h-4" /> Everything in Elite
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-pure-white w-4 h-4" /> Unlimited Listings
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-pure-white w-4 h-4" /> Dedicated Growth Architect
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="text-pure-white w-4 h-4" /> Custom API Integration
                </li>
              </ul>
              <button 
                onClick={openBetaModal}
                className="w-full bg-transparent border border-white text-pure-white font-button-text text-button-text uppercase px-8 py-4 rounded-none hover:bg-white/5 transition-colors duration-300 active:scale-95 cursor-pointer font-bold"
              >
                See If You Qualify
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-onyx-black py-gutter">
        <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop gap-unit max-w-container-max mx-auto">
          <span className="font-display-xl-mobile text-headline-md text-pure-white tracking-tighter">
            SyncSell
          </span>
          <div className="flex flex-col md:flex-row gap-gutter items-center text-center">
            <div className="flex gap-6">
              <a className="font-label-caps text-label-caps text-muted-silver hover:text-pure-white transition-opacity uppercase tracking-widest" href="#">
                Terms of Service
              </a>
              <a className="font-label-caps text-label-caps text-muted-silver hover:text-pure-white transition-opacity uppercase tracking-widest" href="#">
                Privacy Policy
              </a>
            </div>
            <span className="font-body-md text-body-md text-muted-silver">
              © 2026 SyncSell. All rights reserved.
            </span>
          </div>
        </div>
      </footer>

      {/* Beta Application Modal */}
      <BetaApplicationModal 
        isOpen={betaModalOpen} 
        onClose={() => setBetaModalOpen(false)} 
      />
    </div>
  );
}
