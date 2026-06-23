"use client";

import React, { useState } from "react";
import { createPromoCode } from "@/app/admin-portal/actions";
import { Sparkles, Key, Plus, Loader2 } from "lucide-react";

export function PromoGenerator() {
  const [code, setCode] = useState("");
  const [planType, setPlanType] = useState("starter");
  const [duration, setDuration] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const generateRandomCode = () => {
    const segment1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const segment2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    setCode(`SYNC-REDEEM-${segment1}-${segment2}`);
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter or generate a promo code.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("code", code);
    formData.append("planType", planType);
    formData.append("durationMonths", duration);

    const res = await createPromoCode(formData);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setCode("");
      // Reset form if needed
    }
  };

  return (
    <div className="glass rounded-xl p-6 border border-slate-200/60 shadow-sm space-y-4">
      <h3 className="text-base font-bold font-heading text-slate-950 flex items-center gap-2">
        <Key className="w-4.5 h-4.5 text-primary" />
        <span>Create One-Time Activation Key</span>
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-lg flex items-center gap-1.5">
            <span>✓ Promo code generated and saved successfully!</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Promo Code Key</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SYNC-REDEEM-XXXX-XXXX"
              className="flex-1 px-3.5 py-2 border-2 border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white focus:border-primary transition-all outline-none"
            />
            <button
              type="button"
              onClick={generateRandomCode}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 hover:border-slate-350 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-secondary" />
              <span>Auto-Generate</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Plan / Credit Volume</label>
            <select
              value={planType}
              onChange={(e) => setPlanType(e.target.value)}
              className="w-full px-3.5 py-2 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:border-primary transition-all outline-none"
            >
              <option value="starter">Starter (200 Credits)</option>
              <option value="growth">Growth (350 Credits)</option>
              <option value="power">Power (500 Credits)</option>
              <option value="agency">Agency (1000 Credits)</option>
              <option value="enterprise">Enterprise (3000 Credits)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Duration (Months)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3.5 py-2 border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:border-primary transition-all outline-none"
            >
              <option value="1">1 Month</option>
              <option value="3">3 Months</option>
              <option value="6">6 Months</option>
              <option value="12">12 Months</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-extrabold shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          <span>Create Key</span>
        </button>
      </form>
    </div>
  );
}
