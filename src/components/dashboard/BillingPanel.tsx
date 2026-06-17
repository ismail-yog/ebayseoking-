"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, Ticket, ArrowRight, Landmark, PhoneCall, HelpCircle, ShieldCheck 
} from "lucide-react";
import { toast } from "sonner";

interface BillingPanelProps {
  profile: {
    plan_type: string;
    optimization_limit: number;
    optimizations_used: number;
    plan_expires_at?: string | null;
  };
}

export function BillingPanel({ profile }: BillingPanelProps) {
  const [promoCode, setPromoCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [selectedPlanForInstructions, setSelectedPlanForInstructions] = useState<string | null>(null);

  // Format plan expiry date
  const formatExpiryDate = (dateStr?: string | null) => {
    if (!dateStr) return "Never (Lifetime Free)";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    setRedeeming(true);
    toast.loading("Verifying license key...");

    try {
      const res = await fetch("/api/billing/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode }),
      });

      toast.dismiss();

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to redeem code");
      }

      const data = await res.json();
      toast.success(
        `License Activated! Upgraded to ${data.planType.toUpperCase()} plan. ${data.limit} credits added.`,
        { duration: 6000 }
      );
      
      setPromoCode("");
      
      // Delay page reload slightly so the user sees the success toast
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to verify promo code");
    } finally {
      setRedeeming(false);
    }
  };

  const plans = [
    {
      id: "basic",
      name: "Basic",
      price: "$19",
      limit: "100",
      color: "from-primary/20 to-primary/5",
      borderColor: "border-primary/20",
      features: [
        "100 listing optimizations",
        "Claude 3.5 SEO engine",
        "XML eBay Trading Sync",
        "1 month validity",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: "$49",
      limit: "1,000",
      color: "from-secondary/20 to-secondary/5",
      borderColor: "border-secondary/30",
      features: [
        "1,000 listing optimizations",
        "Claude 3.5 advanced copywriting",
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
      color: "from-accent-cyan/20 to-accent-cyan/5",
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
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Expiry / Credit Status Header */}
      <div className="glass rounded-xl p-6 border border-white/5 relative overflow-hidden bg-gradient-to-tr from-bg-secondary to-bg-primary">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <span>Current Subscription Info</span>
            </h3>
            <div className="text-xs text-gray-400 space-y-1">
              <p>
                Active Tier: <span className="font-bold text-white capitalize">{profile.plan_type}</span>
              </p>
              <p>
                Expiration Date: <span className="font-semibold text-gray-300">{formatExpiryDate(profile.plan_expires_at)}</span>
              </p>
            </div>
          </div>

          {/* Quick Code Input box */}
          <div className="w-full md:max-w-sm shrink-0">
            <form onSubmit={handleRedeem} className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Redeem Promo Code / License Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Ticket className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    disabled={redeeming}
                    placeholder="SYNC-PRO-XXXX-XXXX"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-lg py-2 pl-10 pr-4 text-sm placeholder:text-gray-600 focus:outline-none transition-all duration-200"
                  />
                </div>
                <button
                  type="submit"
                  disabled={redeeming}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-xs font-bold text-white shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
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
          <h2 className="text-lg font-bold font-heading text-white">Upgrade Credits & Plans</h2>
          <p className="text-xs text-gray-400">Choose a package that fits your inventory scale. Key activations last for 30 days.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`glass rounded-xl p-6 border ${plan.borderColor} bg-gradient-to-b ${plan.color} relative overflow-hidden flex flex-col justify-between`}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-secondary text-[8px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider">
                  Popular
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold font-heading text-white capitalize">{plan.name} Plan</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-extrabold text-white font-heading">{plan.price}</span>
                    <span className="text-[10px] text-gray-500">/ month</span>
                  </div>
                </div>

                <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs text-center">
                  <span className="font-bold text-white">{plan.limit}</span> optimizations included
                </div>

                <ul className="space-y-2 text-xs text-gray-400">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setSelectedPlanForInstructions(plan.id)}
                className="w-full mt-6 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all cursor-pointer"
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
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl glass-premium p-8 z-10 text-left"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-accent-cyan" />
              
              <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <Landmark className="w-5 h-5 text-primary" />
                <span>Manual Payment & Code Delivery</span>
              </h3>
              
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Stripe is currently unavailable in your region. To unlock the <span className="font-bold text-white capitalize">{selectedPlanForInstructions} Plan</span>, please send your payment manually using the details below.
              </p>

              {/* Instructions Details */}
              <div className="my-6 space-y-4 text-xs">
                {/* Option 1: Bank Transfer */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Landmark className="w-4 h-4 text-accent-cyan" />
                    <span>Option 1: Direct Bank Transfer (IBAN)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-gray-400 font-mono text-[11px]">
                    <span>Bank Name:</span>
                    <span className="col-span-2 text-white font-semibold">Meezan Bank Limited</span>
                    <span>Account Title:</span>
                    <span className="col-span-2 text-white font-semibold">Ismail Bashir</span>
                    <span>IBAN Account:</span>
                    <span className="col-span-2 text-white font-semibold select-all">PK64MEZN00300109485293</span>
                  </div>
                </div>

                {/* Option 2: Mobile Wallet */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <PhoneCall className="w-4 h-4 text-secondary" />
                    <span>Option 2: Mobile Wallet (EasyPaisa / JazzCash)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-gray-400 font-mono text-[11px]">
                    <span>Provider:</span>
                    <span className="col-span-2 text-white font-semibold">EasyPaisa</span>
                    <span>Mobile Number:</span>
                    <span className="col-span-2 text-white font-semibold select-all">0300 1234567</span>
                    <span>Account Name:</span>
                    <span className="col-span-2 text-white font-semibold">Ismail Bashir</span>
                  </div>
                </div>

                {/* Receipt verification note */}
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary flex items-start gap-2.5">
                  <HelpCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">How to receive your key:</p>
                    <p className="mt-1 leading-normal text-gray-300">
                      Send a screenshot of your transfer receipt via WhatsApp to <span className="font-bold text-white select-all">+92 300 1234567</span> or email to <span className="font-bold text-white select-all">billing@syncsell.ai</span>. You will receive your one-time activation code within 15 minutes!
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedPlanForInstructions(null)}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-xs font-bold text-white shadow-lg cursor-pointer"
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
