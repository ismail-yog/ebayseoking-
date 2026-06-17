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
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-xl glass-premium p-4 rounded-xl flex items-center justify-between gap-4 border border-primary/30 shadow-2xl shadow-primary/25"
        >
          {/* Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {selectedCount} {selectedCount === 1 ? "Listing" : "Listings"} Selected
              </p>
              <p className="text-[10px] text-gray-400">Ready to optimize with Claude 4.6 AI</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClear}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onOptimize}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-xs font-bold text-white shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
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
