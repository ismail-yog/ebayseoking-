import { NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { is_autopilot_enabled, marketplace_region, sync_interval } = body;

    const { error } = await supabase
      .from("users")
      .update({
        is_autopilot_enabled: !!is_autopilot_enabled,
        marketplace_region: marketplace_region || "US",
        sync_interval: sync_interval || "24h",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) throw error;

    console.log(`Successfully updated settings for user ${user.id}`);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save settings";
    console.error(`Save settings error: ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
