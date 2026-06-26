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
        sync_interval: sync_interval || "4d",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) throw error;

    // Trigger Autopilot run immediately if enabled
    if (is_autopilot_enabled) {
      const originUrl = new URL(req.url).origin;
      const autopilotUrl = `${originUrl}/api/jobs/autopilot`;
      const cronSecret = process.env.CRON_SECRET || "";

      fetch(autopilotUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cronSecret}`,
          "Content-Type": "application/json",
        },
      }).catch((e) => console.error("Failed to auto-trigger autopilot run:", e));
    }

    console.log(`Successfully updated settings for user ${user.id}`);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save settings";
    console.error(`Save settings error: ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
