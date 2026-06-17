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
    <div className="glass rounded-xl p-4.5 border border-white/5 space-y-3">
      {/* Label and Info */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400 font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Credits Used</span>
        </span>
        <span className="font-semibold text-white">
          {used} / {limit}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full bg-gradient-to-r ${
            isCloseToLimit 
              ? "from-secondary to-accent-magenta" 
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
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white text-xs font-semibold shadow-lg shadow-primary/20 cursor-pointer"
        >
          <span>Upgrade Plan</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </motion.button>
      )}

      {/* Helper text */}
      <div className="text-[10px] text-gray-500 text-center uppercase tracking-wider">
        Plan: <span className="font-bold text-gray-400">{plan}</span>
      </div>
    </div>
  );
}
