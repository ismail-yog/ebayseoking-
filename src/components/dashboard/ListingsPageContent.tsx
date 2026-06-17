"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, CheckCircle2, AlertCircle, Clock, 
  Eye, EyeOff, Search, Store
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
  const [expandedListingId, setExpandedListingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState<ProfileStats>(profile);

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

  const toggleExpand = (id: string) => {
    setExpandedListingId((prev) => (prev === id ? null : id));
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
    <div className="space-y-6 max-w-6xl relative pb-24">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-white">Active Product Listings</h2>
          <p className="text-sm text-gray-400">Select active listings to optimize using Claude 3.5 Sonnet.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-semibold">Credits:</span>
          <span className="text-xs text-white font-bold bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">
            {credits.optimizations_used} / {credits.optimization_limit} used
          </span>
        </div>
      </div>

      {listings.length > 0 && (
        /* Stats Overview Grid */
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-4 border border-white/5 relative overflow-hidden">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Pending Optimization</p>
            <h3 className="text-xl font-bold text-white mt-1">{pendingCount}</h3>
          </div>
          <div className="glass rounded-xl p-4 border border-white/5 relative overflow-hidden">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">In Progress / Queue</p>
            <h3 className="text-xl font-bold text-primary mt-1">{inProgressCount}</h3>
          </div>
          <div className="glass rounded-xl p-4 border border-white/5 relative overflow-hidden">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Optimized & Synced</p>
            <h3 className="text-xl font-bold text-green-400 mt-1">{optimizedCount}</h3>
          </div>
          <div className="glass rounded-xl p-4 border border-white/5 relative overflow-hidden">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Failed / Issues</p>
            <h3 className="text-xl font-bold text-red-400 mt-1">{failedCount}</h3>
          </div>
        </div>
      )}

      {listings.length === 0 ? (
        /* Empty State */
        <div className="glass rounded-xl p-12 text-center border border-white/5 space-y-6 max-w-xl mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold font-heading text-white">No Listings Found</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
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
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search synced listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder:text-gray-600 focus:outline-none transition-all duration-200"
              />
            </div>

            {/* Quick selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              <span className="text-xs text-gray-400 font-semibold">Select Pending:</span>
              <button
                onClick={() => handleSelectCount("5")}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-semibold text-white transition-all cursor-pointer"
              >
                5
              </button>
              <button
                onClick={() => handleSelectCount("10")}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-semibold text-white transition-all cursor-pointer"
              >
                10
              </button>
              <button
                onClick={() => handleSelectCount("25")}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-semibold text-white transition-all cursor-pointer"
              >
                25
              </button>
              <button
                onClick={() => handleSelectCount("all")}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-semibold text-white transition-all cursor-pointer"
              >
                All
              </button>
            </div>
          </div>

          {/* Table Card */}
          <div className="glass rounded-xl overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01] text-xs font-semibold text-gray-400">
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredListings.length > 0 &&
                          selectedIds.length === filteredListings.length
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-white/10 bg-white/5 text-primary focus:ring-primary/30 w-4 h-4 cursor-pointer"
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
                    const isExpanded = expandedListingId === listing.id;

                    return (
                      <React.Fragment key={listing.id}>
                        {/* Table Row */}
                        <tr className={`hover:bg-white/[0.02] transition-colors ${
                          isSelected ? "bg-primary/5" : ""
                        }`}>
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={listing.status === "In Progress"}
                              onChange={(e) => handleSelectRow(listing.id, e.target.checked)}
                              className="rounded border-white/10 bg-white/5 text-primary focus:ring-primary/30 w-4 h-4 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="p-4">
                            {listing.image_urls && listing.image_urls.length > 0 ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={listing.image_urls[0]}
                                alt={listing.title}
                                className="w-10 h-10 rounded-lg object-cover border border-white/10"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-xs text-gray-500 font-semibold font-mono">
                                N/A
                              </div>
                            )}
                          </td>
                          <td className="p-4 py-3.5 max-w-md">
                            <div>
                              <p className="font-semibold text-white leading-snug line-clamp-2">
                                {listing.title}
                              </p>
                              <p className="text-[10px] text-gray-500 font-mono mt-1">
                                Item ID: {listing.ebay_item_id}
                              </p>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-white">
                            {listing.currency || "USD"} {listing.price?.toFixed(2) || "0.00"}
                          </td>
                          <td className="p-4">
                            {listing.status === "Optimized" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Optimized
                              </span>
                            )}
                            {listing.status === "In Progress" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3 animate-spin" /> In Queue
                              </span>
                            )}
                            {listing.status === "Pending" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                            {listing.status === "Failed" && (
                              <span 
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full cursor-pointer"
                                title={listing.error_message || "Unknown error"}
                              >
                                <AlertCircle className="w-3 h-3" /> Failed
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {listing.status === "Optimized" ? (
                              <button
                                onClick={() => toggleExpand(listing.id)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer border-0"
                                title="Show Before & After comparison"
                              >
                                {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-green-400" />}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-600">-</span>
                            )}
                          </td>
                        </tr>

                        {/* Before & After Accordion Drawer */}
                        {isExpanded && listing.status === "Optimized" && (
                          <tr>
                            <td colSpan={6} className="bg-white/[0.01] p-6 border-b border-white/5">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="grid md:grid-cols-2 gap-6"
                              >
                                {/* Original Card */}
                                <div className="p-4 rounded-xl border border-red-500/10 bg-red-500/[0.02] space-y-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold tracking-wider uppercase bg-red-500/15 border border-red-500/35 text-red-400 px-2 py-0.5 rounded-md">
                                      Original Listing
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-semibold text-gray-400">Product Title</p>
                                    <p className="text-xs text-gray-300 font-mono bg-black/20 p-2 rounded-lg mt-1 border border-white/5">
                                      {listing.title}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-semibold text-gray-400">Product Description</p>
                                    <div 
                                      className="text-xs text-gray-400 bg-black/20 p-2.5 rounded-lg mt-1 border border-white/5 font-mono max-h-36 overflow-y-auto"
                                      dangerouslySetInnerHTML={{ __html: listing.description || "No description provided." }}
                                    />
                                  </div>
                                </div>

                                {/* Optimized Card */}
                                <div className="p-4 rounded-xl border border-green-500/15 bg-green-500/[0.02] space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold tracking-wider uppercase bg-green-500/15 border border-green-500/35 text-green-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" /> Claude 3.5 AI-Optimized
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-semibold text-gray-400">Optimized Title (Keywords Highlighted)</p>
                                    <p className="text-xs text-white font-mono bg-black/20 p-2 rounded-lg mt-1 border border-green-500/20 glow-indigo">
                                      {listing.optimized_title || "Optimization payload missing"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-semibold text-gray-400">Cassini-Enhanced HTML Description</p>
                                    <div 
                                      className="text-xs text-gray-300 bg-black/20 p-2.5 rounded-lg mt-1 border border-green-500/20 font-mono max-h-36 overflow-y-auto"
                                      dangerouslySetInnerHTML={{ __html: listing.optimized_description || "No description provided." }}
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
    </div>
  );
}
