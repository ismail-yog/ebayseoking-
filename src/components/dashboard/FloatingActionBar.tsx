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
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-xl p-4 rounded-2xl flex items-center justify-between gap-4 bg-white border-2 border-slate-200 shadow-2xl shadow-slate-300/50"
        >
          {/* Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/15 to-secondary/15 flex items-center justify-center text-primary border border-primary/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">
                {selectedCount} {selectedCount === 1 ? "Listing" : "Listings"} Selected
              </p>
              <p className="text-[10px] text-slate-500 font-bold">Ready to optimize with Claude 4.6 AI</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClear}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={onOptimize}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-xs font-bold text-white shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white btn-shimmer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
