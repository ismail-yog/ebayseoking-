import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClientServer } from "@/lib/supabase/server";
import { 
  LayoutDashboard, ShoppingBag, CreditCard, Settings, LogOut, 
  ShieldCheck, Zap 
} from "lucide-react";
import { CreditCounter } from "@/components/dashboard/CreditCounter";

// Log out action for Server Action inside dashboard shell
async function logout() {
  "use server";
  const supabase = await createClientServer();
  await supabase.auth.signOut();
  redirect("/");
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

  // Fetch user profile stats
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, plan_type, optimization_limit, optimizations_used, plan_expires_at")
    .eq("id", user.id)
    .single();

  const activeProfile = profile ? { ...profile } : {
    full_name: user.user_metadata?.full_name || "SyncSell Merchant",
    email: user.email || "",
    plan_type: "free",
    optimization_limit: 10,
    optimizations_used: 0,
    plan_expires_at: null,
  };

  // Perform dynamic auto-expiry verification check
  if (profile && profile.plan_type !== "free" && profile.plan_expires_at) {
    const expiry = new Date(profile.plan_expires_at);
    if (expiry < new Date()) {
      console.log(`Plan expired for user ${user.id}. Executing auto-downgrade to Free.`);
      
      await supabase
        .from("profiles")
        .update({
          plan_type: "free",
          optimization_limit: 10,
          plan_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      activeProfile.plan_type = "free";
      activeProfile.optimization_limit = 10;
      activeProfile.plan_expires_at = null;
    }
  }

  return (
    <div className="relative min-h-screen flex bg-bg-primary text-gray-100 font-sans">
      {/* Decorative Orbs */}
      <div className="absolute top-[10%] left-[5%] w-[35%] h-[35%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-[35%] h-[35%] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Glass Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-bg-secondary/40 backdrop-blur-md flex flex-col z-20">
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-lg font-heading bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              SyncSell
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 px-4 space-y-1">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          >
            <LayoutDashboard className="w-4.5 h-4.5 text-primary" />
            <span>Overview</span>
          </Link>
          <Link 
            href="/dashboard/listings" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          >
            <ShoppingBag className="w-4.5 h-4.5 text-secondary" />
            <span>Listings</span>
          </Link>
          <Link 
            href="/dashboard?tab=billing" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          >
            <CreditCard className="w-4.5 h-4.5 text-accent-cyan" />
            <span>Billing</span>
          </Link>
          <Link 
            href="/dashboard?tab=settings" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          >
            <Settings className="w-4.5 h-4.5 text-gray-400" />
            <span>Settings</span>
          </Link>
        </nav>

        {/* User Card & Credit Widget */}
        <div className="p-4 border-t border-white/5 space-y-4">
          <CreditCounter 
            used={activeProfile.optimizations_used} 
            limit={activeProfile.optimization_limit} 
            plan={activeProfile.plan_type} 
          />

          <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent-magenta flex items-center justify-center font-bold text-xs text-white shrink-0">
                {activeProfile.full_name.substring(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold truncate text-white">
                  {activeProfile.full_name}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {activeProfile.email}
                </p>
              </div>
            </div>

            <form action={logout}>
              <button 
                type="submit" 
                className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors bg-transparent border-0 cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between z-10">
          <div>
            <h1 className="text-lg font-bold font-heading text-white">Dashboard Workspace</h1>
            <p className="text-xs text-gray-400">Scale your eBay SEO autopilot</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
              <span className="text-gray-300 font-medium capitalize">{activeProfile.plan_type} Tier</span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
