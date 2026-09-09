import { NextResponse } from "next/server";
import { google } from "googleapis";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createYouTubeOAuthClient } from "@/lib/youtube";

export async function POST() {
  try {
    // ---------------------------------------------------------
    // 1. Verify authenticated user
    // ---------------------------------------------------------

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // 2. Load ONLY this user's YouTube connection
    // ---------------------------------------------------------

    const {
      data: connection,
      error: connectionError,
    } = await supabaseAdmin
      .from("youtube_connections")
      .select(
        "youtube_channel_id, access_token, refresh_token, token_type, expiry_date"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (connectionError) {
      console.error(
        "YouTube connection lookup error."
      );

      return NextResponse.json(
        {
          error:
            "Failed to load YouTube connection.",
        },
        { status: 500 }
      );
    }

    if (!connection) {
      return NextResponse.json(
        {
          error:
            "YouTube is not connected.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // 3. Validate OAuth connection
    // ---------------------------------------------------------

    if (
      !connection.youtube_channel_id ||
      !connection.access_token ||
      !connection.refresh_token
    ) {
      console.error(
        "YouTube connection is incomplete."
      );

      return NextResponse.json(
        {
          error:
            "YouTube connection is incomplete. Please reconnect YouTube.",
        },
        { status: 409 }
      );
    }

    // ---------------------------------------------------------
    // 4. Configure Google OAuth client
    // ---------------------------------------------------------

    const oauth2Client =
      createYouTubeOAuthClient();

    oauth2Client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
      token_type:
        connection.token_type ?? "Bearer",
      expiry_date:
        connection.expiry_date ?? undefined,
    });

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    // ---------------------------------------------------------
    // 5. Load uploads playlist
    // ---------------------------------------------------------

    const channelResponse =
      await youtube.channels.list({
        part: ["contentDetails"],
        id: [
          connection.youtube_channel_id,
        ],
      });

    const uploadsPlaylistId =
      channelResponse.data.items?.[0]
        ?.contentDetails
        ?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return NextResponse.json(
        {
          error:
            "Uploads playlist not found.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // 6. Load video IDs
    // ---------------------------------------------------------

    const playlistResponse =
      await youtube.playlistItems.list({
        part: [
          "snippet",
          "contentDetails",
        ],
        playlistId: uploadsPlaylistId,
        maxResults: 50,
      });

    const videoIds =
      playlistResponse.data.items
        ?.map(
          (item) =>
            item.contentDetails?.videoId
        )
        .filter(
          (id): id is string =>
            Boolean(id)
        ) ?? [];

    if (videoIds.length === 0) {
      return NextResponse.json({
        synced: 0,
      });
    }

    // ---------------------------------------------------------
    // 7. Load full video information
    // ---------------------------------------------------------

    const videosResponse =
      await youtube.videos.list({
        part: [
          "snippet",
          "contentDetails",
          "statistics",
        ],
        id: videoIds,
      });

    const videos =
      videosResponse.data.items?.map(
        (video) => ({
          user_id: user.id,
          youtube_video_id:
            video.id ?? "",
          title:
            video.snippet?.title ?? "",
          description:
            video.snippet?.description ??
            "",
          thumbnail:
            video.snippet?.thumbnails?.high
              ?.url ??
            video.snippet?.thumbnails
              ?.default?.url ??
            "",
          published_at:
            video.snippet
              ?.publishedAt ?? null,
          duration:
            video.contentDetails
              ?.duration ?? null,
          views: Number(
            video.statistics
              ?.viewCount ?? 0
          ),
          likes: Number(
            video.statistics
              ?.likeCount ?? 0
          ),
          comments: Number(
            video.statistics
              ?.commentCount ?? 0
          ),
          updated_at:
            new Date().toISOString(),
        })
      ) ?? [];

    // ---------------------------------------------------------
    // 8. Store videos for THIS user only
    // ---------------------------------------------------------

    const { error } =
      await supabaseAdmin
        .from("youtube_videos")
        .upsert(videos, {
          onConflict:
            "user_id,youtube_video_id",
        });

    if (error) {
      console.error(
        "Video sync database error."
      );

      return NextResponse.json(
        {
          error:
            "Failed to sync videos.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      synced: videos.length,
    });
  } catch (error) {
    console.error(
      "Unexpected video sync error:",
      error instanceof Error
        ? error.message
        : "Unknown server error."
    );

    return NextResponse.json(
      {
        error:
          "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}