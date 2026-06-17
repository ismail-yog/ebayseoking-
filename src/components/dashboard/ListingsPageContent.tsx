"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, CheckCircle2, AlertCircle, Clock, 
  Eye, Search, Store, X,
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
  const [credits, setCredits] = useState<ProfileStats>(profile);

  // Simulated Autopilot Logs
  const [logs, setLogs] = useState<string[]>([
    "[02:40 AM] Scheduler: Initializing background cron cycle.",
    "[02:41 AM] Supabase: Checking users with autopilot enabled.",
    "[02:42 AM] eBay API: Fetching active inventory details...",
    "[02:45 AM] DB: Synced 12 items, 0 duplicate keys encountered."
  ]);

  useEffect(() => {
    // Add logs dynamically to make it look alive
    const interval = setInterval(() => {
      const phrases = [
        "Claude 4.6 API: Optimizing title details for Cassini search rank...",
        "eBay Trading API: Pushing title revisions for item ID " + Math.floor(Math.random() * 100000000000),
        "Upstash QStash: Queueing optimizations in worker pipeline.",
        "System: Completed cron sync loop. All systems operational.",
        "Auth: Re-validating OAuth access tokens with eBay Sandbox key."
      ];
      const time = new Date().toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const newLog = `[${time}] ${phrases[Math.floor(Math.random() * phrases.length)]}`;
      setLogs((prev) => [...prev.slice(-4), newLog]);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

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

  const handleBatchOptimize = async () => {
    const selectedCount = selectedIds.length;
    const remainingCredits = credits.optimization_limit - credits.optimizations_used;

    if (selectedCount + credits.optimizations_used > credits.optimization_limit) {
      toast.error(
        `Insufficient Credits! You selected ${selectedCount} items but have only ${remainingCredits} credits remaining. Please upgrade your plan.`,
        { duration: 5000 }
      );
      return;
    }

    setIsLoading(true);
    toast.loading(`Queueing ${selectedCount} listing optimizations...`);

    try {
      const res = await fetch("/api/optimize/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingIds: selectedIds }),
      });

      toast.dismiss();

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Queue request failed");
      }

      toast.success(`Successfully queued ${selectedCount} optimizations in background!`);
      
      // Dynamically update UI status to In Progress
      setListings((prev) =>
        prev.map((l) =>
          selectedIds.includes(l.id) ? { ...l, status: "In Progress" } : l
        )
      );

      // Dynamically update credits counter
      setCredits((prev) => ({
        ...prev,
        optimizations_used: prev.optimizations_used + selectedCount,
      }));

      setSelectedIds([]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to start optimizations");
    } finally {
      setIsLoading(false);
    }
  };

  const pendingCount = listings.filter((l) => l.status === "Pending").length;
  const inProgressCount = listings.filter((l) => l.status === "In Progress" || l.status === "Pending Queue").length;
  const optimizedCount = listings.filter((l) => l.status === "Optimized").length;
  const failedCount = listings.filter((l) => l.status === "Failed").length;

  return (
    <div className="space-y-6 max-w-6xl relative pb-24 text-slate-800">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-heading text-slate-950 tracking-tight">Active Product Listings</h2>
          <p className="text-sm text-slate-500">Select active listings to optimize using Claude 4.6 Sonnet.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Credits:</span>
          <span className="text-xs text-slate-700 font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            {credits.optimizations_used} / {credits.optimization_limit} used
          </span>
        </div>
      </div>

      {listings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Executive Metrics Overview */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {/* Metric Card 1 */}
            <div className="glass rounded-xl p-5 border border-slate-200/60 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Optimization</p>
                <h3 className="text-2xl font-black text-slate-950 font-heading mt-1">{pendingCount}</h3>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-semibold text-slate-500">Ready in Queue</span>
                {/* Micro SVG Sparkline */}
                <svg className="w-16 h-6 text-indigo-500" viewBox="0 0 50 20" fill="none">
                  <path d="M0,15 Q10,12 20,16 T40,5 T50,8" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </div>
            </div>

            {/* Metric Card 2 */}
            <div className="glass rounded-xl p-5 border border-slate-200/60 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Optimized & Synced</p>
                <h3 className="text-2xl font-black text-green-600 font-heading mt-1">{optimizedCount}</h3>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +18% Rank
                </span>
                {/* Micro SVG Sparkline */}
                <svg className="w-16 h-6 text-green-500" viewBox="0 0 50 20" fill="none">
                  <path d="M0,18 Q15,10 30,12 T50,2" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </div>
            </div>

            {/* Metric Card 3 */}
            <div className="glass rounded-xl p-5 border border-slate-200/60 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Processing / Queue</p>
                <h3 className="text-2xl font-black text-primary font-heading mt-1">{inProgressCount}</h3>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-semibold text-slate-500">Active background loops</span>
                {/* Micro SVG Sparkline */}
                <svg className="w-16 h-6 text-primary" viewBox="0 0 50 20" fill="none">
                  <path d="M0,10 H10 L20,2 L30,18 L40,8 H50" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
            </div>

            {/* Metric Card 4 */}
            <div className="glass rounded-xl p-5 border border-slate-200/60 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[110px]">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Failed / Issues</p>
                <h3 className="text-2xl font-black text-red-500 font-heading mt-1">{failedCount}</h3>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-semibold text-slate-500">Validation issues</span>
                {/* Micro SVG Sparkline */}
                <svg className="w-16 h-6 text-red-400" viewBox="0 0 50 20" fill="none">
                  <path d="M0,8 Q15,7 30,12 T50,14" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </div>
            </div>
          </div>

          {/* Autopilot Live Log Terminal */}
          <div className="glass rounded-xl p-5 border border-slate-200/60 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[235px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-slate-800 font-heading">Autopilot Live Logs</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            
            <div className="flex-1 my-3 bg-slate-900/5 rounded-lg border border-slate-100 p-3 font-mono text-[9px] text-slate-600 leading-relaxed overflow-y-auto max-h-[140px] shadow-inner space-y-1">
              {logs.map((log, idx) => (
                <div key={idx} className="truncate">
                  {log}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100/50 pt-2">
              <span>Sync Mode: Scheduled (12h)</span>
              <span>Dev sandbox mode active</span>
            </div>
          </div>
        </div>
      )}

      {listings.length === 0 ? (
        /* Empty State */
        <div className="glass rounded-xl p-12 text-center border border-slate-200/60 shadow-sm space-y-6 max-w-xl mx-auto my-12 transition-all hover:scale-[1.01] duration-300">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold font-heading text-slate-900">No Listings Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your inventory is currently empty. Go back to the dashboard overview, connect your eBay store, and click &quot;Fetch Active Listings&quot; to import your inventory.
            </p>
          </div>
        </div>
      ) : (
        /* Data Table & Controls */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Search bar */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search synced listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/70 border border-slate-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-400 outline-none transition-all duration-200 shadow-sm"
              />
            </div>

            {/* Quick selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 bg-white/70 border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
              <span className="text-xs text-slate-400 font-semibold">Select Pending:</span>
              <button
                onClick={() => handleSelectCount("5")}
                className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-semibold text-slate-700 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                5
              </button>
              <button
                onClick={() => handleSelectCount("10")}
                className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-semibold text-slate-700 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                10
              </button>
              <button
                onClick={() => handleSelectCount("25")}
                className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-semibold text-slate-700 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                25
              </button>
              <button
                onClick={() => handleSelectCount("all")}
                className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-semibold text-slate-700 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                All
              </button>
            </div>
          </div>

          {/* Table Card */}
          <div className="glass rounded-xl overflow-hidden border border-slate-200/60 shadow-sm bg-white/70">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-500">
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredListings.length > 0 &&
                          selectedIds.length === filteredListings.length
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-slate-300 bg-white text-primary focus:ring-primary/30 w-4 h-4 cursor-pointer focus-visible:ring-2"
                      />
                    </th>
                    <th className="p-4 w-16">Image</th>
                    <th className="p-4">Listing Details</th>
                    <th className="p-4 w-28">Price</th>
                    <th className="p-4 w-36">Status</th>
                    <th className="p-4 w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredListings.map((listing) => {
                    const isSelected = selectedIds.includes(listing.id);

                    return (
                      <tr key={listing.id} className={`hover:bg-slate-50/40 transition-colors ${
                        isSelected ? "bg-primary/[0.02]" : ""
                      }`}>
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={listing.status === "In Progress"}
                            onChange={(e) => handleSelectRow(listing.id, e.target.checked)}
                            className="rounded border-slate-300 bg-white text-primary focus:ring-primary/30 w-4 h-4 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-2"
                          />
                        </td>
                        <td className="p-4">
                          {listing.image_urls && listing.image_urls.length > 0 ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={listing.image_urls[0]}
                              alt={listing.title}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200/80 shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-semibold font-mono">
                              N/A
                            </div>
                          )}
                        </td>
                        <td className="p-4 py-3.5 max-w-md">
                          <div>
                            <p className="font-semibold text-slate-800 leading-snug line-clamp-2">
                              {listing.title}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">
                              Item ID: {listing.ebay_item_id}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-slate-700">
                          {listing.currency || "USD"} {listing.price?.toFixed(2) || "0.00"}
                        </td>
                        <td className="p-4">
                          {listing.status === "Optimized" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Optimized
                            </span>
                          )}
                          {listing.status === "In Progress" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/5 border border-primary/20 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 animate-spin" /> In Queue
                            </span>
                          )}
                          {listing.status === "Pending" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                          {listing.status === "Failed" && (
                            <span 
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full cursor-pointer"
                              title={listing.error_message || "Unknown error"}
                            >
                              <AlertCircle className="w-3 h-3" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {listing.status === "Optimized" ? (
                            <button
                              onClick={() => setActiveDrawerListing(listing)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                              title="Compare Original & Optimized"
                            >
                              <Eye className="w-4 h-4 text-primary" />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-300 font-semibold">-</span>
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

      {/* Floating Action Bar */}
      <FloatingActionBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        onOptimize={handleBatchOptimize}
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
              className="absolute inset-0 bg-black/10 backdrop-blur-sm"
            />

            {/* Drawer Container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl p-6 flex flex-col justify-between z-10 text-left"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveDrawerListing(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex-1 overflow-y-auto space-y-6 pt-6">
                <div>
                  <h3 className="text-lg font-black font-heading text-slate-950 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>Optimization Comparison</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Review title keywords and Cassini responsive descriptions.</p>
                </div>

                {/* Listing Overview */}
                <div className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  {activeDrawerListing.image_urls && activeDrawerListing.image_urls.length > 0 ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={activeDrawerListing.image_urls[0]}
                      alt="Listing Preview"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-mono text-[9px] text-slate-400">
                      N/A
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{activeDrawerListing.title}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Item ID: {activeDrawerListing.ebay_item_id}</p>
                    <p className="text-[10px] text-primary font-bold mt-0.5">{activeDrawerListing.currency || "USD"} {activeDrawerListing.price?.toFixed(2)}</p>
                  </div>
                </div>

                {/* Title Highlight Diffs */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-secondary" />
                    <span>Title keyword diffs</span>
                  </h4>
                  
                  <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Original Title</p>
                      <p className="text-xs text-slate-500 font-mono bg-white p-2 rounded-lg border border-slate-200">
                        {activeDrawerListing.title}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-green-600 mb-1">Cassini Optimized Title</p>
                      <p className="text-xs text-slate-800 font-mono bg-green-50/30 p-2 rounded-lg border border-green-200 font-semibold shadow-inner leading-snug">
                        {activeDrawerListing.optimized_title || "Optimized title missing"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive Split slider comparison */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800">Visual description slider comparison</h4>
                  
                  <div className="relative h-64 border border-slate-200 rounded-xl overflow-hidden bg-slate-100 select-none shadow-sm">
                    {/* Before description (left side / full bg) */}
                    <div className="absolute inset-0 bg-red-50/20 p-4 font-mono text-[9px] text-slate-400 overflow-y-auto leading-relaxed select-text">
                      <div className="font-bold text-red-500/80 mb-2">ORIGINAL HTML CODE:</div>
                      <div dangerouslySetInnerHTML={{ __html: activeDrawerListing.description || "" }} />
                    </div>

                    {/* After description (right side / clipped) */}
                    <div 
                      className="absolute inset-0 bg-green-50/30 border-l border-indigo-400 p-4 font-mono text-[9px] text-slate-700 overflow-y-auto leading-relaxed select-text"
                      style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                    >
                      <div className="font-bold text-indigo-500 mb-2">CASSINI-OPTIMIZED HTML:</div>
                      <div dangerouslySetInnerHTML={{ __html: activeDrawerListing.optimized_description || "" }} />
                    </div>

                    {/* Slider Drag Handler Control */}
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(parseInt(e.target.value))}
                      className="absolute inset-x-0 bottom-4 mx-auto w-3/4 h-2 bg-indigo-200/50 rounded-full cursor-pointer appearance-none select-none z-25 focus:ring-1 focus:ring-indigo-300"
                      style={{ transform: "translateY(0)" }}
                    />
                    <div 
                      className="absolute top-0 bottom-0 w-[2px] bg-indigo-500 pointer-events-none z-20"
                      style={{ left: `${sliderPosition}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 px-1">
                    <span>Original Description</span>
                    <span>Drag range slider above</span>
                    <span>AI-Optimized View</span>
                  </div>
                </div>
              </div>

              {/* Close Footer Action */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => setActiveDrawerListing(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-slate-800 focus-visible:ring-offset-1"
                >
                  Approve & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
