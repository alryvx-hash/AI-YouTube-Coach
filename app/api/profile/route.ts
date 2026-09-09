import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_CHANNEL_NAME_LENGTH = 100;

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: profile, error } = await supabase
      .from("channel_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile fetch error.");

      return NextResponse.json(
        { error: "Failed to fetch profile." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email ?? null,
      },
      profile,
    });
  } catch (error) {
    console.error(
      "Unexpected profile GET error:",
      error instanceof Error
        ? error.message
        : "Unknown server error."
    );

    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("channel_name" in body)
    ) {
      return NextResponse.json(
        { error: "Channel name is required." },
        { status: 400 }
      );
    }

    const channelNameValue = (
      body as { channel_name?: unknown }
    ).channel_name;

    if (
      channelNameValue !== null &&
      typeof channelNameValue !== "string"
    ) {
      return NextResponse.json(
        { error: "Channel name must be a string or null." },
        { status: 400 }
      );
    }

    const channelName =
      typeof channelNameValue === "string"
        ? channelNameValue.trim()
        : "";

    if (channelName.length > MAX_CHANNEL_NAME_LENGTH) {
      return NextResponse.json(
        {
          error:
            "Channel name must be 100 characters or fewer.",
        },
        { status: 400 }
      );
    }

    const { data: existingProfile, error: existingError } =
      await supabase
        .from("channel_profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

    if (existingError) {
      console.error(
        "Profile existence check error."
      );

      return NextResponse.json(
        { error: "Failed to update profile." },
        { status: 500 }
      );
    }

    let profile;
    let error;

    if (existingProfile) {
      const result = await supabase
        .from("channel_profiles")
        .update({
          channel_name: channelName || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("*")
        .single();

      profile = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from("channel_profiles")
        .insert({
          id: user.id,
          channel_name: channelName || null,
        })
        .select("*")
        .single();

      profile = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Profile update error.");

      return NextResponse.json(
        { error: "Failed to update profile." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile,
    });
  } catch (error) {
    console.error(
      "Unexpected profile PUT error:",
      error instanceof Error
        ? error.message
        : "Unknown server error."
    );

    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}