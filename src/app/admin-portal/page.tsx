import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClientServer } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PromoGenerator } from "@/components/admin/PromoGenerator";
import { DeleteCodeButton } from "@/components/admin/DeleteCodeButton";
import { 
  ShieldAlert, Users, TrendingUp, ShoppingBag, 
  Calendar, Award, CreditCard, ChevronLeft 
} from "lucide-react";

const ADMIN_EMAILS = ["connect@syncsell.org", "immicpb@gmail.com"];

export default async function AdminPortalPage() {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();

  // Obscurity: return 404 Not Found if unauthorized
  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    notFound();
  }

  const adminClient = createAdminClient();

  // Fetch users, promo codes, and store credentials in parallel
  const [usersRes, promoCodesRes, storesRes] = await Promise.all([
    adminClient.from("users").select("*").order("created_at", { ascending: false }),
    adminClient.from("promo_codes").select("*").order("created_at", { ascending: false }),
    adminClient.from("store_credentials").select("user_id, ebay_store_name")
  ]);

  const users = usersRes.data || [];
  const promoCodes = promoCodesRes.data || [];
  const stores = storesRes.data || [];

  const totalUsers = users.length;
  const totalOptimizations = users.reduce((sum, u) => sum + (u.optimizations_used || 0), 0);
  const totalStores = stores.length;

  const userEmailMap = new Map(users.map(u => [u.id, u.email]));
  const connectedStoresMap = new Map(stores.map(s => [s.user_id, s.ebay_store_name]));

  return (
    <div className="relative min-h-screen bg-bg-primary font-sans p-6 lg:p-10 text-slate-800">
      {/* Ambient background decoration */}
      <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] bg-primary/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] bg-secondary/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors mb-2"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Merchant Dashboard</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent-magenta flex items-center justify-center shadow-md shadow-primary/20">
                <ShieldAlert className="w-4.5 h-4.5 text-white" />
              </div>
              <h1 className="text-2xl font-black font-heading text-slate-950 tracking-tight">
                System Admin Portal
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Manage licensing, view registered merchants, and monitor system metrics.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center bg-white px-4 py-2 rounded-xl border-2 border-slate-200 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700">Admin Mode Active</span>
          </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Stat 1: Total Users */}
          <div className="glass bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4 text-primary bg-primary/5 p-2 rounded-lg border border-primary/10">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-400">Total Registered Users</p>
            <h3 className="text-3xl font-black text-slate-900 font-heading mt-2">{totalUsers}</h3>
            <p className="text-[10px] text-slate-400 mt-2">Active accounts in database</p>
          </div>

          {/* Stat 2: Total Optimizations */}
          <div className="glass bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4 text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-400">Total Optimizations Executed</p>
            <h3 className="text-3xl font-black text-slate-900 font-heading mt-2">{totalOptimizations}</h3>
            <p className="text-[10px] text-green-600 font-bold mt-2">Across all stores</p>
          </div>

          {/* Stat 3: Connected Stores */}
          <div className="glass bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4 text-secondary bg-secondary/5 p-2 rounded-lg border border-secondary/10">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-400">Connected eBay Stores</p>
            <h3 className="text-3xl font-black text-slate-900 font-heading mt-2">{totalStores}</h3>
            <p className="text-[10px] text-slate-400 mt-2">With active API credentials</p>
          </div>
        </div>

        {/* Action Panel & Code List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Promo Generator (Left) */}
          <div className="lg:col-span-1 space-y-6">
            <PromoGenerator />
          </div>

          {/* Promo Codes History (Right) */}
          <div className="lg:col-span-2 glass bg-white rounded-xl p-6 border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-base font-bold font-heading text-slate-950 flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-secondary" />
              <span>Promo Codes & Activation Keys</span>
            </h3>
            
            <div className="overflow-x-auto max-h-[350px] overflow-y-auto border border-slate-150 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-3">Key Code</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Redeemed By</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-semibold text-slate-700 divide-y divide-slate-100">
                  {promoCodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                        No activation keys generated yet. Use the tool on the left to create one.
                      </td>
                    </tr>
                  ) : (
                    promoCodes.map((code) => {
                      const redeemerEmail = code.used_by ? userEmailMap.get(code.used_by) : null;
                      return (
                        <tr key={code.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-slate-950 select-all">{code.code}</td>
                          <td className="p-3 capitalize text-primary font-bold">{code.plan_type}</td>
                          <td className="p-3 text-slate-400">{code.duration_months}m</td>
                          <td className="p-3">
                            {code.is_used ? (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-250 text-[10px] text-slate-500 font-extrabold uppercase">
                                Used
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-[10px] text-green-700 font-extrabold uppercase">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-medium truncate max-w-[150px]" title={redeemerEmail || ""}>
                            {code.is_used ? (
                              <div className="space-y-0.5">
                                <p className="text-slate-900 font-bold">{redeemerEmail || "System Override"}</p>
                                <p className="text-[9px] text-slate-400">
                                  {new Date(code.used_at).toLocaleDateString()}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-350">—</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {!code.is_used && <DeleteCodeButton id={code.id} />}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Registered Users Details */}
        <div className="glass bg-white rounded-xl p-6 border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="text-base font-bold font-heading text-slate-950 flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-primary" />
            <span>Registered Users / Merchants</span>
          </h3>

          <div className="overflow-x-auto border border-slate-150 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Plan Tier</th>
                  <th className="p-3.5">Optimization Usage</th>
                  <th className="p-3.5">eBay Connection</th>
                  <th className="p-3.5">Joined Date</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-slate-700 divide-y divide-slate-100">
                {users.map((u) => {
                  const storeName = connectedStoresMap.get(u.id);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="p-3.5 text-slate-950 font-bold">{u.full_name || "SyncSell Merchant"}</td>
                      <td className="p-3.5 font-mono">{u.email}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-bold capitalize">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          <span>{u.plan_type}</span>
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1 max-w-[120px]">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400">
                            <span>{u.optimizations_used} used</span>
                            <span>{u.optimization_limit} max</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-150">
                            <div 
                              className="h-full bg-primary" 
                              style={{ 
                                width: `${Math.min(((u.optimizations_used || 0) / (u.optimization_limit || 1)) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {storeName ? (
                          <span className="px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-[10px] text-green-700 font-extrabold uppercase">
                            Active: {storeName}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] text-slate-400 font-bold uppercase">
                            Not Connected
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(u.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
