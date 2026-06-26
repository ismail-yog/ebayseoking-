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
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

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
          
          if (data.emailSent) {
            setEmailSent(true);
            setRegisteredEmail(data.email);
            setOcrResultCode(""); // clear input for user copy-paste verification
          } else {
            setEmailSent(false);
            setOcrResultCode(data.code);
            toast.info("Resend unconfigured. Verification code displayed below.");
          }
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
    <div className="space-y-8 max-w-6xl pb-16 text-pure-white">
      {/* Expiry / Credit Status Header */}
      <div className="bg-graphite-surface rounded-sm p-6 border border-white/10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-metallic-gold/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-left">
            <h3 className="text-base font-bold font-display text-pure-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-metallic-gold" />
              <span>Current Subscription Info</span>
            </h3>
            <div className="text-xs font-semibold text-muted-silver space-y-1">
              <p>
                Active Tier: <span className="font-bold text-metallic-gold capitalize">{profile.plan_type}</span>
              </p>
              <p>
                Expiration Date: <span className="font-semibold text-pure-white">{formatExpiryDate(profile.plan_expires_at)}</span>
              </p>
            </div>
          </div>

          {/* Quick Code Input box */}
          <div className="w-full md:max-w-sm shrink-0">
            <form onSubmit={handleRedeem} className="space-y-2 text-left">
              <label className="text-[10px] font-bold text-muted-silver uppercase tracking-wider block">
                Redeem Promo Code / License Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Ticket className="absolute left-3.5 top-3 w-4 h-4 text-muted-silver" />
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
                  className="px-5 py-2.5 rounded-sm bg-metallic-gold hover:bg-primary-fixed-dim text-xs font-extrabold uppercase text-onyx-black shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 outline-none"
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
          <h2 className="text-lg font-bold font-display text-pure-white">Buy Optimization Credits</h2>
          <p className="text-xs text-muted-silver">1 Credit = 1 Fully Optimized Listing. Choose a pack that fits your store size.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-graphite-surface rounded-sm p-6 border ${
                plan.popular ? "border-metallic-gold/50 hover:border-metallic-gold" : "border-white/10 hover:border-metallic-gold/30"
              } relative overflow-hidden flex flex-col justify-between shadow-lg transition-all duration-200 group`}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 bg-metallic-gold text-onyx-black text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider shadow">
                  Popular
                </div>
              )}

              <div className="space-y-4">
                <div className="text-left">
                  <h3 className="text-base font-bold font-display text-pure-white capitalize">{plan.name} Plan</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-black text-pure-white font-display">{plan.price}</span>
                  </div>
                  {plan.perCredit && (
                    <span className="text-[10px] text-muted-silver font-bold mt-1 block">{plan.perCredit} per listing</span>
                  )}
                </div>

                <div className="p-3 bg-onyx-black/60 rounded-sm border border-white/5 text-xs text-center shadow-inner font-bold text-muted-silver">
                  <span className="font-extrabold text-metallic-gold">{plan.limit}</span> optimizations included
                </div>

                <ul className="space-y-2.5 text-xs text-muted-silver font-semibold text-left">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-metallic-gold shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setSelectedPlanForInstructions(plan.id)}
                className="w-full mt-6 flex items-center justify-center gap-1.5 py-2.5 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-pure-white transition-all cursor-pointer shadow-sm outline-none active:scale-95"
              >
                <span>Get Activation Key</span>
                <ArrowRight className="w-3.5 h-3.5 text-metallic-gold" />
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
              className="fixed inset-0 bg-onyx-black/60 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-sm p-8 z-10 text-left bg-graphite-surface border border-white/15 shadow-2xl"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-metallic-gold via-primary to-secondary" />
              
              <h3 className="text-lg font-bold font-display text-pure-white flex items-center gap-2">
                <Landmark className="w-5 h-5 text-metallic-gold" />
                <span>Manual Payment & Code Delivery</span>
              </h3>
              
              <p className="text-xs text-muted-silver mt-2 leading-relaxed font-bold">
                Stripe is currently unavailable in your region. To unlock the <span className="font-extrabold text-metallic-gold capitalize">{selectedPlanForInstructions} Plan</span>, please send your payment manually using the details below.
              </p>

              {/* Instructions Details */}
              <div className="my-6 space-y-4 text-xs">
                {/* Option 1: Bank Transfer */}
                <div className="p-4 rounded-sm bg-onyx-black/60 border border-white/10 space-y-2 shadow-inner">
                  <div className="flex items-center gap-2 text-metallic-gold font-extrabold">
                    <Landmark className="w-4 h-4" />
                    <span>Option 1: Direct Bank Transfer (IBAN)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-muted-silver font-mono text-[11px]">
                    <span>Bank Name:</span>
                    <span className="col-span-2 text-pure-white font-extrabold">SadaPay</span>
                    <span>Account No:</span>
                    <span className="col-span-2 text-metallic-gold font-black select-all">03295658149</span>
                    <span>Account Title:</span>
                    <span className="col-span-2 text-pure-white font-extrabold">Muhammad Ismail Bashir</span>
                    <span>IBAN Account:</span>
                    <span className="col-span-2 text-metallic-gold font-black select-all">PK81SADA0000003295658149</span>
                  </div>
                </div>

                {/* Option 2: Mobile Wallet */}
                <div className="p-4 rounded-sm bg-onyx-black/60 border border-white/10 space-y-2 shadow-inner">
                  <div className="flex items-center gap-2 text-metallic-gold font-extrabold">
                    <PhoneCall className="w-4 h-4" />
                    <span>Option 2: Mobile Wallet (EasyPaisa / JazzCash)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-muted-silver font-mono text-[11px]">
                    <span>Provider:</span>
                    <span className="col-span-2 text-pure-white font-extrabold">EasyPaisa</span>
                    <span>Account No:</span>
                    <span className="col-span-2 text-metallic-gold font-black select-all">03160580345</span>
                    <span>Account Name:</span>
                    <span className="col-span-2 text-pure-white font-extrabold">Muhammad Ismail Bashir</span>
                    <span>IBAN Account:</span>
                    <span className="col-span-2 text-metallic-gold font-black select-all">PK41TMFB0000000078433120</span>
                  </div>
                </div>

                {/* Receipt verification note */}
                <div className="p-3.5 rounded-sm bg-metallic-gold/5 border border-metallic-gold/20 text-xs text-muted-silver flex items-start gap-2.5">
                  <HelpCircle className="w-4.5 h-4.5 text-metallic-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-pure-white">How to receive your key:</p>
                    <p className="mt-1 leading-normal text-muted-silver font-medium">
                      Send a screenshot of your transfer receipt via WhatsApp to <span className="font-extrabold text-metallic-gold select-all">+92 316 0580345</span> or email to <span className="font-extrabold text-metallic-gold select-all">connect@syncsell.org</span>. You will receive your one-time activation code within 15 minutes!
                    </p>
                  </div>
                </div>

                {/* Instant Verification Section */}
                <div className="border-t border-white/10 pt-4.5 space-y-3">
                  <div className="text-pure-white font-extrabold text-xs flex items-center gap-2">
                    <Ticket className="w-4.5 h-4.5 text-metallic-gold" />
                    <span>Instant AI Activation (Fastest)</span>
                  </div>
                  <p className="text-[11px] text-muted-silver leading-normal font-semibold">
                    Transferred the amount? Upload your transaction screenshot below, and our Claude Vision AI will instantly verify it, log it, and generate your activation key.
                  </p>

                  {!emailSent ? (
                    !ocrResultCode ? (
                      <div className="relative border border-dashed border-white/20 hover:border-metallic-gold rounded-sm p-5 flex flex-col items-center justify-center bg-onyx-black/35 hover:bg-onyx-black/60 transition-all cursor-pointer group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReceiptUpload}
                          disabled={uploadingReceipt}
                          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
                        />
                        <Upload className="w-6 h-6 text-muted-silver group-hover:text-metallic-gold transition-colors mb-1.5" />
                        <span className="text-xs font-bold text-pure-white">
                          {uploadingReceipt ? "Verifying payment receipt..." : "Click or Drag receipt here"}
                        </span>
                        <span className="text-[9px] text-muted-silver font-semibold mt-0.5">Supports PNG, JPEG, JPG (max 4.5MB)</span>
                      </div>
                    ) : (
                      <div className="p-4 rounded-sm bg-green-500/10 border border-green-500/20 space-y-3 shadow-inner">
                        <p className="text-xs font-bold text-green-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-green-400 shrink-0" />
                          <span>Activation Key Generated! (Demo Mode)</span>
                        </p>
                        <div className="flex items-center justify-between gap-2 bg-onyx-black px-3.5 py-2.5 rounded-sm border border-white/10 shadow-sm">
                          <span className="font-black font-mono text-sm text-pure-white tracking-wider select-all">{ocrResultCode}</span>
                          <span className="text-[9px] font-bold text-green-450 bg-green-55/35 px-2 py-0.5 rounded-sm uppercase">Verified</span>
                        </div>
                        <button
                          onClick={() => handleAutoRedeem(ocrResultCode)}
                          disabled={redeeming}
                          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-xs font-extrabold text-white rounded-sm shadow-md cursor-pointer disabled:opacity-50 transition-colors"
                        >
                          {redeeming ? "Activating Plan..." : "Instant Unlock Credits"}
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="p-5 rounded-sm bg-primary/10 border border-primary/20 space-y-3.5 shadow-inner">
                      <p className="text-xs font-bold text-pure-white flex items-center gap-1.5">
                        <Ticket className="w-4.5 h-4.5 text-metallic-gold shrink-0" />
                        <span>Activation Key Emailed!</span>
                      </p>
                      <p className="text-[11px] text-muted-silver font-medium leading-relaxed">
                        We have successfully verified your transfer and sent your one-time activation code to your registered email address: <strong className="text-pure-white">{registeredEmail}</strong>. Please check your inbox (or spam) and paste the code below to claim your credits.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="SYNC-REDEEM-XXXX-XXXX"
                          value={ocrResultCode || ""}
                          onChange={(e) => setOcrResultCode(e.target.value.toUpperCase())}
                          className="flex-1 bg-onyx-black border border-white/15 focus:border-metallic-gold focus:ring-1 focus:ring-metallic-gold/30 rounded-sm py-2 px-3.5 text-xs text-pure-white placeholder:text-muted-silver outline-none font-mono font-bold uppercase tracking-wider"
                        />
                        <button
                          onClick={() => handleAutoRedeem(ocrResultCode || "")}
                          disabled={redeeming || !ocrResultCode}
                          className="px-5 py-2 bg-metallic-gold hover:bg-primary-fixed-dim text-xs font-extrabold uppercase text-onyx-black rounded-sm shadow-md cursor-pointer disabled:opacity-50 transition-colors outline-none"
                        >
                          {redeeming ? "Verifying..." : "Verify & Activate"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedPlanForInstructions(null)}
                className="w-full py-3 mt-6 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-pure-white shadow-md cursor-pointer transition-all active:scale-95"
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
