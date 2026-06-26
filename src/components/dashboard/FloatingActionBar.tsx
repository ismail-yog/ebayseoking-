"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

interface FloatingActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onOptimize: () => void;
  isLoading: boolean;
}

export function FloatingActionBar({ selectedCount, onClear, onOptimize, isLoading }: FloatingActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 80, x: "-50%", opacity: 0 }}
          animate={{ y: 0, x: "-50%", opacity: 1 }}
          exit={{ y: 80, x: "-50%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-xl p-4 rounded-sm flex items-center justify-between gap-4 bg-graphite-surface border border-white/15 shadow-2xl shadow-black/80"
        >
          {/* Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-metallic-gold/10 flex items-center justify-center text-metallic-gold border border-metallic-gold/20">
              <Sparkles className="w-5 h-5 animate-pulse text-metallic-gold" />
            </div>
            <div>
              <p className="text-sm font-bold text-pure-white font-display">
                {selectedCount} {selectedCount === 1 ? "Listing" : "Listings"} Selected
              </p>
              <p className="text-[10px] text-muted-silver">Ready to optimize with Claude AI SEO</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClear}
              disabled={isLoading}
              className="px-4 py-2 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 text-muted-silver hover:text-pure-white text-xs font-bold transition-all cursor-pointer outline-none active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={onOptimize}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-sm bg-metallic-gold hover:bg-primary-fixed-dim text-xs font-extrabold uppercase text-onyx-black shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 outline-none"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-onyx-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Optimize Selected</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
