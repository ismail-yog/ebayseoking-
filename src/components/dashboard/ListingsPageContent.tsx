"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, CheckCircle2, AlertCircle, Clock, 
  Eye, Search, Store, X, DownloadCloud, Zap,
  TrendingUp, Terminal, Sliders
} from "lucide-react";
import { FloatingActionBar } from "@/components/dashboard/FloatingActionBar";
import { toast } from "sonner";

interface Listing {
  id: string;
  ebay_item_id: string;
  title: string;
  optimized_title?: string;
  description?: string;
  optimized_description?: string;
  image_urls?: string[];
  price?: number;
  currency?: string;
  status: string;
  error_message?: string;
  updated_at: string;
}

interface ProfileStats {
  optimizations_used: number;
  optimization_limit: number;
}

interface ListingsPageContentProps {
  initialListings: Listing[];
  profile: ProfileStats;
}

export function ListingsPageContent({ initialListings, profile }: ListingsPageContentProps) {
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDrawerListing, setActiveDrawerListing] = useState<Listing | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50); // 0-100 percentage for the split-pane compare slider
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [autoPublishMode, setAutoPublishMode] = useState(false);
  const [credits, setCredits] = useState<ProfileStats>(profile);
  const router = useRouter();

  // Sync state when server component data (initialListings) refreshes
  useEffect(() => {
    setListings(initialListings);
    setCredits(profile);
  }, [initialListings, profile]);

  const [isAutopilotEnabled, setIsAutopilotEnabled] = useState(false);
  const [logs, setLogs] = useState<{message: string, created_at: string, level: string}[]>([]);

  // Fetch autopilot status
  useEffect(() => {
    const fetchAutopilotStatus = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('users').select('is_autopilot_enabled').eq('id', user.id).single();
          if (data) setIsAutopilotEnabled(!!data.is_autopilot_enabled);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchAutopilotStatus();
  }, []);

  // Poll system logs every 3 seconds
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('system_logs')
          .select('message, created_at, level')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (data) {
          setLogs(data.reverse());
        }
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleAutopilot = async () => {
    const newState = !isAutopilotEnabled;
    setIsAutopilotEnabled(newState);
    toast.info(newState ? "Autopilot Resumed!" : "Autopilot Paused. Queue will halt.");
    try {
      await fetch('/api/user/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_autopilot_enabled: newState })
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to update autopilot status");
      setIsAutopilotEnabled(!newState); // revert
    }
  };

  // Filter listings based on search
  const filteredListings = listings.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.ebay_item_id.includes(searchQuery)
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredListings.map((l) => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleSelectCount = (countStr: string) => {
    const pendingListings = filteredListings.filter((l) => l.status === "Pending");
    const count = countStr === "all" ? pendingListings.length : parseInt(countStr) || 0;
    const idsToSelect = pendingListings.slice(0, count).map((l) => l.id);
    setSelectedIds(idsToSelect);
  };

  const handleBatchOptimize = async (idsToOptimize?: string[] | unknown) => {
    const targetIds = Array.isArray(idsToOptimize) ? idsToOptimize : selectedIds;
    const selectedCount = targetIds.length;
    const remainingCredits = credits.optimization_limit - credits.optimizations_used;

    if (selectedCount === 0) return;

    if (selectedCount > remainingCredits) {
      toast.error(
        `Insufficient Credits! You selected ${selectedCount} items but have only ${remainingCredits} credits remaining.`,
        { duration: 5000 }
      );
      return;
    }

    setIsLoading(true);
    toast.loading(`Queueing ${selectedCount} listing optimizations...`);

    let processedCount = 0;

    for (const listingId of targetIds) {
      // Respect pause controller
      if (!isAutopilotEnabled) {
        toast.info("Autopilot paused. Stopping bulk queue.");
        break;
      }

      // Dynamically update UI status to In Progress
      setListings((prev) =>
        prev.map((l) =>
          l.id === listingId ? { ...l, status: "In Progress" } : l
        )
      );

      try {
        const res = await fetch("/api/optimize/single", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId, autoPublish: autoPublishMode }),
        });

        if (!res.ok) {
          const errData = await res.json();
          console.error(`Failed to optimize ${listingId}:`, errData);
          setListings((prev) =>
            prev.map((l) =>
              l.id === listingId ? { ...l, status: "Failed", error_message: errData.error || "Optimization failed" } : l
            )
          );
          continue;
        }

        processedCount++;
        const data = await res.json();
        
        // Dynamically update UI with final optimized listing data
        if (data.listing) {
          setListings((prev) =>
            prev.map((l) =>
              l.id === listingId ? data.listing : l
            )
          );
        } else {
          setListings((prev) =>
            prev.map((l) =>
              l.id === listingId ? { ...l, status: autoPublishMode ? "Optimized" : "Pending Review" } : l
            )
          );
        }

        // Dynamically update credits counter
        setCredits((prev) => ({
          ...prev,
          optimizations_used: prev.optimizations_used + 1,
        }));
        
      } catch (err) {
        console.error("Queue request failed for " + listingId, err);
        setListings((prev) =>
          prev.map((l) =>
            l.id === listingId ? { ...l, status: "Failed", error_message: "Network or queue request failed" } : l
          )
        );
      }
    }

    toast.dismiss();
    toast.success(`Successfully processed ${processedCount} optimizations!`);

    if (!idsToOptimize) setSelectedIds([]);
    setIsLoading(false);
  };

  const handleFetchListings = async () => {
    setIsFetching(true);
    toast.loading("Fetching active listings from eBay...");
    try {
      const res = await fetch("/api/ebay/sync", { method: "POST" });
      const data = await res.json();
      toast.dismiss();
      if (!res.ok) throw new Error(data.error || "Failed to fetch listings");
      
      toast.success(`Successfully synced ${data.count} active listings from eBay!`);
      router.refresh();
    } catch (err: unknown) {
      toast.dismiss();
      const msg = err instanceof Error ? err.message : "Failed to sync eBay listings";
      toast.error(msg);
    } finally {
      setIsFetching(false);
    }
  };

  const handleOptimizeAll = () => {
    const pendingListings = listings.filter((l) => l.status === "Pending");
    if (pendingListings.length === 0) {
      toast.info("No pending listings available to optimize.");
      return;
    }
    handleBatchOptimize(pendingListings.map(l => l.id));
  };

  const handleManualPublish = async (listingId: string) => {
    setIsLoading(true);
    toast.loading("Publishing to eBay...");
    try {
      const res = await fetch("/api/ebay/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      toast.dismiss();
      if (!res.ok) throw new Error(data.error || "Failed to publish listing");
      
      toast.success("Successfully published to eBay!");
      
      setListings((prev) =>
        prev.map((l) =>
          l.id === listingId ? { ...l, status: "Optimized" } : l
        )
      );
      if (activeDrawerListing?.id === listingId) {
        setActiveDrawerListing({ ...activeDrawerListing, status: "Optimized" });
      }
    } catch (err: unknown) {
      toast.dismiss();
      toast.error(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setIsLoading(false);
    }
  };

  const pendingCount = listings.filter((l) => l.status === "Pending").length;
  const inProgressCount = listings.filter((l) => l.status === "In Progress" || l.status === "Pending Queue").length;
  const optimizedCount = listings.filter((l) => l.status === "Optimized").length;
  const pendingReviewCount = listings.filter((l) => l.status === "Pending Review").length;
  const failedCount = listings.filter((l) => l.status === "Failed").length;

  return (
    <div className="space-y-6 max-w-6xl relative pb-24 text-pure-white">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-display text-pure-white tracking-tight uppercase">Active Product Listings</h2>
          <p className="text-xs font-semibold text-muted-silver">Select active listings to optimize using Claude 4.6 Sonnet.</p>
        </div>

        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          <label className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-sm border border-white/10 transition-colors">
            <input 
              type="checkbox" 
              checked={autoPublishMode}
              onChange={(e) => setAutoPublishMode(e.target.checked)}
              className="rounded accent-metallic-gold text-metallic-gold focus:ring-metallic-gold w-4 h-4 cursor-pointer"
            />
            <span className="text-xs font-bold text-pure-white">Auto-publish to eBay</span>
          </label>

          <button
            onClick={handleFetchListings}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 text-pure-white text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isFetching ? <Clock className="w-4 h-4 animate-spin text-metallic-gold" /> : <DownloadCloud className="w-4 h-4 text-metallic-gold" />}
            <span className="hidden sm:inline">Fetch Active Listings</span>
            <span className="sm:hidden">Fetch</span>
          </button>
          
          <button
            onClick={toggleAutopilot}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-sm border text-xs font-bold transition-all cursor-pointer ${
              isAutopilotEnabled
                ? "bg-red-950/20 border-red-800 text-red-400 hover:bg-red-900/20"
                : "bg-metallic-gold/10 border-metallic-gold/30 text-metallic-gold hover:bg-metallic-gold/20"
            }`}
          >
            {isAutopilotEnabled ? "Pause Autopilot" : "Resume Autopilot"}
          </button>
          
          <button
            onClick={handleOptimizeAll}
            disabled={isLoading || pendingCount === 0}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-sm bg-metallic-gold hover:bg-primary-fixed-dim text-onyx-black text-xs font-extrabold uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-metallic-gold/10 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-onyx-black/10" />
            <span className="hidden sm:inline">Optimize All</span>
            <span className="sm:hidden">Opt All</span>
          </button>

          <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-pure-white font-black bg-onyx-black/50 border border-white/10 px-3 py-1.5 rounded-sm">
              Credits: {credits.optimizations_used} / {credits.optimization_limit}
            </span>
          </div>
        </div>
      </div>

      {listings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Executive Metrics Overview */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {/* Metric Card 1 */}
            <div className="bg-graphite-surface rounded-sm p-5 border border-white/10 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[110px] hover:border-metallic-gold/20 transition-all">
              <div>
                <p className="text-[10px] font-extrabold text-muted-silver uppercase tracking-wider">Pending Optimization</p>
                <h3 className="text-2xl font-black text-pure-white font-display mt-1">{pendingCount}</h3>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                <span className="text-[10px] font-bold text-muted-silver">Ready in Queue</span>
                <svg className="w-16 h-6 text-metallic-gold" viewBox="0 0 50 20" fill="none">
                  <path d="M0,15 Q10,12 20,16 T40,5 T50,8" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </div>
            </div>

            {/* Metric Card 2 */}
            <div className="bg-graphite-surface rounded-sm p-5 border border-white/10 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[110px] hover:border-metallic-gold/20 transition-all">
              <div>
                <p className="text-[10px] font-extrabold text-muted-silver uppercase tracking-wider">Optimized & Synced</p>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-2xl font-black text-metallic-gold font-display">{optimizedCount}</h3>
                  {pendingReviewCount > 0 && (
                    <span className="text-[9px] font-extrabold text-orange-400 bg-orange-950/20 border border-orange-850 px-2 py-0.5 rounded-sm shadow-inner animate-pulse">
                      {pendingReviewCount} Review
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                <span className="text-[10px] font-extrabold text-metallic-gold bg-metallic-gold/5 px-1.5 py-0.5 rounded-sm border border-metallic-gold/20 flex items-center gap-0.5 shadow-inner">
                  <TrendingUp className="w-3 h-3" /> +18% Rank
                </span>
                <svg className="w-16 h-6 text-metallic-gold" viewBox="0 0 50 20" fill="none">
                  <path d="M0,18 Q15,10 30,12 T50,2" stroke="currentColor" strokeWidth="2.5" fill="none" />
                </svg>
              </div>
            </div>

            {/* Metric Card 3 */}
            <div className="bg-graphite-surface rounded-sm p-5 border border-white/10 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[110px] hover:border-metallic-gold/20 transition-all">
              <div>
                <p className="text-[10px] font-extrabold text-muted-silver uppercase tracking-wider">Processing / Queue</p>
                <h3 className="text-2xl font-black text-pure-white font-display mt-1">{inProgressCount}</h3>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                <span className="text-[10px] font-bold text-muted-silver">Active loops</span>
                <svg className="w-16 h-6 text-metallic-gold" viewBox="0 0 50 20" fill="none">
                  <path d="M0,10 H10 L20,2 L30,18 L40,8 H50" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </div>
            </div>

            {/* Metric Card 4 */}
            <div className="bg-graphite-surface rounded-sm p-5 border border-white/10 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[110px] hover:border-metallic-gold/20 transition-all">
              <div>
                <p className="text-[10px] font-extrabold text-muted-silver uppercase tracking-wider">Failed / Issues</p>
                <h3 className="text-2xl font-black text-red-500 font-display mt-1">{failedCount}</h3>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                <span className="text-[10px] font-bold text-muted-silver">Validation issues</span>
                <svg className="w-16 h-6 text-red-500" viewBox="0 0 50 20" fill="none">
                  <path d="M0,8 Q15,7 30,12 T50,14" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </div>
            </div>
          </div>

          {/* Autopilot Live Log Terminal - Prestige Dark style */}
          <div className="bg-graphite-surface rounded-sm p-5 border border-white/10 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[235px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-1.5 text-pure-white">
                <Terminal className="w-4 h-4 text-metallic-gold" />
                <span className="text-xs font-extrabold font-display uppercase tracking-wider">Autopilot Live Logs</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-metallic-gold animate-pulse" />
            </div>
            
            <div className="flex-1 my-3 bg-onyx-black/80 rounded-sm p-3.5 font-mono text-[10px] leading-relaxed overflow-y-auto max-h-[140px] shadow-inner space-y-1.5 border border-white/5">
              {logs.length === 0 && <div className="text-white/30">Waiting for system events...</div>}
              {logs.map((log, idx) => {
                const time = new Date(log.created_at).toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" });
                const color = log.level === 'error' ? 'text-red-400' : log.level === 'success' ? 'text-metallic-gold' : 'text-pure-white/80';
                return (
                  <div key={idx} className={`truncate ${color}`}>
                    <span className="text-white/20">[{time}]</span> {log.message}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[9px] text-muted-silver border-t border-white/10 pt-2 font-bold uppercase tracking-wider">
              <span>Sync Mode: Scheduled (12h)</span>
              <span>Sandbox Active</span>
            </div>
          </div>
        </div>
      )}

      {listings.length === 0 ? (
        /* Empty State */
        <div className="bg-graphite-surface rounded-sm p-12 text-center border border-white/10 shadow-xl space-y-6 max-w-xl mx-auto my-12">
          <div className="w-16 h-16 rounded-sm bg-onyx-black/50 border border-white/10 shadow-inner flex items-center justify-center text-metallic-gold mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-black font-display text-pure-white uppercase">No Listings Found</h3>
            <p className="text-xs text-muted-silver leading-relaxed font-semibold">
              Your inventory is currently empty. Click the &quot;Fetch Active Listings&quot; button above to import your live inventory from eBay, or connect your store in the Overview tab first.
            </p>
            <button
              onClick={handleFetchListings}
              disabled={isFetching}
              className="mt-4 px-8 py-3 rounded-sm bg-metallic-gold hover:bg-primary-fixed-dim text-onyx-black text-sm font-bold uppercase shadow-lg shadow-metallic-gold/10 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isFetching ? "Fetching from eBay..." : "Fetch Active Listings Now"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Search bar */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-silver" />
              <input
                type="text"
                placeholder="Search synced listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-onyx-black border border-white/15 focus:border-metallic-gold focus:ring-1 focus:ring-metallic-gold rounded-sm py-2.5 pl-10 pr-4 text-sm text-pure-white placeholder:text-white/30 outline-none transition-all duration-200 shadow-inner font-medium"
              />
            </div>

            {/* Quick selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 bg-onyx-black/50 border border-white/10 rounded-sm px-3 py-1.5 shadow-sm">
              <span className="text-xs text-muted-silver font-bold">Select Pending:</span>
              {["5", "10", "25", "all"].map((val) => (
                <button
                  key={val}
                  onClick={() => handleSelectCount(val)}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-xs font-bold text-pure-white transition-all cursor-pointer outline-none focus:border-metallic-gold"
                >
                  {val === "all" ? "All" : val}
                </button>
              ))}
            </div>
          </div>

          {/* Main Table Card */}
          <div className="bg-graphite-surface/40 backdrop-blur-sm rounded-sm overflow-hidden border border-white/10 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-onyx-black/60 text-xs font-extrabold text-muted-silver uppercase tracking-wider">
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredListings.length > 0 &&
                          selectedIds.length === filteredListings.length
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-white/20 bg-onyx-black text-metallic-gold focus:ring-metallic-gold w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="p-4 w-16">Image</th>
                    <th className="p-4">Listing Details</th>
                    <th className="p-4 w-28">Price</th>
                    <th className="p-4 w-36">Status</th>
                    <th className="p-4 w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredListings.map((listing) => {
                    const isSelected = selectedIds.includes(listing.id);

                    return (
                      <tr key={listing.id} className={`hover:bg-white/[0.01] transition-colors ${
                        isSelected ? "bg-metallic-gold/[0.03]" : ""
                      }`}>
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={listing.status === "In Progress"}
                            onChange={(e) => handleSelectRow(listing.id, e.target.checked)}
                            className="rounded border-white/20 bg-onyx-black text-metallic-gold focus:ring-metallic-gold w-4 h-4 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="p-4">
                          {listing.image_urls && listing.image_urls.length > 0 ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={listing.image_urls[0]}
                              alt={listing.title}
                              className="w-10 h-10 rounded-sm object-cover border border-white/10 shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-sm bg-onyx-black/50 border border-white/10 flex items-center justify-center text-[10px] text-muted-silver font-bold font-mono">
                              N/A
                            </div>
                          )}
                        </td>
                        <td className="p-4 py-3.5 max-w-md">
                          <div>
                            <p className="font-bold text-pure-white leading-snug line-clamp-2">
                              {listing.title}
                            </p>
                            <p className="text-[10px] text-muted-silver font-bold font-mono mt-1">
                              Item ID: {listing.ebay_item_id}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-pure-white">
                          {listing.currency || "USD"} {listing.price?.toFixed(2) || "0.00"}
                        </td>
                        <td className="p-4">
                          {listing.status === "Optimized" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-metallic-gold bg-metallic-gold/5 border border-metallic-gold/20 px-2.5 py-0.5 rounded-sm">
                              <CheckCircle2 className="w-3 h-3" /> Live on eBay
                            </span>
                          )}
                          {listing.status === "Pending Review" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-950/20 border border-orange-850 px-2.5 py-0.5 rounded-sm animate-pulse">
                              <Eye className="w-3 h-3" /> Review Required
                            </span>
                          )}
                          {listing.status === "In Progress" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-sm">
                              <Clock className="w-3 h-3 animate-spin text-metallic-gold" /> In Queue
                            </span>
                          )}
                          {listing.status === "Pending" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-silver bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-sm">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                          {listing.status === "Failed" && (
                            <span 
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/20 border border-red-800 px-2.5 py-0.5 rounded-sm cursor-pointer"
                              title={listing.error_message || "Unknown error"}
                            >
                              <AlertCircle className="w-3 h-3 animate-pulse" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {(listing.status === "Optimized" || listing.status === "Pending Review") ? (
                            <button
                              onClick={() => {
                                setSliderPosition(50);
                                setActiveDrawerListing(listing);
                              }}
                              className="p-1.5 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 text-muted-silver hover:text-pure-white transition-colors cursor-pointer"
                              title="Compare Original & Optimized"
                            >
                              <Eye className="w-4 h-4 text-metallic-gold" />
                            </button>
                          ) : (
                            <span className="text-xs text-white/20 font-bold">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Before & After Results Section */}
      {(optimizedCount > 0 || pendingReviewCount > 0) && (
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <div className="p-2 bg-metallic-gold/10 border border-metallic-gold/20 rounded-sm shadow-sm">
              <Sparkles className="w-5 h-5 text-metallic-gold" />
            </div>
            <div>
              <h2 className="text-xl font-black font-display text-pure-white tracking-tight uppercase">Optimization Results</h2>
              <p className="text-xs font-semibold text-muted-silver mt-0.5">See exactly how Claude 4.6 improved your listings.</p>
            </div>
          </div>

          <div className="bg-graphite-surface/40 backdrop-blur-sm rounded-sm overflow-hidden border border-white/10 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-onyx-black/60 text-xs font-extrabold text-muted-silver uppercase tracking-wider">
                    <th className="p-4 w-16 text-center">Item</th>
                    <th className="p-4 w-1/3">Original Title (Before)</th>
                    <th className="p-4 w-1/3">Optimized Title (After)</th>
                    <th className="p-4 w-32 text-center">Status</th>
                    <th className="p-4 w-28 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {listings.filter(l => l.status === "Optimized" || l.status === "Pending Review").map((listing) => (
                    <tr key={`result-${listing.id}`} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-4 align-top">
                        <div className="flex flex-col items-center gap-2">
                          {listing.image_urls && listing.image_urls.length > 0 ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={listing.image_urls[0]}
                              alt={listing.title}
                              className="w-12 h-12 rounded-sm object-cover border border-white/10 shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-sm bg-onyx-black/50 border border-white/10 flex items-center justify-center text-[10px] text-muted-silver font-bold font-mono">
                              N/A
                            </div>
                          )}
                          <span className="text-[9px] font-mono font-bold text-white/30 text-center w-16 truncate" title={listing.ebay_item_id}>
                            {listing.ebay_item_id}
                          </span>
                        </div>
                      </td>
                      
                      <td className="p-4 align-top">
                        <div className="h-full bg-white/5 border border-white/10 rounded-sm p-3">
                          <p className="text-[9px] font-extrabold text-red-400 uppercase mb-1.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Original
                          </p>
                          <p className="text-xs text-muted-silver font-medium leading-relaxed">
                            {listing.title}
                          </p>
                        </div>
                      </td>
                      
                      <td className="p-4 align-top">
                        <div className="h-full bg-metallic-gold/5 border border-metallic-gold/20 rounded-sm p-3 shadow-inner">
                          <p className="text-[9px] font-extrabold text-metallic-gold uppercase mb-1.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-metallic-gold"></span>
                            Cassini Optimized
                          </p>
                          <p className="text-xs text-pure-white font-bold leading-relaxed">
                            {listing.optimized_title}
                          </p>
                        </div>
                      </td>
                      
                      <td className="p-4 text-center align-middle">
                        {listing.status === "Optimized" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-metallic-gold bg-metallic-gold/5 border border-metallic-gold/20 px-2.5 py-1 rounded-sm">
                            <CheckCircle2 className="w-3 h-3" /> Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-950/20 border border-orange-850 px-2.5 py-1 rounded-sm animate-pulse">
                            <Eye className="w-3 h-3" /> Review
                          </span>
                        )}
                      </td>
                      
                      <td className="p-4 text-center align-middle">
                        <div className="flex flex-col gap-2 items-center justify-center">
                          <button
                            onClick={() => {
                              setSliderPosition(50);
                              setActiveDrawerListing(listing);
                            }}
                            className="w-full max-w-[100px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 text-pure-white text-[10px] font-bold transition-all shadow-md cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-metallic-gold" />
                            View Desc
                          </button>
                          
                          {listing.status === "Pending Review" && (
                            <button
                              onClick={() => handleManualPublish(listing.id)}
                              disabled={isLoading}
                              className="w-full max-w-[100px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-sm bg-metallic-gold hover:bg-primary-fixed-dim text-onyx-black text-[10px] font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                            >
                              <Zap className="w-3 h-3" />
                              Publish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <FloatingActionBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        onOptimize={() => handleBatchOptimize()}
        isLoading={isLoading}
      />

      {/* Slide-out Drawer Panel with Split before & after comparison slider */}
      <AnimatePresence>
        {activeDrawerListing && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveDrawerListing(null)}
              className="absolute inset-0 bg-onyx-black/80 backdrop-blur-sm"
            />

            {/* Drawer Container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md h-full bg-graphite-surface border-l border-white/10 shadow-2xl p-6 flex flex-col justify-between z-10 text-left text-pure-white"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveDrawerListing(null)}
                className="absolute top-4 right-4 p-1.5 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 text-muted-silver hover:text-pure-white transition-colors cursor-pointer shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex-1 overflow-y-auto space-y-6 pt-6">
                <div>
                  <h3 className="text-lg font-black font-display text-pure-white flex items-center gap-1.5 uppercase tracking-wide">
                    <Sparkles className="w-5 h-5 text-metallic-gold" />
                    <span>Comparison</span>
                  </h3>
                  <p className="text-xs font-semibold text-muted-silver mt-1">Review title keywords and Cassini responsive descriptions.</p>
                </div>

                {/* Listing Overview */}
                <div className="flex gap-3 p-3 bg-onyx-black/50 rounded-sm border border-white/10 shadow-inner">
                  {activeDrawerListing.image_urls && activeDrawerListing.image_urls.length > 0 ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={activeDrawerListing.image_urls[0]}
                      alt="Listing Preview"
                      className="w-12 h-12 rounded-sm object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-sm bg-onyx-black border border-white/10 flex items-center justify-center font-mono text-[9px] text-muted-silver font-bold">
                      N/A
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-black text-pure-white line-clamp-1 font-display">{activeDrawerListing.title}</h4>
                    <p className="text-[10px] text-muted-silver font-bold font-mono mt-0.5">Item ID: {activeDrawerListing.ebay_item_id}</p>
                    <p className="text-[10px] text-metallic-gold font-extrabold mt-0.5">{activeDrawerListing.currency || "USD"} {activeDrawerListing.price?.toFixed(2)}</p>
                  </div>
                </div>

                {/* Title Highlight Diffs */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-pure-white flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-metallic-gold" />
                    <span>Title keyword diffs</span>
                  </h4>
                  
                  <div className="space-y-3 p-4 rounded-sm border border-white/10 bg-onyx-black/40">
                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted-silver mb-1">Original Title</p>
                      <p className="text-xs text-muted-silver font-mono bg-white/5 p-2.5 rounded-sm border border-white/5">
                        {activeDrawerListing.title}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-metallic-gold mb-1">Cassini Optimized Title</p>
                      <p className="text-xs text-pure-white font-mono bg-metallic-gold/5 p-2.5 rounded-sm border border-metallic-gold/20 font-bold shadow-inner leading-snug">
                        {activeDrawerListing.optimized_title || "Optimized title missing"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive Split slider comparison */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-pure-white">Visual description slider comparison</h4>
                  
                  <div className="relative h-64 border border-white/10 rounded-sm overflow-hidden bg-onyx-black/50 select-none shadow-sm">
                    {/* Before description (left side / full bg) */}
                    <div className="absolute inset-0 bg-red-950/5 p-4 font-mono text-[10px] text-muted-silver overflow-y-auto leading-relaxed select-text">
                      <div className="font-extrabold text-red-400 mb-2">ORIGINAL HTML CODE:</div>
                      <div dangerouslySetInnerHTML={{ __html: activeDrawerListing.description || "" }} />
                    </div>

                    {/* After description (right side / clipped) */}
                    <div 
                      className="absolute inset-0 bg-metallic-gold/5 border-l border-metallic-gold p-4 font-mono text-[10px] text-pure-white overflow-y-auto leading-relaxed select-text"
                      style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                    >
                      <div className="font-extrabold text-metallic-gold mb-2">CASSINI-OPTIMIZED HTML:</div>
                      <div dangerouslySetInnerHTML={{ __html: activeDrawerListing.optimized_description || "" }} />
                    </div>

                    {/* Slider Drag Handler Control */}
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(parseInt(e.target.value))}
                      className="absolute inset-x-0 bottom-4 mx-auto w-3/4 h-2 bg-white/10 rounded-full cursor-pointer appearance-none select-none z-25 focus:ring-1 focus:ring-metallic-gold"
                      style={{ transform: "translateY(0)" }}
                    />
                    <div 
                      className="absolute top-0 bottom-0 w-[1px] bg-metallic-gold pointer-events-none z-20"
                      style={{ left: `${sliderPosition}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-silver font-bold px-1">
                    <span>Original Description</span>
                    <span>Drag range slider above</span>
                    <span>AI-Optimized View</span>
                  </div>
                </div>
              </div>

              {/* Close Footer Action */}
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                {activeDrawerListing.status === "Pending Review" && (
                  <button
                    onClick={() => handleManualPublish(activeDrawerListing.id)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-metallic-gold hover:bg-primary-fixed-dim text-onyx-black rounded-none text-xs font-bold cursor-pointer shadow-md transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Clock className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Approve & Publish to eBay
                  </button>
                )}
                <button
                  onClick={() => setActiveDrawerListing(null)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-pure-white rounded-none text-xs font-bold cursor-pointer transition-all"
                >
                  {activeDrawerListing.status === "Pending Review" ? "Close & Decide Later" : "Close"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
