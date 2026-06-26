import React from "react";
import { redirect } from "next/navigation";
import { createClientServer } from "@/lib/supabase/server";
import { EbayStatusCard } from "@/components/dashboard/EbayStatusCard";
import { BillingPanel } from "@/components/dashboard/BillingPanel";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";
import { 
  Sparkles, CheckCircle2, ShoppingBag, Clock 
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

  // Start queries in parallel to eliminate waterfall latency
  const profilePromise = supabase
    .from("users")
    .select("plan_type, optimization_limit, optimizations_used, plan_expires_at, is_autopilot_enabled, marketplace_region, sync_interval")
    .eq("id", user.id)
    .single();

  const isOverview = !tab;
  const credentialsPromise = isOverview
    ? supabase
        .from("store_credentials")
        .select("ebay_store_name, ebay_username")
        .eq("user_id", user.id)
        .maybeSingle()
    : Promise.resolve({ data: null });

  const listingsPromise = isOverview
    ? supabase
        .from("product_listings")
        .select("status")
        .eq("user_id", user.id)
    : Promise.resolve({ data: null });

  const [profileRes, credentialsRes, listingsRes] = await Promise.all([
    profilePromise,
    credentialsPromise,
    listingsPromise,
  ]);

  const profile = profileRes.data;
  const credentials = credentialsRes.data;
  const listings = listingsRes.data;

  const activeProfile = profile ? {
    ...profile,
    is_autopilot_enabled: !!profile.is_autopilot_enabled,
    marketplace_region: profile.marketplace_region || "US",
    sync_interval: profile.sync_interval || "4d",
  } : {
    plan_type: "free",
    optimization_limit: 50,
    optimizations_used: 0,
    plan_expires_at: null,
    is_autopilot_enabled: false,
    marketplace_region: "US",
    sync_interval: "4d",
  };

  // Render Billing Tab Panel
  if (tab === "billing") {
    return <BillingPanel profile={activeProfile} />;
  }

  // Render Settings Tab Panel
  if (tab === "settings") {
    return <SettingsPanel profile={activeProfile} />;
  }

  const isConnected = !!credentials;

  // Fetch stats from product_listings
  let totalListings = 0;
  let optimizedListings = 0;
  let pendingListings = 0;

  if (listings) {
    totalListings = listings.length;
    optimizedListings = listings.filter((l) => l.status === "Optimized").length;
    pendingListings = listings.filter((l) => l.status === "Pending" || l.status === "In Progress").length;
  }

  return (
    <div className="space-y-8 max-w-6xl text-pure-white">
      {/* Welcome Banner */}
      <div>
        <h2 className="text-2xl font-black font-display text-pure-white tracking-tight">Store Overview</h2>
        <p className="text-sm text-muted-silver">Track and monitor your eBay search rank automation.</p>
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
        <div className="bg-graphite-surface rounded-sm p-5 border border-white/10 hover:border-metallic-gold/30 transition-all shadow-lg relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-metallic-gold bg-metallic-gold/10 p-2 rounded-sm border border-metallic-gold/20 transition-all group-hover:scale-105">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-muted-silver uppercase tracking-wider">Total Synced Items</p>
          <h3 className="text-3xl font-black text-pure-white font-display mt-2">{totalListings}</h3>
          <p className="text-[10px] text-muted-silver mt-2">Active items in database</p>
        </div>

        {/* Stat 2 */}
        <div className="bg-graphite-surface rounded-sm p-5 border border-white/10 hover:border-metallic-gold/30 transition-all shadow-lg relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-green-500 bg-green-500/10 p-2 rounded-sm border border-green-55/20 transition-all group-hover:scale-105">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-muted-silver uppercase tracking-wider">AI-Optimized Listings</p>
          <h3 className="text-3xl font-black text-pure-white font-display mt-2">{optimizedListings}</h3>
          <p className="text-[10px] text-green-400 font-bold mt-2">
            {totalListings > 0 ? `${Math.round((optimizedListings / totalListings) * 100)}%` : "0%"} of inventory optimized
          </p>
        </div>

        {/* Stat 3 */}
        <div className="bg-graphite-surface rounded-sm p-5 border border-white/10 hover:border-metallic-gold/30 transition-all shadow-lg relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-amber-500 bg-amber-500/10 p-2 rounded-sm border border-amber-500/20 transition-all group-hover:scale-105">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-muted-silver uppercase tracking-wider">Pending Optimization</p>
          <h3 className="text-3xl font-black text-pure-white font-display mt-2">{pendingListings}</h3>
          <p className="text-[10px] text-muted-silver mt-2">Ready in queue</p>
        </div>
      </div>

      {/* Activity Grid / Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tips / Guidelines */}
        <div className="lg:col-span-3 bg-graphite-surface rounded-sm p-6 border border-white/10 shadow-lg space-y-4">
          <h3 className="text-base font-bold font-display text-pure-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-metallic-gold" />
            <span>AI Optimization Tips for eBay Cassini Rank</span>
          </h3>
          <div className="space-y-3 text-xs text-muted-silver">
            <div className="p-3.5 bg-onyx-black/50 rounded-sm border border-white/10">
              <p className="font-bold text-metallic-gold">1. Optimize Title Keywords First</p>
              <p className="mt-1 text-pure-white/80">eBay search places huge emphasis on the first 3-5 words of the title. Ensure product type, brand, model, and key specs are frontloaded.</p>
            </div>
            <div className="p-3.5 bg-onyx-black/50 rounded-sm border border-white/10">
              <p className="font-bold text-metallic-gold">2. Enhance Descriptions with Structured HTML</p>
              <p className="mt-1 text-pure-white/80">SyncSell generates clean, mobile-responsive layout descriptions. Structured text satisfies Cassini readability algorithm scans.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
