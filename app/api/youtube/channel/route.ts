import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createYouTubeOAuthClient } from "@/lib/youtube";

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

    const { data: connection, error: connectionError } =
      await supabaseAdmin
        .from("youtube_connections")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (connectionError) {
      console.error(
        "Connection lookup error:",
        connectionError
      );

      return NextResponse.json(
        { error: "Failed to load YouTube connection." },
        { status: 500 }
      );
    }

    if (!connection) {
      return NextResponse.json(
        { error: "YouTube is not connected." },
        { status: 404 }
      );
    }

    const oauth2Client = createYouTubeOAuthClient();

    oauth2Client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
      token_type: connection.token_type,
      expiry_date: connection.expiry_date,
    });

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    const response = await youtube.channels.list({
      part: ["snippet", "statistics", "contentDetails"],
      id: [connection.youtube_channel_id],
    });

    const channel = response.data.items?.[0];

    if (!channel) {
      return NextResponse.json(
        { error: "YouTube channel not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      channel: {
        id: channel.id,
        name: channel.snippet?.title ?? "",
        description: channel.snippet?.description ?? "",
        customUrl: channel.snippet?.customUrl ?? "",
        thumbnail:
          channel.snippet?.thumbnails?.default?.url ?? "",
        views: Number(channel.statistics?.viewCount ?? 0),
        subscribers: Number(
          channel.statistics?.subscriberCount ?? 0
        ),
        videos: Number(channel.statistics?.videoCount ?? 0),
      },
    });
  } catch (error) {
    console.error("YouTube channel API error:", error);

    return NextResponse.json(
      { error: "Failed to fetch YouTube channel." },
      { status: 500 }
    );
  }
}