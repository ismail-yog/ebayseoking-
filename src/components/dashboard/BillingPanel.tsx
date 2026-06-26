"use client";

import React, { useState } from "react";
import { ShieldCheck, Ticket } from "lucide-react";
import { toast } from "sonner";

interface BillingPanelProps {
  profile: {
    plan_type: string;
    plan_expires_at: string | null;
    optimizations_used: number;
    optimization_limit: number;
  };
}

export function BillingPanel({ profile }: BillingPanelProps) {
  const [promoCode, setPromoCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    
    setRedeeming(true);
    try {
      const res = await fetch("/api/billing/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to redeem code");

      toast.success(`Code redeemed successfully! Account upgraded to: ${data.plan_type.toUpperCase()}`);
      setPromoCode("");
      
      // Reload page to refresh profile state
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to redeem code");
    } finally {
      setRedeeming(false);
    }
  };

  const formatExpiryDate = (dateStr: string | null) => {
    if (!dateStr) return "Never (Free Tier)";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16 text-pure-white">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black font-display text-pure-white tracking-tight">Redeem License</h2>
        <p className="text-sm text-muted-silver">Manage your active subscription status and unlock more optimization credits.</p>
      </div>

      {/* Current Subscription Info & Code Activation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status card */}
        <div className="lg:col-span-1 bg-graphite-surface rounded-sm p-6 border border-white/10 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-metallic-gold/5 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-4 text-left relative z-10">
            <h3 className="text-base font-bold font-display text-pure-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-metallic-gold" />
              <span>Subscription Info</span>
            </h3>
            <div className="text-xs font-semibold text-muted-silver space-y-2.5">
              <div className="p-3 bg-onyx-black/50 border border-white/5 rounded-sm">
                <span className="text-[10px] text-muted-silver block uppercase tracking-wider font-bold">Active Tier</span>
                <span className="text-lg font-black text-metallic-gold capitalize font-display mt-0.5 block">{profile.plan_type}</span>
              </div>
              <div className="p-3 bg-onyx-black/50 border border-white/5 rounded-sm">
                <span className="text-[10px] text-muted-silver block uppercase tracking-wider font-bold">Expiration Date</span>
                <span className="text-sm font-bold text-pure-white mt-0.5 block">{formatExpiryDate(profile.plan_expires_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Redeem code card */}
        <div className="lg:col-span-2 bg-graphite-surface rounded-sm p-6 border border-white/10 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-metallic-gold/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-4 text-left relative z-10">
            <h3 className="text-base font-bold font-display text-pure-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-metallic-gold" />
              <span>Redeem Promo Code / License Key</span>
            </h3>
            <p className="text-xs text-muted-silver leading-relaxed font-semibold">
              Enter your license key or promo code to immediately add optimization credits to your store dashboard.
            </p>
            <form onSubmit={handleRedeem} className="space-y-3 pt-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Ticket className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-silver" />
                  <input
                    type="text"
                    required
                    disabled={redeeming}
                    placeholder="SYNC-PRO-XXXX-XXXX"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full bg-onyx-black border border-white/15 focus:border-metallic-gold focus:ring-1 focus:ring-metallic-gold/30 rounded-sm py-2.5 pl-10 pr-4 text-sm text-pure-white placeholder:text-muted-silver outline-none transition-all duration-200 shadow-sm font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={redeeming}
                  className="px-6 py-2.5 rounded-sm bg-metallic-gold hover:bg-primary-fixed-dim text-xs font-extrabold uppercase text-onyx-black shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 outline-none"
                >
                  Apply Code
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
