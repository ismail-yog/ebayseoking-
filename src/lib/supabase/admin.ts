import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with the service role key to bypass Row Level Security.
 * Should ONLY be used in secure, server-side environments (API routes, server actions).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";

  if (serviceRoleKey === "placeholder-service-key") {
    console.warn("Using placeholder Supabase Service Role Key. Admin actions will fail.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
