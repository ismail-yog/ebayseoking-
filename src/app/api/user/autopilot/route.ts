import { NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { is_autopilot_enabled } = await req.json();

    const { error } = await supabase
      .from("users")
      .update({ is_autopilot_enabled })
      .eq("id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, is_autopilot_enabled });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
