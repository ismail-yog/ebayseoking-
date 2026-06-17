import { NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete credentials for the user
    const { error } = await supabase
      .from("store_credentials")
      .delete()
      .eq("user_id", user.id);

    if (error) throw error;

    console.log(`Successfully disconnected eBay store for user ${user.id}`);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Disconnect failed";
    console.error(`eBay disconnect error: ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
