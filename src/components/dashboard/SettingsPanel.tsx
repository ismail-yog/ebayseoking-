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
  const [interval, setInterval] = useState(() => {
    const val = profile.sync_interval;
    if (val === "4d" || val === "1w" || val === "2w") return val;
    return "4d";
  });
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
    <div className="space-y-6 max-w-2xl text-pure-white">
      {/* General Settings */}
      <div className="bg-graphite-surface rounded-sm p-8 border border-white/10 shadow-lg space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-white/5 flex items-center justify-center border border-white/10 text-metallic-gold shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-pure-white tracking-tight">General Settings</h2>
              <p className="text-xs font-medium text-muted-silver">Configure your store configuration and synchronization frequencies.</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-sm bg-metallic-gold hover:bg-primary-fixed-dim text-xs font-extrabold uppercase text-onyx-black transition-all cursor-pointer disabled:opacity-50 outline-none active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>

        <div className="space-y-5">
          {/* Autopilot Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-sm bg-onyx-black/60 border border-white/10 shadow-inner">
            <div className="pr-4 text-left">
              <label className="text-sm font-bold text-pure-white flex items-center gap-2">
                <span>Autopilot Mode (Hands-free)</span>
                {isAutopilot ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-green-450 bg-green-500/10 border border-green-500/25 px-2 py-0.5 rounded-sm">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-muted-silver bg-white/5 border border-white/10 px-2 py-0.5 rounded-sm">
                    Off
                  </span>
                )}
              </label>
              <p className="text-xs font-medium text-muted-silver mt-1">
                SyncSell will automatically fetch your active eBay listings, optimize them using Claude AI, and push them to eBay on a scheduled basis.
              </p>
            </div>
            <button
              onClick={() => setIsAutopilot(!isAutopilot)}
              className={`w-12 h-6 rounded-full p-1 transition-all duration-200 cursor-pointer outline-none shrink-0 ${
                isAutopilot ? "bg-metallic-gold" : "bg-white/10"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-onyx-black shadow transform duration-200 ${
                  isAutopilot ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Region */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-muted-silver">Marketplace Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-onyx-black border border-white/15 rounded-sm py-2.5 px-3.5 text-sm font-semibold text-pure-white focus:outline-none focus:border-metallic-gold focus:ring-1 focus:ring-metallic-gold/30 transition-all duration-150 shadow-sm"
            >
              <option value="US" className="bg-onyx-black text-pure-white font-semibold">eBay United States (USD)</option>
              <option value="UK" className="bg-onyx-black text-pure-white font-semibold">eBay United Kingdom (GBP)</option>
              <option value="DE" className="bg-onyx-black text-pure-white font-semibold">eBay Germany (EUR)</option>
              <option value="CA" className="bg-onyx-black text-pure-white font-semibold">eBay Canada (CAD)</option>
            </select>
          </div>

          {/* Sync Interval */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-muted-silver">Sync & Autopilot Interval</label>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="w-full bg-onyx-black border border-white/15 rounded-sm py-2.5 px-3.5 text-sm font-semibold text-pure-white focus:outline-none focus:border-metallic-gold focus:ring-1 focus:ring-metallic-gold/30 transition-all duration-150 shadow-sm"
            >
              <option value="4d" className="bg-onyx-black text-pure-white font-semibold">Every 4 Days</option>
              <option value="1w" className="bg-onyx-black text-pure-white font-semibold">Every 1 Week</option>
              <option value="2w" className="bg-onyx-black text-pure-white font-semibold">Every 2 Weeks</option>
            </select>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-graphite-surface rounded-sm p-6 border border-white/10 shadow-lg space-y-4">
        <h3 className="text-base font-bold font-display text-pure-white tracking-tight text-left">System Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2.5">
            <span className="text-muted-silver font-bold">Claude 4.6 API</span>
            <span className="text-green-400 font-extrabold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Operational
            </span>
          </div>
          <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2.5">
            <span className="text-muted-silver font-bold">Upstash QStash</span>
            <span className="text-green-400 font-extrabold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Operational
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-silver font-bold">eBay Trading API</span>
            <span className="text-green-400 font-extrabold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
