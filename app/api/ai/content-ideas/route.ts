import { NextResponse } from "next/server";
import OpenAI from "openai";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Video = {
  title: string;
  views: number | null;
};

type ContentIdea = {
  title: string;
  angle: string;
  reason: string;
};

type RawContentIdea = {
  title: unknown;
  angle: unknown;
  reason: unknown;
};

/*
 * ---------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------
 */

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSignificantWords(value: string): string[] {
  return normalizeText(value)
    .split(/\s+/)
    .filter(
      (word: string) =>
        word.length >= 5
    );
}

function isTooSimilarToExistingTitle(
  ideaTitle: string,
  existingTitles: string[]
): boolean {
  const normalizedIdea =
    normalizeText(ideaTitle);

  if (!normalizedIdea) {
    return true;
  }

  return existingTitles.some(
    (existingTitle: string) => {
      const normalizedExisting =
        normalizeText(existingTitle);

      if (!normalizedExisting) {
        return false;
      }

      // Exact match
      if (
        normalizedIdea ===
        normalizedExisting
      ) {
        return true;
      }

      const ideaWords =
        getSignificantWords(ideaTitle);

      const existingWords =
        getSignificantWords(existingTitle);

      if (
        ideaWords.length === 0 ||
        existingWords.length === 0
      ) {
        return false;
      }

      const matchingWords =
        ideaWords.filter(
          (word: string) =>
            existingWords.includes(word)
        );

      const similarity =
        matchingWords.length /
        Math.max(
          Math.min(
            ideaWords.length,
            existingWords.length
          ),
          1
        );

      /*
       * If too many important words are shared,
       * treat the idea as too similar.
       */
      return (
        matchingWords.length >= 2 &&
        similarity >= 0.6
      );
    }
  );
}

function removeDuplicateIdeas(
  ideas: ContentIdea[]
): ContentIdea[] {
  const seen = new Set<string>();

  return ideas.filter(
    (idea: ContentIdea) => {
      const normalizedTitle =
        normalizeText(idea.title);

      if (!normalizedTitle) {
        return false;
      }

      if (seen.has(normalizedTitle)) {
        return false;
      }

      seen.add(normalizedTitle);

      return true;
    }
  );
}

/*
 * ---------------------------------------------------------
 * Intelligent fallback
 * ---------------------------------------------------------
 *
 * IMPORTANT:
 * This fallback must NEVER simply rename an existing video.
 *
 * The fallback creates genuinely different content formats
 * and concepts when OpenAI is unavailable.
 * ---------------------------------------------------------
 */

