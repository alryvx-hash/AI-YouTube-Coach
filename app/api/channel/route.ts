import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
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
    // 2. Existing dashboard values
    // ---------------------------------------------------------

    const views = 128430;
    const subscribers = 2840;
    const watchTime = 1240;
    const ctr = 5.8;

    // ---------------------------------------------------------
    // 3. Performance score
    // ---------------------------------------------------------

    let performanceScore = 50;

    if (views >= 100000) {
      performanceScore += 15;
    } else if (views >= 50000) {
      performanceScore += 10;
    } else if (views >= 10000) {
      performanceScore += 5;
    }

    if (subscribers >= 2500) {
      performanceScore += 15;
    } else if (subscribers >= 1000) {
      performanceScore += 10;
    } else if (subscribers >= 500) {
      performanceScore += 5;
    }

    if (watchTime >= 1000) {
      performanceScore += 10;
    } else if (watchTime >= 500) {
      performanceScore += 5;
    }

    if (ctr >= 7) {
      performanceScore += 10;
    } else if (ctr >= 5) {
      performanceScore += 7;
    } else if (ctr >= 3) {
      performanceScore += 3;
    }

    performanceScore = Math.min(
      100,
      Math.max(0, performanceScore)
    );

    // ---------------------------------------------------------
    // 4. Strengths / weaknesses / recommendations
    // ---------------------------------------------------------

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    if (views >= 100000) {
      strengths.push(
        "Your channel is generating strong view volume."
      );
    } else {
      weaknesses.push(
        "Your channel could generate more views."
      );
    }

    if (subscribers >= 2500) {
      strengths.push(
        "Your subscriber base is showing healthy growth potential."
      );
    } else {
      weaknesses.push(
        "Your subscriber conversion could be stronger."
      );
    }

    if (watchTime >= 1000) {
      strengths.push(
        "Your watch time indicates strong audience engagement."
      );
    } else {
      weaknesses.push(
        "Your watch time could be improved."
      );
    }

    if (ctr >= 6) {
      strengths.push(
        "Your click-through rate is performing well."
      );
    } else if (ctr >= 5) {
      weaknesses.push(
        "Your click-through rate has room for improvement."
      );

      recommendations.push(
        "Experiment with stronger thumbnails and more compelling titles."
      );
    } else {
      weaknesses.push(
        "Your click-through rate is below the desired range."
      );

      recommendations.push(
        "Prioritize improving thumbnails and titles to increase clicks."
      );
    }

    if (views >= 100000 && watchTime >= 1000) {
      recommendations.push(
        "Create more videos around topics that already generate strong audience interest."
      );
    }

    if (subscribers > 0 && views > 0) {
      recommendations.push(
        "Study which videos convert viewers into subscribers and create similar content."
      );
    }

    // ---------------------------------------------------------
    // 5. Existing analytics
    // ---------------------------------------------------------

    const analytics = {
      "7d": [
        { day: "Mon", views: 1200 },
        { day: "Tue", views: 1800 },
        { day: "Wed", views: 1500 },
        { day: "Thu", views: 2400 },
        { day: "Fri", views: 3100 },
        { day: "Sat", views: 2800 },
        { day: "Sun", views: 3600 },
      ],

      "28d": [
        { day: "Week 1", views: 8200 },
        { day: "Week 2", views: 11400 },
        { day: "Week 3", views: 9800 },
        { day: "Week 4", views: 13700 },
      ],

      "90d": [
        { day: "Month 1", views: 38200 },
        { day: "Month 2", views: 44700 },
        { day: "Month 3", views: 52100 },
      ],
    };

    // ---------------------------------------------------------
    // 6. Load REAL YouTube videos from Supabase
    // ---------------------------------------------------------

    const { data: youtubeVideos, error: videosError } =
      await supabaseAdmin
        .from("youtube_videos")
        .select(
          `
            id,
            title,
            thumbnail,
            views,
            likes,
            comments,
            published_at
          `
        )
        .eq("user_id", user.id)
        .order("views", { ascending: false })
        .limit(10);

    if (videosError) {
      console.error(
        "Failed to load dashboard videos:",
        videosError
      );

      return NextResponse.json(
        {
          error: "Failed to load dashboard videos.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 7. Convert real videos into dashboard Top Videos
    // ---------------------------------------------------------

    const topVideos =
      (youtubeVideos ?? []).map((video) => {
        const videoViews = Number(video.views ?? 0);
        const videoLikes = Number(video.likes ?? 0);

        const videoCtr =
          videoViews > 0
            ? Number(
                (
                  (videoLikes / videoViews) *
                  100
                ).toFixed(1)
              )
            : 0;

        return {
          id: video.id,
          title: video.title,
          ctr: videoCtr,
          views: videoViews,
          thumbnail: video.thumbnail ?? null,
          likes: videoLikes,
          comments: Number(video.comments ?? 0),
          publishedAt: video.published_at ?? null,
        };
      });

    // ---------------------------------------------------------
    // 8. Calculate basic real-video metrics
    // ---------------------------------------------------------

    const averageViews =
      topVideos.length > 0
        ? topVideos.reduce(
            (sum, video) => sum + video.views,
            0
          ) / topVideos.length
        : 0;

    const averageCtr =
      topVideos.length > 0
        ? topVideos.reduce(
            (sum, video) => sum + video.ctr,
            0
          ) / topVideos.length
        : 0;

    const bestVideo =
      topVideos.length > 0
        ? [...topVideos].sort(
            (a, b) => b.views - a.views
          )[0]
        : null;

    const worstVideo =
      topVideos.length > 0
        ? [...topVideos].sort(
            (a, b) => a.views - b.views
          )[0]
        : null;

    // ---------------------------------------------------------
    // 9. Return dashboard data
    // ---------------------------------------------------------

    return NextResponse.json({
      views,
      subscribers,
      watchTime,
      ctr,

      analytics,

      topVideos,

      insights: {
        summary:
          performanceScore >= 80
            ? "Your channel is performing very strongly."
            : performanceScore >= 65
              ? "Your channel is showing positive momentum."
              : "Your channel has several areas that can be improved.",

        recommendation:
          recommendations[0] ||
          "Continue monitoring your analytics and focus on consistent content.",
      },

      analysis: {
        performanceScore,
        strengths,
        weaknesses,
        recommendations,
      },

      videoAnalysis: {
        averageViews,
        averageCtr,
        bestVideo,
        worstVideo,
      },
    });
  } catch (error) {
    console.error(
      "Channel dashboard API error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load channel dashboard.",
      },
      { status: 500 }
    );
  }
}