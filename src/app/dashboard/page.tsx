import React from "react";
import { redirect } from "next/navigation";
import { createClientServer } from "@/lib/supabase/server";
import { EbayStatusCard } from "@/components/dashboard/EbayStatusCard";
import { BillingPanel } from "@/components/dashboard/BillingPanel";
import { 
  Sparkles, CheckCircle2, ShoppingBag, Clock, Settings 
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch user profile details for stats & billing
  const { data: profile } = await supabase
    .from("users")
    .select("plan_type, optimization_limit, optimizations_used, plan_expires_at")
    .eq("id", user.id)
    .single();

  const activeProfile = profile || {
    plan_type: "free",
    optimization_limit: 10,
    optimizations_used: 0,
    plan_expires_at: null,
  };

  // Render Billing Tab Panel
  if (tab === "billing") {
    return <BillingPanel profile={activeProfile} />;
  }

  // Render Settings Tab Panel
  if (tab === "settings") {
    return (
      <div className="space-y-6 max-w-2xl">
        {/* General Settings */}
        <div className="glass rounded-xl p-8 border border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 text-gray-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-white">General Settings</h2>
              <p className="text-xs text-gray-400">Configure your store configuration and synchronization frequencies.</p>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Marketplace Region</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-gray-300 focus:outline-none">
                <option value="US">eBay United States (USD)</option>
                <option value="UK">eBay United Kingdom (GBP)</option>
                <option value="DE">eBay Germany (EUR)</option>
                <option value="CA">eBay Canada (CAD)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Sync Interval</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-gray-300 focus:outline-none">
                <option value="12h">Twice Daily (Every 12 Hours)</option>
                <option value="24h">Once Daily (Every 24 Hours)</option>
                <option value="manual">Manual Pull Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* System Status (Moved from Overview) */}
        <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
          <h3 className="text-base font-bold font-heading text-white">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
              <span className="text-gray-400">Claude 3.5 API</span>
              <span className="text-green-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Operational
              </span>
            </div>
            <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
              <span className="text-gray-400">Upstash QStash</span>
              <span className="text-green-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Operational
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">eBay Trading API</span>
              <span className="text-green-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Connected
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch eBay credentials status
  const { data: credentials } = await supabase
    .from("store_credentials")
    .select("ebay_store_name, ebay_username")
    .eq("user_id", user.id)
    .maybeSingle();

  const isConnected = !!credentials;

  // Fetch stats from product_listings
  let totalListings = 0;
  let optimizedListings = 0;
  let pendingListings = 0;

  const { data: listings } = await supabase
    .from("product_listings")
    .select("status")
    .eq("user_id", user.id);

  if (listings) {
    totalListings = listings.length;
    optimizedListings = listings.filter((l) => l.status === "Optimized").length;
    pendingListings = listings.filter((l) => l.status === "Pending" || l.status === "In Progress").length;
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome Banner */}
      <div>
        <h2 className="text-2xl font-bold font-heading text-white">Store Overview</h2>
        <p className="text-sm text-gray-400">Track and monitor your eBay search rank automation.</p>
      </div>

      {/* eBay Connection State */}
      <EbayStatusCard 
        isConnected={isConnected} 
        storeName={credentials?.ebay_store_name} 
        username={credentials?.ebay_username} 
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat 1 */}
        <div className="glass rounded-xl p-5 border border-white/5 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-primary bg-primary/10 p-2 rounded-lg border border-primary/20">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-400">Total Synced Items</p>
          <h3 className="text-3xl font-extrabold text-white font-heading mt-2">{totalListings}</h3>
          <p className="text-[10px] text-gray-500 mt-2">Active items in database</p>
        </div>

        {/* Stat 2 */}
        <div className="glass rounded-xl p-5 border border-white/5 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-green-400 bg-green-500/10 p-2 rounded-lg border border-green-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-400">AI-Optimized Listings</p>
          <h3 className="text-3xl font-extrabold text-white font-heading mt-2">{optimizedListings}</h3>
          <p className="text-[10px] text-green-400 font-semibold mt-2">
            {totalListings > 0 ? `${Math.round((optimizedListings / totalListings) * 100)}%` : "0%"} of inventory optimized
          </p>
        </div>

        {/* Stat 3 */}
        <div className="glass rounded-xl p-5 border border-white/5 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-yellow-500 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-gray-400">Pending Optimization</p>
          <h3 className="text-3xl font-extrabold text-white font-heading mt-2">{pendingListings}</h3>
          <p className="text-[10px] text-gray-500 mt-2">Ready in queue</p>
        </div>
      </div>

      {/* Activity Grid / Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tips / Guidelines */}
        <div className="lg:col-span-3 glass rounded-xl p-6 border border-white/5 space-y-4">
          <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span>AI Optimization Tips for eBay Cassini Rank</span>
          </h3>
          <div className="space-y-3 text-xs text-gray-400">
            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
              <p className="font-semibold text-gray-200">1. Optimize Title Keywords First</p>
              <p className="mt-1">eBay search places huge emphasis on the first 3-5 words of the title. Ensure product type, brand, model, and key specs are frontloaded.</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
              <p className="font-semibold text-gray-200">2. Enhance Descriptions with Structured HTML</p>
              <p className="mt-1">SyncSell generates clean, mobile-responsive layout descriptions. Structured text satisfies Cassini readability algorithm scans.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
