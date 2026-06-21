import React from "react";
import { redirect } from "next/navigation";
import { createClientServer } from "@/lib/supabase/server";
import { ListingsPageContent } from "@/components/dashboard/ListingsPageContent";

export default async function ListingsPage() {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch listing items
  const { data: listings } = await supabase
    .from("product_listings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch user profile to validate credits limits
  const { data: profile } = await supabase
    .from("users")
    .select("optimizations_used, optimization_limit")
    .eq("id", user.id)
    .single();

  return (
    <ListingsPageContent 
      initialListings={listings || []} 
      profile={profile || { optimizations_used: 0, optimization_limit: 50 }} 
    />
  );
}
