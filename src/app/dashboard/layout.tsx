import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClientServer } from "@/lib/supabase/server";
import { 
  LayoutDashboard, ShoppingBag, CreditCard, Settings, LogOut, 
  ShieldCheck, Zap, CheckCircle2
} from "lucide-react";
import { CreditCounter } from "@/components/dashboard/CreditCounter";

// Log out action for Server Action inside dashboard shell
async function logout() {
  "use server";
  const supabase = await createClientServer();
  await supabase.auth.signOut();
  redirect("/");
}

// Disconnect eBay store action inside dashboard shell
async function disconnectEbay() {
  "use server";
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("store_credentials").delete().eq("user_id", user.id);
  }
  redirect("/dashboard");
}


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClientServer();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch profile and store credentials status in parallel to eliminate waterfall latency
  const [profileRes, credentialsRes] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, email, plan_type, optimization_limit, optimizations_used, plan_expires_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("store_credentials")
      .select("ebay_store_name")
      .eq("user_id", user.id)
      .maybeSingle()
  ]);

  const profile = profileRes.data;
  const credentials = credentialsRes.data;

  const activeProfile = profile ? { ...profile } : {
    full_name: user.user_metadata?.full_name || "SyncSell Merchant",
    email: user.email || "",
    plan_type: "free",
    optimization_limit: 50,
    optimizations_used: 0,
    plan_expires_at: null,
  };

  const isConnected = !!credentials;

  // Perform dynamic auto-expiry verification check
  if (profile && profile.plan_type !== "free" && profile.plan_expires_at) {
    const expiry = new Date(profile.plan_expires_at);
    if (expiry < new Date()) {
      console.log(`Plan expired for user ${user.id}. Executing auto-downgrade to Free.`);
      
      await supabase
        .from("users")
        .update({
          plan_type: "free",
          optimization_limit: 50,
          plan_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      activeProfile.plan_type = "free";
      activeProfile.optimization_limit = 50;
      activeProfile.plan_expires_at = null;
    }
  }

  return (
    <div className="relative min-h-screen bg-bg-primary font-sans">
      {/* Subtle decorative ambient blobs */}
      <div className="absolute top-[10%] left-[5%] w-[30%] h-[30%] bg-primary/[0.04] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-[30%] h-[30%] bg-secondary/[0.04] rounded-full blur-[100px] pointer-events-none" />

      {/* Light-Mode Sidebar — Fixed to viewport */}
      <aside className="hidden lg:flex w-[260px] border-r-2 border-slate-200 bg-white flex-col z-20 shadow-sm fixed top-0 left-0 bottom-0 overflow-y-auto">
        {/* Sidebar Header */}
        <div className="h-[72px] flex items-center px-6 border-b border-slate-200">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-black text-xl font-heading text-slate-950 tracking-tight">
              SyncSell
            </span>
          </Link>
        </div>

        {/* Profile Section & Credits */}
        <div className="p-4.5 border-b border-slate-200 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent-magenta flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-md shadow-primary/15">
              {activeProfile.full_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-900">
                {activeProfile.full_name}
              </p>
              <p className="text-[11px] text-slate-500 truncate font-medium">
                {activeProfile.email}
              </p>
            </div>
          </div>
          <CreditCounter 
            used={activeProfile.optimizations_used} 
            limit={activeProfile.optimization_limit} 
            plan={activeProfile.plan_type} 
          />
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-5 px-3 space-y-1">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:text-primary hover:bg-primary/[0.06] transition-all duration-200 group"
          >
            <LayoutDashboard className="w-[18px] h-[18px] text-slate-400 group-hover:text-primary transition-colors" />
            <span>Overview</span>
          </Link>
          <Link 
            href="/dashboard/listings" 
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:text-secondary hover:bg-secondary/[0.06] transition-all duration-200 group"
          >
            <ShoppingBag className="w-[18px] h-[18px] text-slate-400 group-hover:text-secondary transition-colors" />
            <span>Listings</span>
          </Link>
          <Link 
            href="/dashboard?tab=billing" 
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:text-accent-cyan hover:bg-accent-cyan/[0.06] transition-all duration-200 group"
          >
            <CreditCard className="w-[18px] h-[18px] text-slate-400 group-hover:text-accent-cyan transition-colors" />
            <span>Billing</span>
          </Link>
          <Link 
            href="/dashboard?tab=settings" 
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 group"
          >
            <Settings className="w-[18px] h-[18px] text-slate-400 group-hover:text-slate-600 transition-colors" />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Sidebar Footer (Connect eBay & Sign Out) */}
        <div className="p-4 border-t border-slate-200 space-y-3 mt-auto">
          {!isConnected ? (
            <a 
              href="/api/ebay/auth"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all text-center cursor-pointer hover:-translate-y-0.5"
            >
              <Zap className="w-3.5 h-3.5 fill-white/10" />
              <span>Connect eBay Store</span>
            </a>
          ) : (
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-green-50 border-2 border-green-200 text-xs font-bold text-green-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="truncate">Connected: {credentials?.ebay_store_name || "eBay"}</span>
              </div>
              <form action={disconnectEbay} className="w-full">
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-red-50 hover:bg-red-100 border-2 border-red-200 text-[11px] font-bold text-red-600 transition-all cursor-pointer"
                >
                  Disconnect eBay
                </button>
              </form>
            </div>
          )}

          <form action={logout} className="w-full">
            <button 
              type="submit" 
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-50 hover:bg-red-50 border-2 border-slate-200 hover:border-red-200 text-xs font-bold text-slate-600 hover:text-red-600 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area — offset by sidebar width */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[260px]">
        {/* Top Header Bar */}
        <header className="h-[72px] border-b-2 border-slate-200 bg-white px-6 lg:px-8 flex items-center justify-between z-10 shadow-sm">
          <div>
            <h1 className="text-lg font-black font-heading text-slate-950 tracking-tight">Dashboard Workspace</h1>
            <p className="text-[11px] text-slate-500 font-medium">Scale your eBay SEO autopilot</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-xs shadow-inner">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              <span className="text-slate-700 font-bold capitalize">{activeProfile.plan_type} Tier</span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
