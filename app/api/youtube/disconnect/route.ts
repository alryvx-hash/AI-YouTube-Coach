import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  try {
    // ---------------------------------------------------------
    // 1. Verify the currently authenticated user
    // ---------------------------------------------------------

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // 2. Delete YouTube connection for THIS user only
    // ---------------------------------------------------------

    const {
      error: connectionError,
    } = await supabaseAdmin
      .from("youtube_connections")
      .delete()
      .eq("user_id", user.id);

    if (connectionError) {
      console.error(
        "YouTube disconnect database error."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to delete YouTube connection.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 3. Remove YouTube channel ID from profile
    // Keep the profile itself.
    // ---------------------------------------------------------

    const {
      error: profileError,
    } = await supabaseAdmin
      .from("channel_profiles")
      .update({
        youtube_channel_id: null,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      console.error(
        "YouTube profile cleanup error."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to clean YouTube profile data.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 4. Return success
    // ---------------------------------------------------------

    return NextResponse.json({
      success: true,
      message:
        "YouTube disconnected successfully.",
    });
  } catch (error) {
    console.error(
      "YouTube disconnect error:",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to disconnect YouTube.",
      },
      { status: 500 }
    );
  }
}