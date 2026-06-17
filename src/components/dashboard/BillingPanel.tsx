"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, ArrowRight, Ticket, Landmark, PhoneCall, HelpCircle, ShieldCheck
} from "lucide-react";
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
  const [selectedPlanForInstructions, setSelectedPlanForInstructions] = useState<string | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const plans = [
    {
      id: "basic",
      name: "Basic",
      price: "$19",
      limit: "100",
      color: "from-primary/10 to-primary/[0.01]",
      borderColor: "border-primary/20",
      features: [
        "100 listing optimizations",
        "Claude 4.6 SEO engine",
        "XML eBay Trading Sync",
        "1 month validity",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: "$49",
      limit: "1,000",
      color: "from-secondary/10 to-secondary/[0.01]",
      borderColor: "border-secondary/20",
      features: [
        "1,000 listing optimizations",
        "Claude 4.6 advanced copywriting",
        "Batch queue processing",
        "1 month validity",
      ],
      popular: true,
    },
    {
      id: "business",
      name: "Business",
      price: "$119",
      limit: "3,000",
      color: "from-accent-cyan/15 to-accent-cyan/[0.01]",
      borderColor: "border-accent-cyan/20",
      features: [
        "3,000 listing optimizations",
        "Cassini ranking analyzer",
        "Priority queue processing",
        "1 month validity",
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl pb-16 text-slate-800">
      {/* Expiry / Credit Status Header */}
      <div className="glass rounded-xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden bg-white/70">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <h3 className="text-base font-black font-heading text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <span>Current Subscription Info</span>
            </h3>
            <div className="text-xs text-slate-500 space-y-1">
              <p>
                Active Tier: <span className="font-bold text-slate-800 capitalize">{profile.plan_type}</span>
              </p>
              <p>
                Expiration Date: <span className="font-semibold text-slate-700">{formatExpiryDate(profile.plan_expires_at)}</span>
              </p>
            </div>
          </div>

          {/* Quick Code Input box */}
          <div className="w-full md:max-w-sm shrink-0">
            <form onSubmit={handleRedeem} className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Redeem Promo Code / License Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Ticket className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    disabled={redeeming}
                    placeholder="SYNC-PRO-XXXX-XXXX"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-lg py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 outline-none transition-all duration-200 shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={redeeming}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-xs font-bold text-white shadow-sm cursor-pointer disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-white"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black font-heading text-slate-900">Upgrade Credits & Plans</h2>
          <p className="text-xs text-slate-500">Choose a package that fits your inventory scale. Key activations last for 30 days.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`glass rounded-xl p-6 border ${plan.borderColor} bg-gradient-to-b ${plan.color} relative overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200`}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-secondary text-[8px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider">
                  Popular
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-black font-heading text-slate-900 capitalize">{plan.name} Plan</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-black text-slate-950 font-heading">{plan.price}</span>
                    <span className="text-[10px] text-slate-400">/ month</span>
                  </div>
                </div>

                <div className="p-3 bg-white/80 rounded-lg border border-slate-200/60 text-xs text-center shadow-inner">
                  <span className="font-bold text-slate-800">{plan.limit}</span> optimizations included
                </div>

                <ul className="space-y-2 text-xs text-slate-500">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setSelectedPlanForInstructions(plan.id)}
                className="w-full mt-6 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <span>Get Activation Key</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Payment Instructions Modal */}
      <AnimatePresence>
        {selectedPlanForInstructions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlanForInstructions(null)}
              className="fixed inset-0 bg-slate-950/20 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl glass-premium p-8 z-10 text-left bg-white border border-slate-200"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-accent-cyan" />
              
              <h3 className="text-lg font-black font-heading text-slate-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-primary" />
                <span>Manual Payment & Code Delivery</span>
              </h3>
              
              <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
                Stripe is currently unavailable in your region. To unlock the <span className="font-bold text-slate-800 capitalize">{selectedPlanForInstructions} Plan</span>, please send your payment manually using the details below.
              </p>

              {/* Instructions Details */}
              <div className="my-6 space-y-4 text-xs">
                {/* Option 1: Bank Transfer */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 shadow-inner">
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Landmark className="w-4 h-4 text-accent-cyan" />
                    <span>Option 1: Direct Bank Transfer (IBAN)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-slate-500 font-mono text-[11px]">
                    <span>Bank Name:</span>
                    <span className="col-span-2 text-slate-800 font-semibold">Meezan Bank Limited</span>
                    <span>Account Title:</span>
                    <span className="col-span-2 text-slate-800 font-semibold">Ismail Bashir</span>
                    <span>IBAN Account:</span>
                    <span className="col-span-2 text-slate-800 font-bold select-all">PK64MEZN00300109485293</span>
                  </div>
                </div>

                {/* Option 2: Mobile Wallet */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 shadow-inner">
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <PhoneCall className="w-4 h-4 text-secondary" />
                    <span>Option 2: Mobile Wallet (EasyPaisa / JazzCash)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-slate-500 font-mono text-[11px]">
                    <span>Provider:</span>
                    <span className="col-span-2 text-slate-800 font-semibold">EasyPaisa</span>
                    <span>Mobile Number:</span>
                    <span className="col-span-2 text-slate-800 font-bold select-all">0300 1234567</span>
                    <span>Account Name:</span>
                    <span className="col-span-2 text-slate-800 font-semibold">Ismail Bashir</span>
                  </div>
                </div>

                {/* Receipt verification note */}
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary flex items-start gap-2.5">
                  <HelpCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">How to receive your key:</p>
                    <p className="mt-1 leading-normal text-slate-600">
                      Send a screenshot of your transfer receipt via WhatsApp to <span className="font-bold text-slate-800 select-all">+92 300 1234567</span> or email to <span className="font-bold text-slate-800 select-all">billing@syncsell.ai</span>. You will receive your one-time activation code within 15 minutes!
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedPlanForInstructions(null)}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-xs font-bold text-white shadow-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                Close Instructions
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