function generateFallbackIdeas(
  videos: Video[]
): ContentIdea[] {
  if (!videos || videos.length === 0) {
    return [
      {
        title:
          "The 30-Day YouTube Challenge: What Can You Build From Zero?",
        angle:
          "Create a practical challenge showing the process of building a channel step by step.",
        reason:
          "There is not enough channel history yet, so a structured experiment can create useful content while generating new performance data.",
      },
      {
        title:
          "5 YouTube Experiments Every Creator Should Try",
        angle:
          "Turn content growth into a series of controlled experiments.",
        reason:
          "Experiment-based content gives the audience something actionable while helping discover which formats work best.",
      },
      {
        title:
          "Why Some Good Videos Never Get Attention",
        angle:
          "Explain the difference between having a good idea and presenting it in a way people want to click.",
        reason:
          "This explores the broader content strategy problem rather than depending on an existing video topic.",
      },
      {
        title:
          "I Changed My Entire Video Strategy for 7 Days",
        angle:
          "Use a short challenge format to test a completely different publishing strategy.",
        reason:
          "A challenge creates a new narrative structure and gives viewers a reason to follow the experiment.",
      },
      {
        title:
          "The Creator's Checklist Before Hitting Publish",
        angle:
          "Build a practical pre-publishing checklist covering the decisions that matter before releasing a video.",
        reason:
          "This provides a useful evergreen concept without copying any previous video title.",
      },
    ];
  }

  const normalizedVideos = videos
    .map((video: Video) => ({
      title: String(
        video.title ?? ""
      ).trim(),
      views: Number(
        video.views ?? 0
      ),
    }))
    .filter(
      (video) =>
        video.title.length > 0
    )
    .sort(
      (a, b) =>
        b.views - a.views
    );

  const existingTitles =
    normalizedVideos.map(
      (video) => video.title
    );

  /*
   * These are deliberately different content formats.
   * We use channel performance only as evidence that
   * the channel has enough data to justify experimentation.
   */

  const candidateIdeas: ContentIdea[] = [
    {
      title:
        "I Tried the 80/20 Rule on My YouTube Channel",
      angle:
        "Identify the small number of actions that could produce the biggest improvement and test them publicly.",
      reason:
        "Your channel already has performance history, making it possible to turn growth into a practical experiment rather than repeating an existing topic.",
    },
    {
      title:
        "What Happens When You Stop Chasing Every Trend?",
      angle:
        "Explore whether focusing on a consistent content strategy can outperform constantly following trends.",
      reason:
        "This introduces a strategic question that is different from simply reproducing your existing successful topics.",
    },
    {
      title:
        "I Built My Next Video Using Only Viewer Psychology",
      angle:
        "Create a video around curiosity, attention, storytelling, and viewer motivation instead of a specific existing topic.",
      reason:
        "The concept focuses on how content is constructed, creating a new direction while still being relevant to channel growth.",
    },
    {
      title:
        "The 7-Day Content Experiment: One Small Change Every Day",
      angle:
        "Run a seven-day experiment where each day tests one different content decision.",
      reason:
        "A serialized experiment creates a completely different format and gives the audience a reason to keep watching.",
    },
    {
      title:
        "If I Had to Grow This Channel Again, This Is What I Would Do",
      angle:
        "Create a strategic roadmap based on lessons learned from the channel's existing performance.",
      reason:
        "This transforms existing experience into a new educational format instead of copying an old video.",
    },
    {
      title:
        "3 Video Formats That Could Change the Way You Create",
      angle:
        "Compare three fundamentally different video structures and explain when each one makes sense.",
      reason:
        "Format-based content creates new opportunities without relying on the titles of existing uploads.",
    },
    {
      title:
        "The Hidden Problem With Making Too Much Content",
      angle:
        "Examine the trade-off between publishing more videos and improving the quality of each upload.",
      reason:
        "This approaches creator growth from a strategic problem rather than repeating an existing topic.",
    },
    {
      title:
        "I Let the Data Decide What I Create Next",
      angle:
        "Turn the channel's analytics into a public decision-making experiment.",
      reason:
        "Your existing performance data can become the foundation of a new story rather than simply generating another version of an old video.",
    },
  ];

  /*
   * Remove anything that accidentally resembles an existing
   * video title.
   */
  const filteredIdeas =
    candidateIdeas.filter(
      (idea: ContentIdea) =>
        !isTooSimilarToExistingTitle(
          idea.title,
          existingTitles
        )
    );

  /*
   * Remove duplicate ideas and return the first five.
   */
  const uniqueIdeas =
    removeDuplicateIdeas(
      filteredIdeas
    );

  return uniqueIdeas.slice(0, 5);
}

/*
 * ---------------------------------------------------------
 * API
 * ---------------------------------------------------------
 */

