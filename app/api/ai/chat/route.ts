import { NextResponse } from "next/server";
import OpenAI from "openai";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const MAX_MESSAGE_LENGTH = 2000;

function generateFallbackAnswer(
  message: string,
  videos: {
    title: string;
    views: number | null;
    likes: number | null;
    comments: number | null;
  }[]
) {
  const normalizedMessage = message.toLowerCase();

  if (!videos || videos.length === 0) {
    return "I don't have enough video data yet. Connect your YouTube channel and sync your videos first.";
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

  const averageViews = Math.round(
    totalViews / normalizedVideos.length
  );

  const bestVideo = [...normalizedVideos].sort(
    (a, b) => b.views - a.views
  )[0];

  const lowestVideo = [...normalizedVideos].sort(
    (a, b) => a.views - b.views
  )[0];

  if (
    normalizedMessage.includes("best") ||
    normalizedMessage.includes("top")
  ) {
    return `Your best-performing video is "${bestVideo.title}" with ${bestVideo.views.toLocaleString()} views.`;
  }

  if (
    normalizedMessage.includes("worst") ||
    normalizedMessage.includes("lowest")
  ) {
    return `Your lowest-performing video is "${lowestVideo.title}" with ${lowestVideo.views.toLocaleString()} views.`;
  }

  if (
    normalizedMessage.includes("views") ||
    normalizedMessage.includes("view")
  ) {
    return `Your ${normalizedVideos.length} analyzed videos generated ${totalViews.toLocaleString()} total views, with an average of ${averageViews.toLocaleString()} views per video.`;
  }

  if (
    normalizedMessage.includes("grow") ||
    normalizedMessage.includes("growth")
  ) {
    return `To improve growth, study what worked in "${bestVideo.title}", create related content, and improve titles and thumbnails on lower-performing videos.`;
  }

  if (
    normalizedMessage.includes("engagement") ||
    normalizedMessage.includes("likes") ||
    normalizedMessage.includes("comments")
  ) {
    const totalLikes = normalizedVideos.reduce(
      (sum, video) => sum + video.likes,
      0
    );

    const totalComments = normalizedVideos.reduce(
      (sum, video) => sum + video.comments,
      0
    );

    return `Your analyzed videos generated ${totalLikes.toLocaleString()} likes and ${totalComments.toLocaleString()} comments. Focus on stronger calls to action and topics that encourage discussion.`;
  }

  return `I analyzed ${normalizedVideos.length} videos. Your strongest video is "${bestVideo.title}", while the lowest-performing video is "${lowestVideo.title}". Ask me about views, engagement, growth, best videos, or weakest videos.`;
}

export async function POST(request: Request) {
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
    // 2. Validate request body
    // ---------------------------------------------------------

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
      !("message" in body)
    ) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const messageValue = (
      body as { message?: unknown }
    ).message;

    const message =
      typeof messageValue === "string"
        ? messageValue.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 3. Load profile context for THIS user only
    // ---------------------------------------------------------

    const { data: profile } = await supabaseAdmin
      .from("channel_profiles")
      .select("channel_name, youtube_channel_id")
      .eq("id", user.id)
      .maybeSingle();

    // ---------------------------------------------------------
    // 4. Load video context for THIS user only
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
      console.error("Chat videos lookup error.");

      return NextResponse.json(
        { error: "Failed to load video context." },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 5. Try OpenAI
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
You are the AI assistant inside a YouTube analytics platform.

User message:
${message}

Channel:
${JSON.stringify(profile)}

Videos:
${JSON.stringify(videos)}

Answer the user's question clearly and specifically.

Rules:
- Use only the provided data.
- Do not invent metrics.
- If the data is insufficient, say so.
- Keep the answer useful and practical.
`;

      const response = await openai.responses.create({
        model: "gpt-5-mini",
        input: prompt,
      });

      return NextResponse.json({
        answer:
          response.output_text ||
          "I could not generate an answer.",
        source: "openai",
      });
    } catch (aiError) {
      console.warn(
        "OpenAI unavailable. Using fallback chatbot.",
        aiError instanceof Error
          ? aiError.message
          : "Unknown AI error."
      );

      return NextResponse.json({
        answer: generateFallbackAnswer(
          message,
          videos ?? []
        ),
        source: "fallback",
      });
    }
  } catch (error) {
    console.error(
      "AI chat error:",
      error instanceof Error
        ? error.message
        : "Unknown server error."
    );

    return NextResponse.json(
      {
        error: "Failed to process chat.",
      },
      { status: 500 }
    );
  }
}