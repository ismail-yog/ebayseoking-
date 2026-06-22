import React from "react";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 max-w-6xl animate-pulse">
      {/* Header Placeholder */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-slate-200 rounded-lg" />
        <div className="h-4 w-72 bg-slate-100/80 rounded-lg" />
      </div>

      {/* Connection Card / Status Placeholder */}
      <div className="h-32 bg-white rounded-xl border-2 border-slate-200/60 shadow-sm flex items-center justify-between p-6">
        <div className="flex items-center gap-4 w-1/2">
          <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
        <div className="h-10 w-28 bg-slate-200 rounded-lg" />
      </div>

      {/* Stats Cards Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm space-y-4">
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-3 bg-slate-150 rounded w-1/3" />
        </div>
        <div className="h-32 bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm space-y-4">
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-3 bg-slate-150 rounded w-1/3" />
        </div>
        <div className="h-32 bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm space-y-4">
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-8 bg-slate-200 rounded w-1/4" />
          <div className="h-3 bg-slate-150 rounded w-1/3" />
        </div>
      </div>

      {/* Big Card Placeholder */}
      <div className="h-64 bg-white rounded-xl p-6 border border-slate-200/60 shadow-sm space-y-4">
        <div className="h-5 bg-slate-200 rounded w-1/4" />
        <div className="space-y-3 pt-2">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
          <div className="h-4 bg-slate-100 rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}
