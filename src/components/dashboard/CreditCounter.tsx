"use client";

import React from "react";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

interface CreditCounterProps {
  used: number;
  limit: number;
  plan: string;
}

export function CreditCounter({ used, limit, plan }: CreditCounterProps) {
  const percentage = Math.min(Math.round((used / limit) * 100), 100);
  const isCloseToLimit = percentage >= 80;

  const handleUpgrade = () => {
    // Redirect to checkout or Stripe billing portal simulation
    alert("Stripe billing portal initialization. You will be redirected to complete payment.");
  };

  return (
    <div className="rounded-xl p-4 bg-slate-50 border-2 border-slate-200 space-y-3 shadow-inner">
      {/* Label and Info */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Credits Used</span>
        </span>
        <span className="font-black text-slate-900">
          {used} / {limit}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden border border-slate-300">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r shadow-sm ${
            isCloseToLimit 
              ? "from-red-500 to-orange-500" 
              : "from-primary to-accent-cyan"
          }`}
        />
      </div>

      {/* Upgrade Button */}
      {isCloseToLimit && (
        <motion.button
          onClick={handleUpgrade}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white text-xs font-bold shadow-md shadow-primary/20 cursor-pointer transition-all"
        >
          <span>Upgrade Plan</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </motion.button>
      )}

      {/* Helper text */}
      <div className="text-[10px] text-slate-500 text-center uppercase tracking-wider font-bold">
        Plan: <span className="font-extrabold text-slate-700 capitalize">{plan}</span>
      </div>
    </div>
  );
}