export async function POST() {
  try {
    // ---------------------------------------------------------
    // 1. Verify authenticated Supabase user
    // ---------------------------------------------------------

    const supabase =
      await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (
      authError ||
      !user
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // ---------------------------------------------------------
    // 2. Load profile for THIS user only
    // ---------------------------------------------------------

    const {
      data: profile,
    } =
      await supabaseAdmin
        .from("channel_profiles")
        .select(
          "channel_name, youtube_channel_id"
        )
        .eq("id", user.id)
        .maybeSingle();

    // ---------------------------------------------------------
    // 3. Load videos for THIS user only
    // ---------------------------------------------------------

    const {
      data: videos,
      error: videosError,
    } =
      await supabaseAdmin
        .from("youtube_videos")
        .select(
          "title, views"
        )
        .eq(
          "user_id",
          user.id
        )
        .order(
          "views",
          {
            ascending: false,
          }
        )
        .limit(20);

    if (videosError) {
      console.error(
        "Content ideas lookup error."
      );

      return NextResponse.json(
        {
          error:
            "Failed to load video data.",
        },
        {
          status: 500,
        }
      );
    }

    // ---------------------------------------------------------
    // 4. Try OpenAI
    // ---------------------------------------------------------

    try {
      if (
        !process.env
          .OPENAI_API_KEY
      ) {
        throw new Error(
          "OPENAI_API_KEY is not configured."
        );
      }

      const openai =
        new OpenAI({
          apiKey:
            process.env
              .OPENAI_API_KEY,
        });

      const existingTitles =
        (videos ?? [])
          .map(
            (video) =>
              String(
                video.title ?? ""
              ).trim()
          )
          .filter(
            (title: string) =>
              Boolean(title)
          );

      const prompt = `
You are an elite YouTube content strategist.

Your task is to generate genuinely NEW video concepts for this specific channel.

CHANNEL:
${JSON.stringify(profile)}

EXISTING VIDEOS:
${JSON.stringify(videos)}

EXISTING VIDEO TITLES:
${JSON.stringify(existingTitles)}

==================================================
CRITICAL CONTENT RULES
==================================================

Generate EXACTLY 5 genuinely new ideas.

The goal is NOT to rewrite existing videos.

DO NOT:

- Copy an existing title.
- Paraphrase an existing title.
- Slightly modify an existing title.
- Add words to an existing title.
- Remove words from an existing title.
- Create "A New Take on..." versions.
- Create "Part 2" versions unless the supplied data clearly proves that a continuation is appropriate.
- Use the same core topic with only different wording.
- Reuse distinctive phrases from existing titles.
- Generate five variations of the same concept.

Instead:

1. Study the existing videos ONLY to understand audience/content patterns.
2. Find opportunities for NEW subjects, questions, problems, stories, experiments, formats, or perspectives.
3. Each of the 5 ideas must be meaningfully different.
4. Prefer ideas that could realistically become strong YouTube videos.
5. Titles must sound natural and clickable, not like AI-generated marketing slogans.
6. Do not invent statistics.
7. Do not invent channel facts.
8. Do not claim that a topic is successful unless the supplied data supports that conclusion.
9. The five ideas must have different concepts, not just different titles.
10. If the existing videos are concentrated around one subject, explore adjacent opportunities instead of repeatedly returning to that exact subject.

==================================================
DIVERSITY REQUIREMENT
==================================================

Across the 5 ideas, try to vary the format.

For example, use different combinations of:

- Experiment
- Challenge
- Educational breakdown
- Story
- Comparison
- Mistakes
- Strategy
- Behind-the-scenes
- Case study
- Question/problem
- Step-by-step framework

Do NOT force these exact formats if they do not fit the channel.

==================================================
FINAL QUALITY CHECK
==================================================

Before returning an idea, mentally compare its title against every existing title.

Reject the idea if it:

- Looks like a renamed existing video.
- Shares the same main phrase.
- Is essentially the same topic.
- Is only a different angle on the exact same video.
- Sounds like a generic "new take" of an existing upload.

Also compare the 5 generated ideas against each other.

Reject duplicates.

Return ONLY valid JSON:

{
  "ideas": [
    {
      "title": "new YouTube title",
      "angle": "specific explanation of the new content approach",
      "reason": "why this idea makes sense based on the supplied channel data"
    }
  ]
}
`;

      const response =
        await openai.responses.create(
          {
            model:
              "gpt-5-mini",
            input: prompt,
          }
        );

      const result =
        JSON.parse(
          response.output_text
        );

      const ideas =
        Array.isArray(
          result.ideas
        )
          ? (
              result.ideas as unknown[]
            )
              .filter(
                (
                  idea: unknown
                ): idea is RawContentIdea =>
                  typeof idea ===
                    "object" &&
                  idea !== null &&
                  "title" in idea &&
                  "angle" in idea &&
                  "reason" in idea
              )
              .map(
                (
                  idea: RawContentIdea
                ): ContentIdea => ({
                  title:
                    typeof idea.title ===
                    "string"
                      ? idea.title.trim()
                      : "",

                  angle:
                    typeof idea.angle ===
                    "string"
                      ? idea.angle.trim()
                      : "",

                  reason:
                    typeof idea.reason ===
                    "string"
                      ? idea.reason.trim()
                      : "",
                })
              )
              .filter(
                (
                  idea: ContentIdea
                ) =>
                  Boolean(
                    idea.title &&
                      idea.angle &&
                      idea.reason
                  )
              )
              .filter(
                (
                  idea: ContentIdea
                ) =>
                  !isTooSimilarToExistingTitle(
                    idea.title,
                    existingTitles
                  )
              )
          : [];

      const uniqueIdeas =
        removeDuplicateIdeas(
          ideas
        ).slice(0, 5);

      /*
       * We require five strong ideas.
       * If OpenAI does not provide five sufficiently
       * different ideas, use the safe fallback instead.
       */
      if (
        uniqueIdeas.length < 5
      ) {
        throw new Error(
          "OpenAI returned fewer than 5 sufficiently diverse content ideas."
        );
      }

      return NextResponse.json(
        {
          ideas: uniqueIdeas,
          source: "openai",
        }
      );
    } catch (aiError) {
      console.warn(
        "OpenAI unavailable. Using fallback content ideas.",
        aiError instanceof Error
          ? aiError.message
          : "Unknown AI error."
      );

      return NextResponse.json(
        {
          ideas:
            generateFallbackIdeas(
              videos ?? []
            ),
          source:
            "fallback",
        }
      );
    }
  } catch (error) {
    console.error(
      "Content ideas error:",
      error instanceof Error
        ? error.message
        : "Unknown server error."
    );

    return NextResponse.json(
      {
        error:
          "Failed to generate content ideas.",
      },
      {
        status: 500,
      }
    );
  }
}