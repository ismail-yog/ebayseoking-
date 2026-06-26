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
    alert("Onboarding is strictly reviewed. Please contact connect@syncsell.org to upgrade your high-volume tier limits.");
  };

  return (
    <div className="rounded-sm p-4 bg-onyx-black/50 border border-white/10 space-y-3 shadow-inner text-pure-white">
      {/* Label and Info */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-silver font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-metallic-gold" />
          <span>Credits Used</span>
        </span>
        <span className="font-extrabold text-pure-white">
          {used} / {limit}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full rounded-sm bg-white/5 overflow-hidden border border-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-sm ${
            isCloseToLimit 
              ? "bg-gradient-to-r from-red-500 to-orange-500" 
              : "bg-gradient-to-r from-metallic-gold to-primary"
          }`}
        />
      </div>

      {/* Upgrade Button */}
      {isCloseToLimit && (
        <motion.button
          onClick={handleUpgrade}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-none bg-metallic-gold hover:bg-primary-fixed-dim text-onyx-black text-xs font-bold transition-colors cursor-pointer"
        >
          <span>Upgrade Tier</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </motion.button>
      )}

      {/* Helper text */}
      <div className="text-[10px] text-muted-silver text-center uppercase tracking-wider font-bold">
        Tier: <span className="font-extrabold text-metallic-gold capitalize">{plan}</span>
      </div>
    </div>
  );
}
