"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, ArrowRight, Ticket, Landmark, PhoneCall, HelpCircle, ShieldCheck, Upload
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
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [ocrResultCode, setOcrResultCode] = useState<string | null>(null);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4.5 * 1024 * 1024) {
      toast.error("Receipt image must be under 4.5MB.");
      return;
    }

    setUploadingReceipt(true);
    setOcrResultCode(null);
    toast.loading("Claude AI is verifying your payment screenshot...", { id: "receipt-upload" });

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        try {
          const res = await fetch("/api/billing/upload-receipt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: base64data,
              packageId: selectedPlanForInstructions,
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to verify receipt");

          toast.success("AI Payment Verification Successful!", { id: "receipt-upload", duration: 4000 });
          setOcrResultCode(data.code);
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : "Failed to verify receipt", { id: "receipt-upload" });
        } finally {
          setUploadingReceipt(false);
        }
      };
    } catch (err) {
      console.error(err);
      toast.error("Failed to read image file.", { id: "receipt-upload" });
      setUploadingReceipt(false);
    }
  };

  const handleAutoRedeem = async (code: string) => {
    setRedeeming(true);
    toast.loading("Activating your credits package...", { id: "auto-redeem" });
    try {
      const res = await fetch("/api/billing/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to redeem code");

      toast.success(`Credits activated! Account upgraded to ${data.planType.toUpperCase()}`, { id: "auto-redeem" });
      setSelectedPlanForInstructions(null);
      setOcrResultCode(null);
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Activation failed", { id: "auto-redeem" });
    } finally {
      setRedeeming(false);
    }
  };

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
      id: "starter",
      name: "Starter",
      price: "$39",
      limit: "200",
      perCredit: "$0.20",
      color: "from-primary/10 to-primary/[0.01]",
      borderColor: "border-primary/30",
      features: [
        "200 listing optimizations",
        "Claude AI SEO engine",
        "Cassini keyword front-loading",
        "Item specifics extraction",
      ],
    },
    {
      id: "growth",
      name: "Growth",
      price: "$65",
      limit: "350",
      perCredit: "$0.19",
      color: "from-secondary/15 to-secondary/[0.01]",
      borderColor: "border-secondary/40",
      features: [
        "350 listing optimizations",
        "Semantic keyword injection",
        "Protected element preservation",
        "Batch queue processing",
      ],
    },
    {
      id: "power",
      name: "Power Seller",
      price: "$79",
      limit: "500",
      perCredit: "$0.16",
      color: "from-accent-cyan/15 to-accent-cyan/[0.01]",
      borderColor: "border-accent-cyan/30",
      features: [
        "500 listing optimizations",
        "Full HTML description rewrite",
        "Mobile-responsive layouts",
        "Priority queue processing",
      ],
      popular: true,
    },
    {
      id: "agency",
      name: "Agency",
      price: "$149",
      limit: "1,000",
      perCredit: "$0.15",
      color: "from-purple-500/15 to-purple-500/[0.01]",
      borderColor: "border-purple-400/30",
      features: [
        "1,000 listing optimizations",
        "Multi-store support",
        "Advanced Cassini analytics",
        "Bulk optimize all listings",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "$399",
      limit: "3,000",
      perCredit: "$0.13",
      color: "from-amber-500/15 to-amber-500/[0.01]",
      borderColor: "border-amber-400/30",
      features: [
        "3,000 listing optimizations",
        "Dedicated priority support",
        "Full store SEO overhaul",
        "Maximum ROI per credit",
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl pb-16 text-slate-800">
      {/* Expiry / Credit Status Header */}
      <div className="bg-white rounded-xl p-6 border-2 border-slate-300 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-left">
            <h3 className="text-base font-black font-heading text-slate-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <span>Current Subscription Info</span>
            </h3>
            <div className="text-xs font-semibold text-slate-600 space-y-1">
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
            <form onSubmit={handleRedeem} className="space-y-2 text-left">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Redeem Promo Code / License Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Ticket className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    disabled={redeeming}
                    placeholder="SYNC-PRO-XXXX-XXXX"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full bg-white border-2 border-slate-350 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition-all duration-200 shadow-sm font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={redeeming}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-xs font-bold text-white shadow-md transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-white"
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
        <div className="text-left">
          <h2 className="text-lg font-black font-heading text-slate-950">Buy Optimization Credits</h2>
          <p className="text-xs font-semibold text-slate-550">1 Credit = 1 Fully Optimized Listing. Choose a pack that fits your store size.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-xl p-6 border-2 ${plan.borderColor} bg-gradient-to-b ${plan.color} relative overflow-hidden flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-200`}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-secondary text-[8px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-wider shadow">
                  Popular
                </div>
              )}

              <div className="space-y-4">
                <div className="text-left">
                  <h3 className="text-base font-black font-heading text-slate-950 capitalize">{plan.name} Plan</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-black text-slate-950 font-heading">{plan.price}</span>
                  </div>
                  {plan.perCredit && (
                    <span className="text-[10px] text-slate-500 font-bold mt-1 block">{plan.perCredit} per listing</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-center shadow-inner font-bold text-slate-700">
                  <span className="font-extrabold text-slate-900">{plan.limit}</span> optimizations included
                </div>

                <ul className="space-y-2.5 text-xs text-slate-650 font-semibold text-left">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setSelectedPlanForInstructions(plan.id)}
                className="w-full mt-6 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white hover:bg-slate-50 border-2 border-slate-350 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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
              className="fixed inset-0 bg-slate-950/35 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl p-8 z-10 text-left bg-white border-2 border-slate-350 shadow-2xl"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-secondary to-accent-cyan" />
              
              <h3 className="text-lg font-black font-heading text-slate-950 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-primary" />
                <span>Manual Payment & Code Delivery</span>
              </h3>
              
              <p className="text-xs text-slate-700 mt-2 leading-relaxed font-bold">
                Stripe is currently unavailable in your region. To unlock the <span className="font-extrabold text-slate-950 capitalize">{selectedPlanForInstructions} Plan</span>, please send your payment manually using the details below.
              </p>

              {/* Instructions Details */}
              <div className="my-6 space-y-4 text-xs">
                {/* Option 1: Bank Transfer */}
                <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200 space-y-2 shadow-inner">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold">
                    <Landmark className="w-4 h-4 text-accent-cyan" />
                    <span>Option 1: Direct Bank Transfer (IBAN)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-slate-600 font-mono text-[11px]">
                    <span>Bank Name:</span>
                    <span className="col-span-2 text-slate-900 font-extrabold">Meezan Bank Limited</span>
                    <span>Account Title:</span>
                    <span className="col-span-2 text-slate-900 font-extrabold">Ismail Bashir</span>
                    <span>IBAN Account:</span>
                    <span className="col-span-2 text-slate-950 font-black select-all">PK64MEZN00300109485293</span>
                  </div>
                </div>

                {/* Option 2: Mobile Wallet */}
                <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200 space-y-2 shadow-inner">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold">
                    <PhoneCall className="w-4 h-4 text-secondary" />
                    <span>Option 2: Mobile Wallet (EasyPaisa / JazzCash)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-slate-600 font-mono text-[11px]">
                    <span>Provider:</span>
                    <span className="col-span-2 text-slate-900 font-extrabold">EasyPaisa</span>
                    <span>Mobile Number:</span>
                    <span className="col-span-2 text-slate-950 font-black select-all">0300 1234567</span>
                    <span>Account Name:</span>
                    <span className="col-span-2 text-slate-900 font-extrabold">Ismail Bashir</span>
                  </div>
                </div>

                {/* Receipt verification note */}
                <div className="p-3.5 rounded-xl bg-primary/5 border-2 border-primary/20 text-xs text-primary flex items-start gap-2.5">
                  <HelpCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-slate-900">How to receive your key:</p>
                    <p className="mt-1 leading-normal text-slate-700 font-medium">
                      Send a screenshot of your transfer receipt via WhatsApp to <span className="font-extrabold text-slate-900 select-all">+92 300 1234567</span> or email to <span className="font-extrabold text-slate-900 select-all">billing@syncsell.ai</span>. You will receive your one-time activation code within 15 minutes!
                    </p>
                  </div>
                </div>

                {/* Instant Verification Section */}
                <div className="border-t border-slate-200 pt-4.5 space-y-3">
                  <div className="text-slate-900 font-extrabold text-xs flex items-center gap-2">
                    <Ticket className="w-4.5 h-4.5 text-primary" />
                    <span>Instant AI Activation (Fastest)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                    Transferred the amount? Upload your transaction screenshot below, and our Claude Vision AI will instantly verify it, log it, and generate your activation key.
                  </p>

                  {!ocrResultCode ? (
                    <div className="relative border-2 border-dashed border-slate-350 hover:border-primary rounded-xl p-5 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/50 transition-all cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptUpload}
                        disabled={uploadingReceipt}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
                      />
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors mb-1.5" />
                      <span className="text-xs font-bold text-slate-700">
                        {uploadingReceipt ? "Verifying payment receipt..." : "Click or Drag receipt here"}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Supports PNG, JPEG, JPG (max 4.5MB)</span>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-green-50 border-2 border-green-200 space-y-3 shadow-inner">
                      <p className="text-xs font-bold text-green-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4.5 h-4.5 text-green-600 shrink-0" />
                        <span>Activation Key Generated!</span>
                      </p>
                      <div className="flex items-center justify-between gap-2 bg-white px-3.5 py-2.5 rounded-lg border border-green-250 shadow-sm">
                        <span className="font-black font-mono text-sm text-slate-900 tracking-wider select-all">{ocrResultCode}</span>
                        <span className="text-[9px] font-bold text-green-700 bg-green-55/30 px-2 py-0.5 rounded uppercase">Verified</span>
                      </div>
                      <button
                        onClick={() => handleAutoRedeem(ocrResultCode)}
                        disabled={redeeming}
                        className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-xs font-extrabold text-white rounded-lg shadow-md cursor-pointer disabled:opacity-50 transition-colors"
                      >
                        {redeeming ? "Activating Plan..." : "Instant Unlock Credits"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedPlanForInstructions(null)}
                className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-xs font-bold text-white shadow-md cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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
