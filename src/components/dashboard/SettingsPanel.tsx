"use client";

import React, { useState } from "react";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";

interface SettingsPanelProps {
  profile: {
    is_autopilot_enabled: boolean;
    marketplace_region: string;
    sync_interval: string;
  };
}

export function SettingsPanel({ profile }: SettingsPanelProps) {
  const [isAutopilot, setIsAutopilot] = useState(profile.is_autopilot_enabled);
  const [region, setRegion] = useState(profile.marketplace_region || "US");
  const [interval, setInterval] = useState(profile.sync_interval || "24h");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_autopilot_enabled: isAutopilot,
          marketplace_region: region,
          sync_interval: interval,
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      toast.success("Settings saved successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl text-slate-800">
      {/* General Settings */}
      <div className="glass rounded-xl p-8 border border-slate-200/60 bg-white/70 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-500 shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black font-heading text-slate-900 tracking-tight">General Settings</h2>
              <p className="text-xs text-slate-400">Configure your store configuration and synchronization frequencies.</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>

        <div className="space-y-5">
          {/* Autopilot Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50/50 border border-slate-200/60 shadow-inner">
            <div className="pr-4">
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <span>Autopilot Mode (Hands-free)</span>
                {isAutopilot ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full">
                    Off
                  </span>
                )}
              </label>
              <p className="text-xs text-slate-400 mt-1">
                SyncSell will automatically fetch your active eBay listings, optimize them using Claude AI, and push them to eBay on a scheduled basis.
              </p>
            </div>
            <button
              onClick={() => setIsAutopilot(!isAutopilot)}
              className={`w-12 h-6 rounded-full p-1 transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                isAutopilot ? "bg-primary" : "bg-slate-200"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow transform duration-200 ${
                  isAutopilot ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Region */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Marketplace Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-700 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-150 shadow-sm"
            >
              <option value="US" className="bg-white text-slate-700">eBay United States (USD)</option>
              <option value="UK" className="bg-white text-slate-700">eBay United Kingdom (GBP)</option>
              <option value="DE" className="bg-white text-slate-700">eBay Germany (EUR)</option>
              <option value="CA" className="bg-white text-slate-700">eBay Canada (CAD)</option>
            </select>
          </div>

          {/* Sync Interval */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Sync & Autopilot Interval</label>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-700 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-150 shadow-sm"
            >
              <option value="12h" className="bg-white text-slate-700">Twice Daily (Every 12 Hours)</option>
              <option value="24h" className="bg-white text-slate-700">Once Daily (Every 24 Hours)</option>
              <option value="manual" className="bg-white text-slate-700">Manual Pull Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="glass rounded-xl p-6 border border-slate-200/60 bg-white/70 shadow-sm space-y-4">
        <h3 className="text-base font-black font-heading text-slate-900 tracking-tight">System Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2.5">
            <span className="text-slate-500 font-semibold">Claude 4.6 API</span>
            <span className="text-green-600 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Operational
            </span>
          </div>
          <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2.5">
            <span className="text-slate-500 font-semibold">Upstash QStash</span>
            <span className="text-green-600 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Operational
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold">eBay Trading API</span>
            <span className="text-green-600 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
