import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: connection, error } = await supabaseAdmin
      .from("youtube_connections")
      .select(
        "youtube_channel_id, youtube_channel_name, updated_at"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("YouTube status error:", error);

      return NextResponse.json(
        { error: "Failed to check YouTube connection." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      connected: Boolean(connection),
      connection,
    });
  } catch (error) {
    console.error("Unexpected YouTube status error:", error);

    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}