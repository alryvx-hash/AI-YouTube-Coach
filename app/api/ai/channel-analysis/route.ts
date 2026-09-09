import { NextResponse } from "next/server";
import OpenAI from "openai";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function generateFallbackAnalysis(
  videos: {
    title: string;
    views: number | null;
    likes: number | null;
    comments: number | null;
  }[]
) {
  if (!videos || videos.length === 0) {
    return {
      summary:
        "There is not enough video data to analyze the channel yet.",
      performanceScore: 0,
      strengths: [],
      weaknesses: [
        "There are not enough videos available for analysis.",
      ],
      recommendations: [
        "Connect a YouTube channel or add more videos to get a better analysis.",
      ],
    };
  }

  const normalizedVideos = videos.map((video) => ({
    ...video,
    views: Number(video.views ?? 0),
    likes: Number(video.likes ?? 0),
    comments: Number(video.comments ?? 0),
  }));

  const totalViews = normalizedVideos.reduce(
    (sum, video) => sum + video.views,
    0
  );

  const totalLikes = normalizedVideos.reduce(
    (sum, video) => sum + video.likes,
    0
  );

  const totalComments = normalizedVideos.reduce(
    (sum, video) => sum + video.comments,
    0
  );

  const averageViews =
    normalizedVideos.length > 0
      ? totalViews / normalizedVideos.length
      : 0;

  const engagementRate =
    totalViews > 0
      ? ((totalLikes + totalComments) / totalViews) * 100
      : 0;

  const bestVideo = [...normalizedVideos].sort(
    (a, b) => b.views - a.views
  )[0];

  const lowestVideo = [...normalizedVideos].sort(
    (a, b) => a.views - b.views
  )[0];

  let performanceScore = 50;

  if (averageViews > 1000) {
    performanceScore += 15;
  }

  if (engagementRate >= 5) {
    performanceScore += 20;
  } else if (engagementRate >= 2) {
    performanceScore += 10;
  }

  if (normalizedVideos.length >= 10) {
    performanceScore += 10;
  }

  performanceScore = Math.min(
    100,
    Math.max(0, performanceScore)
  );

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (averageViews > 1000) {
    strengths.push(
      "Average views indicate good content reach."
    );
  } else {
    weaknesses.push(
      "Average views are relatively low."
    );

    recommendations.push(
      "Focus on high-demand topics and improve your titles and thumbnails."
    );
  }

  if (engagementRate >= 5) {
    strengths.push(
      "Engagement rate is strong compared to the number of views."
    );
  } else {
    weaknesses.push(
      "Engagement rate could be improved."
    );

    recommendations.push(
      "Encourage viewers to comment and interact with your videos."
    );
  }

  if (bestVideo) {
    strengths.push(
      `Your best-performing video is "${bestVideo.title}".`
    );

    recommendations.push(
      `Analyze the topic of "${bestVideo.title}" and consider creating similar content from a different angle or with a similar concept.`
    );
  }

  if (lowestVideo) {
    weaknesses.push(
      `Your lowest-performing video is "${lowestVideo.title}".`
    );
  }

  return {
    summary: `The channel generated ${totalViews.toLocaleString()} views across ${normalizedVideos.length} videos, with an estimated engagement rate of ${engagementRate.toFixed(2)}%.`,
    performanceScore,
    strengths,
    weaknesses,
    recommendations,
  };
}

export async function POST() {
  try {
    // ---------------------------------------------------------
    // 1. Verify authenticated Supabase user
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
    // 2. Load profile for THIS user only
    // ---------------------------------------------------------

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("channel_profiles")
      .select("channel_name, youtube_channel_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Profile lookup error."
      );
    }

    // ---------------------------------------------------------
    // 3. Load videos for THIS user only
    // ---------------------------------------------------------

    const {
      data: videos,
      error: videosError,
    } = await supabaseAdmin
      .from("youtube_videos")
      .select("title, views, likes, comments")
      .eq("user_id", user.id)
      .order("views", { ascending: false })
      .limit(20);

    if (videosError) {
      console.error(
        "Videos lookup error."
      );

      return NextResponse.json(
        { error: "Failed to load video data." },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 4. Try OpenAI
    // ---------------------------------------------------------

    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error(
          "OPENAI_API_KEY is not configured."
        );
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const prompt = `
You are an expert YouTube growth strategist.

Analyze this channel.

Channel:
${JSON.stringify(profile)}

Videos:
${JSON.stringify(videos)}

Return ONLY valid JSON:

{
  "summary": "short analysis",
  "performanceScore": 0,
  "strengths": [],
  "weaknesses": [],
  "recommendations": []
}

Rules:
- performanceScore must be between 0 and 100.
- Base the analysis only on the supplied data.
- Do not invent metrics.
`;

      const response = await openai.responses.create({
        model: "gpt-5-mini",
        input: prompt,
      });

      const analysis = JSON.parse(
        response.output_text
      );

      // Validate the most important AI field before returning it.
      const performanceScore = Number(
        analysis.performanceScore
      );

      if (
        !Number.isFinite(performanceScore) ||
        performanceScore < 0 ||
        performanceScore > 100
      ) {
        throw new Error(
          "Invalid AI performance score."
        );
      }

      return NextResponse.json({
        analysis: {
          summary:
            typeof analysis.summary === "string"
              ? analysis.summary
              : "",
          performanceScore,
          strengths:
            Array.isArray(analysis.strengths)
              ? analysis.strengths.filter(
                  (item: unknown): item is string =>
                    typeof item === "string"
                )
              : [],
          weaknesses:
            Array.isArray(analysis.weaknesses)
              ? analysis.weaknesses.filter(
                  (item: unknown): item is string =>
                    typeof item === "string"
                )
              : [],
          recommendations:
            Array.isArray(
              analysis.recommendations
            )
              ? analysis.recommendations.filter(
                  (item: unknown): item is string =>
                    typeof item === "string"
                )
              : [],
        },
        source: "openai",
      });
    } catch (aiError) {
      console.warn(
        "OpenAI unavailable. Using fallback analysis.",
        aiError instanceof Error
          ? aiError.message
          : "Unknown AI error."
      );

      const fallbackAnalysis =
        generateFallbackAnalysis(
          videos ?? []
        );

      return NextResponse.json({
        analysis: fallbackAnalysis,
        source: "fallback",
      });
    }
  } catch (error) {
    console.error(
      "AI channel analysis error:",
      error instanceof Error
        ? error.message
        : "Unknown server error."
    );

    return NextResponse.json(
      {
        error:
          "Failed to generate analysis.",
      },
      { status: 500 }
    );
  }
}