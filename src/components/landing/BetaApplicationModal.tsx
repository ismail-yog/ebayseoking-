"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ShieldCheck, Mail, Link2, Calendar, CheckCircle } from "lucide-react";

interface BetaApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BetaApplicationModal({ isOpen, onClose }: BetaApplicationModalProps) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [ebayStoreUrl, setEbayStoreUrl] = useState("");
  const [activeListingsCount, setActiveListingsCount] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; qualified: boolean } | null>(null);
  const [error, setError] = useState("");

  const handleNextStep = () => {
    if (step === 1 && !email) {
      setError("Email address is required.");
      return;
    }
    if (step === 1 && !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (step === 2 && !ebayStoreUrl) {
      setError("eBay Store URL is required.");
      return;
    }
    setError("");
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setError("");
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!activeListingsCount || !monthlyRevenue) {
      setError("Please complete all questions.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ebayStoreUrl,
          activeListingsCount,
          monthlyRevenue,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      setResult({ success: true, qualified: data.qualified });
      setStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setEmail("");
    setEbayStoreUrl("");
    setActiveListingsCount("");
    setMonthlyRevenue("");
    setResult(null);
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, duration: 0.4 } },
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={handleReset}
          className="fixed inset-0 bg-onyx-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="relative w-full max-w-xl bg-graphite-surface border border-white/10 p-8 shadow-2xl text-pure-white overflow-hidden"
        >
          {/* Top border decoration */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-metallic-gold" />

          {/* Close button */}
          <button
            onClick={handleReset}
            className="absolute top-4 right-4 text-muted-silver hover:text-pure-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          {step < 4 && (
            <div className="mb-8">
              <span className="font-label-caps text-label-caps text-metallic-gold tracking-widest block mb-2 uppercase">
                Beta Application
              </span>
              <h3 className="font-headline-md text-[24px] leading-8 text-pure-white font-bold tracking-tight">
                See If You Qualify
              </h3>
              {/* Progress dots */}
              <div className="flex gap-2 mt-4">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 transition-all duration-300 ${
                      s <= step ? "bg-metallic-gold" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step Contents */}
          <div className="min-h-[220px] flex flex-col justify-between">
            <div>
              {error && (
                <div className="mb-4 text-xs bg-error-container/30 border border-error-container text-error p-3.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-error" />
                  {error}
                </div>
              )}

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <label className="block text-sm font-semibold tracking-wide text-muted-silver uppercase">
                      1. What is your email address?
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-silver w-5 h-5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="name@company.com"
                        className="w-full bg-onyx-black border border-white/15 pl-12 pr-4 py-4 focus:border-metallic-gold focus:ring-1 focus:ring-metallic-gold outline-none transition-all text-pure-white font-medium placeholder-white/30"
                        required
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-muted-silver leading-relaxed">
                      We will use this address to contact you regarding your application status.
                    </p>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <label className="block text-sm font-semibold tracking-wide text-muted-silver uppercase">
                      2. What is your eBay Store URL?
                    </label>
                    <div className="relative">
                      <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-silver w-5 h-5" />
                      <input
                        type="url"
                        value={ebayStoreUrl}
                        onChange={(e) => {
                          setEbayStoreUrl(e.target.value);
                          setError("");
                        }}
                        placeholder="ebay.com/str/yourstorename"
                        className="w-full bg-onyx-black border border-white/15 pl-12 pr-4 py-4 focus:border-metallic-gold focus:ring-1 focus:ring-metallic-gold outline-none transition-all text-pure-white font-medium placeholder-white/30"
                        required
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-muted-silver leading-relaxed">
                      We require a valid active store link to verify listing volumes.
                    </p>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    {/* Listings Selection */}
                    <div className="space-y-3">
                      <label className="block text-xs font-bold tracking-wide text-muted-silver uppercase">
                        3. How many active listings do you manage?
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {["0-100", "100-1,000", "1,000+"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setActiveListingsCount(option);
                              setError("");
                            }}
                            className={`py-3 px-2 border transition-all text-xs font-bold tracking-wide cursor-pointer ${
                              activeListingsCount === option
                                ? "bg-metallic-gold/10 border-metallic-gold text-metallic-gold"
                                : "border-white/10 hover:border-white/20 bg-onyx-black/50 text-muted-silver hover:text-pure-white"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Revenue Selection */}
                    <div className="space-y-3">
                      <label className="block text-xs font-bold tracking-wide text-muted-silver uppercase">
                        4. What is your average monthly eBay revenue?
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: "not-making-money", label: "I am not making money yet" },
                          { value: "under-5k", label: "Under $5,000 / month" },
                          { value: "5k-50k", label: "$5,000 - $50,000 / month" },
                          { value: "50k-plus", label: "$50,000+ / month (Enterprise)" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setMonthlyRevenue(option.value);
                              setError("");
                            }}
                            className={`w-full py-3 px-4 border text-left transition-all text-xs font-bold tracking-wide cursor-pointer flex items-center justify-between ${
                              monthlyRevenue === option.value
                                ? "bg-metallic-gold/10 border-metallic-gold text-metallic-gold"
                                : "border-white/10 hover:border-white/20 bg-onyx-black/50 text-muted-silver hover:text-pure-white"
                            }`}
                          >
                            <span>{option.label}</span>
                            {monthlyRevenue === option.value && (
                              <CheckCircle className="w-4 h-4 text-metallic-gold" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 4 && result && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6 space-y-6"
                  >
                    {result.qualified ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-metallic-gold/10 border border-metallic-gold/30 flex items-center justify-center text-metallic-gold mx-auto animate-pulse">
                          <Calendar className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                          <span className="font-label-caps text-label-caps text-metallic-gold tracking-widest block uppercase">
                            Application Qualified
                          </span>
                          <h3 className="font-headline-md text-headline-md text-pure-white font-bold tracking-tight">
                            Book Your Strategy Call
                          </h3>
                          <p className="font-body-md text-body-md text-muted-silver max-w-sm mx-auto leading-relaxed">
                            Congratulations! Your store volume qualifies for our Elite Beta Program. Let&apos;s schedule your 15-minute onboarding & alignment call.
                          </p>
                        </div>
                        <a
                          href="https://calendly.com/ismail-bashir/syncsell-strategy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-metallic-gold text-onyx-black font-button-text text-button-text uppercase px-10 py-4.5 font-bold hover:bg-primary-fixed-dim transition-colors cursor-pointer w-full sm:w-auto"
                        >
                          Schedule On Calendly
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-silver mx-auto">
                          <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                          <span className="font-label-caps text-label-caps text-muted-silver tracking-widest block uppercase">
                            Added To Waitlist
                          </span>
                          <h3 className="font-headline-md text-headline-md text-pure-white font-bold tracking-tight">
                            You&apos;re On The Waitlist
                          </h3>
                          <p className="font-body-md text-body-md text-muted-silver max-w-sm mx-auto leading-relaxed">
                            Thank you! Due to high API demand, we are currently prioritizing active high-volume stores (100+ listings). We have added you to our waitlist and will email you as soon as capacity opens up.
                          </p>
                        </div>
                        <button
                          onClick={handleReset}
                          className="w-full sm:w-auto bg-transparent border border-white/20 text-pure-white hover:border-white/40 font-button-text text-button-text uppercase px-8 py-4 transition-colors cursor-pointer"
                        >
                          Close Window
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Actions */}
            {step < 4 && (
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
                {step > 1 ? (
                  <button
                    onClick={handlePrevStep}
                    disabled={loading}
                    className="text-muted-silver hover:text-pure-white transition-colors cursor-pointer text-xs uppercase tracking-wider font-bold"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <button
                    onClick={handleNextStep}
                    className="bg-metallic-gold text-onyx-black font-button-text text-button-text uppercase px-8 py-3.5 flex items-center gap-2 hover:bg-primary-fixed-dim transition-colors cursor-pointer font-bold"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-metallic-gold text-onyx-black font-button-text text-button-text uppercase px-8 py-3.5 flex items-center gap-2 hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 cursor-pointer font-bold"
                  >
                    {loading ? "Submitting..." : "Apply"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
