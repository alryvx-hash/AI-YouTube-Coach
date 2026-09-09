import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("User error:", userError);

      return NextResponse.json(
        {
          error: "Failed to get authenticated user.",
          details: userError.message,
        },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const channelName =
      typeof body.channel_name === "string"
        ? body.channel_name.trim()
        : "";

    const youtubeChannelId =
      typeof body.youtube_channel_id === "string" &&
      body.youtube_channel_id.trim() !== ""
        ? body.youtube_channel_id.trim()
        : null;

    const { data: profile, error: profileError } = await supabase
      .from("channel_profiles")
      .upsert(
        {
          id: user.id,
          channel_name: channelName || null,
          youtube_channel_id: youtubeChannelId,
        },
        {
          onConflict: "id",
        }
      )
      .select()
      .single();

    if (profileError) {
      console.error("Profile database error:", profileError);

      return NextResponse.json(
        {
          error: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile,
    });
  } catch (error) {
    console.error("Unexpected profile creation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}