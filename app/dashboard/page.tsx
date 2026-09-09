"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import StatCard from "../components/StatCard";
import AnalyticsChart from "../components/AnalyticsChart";
import TopVideos from "../components/TopVideos";
import Sidebar from "../components/Sidebar";
type AnalyticsPoint = {
  day: string;
  views: number;
};

type YoutubeVideo = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string | null;
  duration: string | null;
  views: number;
  likes: number;
  comments: number;
};

type Profile = {
  id: string;
  channel_name: string | null;
  youtube_channel_id: string | null;
};

type YoutubeChannel = {
  id: string;
  name: string;
  description: string;
  customUrl: string;
  thumbnail: string;
  views: number;
  subscribers: number;
  videos: number;
};

type VideoAnalytics = {
  summary: {
    totalVideos: number;
    totalViews: number;
    averageViews: number;
    totalLikes: number;
    totalComments: number;
  };
  bestVideo: {
    id: string;
    title: string;
    thumbnail?: string;
    views: number;
    likes: number;
    comments: number;
    engagementRate: number;
    performanceScore: number;
  } | null;
  worstVideo: {
    id: string;
    title: string;
    thumbnail?: string;
    views: number;
    likes: number;
    comments: number;
    engagementRate: number;
    performanceScore: number;
  } | null;
  videos: {
    id: string;
    title: string;
    thumbnail?: string;
    publishedAt?: string | null;
    views: number;
    likes: number;
    comments: number;
    engagementRate: number;
    performanceScore: number;
  }[];
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ContentIdea = {
  title: string;
  angle: string;
  reason: string;
};

function DashboardContent() {
  const router = useRouter();
    const searchParams = useSearchParams();

  // ---------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/auth/login");
    router.refresh();
  }

  // ---------------------------------------------------------
  // BASIC DASHBOARD STATES
  // ---------------------------------------------------------

  const [selectedPeriod, setSelectedPeriod] = useState<
    "7d" | "28d" | "90d"
  >("7d");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [channelStats, setChannelStats] = useState({
    views: 0,
    subscribers: 0,
    watchTime: 0,
    ctr: 0,
  });

  const [analytics, setAnalytics] = useState<{
    "7d": AnalyticsPoint[];
    "28d": AnalyticsPoint[];
    "90d": AnalyticsPoint[];
  }>({
    "7d": [],
    "28d": [],
    "90d": [],
  });

  const [dashboardTopVideos, setDashboardTopVideos] = useState<
  {
    title: string;
    ctr: number;
    views: number;
    thumbnail?: string | null;
  }[]
>([]);

  // ---------------------------------------------------------
  // PROFILE
  // ---------------------------------------------------------

  const [profile, setProfile] = useState<Profile | null>(null);

  // ---------------------------------------------------------
  // YOUTUBE CONNECTION
  // ---------------------------------------------------------

  const [youtubeConnected, setYoutubeConnected] =
    useState(false);

  const [youtubeChannel, setYoutubeChannel] =
    useState<YoutubeChannel | null>(null);

  const [youtubeLoading, setYoutubeLoading] =
    useState(true);

  const [youtubeVideos, setYoutubeVideos] = useState<
    YoutubeVideo[]
  >([]);

  // ---------------------------------------------------------
  // YOUTUBE ANALYTICS
  // ---------------------------------------------------------

  const [youtubeAnalytics, setYoutubeAnalytics] = useState<{
    "7d": AnalyticsPoint[];
    "28d": AnalyticsPoint[];
    "90d": AnalyticsPoint[];
  }>({
    "7d": [],
    "28d": [],
    "90d": [],
  });

  const [youtubePeriodStats, setYoutubePeriodStats] =
    useState({
      views: 0,
      likes: 0,
      comments: 0,
      estimatedMinutesWatched: 0,
      subscribersGained: 0,
    });

  const [analyticsLoading, setAnalyticsLoading] =
    useState(false);

  // ---------------------------------------------------------
  // ANALYSIS
  // ---------------------------------------------------------

  const [insights, setInsights] = useState({
    summary: "",
    recommendation: "",
  });

  const [analysis, setAnalysis] = useState({
    performanceScore: 0,
    strengths: [] as string[],
    weaknesses: [] as string[],
    recommendations: [] as string[],
  });

  // ---------------------------------------------------------
  // VIDEO ANALYTICS
  // ---------------------------------------------------------

  const [videoAnalytics, setVideoAnalytics] =
    useState<VideoAnalytics | null>(null);

  // ---------------------------------------------------------
  // CHAT
  // ---------------------------------------------------------

  const [chatMessages, setChatMessages] = useState<
    ChatMessage[]
  >([]);

  const [chatInput, setChatInput] = useState("");

  const [chatLoading, setChatLoading] = useState(false);

  // ---------------------------------------------------------
  // CONTENT IDEAS
  // ---------------------------------------------------------

  const [contentIdeas, setContentIdeas] = useState<
    ContentIdea[]
  >([]);

  const [contentIdeasLoading, setContentIdeasLoading] =
    useState(false);

  // ---------------------------------------------------------
  // INITIAL DATA LOADING
  // ---------------------------------------------------------

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        // -----------------------------------------------------
        // Load existing dashboard data
        // -----------------------------------------------------

        const response = await fetch("/api/channel");

        if (!response.ok) {
          throw new Error(
            "Failed to fetch channel stats."
          );
        }

        const data = await response.json();

        setChannelStats(data);

        if (data.analytics) {
          setAnalytics(data.analytics);
        }

        if (data.topVideos) {
          setDashboardTopVideos(data.topVideos);
        }

        if (data.insights) {
          setInsights(data.insights);
        }

        if (data.analysis) {
          setAnalysis(data.analysis);
        }

        // -----------------------------------------------------
        // Load profile
        // -----------------------------------------------------

        const profileResponse = await fetch(
          "/api/profile"
        );

        if (profileResponse.ok) {
          const profileData =
            await profileResponse.json();

          setProfile(profileData.profile);
        }

        // -----------------------------------------------------
        // Check YouTube connection
        // -----------------------------------------------------

        const youtubeStatusResponse =
          await fetch("/api/youtube/status");

        if (!youtubeStatusResponse.ok) {
          setYoutubeConnected(false);
          return;
        }

        const youtubeStatusData =
          await youtubeStatusResponse.json();

        const isConnected =
          Boolean(youtubeStatusData.connected);

        setYoutubeConnected(isConnected);

        // -----------------------------------------------------
        // If connected, load real YouTube data
        // -----------------------------------------------------

        if (!isConnected) {
          return;
        }

        // -----------------------------------------------------
        // YouTube channel
        // -----------------------------------------------------

        const channelResponse = await fetch(
          "/api/youtube/channel"
        );

        if (channelResponse.ok) {
          const channelData =
            await channelResponse.json();

          setYoutubeChannel(channelData.channel);
        }

        // -----------------------------------------------------
        // Sync YouTube videos after a successful OAuth reconnect.
        // This runs only when the OAuth callback sends
        // ?youtube_connected=true, so normal Dashboard refreshes
        // do not trigger unnecessary YouTube API syncs.
        // -----------------------------------------------------

        const youtubeJustConnected =
          searchParams.get("youtube_connected") === "true";

        if (youtubeJustConnected) {
          try {
            const syncResponse = await fetch(
              "/api/youtube/videos/sync",
              {
                method: "POST",
              }
            );

            if (!syncResponse.ok) {
              const syncData =
                await syncResponse.json().catch(() => null);

              console.error(
                "YouTube video sync failed:",
                syncData?.error ??
                  "Failed to sync YouTube videos."
              );
            }
          } catch (syncError) {
            console.error(
              "YouTube video sync request failed:",
              syncError
            );
          }
        }

        // -----------------------------------------------------
// Sync YouTube videos
// -----------------------------------------------------

const syncResponse = await fetch(
  "/api/youtube/videos/sync",
  {
    method: "POST",
  }
);

if (!syncResponse.ok) {
  console.error(
    "YouTube video sync failed."
  );
}

// -----------------------------------------------------
// Load synced YouTube videos
// -----------------------------------------------------

const videosResponse = await fetch(
  "/api/youtube/videos"
);

if (videosResponse.ok) {
  const videosData =
    await videosResponse.json();

  setYoutubeVideos(
    Array.isArray(videosData.videos)
      ? videosData.videos
      : []
  );
}

// -----------------------------------------------------
// Video analytics
// -----------------------------------------------------

const videoAnalyticsResponse =
  await fetch(
    "/api/youtube/video-analytics"
  );

if (videoAnalyticsResponse.ok) {
  const videoAnalyticsData =
    await videoAnalyticsResponse.json();

  setVideoAnalytics(
    videoAnalyticsData
  );
}
      } catch (err) {
        console.error(
          "Dashboard loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard."
        );
      } finally {
        setYoutubeLoading(false);
        setLoading(false);
      }
    }

    loadDashboard();
  }, [searchParams]);

  // ---------------------------------------------------------
  // LOAD ANALYTICS WHEN PERIOD CHANGES
  // ---------------------------------------------------------

  useEffect(() => {
    async function loadSelectedAnalytics() {
      if (!youtubeConnected) {
        setYoutubeAnalytics((current) => ({
          ...current,
          [selectedPeriod]: [],
        }));

        setYoutubePeriodStats({
          views: 0,
          likes: 0,
          comments: 0,
          estimatedMinutesWatched: 0,
          subscribersGained: 0,
        });

        return;
      }

      try {
        setAnalyticsLoading(true);

        const response = await fetch(
          `/api/youtube/analytics?period=${selectedPeriod}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load ${selectedPeriod} YouTube analytics.`
          );
        }

        const data = await response.json();

        const rawAnalytics = Array.isArray(
          data.analytics
        )
          ? data.analytics
          : [];

        const chartData: AnalyticsPoint[] =
          rawAnalytics.map(
            (item: {
              date: string;
              views: number;
            }) => ({
              day: item.date,
              views: Number(item.views ?? 0),
            })
          );

        setYoutubeAnalytics((current) => ({
          ...current,
          [selectedPeriod]: chartData,
        }));

        const totals = rawAnalytics.reduce(
          (
            totals: {
              views: number;
              likes: number;
              comments: number;
              estimatedMinutesWatched: number;
              subscribersGained: number;
            },
            item: {
              views?: number;
              likes?: number;
              comments?: number;
              estimatedMinutesWatched?: number;
              subscribersGained?: number;
            }
          ) => {
            totals.views += Number(item.views ?? 0);
            totals.likes += Number(item.likes ?? 0);
            totals.comments += Number(
              item.comments ?? 0
            );
            totals.estimatedMinutesWatched += Number(
              item.estimatedMinutesWatched ?? 0
            );
            totals.subscribersGained += Number(
              item.subscribersGained ?? 0
            );

            return totals;
          },
          {
            views: 0,
            likes: 0,
            comments: 0,
            estimatedMinutesWatched: 0,
            subscribersGained: 0,
          }
        );

        setYoutubePeriodStats(totals);
      } catch (err) {
        console.error(
          "Analytics loading error:",
          err
        );
      } finally {
        setAnalyticsLoading(false);
      }
    }

    loadSelectedAnalytics();
  }, [selectedPeriod, youtubeConnected]);

  // ---------------------------------------------------------
  // AI CHAT
  // ---------------------------------------------------------

  async function handleSendChat() {
    const message = chatInput.trim();

    if (!message || chatLoading) {
      return;
    }

    setChatMessages((messages) => [
      ...messages,
      {
        role: "user",
        content: message,
      },
    ]);

    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch(
        "/api/ai/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to get AI response."
        );
      }

      setChatMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content:
            data.answer ||
            "I could not generate an answer.",
        },
      ]);
    } catch (err) {
      console.error(
        "Chat error:",
        err
      );

      setChatMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content:
            err instanceof Error
              ? err.message
              : "Something went wrong.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  // ---------------------------------------------------------
  // CONTENT IDEAS
  // ---------------------------------------------------------

  async function handleGenerateContentIdeas() {
    if (contentIdeasLoading) {
      return;
    }

    setContentIdeasLoading(true);

    try {
      const response = await fetch(
        "/api/ai/content-ideas",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to generate content ideas."
        );
      }

      setContentIdeas(
        Array.isArray(data.ideas)
          ? data.ideas
          : []
      );
    } catch (err) {
      console.error(
        "Content ideas error:",
        err
      );

      setContentIdeas([]);
    } finally {
      setContentIdeasLoading(false);
    }
  }

  // ---------------------------------------------------------
  // AI CHANNEL ANALYSIS
  // ---------------------------------------------------------

  async function handleGenerateAiAnalysis() {
    try {
      const response = await fetch(
        "/api/ai/channel-analysis",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to generate AI analysis."
        );
      }

      if (!data.analysis) {
        throw new Error(
          "No analysis was returned."
        );
      }

      setInsights({
        summary:
          data.analysis.summary ?? "",
        recommendation:
          data.analysis.recommendations?.[0] ??
          "",
      });

      setAnalysis({
        performanceScore:
          Number(
            data.analysis
              .performanceScore ?? 0
          ),
        strengths:
          data.analysis.strengths ?? [],
        weaknesses:
          data.analysis.weaknesses ?? [],
        recommendations:
          data.analysis.recommendations ??
          [],
      });
    } catch (err) {
      console.error(
        "AI analysis error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to generate AI analysis."
      );
    }
  }

  // ---------------------------------------------------------
  // DISCONNECT YOUTUBE
  // ---------------------------------------------------------

  async function handleDisconnectYouTube() {
    try {
      const response = await fetch(
        "/api/youtube/disconnect",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to disconnect YouTube."
        );
      }

      setYoutubeConnected(false);
      setYoutubeChannel(null);
      setYoutubeVideos([]);
      setVideoAnalytics(null);

      setYoutubeAnalytics({
        "7d": [],
        "28d": [],
        "90d": [],
      });

      setYoutubePeriodStats({
        views: 0,
        likes: 0,
        comments: 0,
        estimatedMinutesWatched: 0,
        subscribersGained: 0,
      });
    } catch (err) {
      console.error(
        "Disconnect error:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to disconnect YouTube."
      );
    }
  }

  // ---------------------------------------------------------
  // SELECTED CHART DATA
  // ---------------------------------------------------------

  const selectedAnalyticsData =
    youtubeAnalytics[selectedPeriod];

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <p className="text-lg font-medium">
            Loading channel data...
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            Please wait a moment.
          </p>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------
  // ERROR
  // ---------------------------------------------------------

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <p className="text-lg font-medium text-red-400">
            Something went wrong.
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            {error}
          </p>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------
  // DASHBOARD UI
  // ---------------------------------------------------------

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="flex min-h-screen">

  <Sidebar />

  <section className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">

            {/* =================================================
                HEADER
            ================================================== */}

            <header>
              <div>
                <p className="text-sm text-zinc-400">
                  Welcome back
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  Channel Overview
                </h1>

                {profile?.channel_name && (
                  <p className="mt-2 text-sm text-zinc-500">
                    {profile.channel_name}
                  </p>
                )}
              </div>

              <div className="mt-8">
                {youtubeLoading ? (
                  <div className="text-sm text-zinc-500">
                    Checking YouTube connection...
                  </div>
                ) : youtubeConnected ? (
                  <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">

                    <p className="text-sm text-zinc-400">
                      YouTube Connected
                    </p>

                    <h2 className="mt-1 text-xl font-semibold">
                      {youtubeChannel?.name ||
                        profile?.channel_name ||
                        "YouTube Channel"}
                    </h2>

                    {youtubeChannel?.customUrl && (
                      <p className="mt-1 text-sm text-zinc-500">
                        {youtubeChannel.customUrl}
                      </p>
                    )}

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">

                      <div>
                        <p className="text-xs text-zinc-500">
                          Views
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {(
                            youtubeChannel?.views ??
                            0
                          ).toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-zinc-500">
                          Subscribers
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {(
                            youtubeChannel?.subscribers ??
                            0
                          ).toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-zinc-500">
                          Videos
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {(
                            youtubeChannel?.videos ??
                            youtubeVideos.length
                          ).toLocaleString()}
                        </p>
                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={
                        handleDisconnectYouTube
                      }
                      className="mt-5 rounded-xl border border-red-900 px-4 py-2 text-sm text-red-400 transition hover:bg-red-950/40"
                    >
                      Disconnect YouTube
                    </button>

                  </div>
                ) : (
                  <a
                    href="/api/youtube/connect"
                    className="inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
                  >
                    Connect YouTube
                  </a>
                )}
              </div>
            </header>

            {/* =================================================
                REAL STATS
            ================================================== */}

            <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <StatCard
                label="Views"
                value={youtubeConnected
                  ? youtubePeriodStats.views.toLocaleString()
                  : channelStats.views.toLocaleString()
                }
                change={selectedPeriod.toUpperCase()}
              />

              <StatCard
                label="Subscribers Gained"
                value={youtubeConnected
                  ? youtubePeriodStats.subscribersGained.toLocaleString()
                  : "0"
                }
                change={selectedPeriod.toUpperCase()}
              />

              <StatCard
                label="Watch Time"
                value={youtubeConnected
                  ? `${(
                      youtubePeriodStats
                        .estimatedMinutesWatched /
                      60
                    ).toFixed(1)} h`
                  : `${channelStats.watchTime.toLocaleString()} h`
                }
                change={selectedPeriod.toUpperCase()}
              />

              <StatCard
                label="Likes"
                value={youtubeConnected
                  ? youtubePeriodStats.likes.toLocaleString()
                  : "0"
                }
                change={selectedPeriod.toUpperCase()}
              />

            </section>

            {/* =================================================
                ANALYTICS
            ================================================== */}

            <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

              <p className="text-sm text-zinc-400">
                Analytics
              </p>

              <h2 className="mt-1 text-2xl font-semibold">
                Views Over the Last{" "}
                {selectedPeriod === "7d"
                  ? "7 Days"
                  : selectedPeriod === "28d"
                    ? "28 Days"
                    : "90 Days"}
              </h2>

              <div className="mt-6 flex flex-wrap gap-2">

                <button
                  onClick={() =>
                    setSelectedPeriod("7d")
                  }
                  className={`rounded-lg px-4 py-2 text-sm transition ${
                    selectedPeriod === "7d"
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                >
                  7 Days
                </button>

                <button
                  onClick={() =>
                    setSelectedPeriod("28d")
                  }
                  className={`rounded-lg px-4 py-2 text-sm transition ${
                    selectedPeriod === "28d"
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                >
                  28 Days
                </button>

                <button
                  onClick={() =>
                    setSelectedPeriod("90d")
                  }
                  className={`rounded-lg px-4 py-2 text-sm transition ${
                    selectedPeriod === "90d"
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                >
                  90 Days
                </button>

              </div>

              <div className="mt-6">

                {analyticsLoading ? (
                  <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
                    Loading YouTube analytics...
                  </div>
                ) : selectedAnalyticsData.length > 0 ? (
                  <AnalyticsChart
                    data={selectedAnalyticsData}
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
                    No analytics data available for this period.
                  </div>
                )}

              </div>
            </section>

            {/* =================================================
                CHANNEL ANALYSIS
            ================================================== */}

            <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

              <div>
                <p className="text-sm text-zinc-400">
                  Channel Analysis
                </p>

                <h2 className="mt-1 text-2xl font-semibold">
                  Performance Overview
                </h2>
              </div>

              <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">

                <p className="text-sm text-zinc-400">
                  Performance Score
                </p>

                <div className="mt-2 flex items-end gap-2">

                  <span className="text-5xl font-bold">
                    {analysis.performanceScore}
                  </span>

                  <span className="mb-1 text-zinc-500">
                    / 100
                  </span>

                </div>

                <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-zinc-800">

                  <div
                    className="h-full rounded-full bg-white transition-all duration-700"
                    style={{
                      width: `${analysis.performanceScore}%`,
                    }}
                  />

                </div>

              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">

                  <h3 className="text-lg font-semibold">
                    Strengths
                  </h3>

                  <div className="mt-4 space-y-3">

                    {analysis.strengths.length > 0 ? (
                      analysis.strengths.map(
                        (strength) => (
                          <p
                            key={strength}
                            className="text-sm leading-6 text-zinc-300"
                          >
                            ✅ {strength}
                          </p>
                        )
                      )
                    ) : (
                      <p className="text-sm text-zinc-500">
                        No strengths detected yet.
                      </p>
                    )}

                  </div>

                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">

                  <h3 className="text-lg font-semibold">
                    Areas to Improve
                  </h3>

                  <div className="mt-4 space-y-3">

                    {analysis.weaknesses.length > 0 ? (
                      analysis.weaknesses.map(
                        (weakness) => (
                          <p
                            key={weakness}
                            className="text-sm leading-6 text-zinc-300"
                          >
                            ⚠️ {weakness}
                          </p>
                        )
                      )
                    ) : (
                      <p className="text-sm text-zinc-500">
                        No major weaknesses detected.
                      </p>
                    )}

                  </div>

                </div>

              </div>

              <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5">

                <h3 className="text-lg font-semibold">
                  Recommendations
                </h3>

                <div className="mt-4 space-y-3">

                  {analysis.recommendations.length >
                  0 ? (
                    analysis.recommendations.map(
                      (recommendation) => (
                        <p
                          key={recommendation}
                          className="text-sm leading-6 text-zinc-300"
                        >
                          🎯 {recommendation}
                        </p>
                      )
                    )
                  ) : (
                    <p className="text-sm text-zinc-500">
                      No recommendations available yet.
                    </p>
                  )}

                </div>
              </div>

            </section>

            {/* =================================================
                AI COACH
            ================================================== */}

            <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

              <p className="text-sm font-medium text-zinc-400">
                AI Coach
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                {insights.summary ||
                  "Get an AI-powered analysis of your channel."}
              </h2>

              <p className="mt-3 max-w-3xl leading-7 text-zinc-400">
                {insights.recommendation ||
                  "Use your real YouTube data to generate personalized recommendations."}
              </p>

              <button
                type="button"
                onClick={
                  handleGenerateAiAnalysis
                }
                className="mt-6 rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
              >
                Ask AI Coach
              </button>

            </section>

            {/* =================================================
                AI CHAT
            ================================================== */}

            <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

              <p className="text-sm font-medium text-zinc-400">
                AI Coach Chat
              </p>

              <h2 className="mt-1 text-2xl font-semibold">
                Ask about your channel
              </h2>

              <div className="mt-6 max-h-96 space-y-4 overflow-y-auto">

                {chatMessages.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    Ask something like:
                    "What is my best video?"
                  </p>
                ) : (
                  chatMessages.map(
                    (message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={
                          message.role === "user"
                            ? "ml-auto max-w-[85%] rounded-2xl bg-white p-4 text-black"
                            : "max-w-[85%] rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-200"
                        }
                      >
                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {message.content}
                        </p>
                      </div>
                    )
                  )
                )}

              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">

                <input
                  value={chatInput}
                  onChange={(event) =>
                    setChatInput(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      handleSendChat();
                    }
                  }}
                  placeholder="Ask about your channel..."
                  className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none"
                />

                <button
                  type="button"
                  onClick={handleSendChat}
                  disabled={
                    chatLoading ||
                    !chatInput.trim()
                  }
                  className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {chatLoading
                    ? "Sending..."
                    : "Send"}
                </button>

              </div>

            </section>

            {/* =================================================
                CONTENT IDEAS
            ================================================== */}

            <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>
                  <p className="text-sm font-medium text-zinc-400">
                    Content Ideas
                  </p>

                  <h2 className="mt-1 text-2xl font-semibold">
                    Ideas based on your channel
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={
                    handleGenerateContentIdeas
                  }
                  disabled={
                    contentIdeasLoading
                  }
                  className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {contentIdeasLoading
                    ? "Generating..."
                    : "Generate Ideas"}
                </button>

              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                {contentIdeas.length === 0 ? (
                  <p className="text-sm text-zinc-500 lg:col-span-3">
                    Click "Generate Ideas" to get content suggestions.
                  </p>
                ) : (
                  contentIdeas.map(
                    (idea, index) => (
                      <div
                        key={`${idea.title}-${index}`}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
                      >

                        <p className="text-xs text-zinc-500">
                          IDEA {index + 1}
                        </p>

                        <h3 className="mt-2 text-lg font-semibold">
                          {idea.title}
                        </h3>

                        <p className="mt-4 text-sm leading-6 text-zinc-300">
                          {idea.angle}
                        </p>

                        <p className="mt-4 text-sm leading-6 text-zinc-500">
                          {idea.reason}
                        </p>

                      </div>
                    )
                  )
                )}

              </div>

            </section>

            {/* =================================================
                TOP VIDEOS
            ================================================== */}

            <section className="mt-8">
              <TopVideos
                videos={dashboardTopVideos}
              />
            </section>

            {/* =================================================
                VIDEO ANALYTICS
            ================================================== */}

            {videoAnalytics && (
              <section className="mt-8 grid gap-6 lg:grid-cols-2">

                {/* Best Video */}

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

                  <p className="text-sm text-zinc-400">
                    Best Performing Video
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">
                    {videoAnalytics.bestVideo?.title ||
                      "No data"}
                  </h2>

                  <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">

                    <div>
                      <p className="text-xs text-zinc-500">
                        Views
                      </p>

                      <p className="mt-1 font-semibold">
                        {(
                          videoAnalytics.bestVideo?.views ??
                          0
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500">
                        Likes
                      </p>

                      <p className="mt-1 font-semibold">
                        {(
                          videoAnalytics.bestVideo?.likes ??
                          0
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500">
                        Score
                      </p>

                      <p className="mt-1 font-semibold">
                        {videoAnalytics.bestVideo
                          ?.performanceScore ??
                          0}
                        /100
                      </p>
                    </div>

                  </div>

                </div>

                {/* Worst Video */}

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

                  <p className="text-sm text-zinc-400">
                    Lowest Performing Video
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">
                    {videoAnalytics.worstVideo?.title ||
                      "No data"}
                  </h2>

                  <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">

                    <div>
                      <p className="text-xs text-zinc-500">
                        Views
                      </p>

                      <p className="mt-1 font-semibold">
                        {(
                          videoAnalytics.worstVideo?.views ??
                          0
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500">
                        Likes
                      </p>

                      <p className="mt-1 font-semibold">
                        {(
                          videoAnalytics.worstVideo?.likes ??
                          0
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500">
                        Score
                      </p>

                      <p className="mt-1 font-semibold">
                        {videoAnalytics.worstVideo
                          ?.performanceScore ??
                          0}
                        /100
                      </p>
                    </div>

                  </div>

                </div>

              </section>
            )}

          </div>
        </section>
      </div>
    </main>
  );
}
export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
          <div className="text-center">
            <p className="text-lg font-medium">
              Loading dashboard...
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Please wait a moment.
            </p>
          </div>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}