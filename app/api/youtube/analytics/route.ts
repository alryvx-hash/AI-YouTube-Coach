import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createYouTubeOAuthClient } from "@/lib/youtube";

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function getStartDate(days: number) {
  const date = new Date();

  date.setDate(date.getDate() - days);

  return formatDate(date);
}

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);

    const period = searchParams.get("period") || "7d";

    const days =
      period === "28d"
        ? 28
        : period === "90d"
          ? 90
          : 7;

    const { data: connection, error: connectionError } =
      await supabaseAdmin
        .from("youtube_connections")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (connectionError) {
      console.error(
        "Analytics connection lookup error:",
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

    const youtubeAnalytics = google.youtubeAnalytics({
      version: "v2",
      auth: oauth2Client,
    });

    const endDate = new Date();
    const startDate = new Date();

    startDate.setDate(startDate.getDate() - days);

    const response =
      await youtubeAnalytics.reports.query({
        ids: "channel==MINE",
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        metrics: "views,likes,comments,estimatedMinutesWatched,subscribersGained",
        dimensions: "day",
        sort: "day",
      });

    const rows = response.data.rows ?? [];

    const analytics = rows.map((row) => ({
      date: row[0] as string,
      views: Number(row[1] ?? 0),
      likes: Number(row[2] ?? 0),
      comments: Number(row[3] ?? 0),
      estimatedMinutesWatched: Number(row[4] ?? 0),
      subscribersGained: Number(row[5] ?? 0),
    }));

    return NextResponse.json({
      period,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      analytics,
    });
  } catch (error) {
    console.error("YouTube Analytics API error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch YouTube analytics.",
      },
      { status: 500 }
    );
  }
}