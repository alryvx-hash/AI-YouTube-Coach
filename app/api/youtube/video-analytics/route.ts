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

    const { data: connection, error: connectionError } =
      await supabaseAdmin
        .from("youtube_connections")
        .select("youtube_channel_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (connectionError) {
      console.error("Connection lookup error:", connectionError);

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

    const { data: videos, error: videosError } =
      await supabaseAdmin
        .from("youtube_videos")
        .select("*")
        .eq("user_id", user.id)
        .order("views", { ascending: false });

    if (videosError) {
      console.error("Video analytics lookup error:", videosError);

      return NextResponse.json(
        { error: "Failed to load video data." },
        { status: 500 }
      );
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json({
        summary: {
          totalVideos: 0,
          totalViews: 0,
          averageViews: 0,
          totalLikes: 0,
          totalComments: 0,
        },
        bestVideo: null,
        worstVideo: null,
        videos: [],
      });
    }

    const totalViews = videos.reduce(
      (sum, video) => sum + Number(video.views ?? 0),
      0
    );

    const totalLikes = videos.reduce(
      (sum, video) => sum + Number(video.likes ?? 0),
      0
    );

    const totalComments = videos.reduce(
      (sum, video) => sum + Number(video.comments ?? 0),
      0
    );

    const averageViews =
      videos.length > 0
        ? Math.round(totalViews / videos.length)
        : 0;

    const analyzedVideos = videos.map((video) => {
      const views = Number(video.views ?? 0);
      const likes = Number(video.likes ?? 0);
      const comments = Number(video.comments ?? 0);

      const engagementRate =
        views > 0
          ? Number(
              (((likes + comments) / views) * 100).toFixed(2)
            )
          : 0;

      const performanceScore =
        averageViews > 0
          ? Math.min(
              100,
              Math.round((views / averageViews) * 50 +
                engagementRate * 10)
            )
          : 0;

      return {
        id: video.youtube_video_id,
        title: video.title,
        thumbnail: video.thumbnail,
        publishedAt: video.published_at,
        views,
        likes,
        comments,
        engagementRate,
        performanceScore,
      };
    });

    const bestVideo = [...analyzedVideos].sort(
      (a, b) =>
        b.performanceScore - a.performanceScore
    )[0];

    const worstVideo = [...analyzedVideos].sort(
      (a, b) =>
        a.performanceScore - b.performanceScore
    )[0];

    return NextResponse.json({
      summary: {
        totalVideos: videos.length,
        totalViews,
        averageViews,
        totalLikes,
        totalComments,
      },
      bestVideo,
      worstVideo,
      videos: analyzedVideos,
    });
  } catch (error) {
    console.error("Video analytics error:", error);

    return NextResponse.json(
      { error: "Failed to calculate video analytics." },
      { status: 500 }
    );
  }
}