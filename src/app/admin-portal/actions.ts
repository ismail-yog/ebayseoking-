"use server";

import { revalidatePath } from "next/cache";
import { createClientServer } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAILS = ["connect@syncsell.org", "immicpb@gmail.com"];

async function checkAdmin() {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new Error("Unauthorized access. Admin privileges required.");
  }
  return user;
}

export async function createPromoCode(formData: FormData) {
  try {
    await checkAdmin();
    
    const code = formData.get("code") as string;
    const planType = formData.get("planType") as string;
    const durationMonths = parseInt(formData.get("durationMonths") as string || "1", 10);

    if (!code || !planType) {
      return { error: "Code and plan type are required." };
    }

    const adminClient = createAdminClient();
    
    // Check if code already exists
    const { data: existing } = await adminClient
      .from("promo_codes")
      .select("id")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (existing) {
      return { error: "A promo code with this name already exists." };
    }

    const { error } = await adminClient
      .from("promo_codes")
      .insert({
        code: code.trim().toUpperCase(),
        plan_type: planType,
        duration_months: durationMonths,
        is_used: false,
      });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/admin-portal");
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to create promo code" };
  }
}

export async function deletePromoCode(id: string) {
  try {
    await checkAdmin();
    const adminClient = createAdminClient();
    
    const { error } = await adminClient
      .from("promo_codes")
      .delete()
      .eq("id", id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/admin-portal");
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to delete promo code" };
  }
}
