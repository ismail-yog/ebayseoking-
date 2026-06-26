import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClientServer } from "@/lib/supabase/server";
import { 
  LayoutDashboard, ShoppingBag, CreditCard, Settings, LogOut, 
  ShieldCheck, Zap, CheckCircle2
} from "lucide-react";
import { CreditCounter } from "@/components/dashboard/CreditCounter";
import { ShaderBackground } from "@/components/landing/ShaderBackground";

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
    <div className="relative min-h-screen bg-onyx-black text-pure-white font-sans selection:bg-metallic-gold selection:text-onyx-black">
      {/* Fixed background shader backdrop */}
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-30 mix-blend-screen">
        <ShaderBackground />
      </div>

      {/* Sidebar — Fixed to viewport */}
      <aside className="hidden lg:flex w-[260px] border-r border-white/10 bg-graphite-surface flex-col z-20 shadow-xl fixed top-0 left-0 bottom-0 overflow-y-auto">
        {/* Sidebar Header */}
        <div className="h-[72px] flex items-center px-6 border-b border-white/10 bg-onyx-black/20">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-sm bg-metallic-gold text-onyx-black flex items-center justify-center shadow-md shadow-metallic-gold/15 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 text-onyx-black fill-onyx-black/10" />
            </div>
            <span className="font-extrabold text-lg font-display text-pure-white tracking-tight">
              SyncSell
            </span>
          </Link>
        </div>

        {/* Profile Section & Credits */}
        <div className="p-5 border-b border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-metallic-gold/10 border border-metallic-gold/20 flex items-center justify-center font-bold text-sm text-metallic-gold shrink-0 shadow-inner">
              {activeProfile.full_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-pure-white font-display">
                {activeProfile.full_name}
              </p>
              <p className="text-[11px] text-muted-silver truncate font-medium">
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
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-sm font-bold text-muted-silver hover:text-metallic-gold hover:bg-white/5 transition-all duration-200 group"
          >
            <LayoutDashboard className="w-[18px] h-[18px] text-muted-silver group-hover:text-metallic-gold transition-colors" />
            <span>Overview</span>
          </Link>
          <Link 
            href="/dashboard/listings" 
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-sm font-bold text-muted-silver hover:text-metallic-gold hover:bg-white/5 transition-all duration-200 group"
          >
            <ShoppingBag className="w-[18px] h-[18px] text-muted-silver group-hover:text-metallic-gold transition-colors" />
            <span>Listings</span>
          </Link>
          <Link 
            href="/dashboard?tab=billing" 
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-sm font-bold text-muted-silver hover:text-metallic-gold hover:bg-white/5 transition-all duration-200 group"
          >
            <CreditCard className="w-[18px] h-[18px] text-muted-silver group-hover:text-metallic-gold transition-colors" />
            <span>Billing</span>
          </Link>
          <Link 
            href="/dashboard?tab=settings" 
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-sm font-bold text-muted-silver hover:text-metallic-gold hover:bg-white/5 transition-all duration-200 group"
          >
            <Settings className="w-[18px] h-[18px] text-muted-silver group-hover:text-metallic-gold transition-colors" />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Sidebar Footer (Connect eBay & Sign Out) */}
        <div className="p-4 border-t border-white/10 space-y-3 mt-auto bg-onyx-black/10">
          {!isConnected ? (
            <a 
              href="/api/ebay/auth"
              className="flex items-center justify-center gap-2 w-full py-3 bg-metallic-gold hover:bg-primary-fixed-dim text-onyx-black text-xs font-extrabold uppercase transition-all text-center cursor-pointer hover:shadow-[0_0_15px_rgba(212,175,55,0.15)] active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Connect eBay Store</span>
            </a>
          ) : (
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-metallic-gold/10 border border-metallic-gold/30 text-xs font-bold text-metallic-gold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Connected: {credentials?.ebay_store_name || "eBay"}</span>
              </div>
              <form action={disconnectEbay} className="w-full">
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-pure-white transition-all cursor-pointer active:scale-95"
                >
                  Disconnect eBay
                </button>
              </form>
            </div>
          )}

          <form action={logout} className="w-full">
            <button 
              type="submit" 
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 hover:bg-red-950/20 border border-white/10 hover:border-red-900/30 text-xs font-bold text-muted-silver hover:text-error transition-all cursor-pointer active:scale-95"
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
        <header className="h-[72px] border-b border-white/10 bg-graphite-surface/90 backdrop-blur-md px-6 lg:px-8 flex items-center justify-between z-10 shadow-lg">
          <div>
            <h1 className="text-sm font-black font-display text-pure-white tracking-tight uppercase">Dashboard Workspace</h1>
            <p className="text-[11px] text-muted-silver font-medium">Scale your eBay SEO autopilot</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-metallic-gold/5 border border-metallic-gold/30 text-xs text-metallic-gold font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-metallic-gold" />
              <span className="capitalize">{activeProfile.plan_type} Tier</span>
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
