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
      <div className="bg-white rounded-xl p-8 border-2 border-slate-300 shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-300 text-slate-600 shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black font-heading text-slate-950 tracking-tight">General Settings</h2>
              <p className="text-xs font-semibold text-slate-500">Configure your store configuration and synchronization frequencies.</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white shadow-md"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>

        <div className="space-y-5">
          {/* Autopilot Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border-2 border-slate-200 shadow-inner">
            <div className="pr-4 text-left">
              <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span>Autopilot Mode (Hands-free)</span>
                {isAutopilot ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-green-700 bg-green-50 border border-green-300 px-2 py-0.5 rounded-full shadow-sm">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-slate-500 bg-white border border-slate-300 px-2 py-0.5 rounded-full shadow-sm">
                    Off
                  </span>
                )}
              </label>
              <p className="text-xs font-semibold text-slate-600 mt-1">
                SyncSell will automatically fetch your active eBay listings, optimize them using Claude AI, and push them to eBay on a scheduled basis.
              </p>
            </div>
            <button
              onClick={() => setIsAutopilot(!isAutopilot)}
              className={`w-12 h-6 rounded-full p-1 transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                isAutopilot ? "bg-primary" : "bg-slate-350"
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
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-slate-500">Marketplace Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-white border-2 border-slate-300 rounded-lg py-2.5 px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150 shadow-sm"
            >
              <option value="US" className="bg-white text-slate-800 font-semibold">eBay United States (USD)</option>
              <option value="UK" className="bg-white text-slate-800 font-semibold">eBay United Kingdom (GBP)</option>
              <option value="DE" className="bg-white text-slate-800 font-semibold">eBay Germany (EUR)</option>
              <option value="CA" className="bg-white text-slate-800 font-semibold">eBay Canada (CAD)</option>
            </select>
          </div>

          {/* Sync Interval */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-slate-500">Sync & Autopilot Interval</label>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="w-full bg-white border-2 border-slate-300 rounded-lg py-2.5 px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150 shadow-sm"
            >
              <option value="12h" className="bg-white text-slate-800 font-semibold">Twice Daily (Every 12 Hours)</option>
              <option value="24h" className="bg-white text-slate-800 font-semibold">Once Daily (Every 24 Hours)</option>
              <option value="manual" className="bg-white text-slate-800 font-semibold">Manual Pull Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl p-6 border-2 border-slate-300 shadow-md space-y-4">
        <h3 className="text-base font-black font-heading text-slate-950 tracking-tight text-left">System Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2.5">
            <span className="text-slate-600 font-bold">Claude 4.6 API</span>
            <span className="text-green-700 font-extrabold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Operational
            </span>
          </div>
          <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2.5">
            <span className="text-slate-600 font-bold">Upstash QStash</span>
            <span className="text-green-700 font-extrabold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Operational
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-bold">eBay Trading API</span>
            <span className="text-green-700 font-extrabold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
