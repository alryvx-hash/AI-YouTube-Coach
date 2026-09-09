                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "../components/Sidebar";

import AnalyticsChart from "../components/AnalyticsChart";

type AnalyticsPoint = {
  day: string;
  views: number;
};

type Period = "7d" | "28d" | "90d";

export default function AnalyticsPage() {
  const router = useRouter();

  const [selectedPeriod, setSelectedPeriod] =
    useState<Period>("7d");

  const [analytics, setAnalytics] = useState<
    AnalyticsPoint[]
  >([]);

  const [stats, setStats] = useState({
    views: 0,
    likes: 0,
    comments: 0,
    estimatedMinutesWatched: 0,
    subscribersGained: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

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
              views?: number;
            }) => ({
              day: item.date,
              views: Number(item.views ?? 0),
            })
          );

        setAnalytics(chartData);

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

            totals.likes += Number(
              item.likes ?? 0
            );

            totals.comments += Number(
              item.comments ?? 0
            );

            totals.estimatedMinutesWatched +=
              Number(
                item.estimatedMinutesWatched ?? 0
              );

            totals.subscribersGained +=
              Number(
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

        setStats(totals);
      } catch (err) {
        console.error(
          "Analytics page loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load analytics."
        );

        setAnalytics([]);

        setStats({
          views: 0,
          likes: 0,
          comments: 0,
          estimatedMinutesWatched: 0,
          subscribersGained: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [selectedPeriod]);

  const periodLabel =
    selectedPeriod === "7d"
      ? "7 Days"
      : selectedPeriod === "28d"
        ? "28 Days"
        : "90 Days";

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="flex min-h-screen">

        {/* =====================================================
            SIDEBAR
        ====================================================== */}

        <Sidebar />

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}

        <section className="flex-1">
          <div className="mx-auto max-w-7xl px-6 py-10">

            {/* HEADER */}

            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-zinc-400">
                  Channel Analytics
                </p>

                <h1 className="mt-1 text-3xl font-bold">
                  Analytics
                </h1>

                <p className="mt-2 text-sm text-zinc-500">
                  Track your YouTube performance over time.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push("/dashboard")
                }
                className="rounded-xl border border-zinc-800 px-5 py-3 text-sm text-zinc-300 transition hover:bg-zinc-900"
              >
                Back to Dashboard
              </button>
            </header>

            {/* PERIOD SELECTOR */}

            <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
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
                  type="button"
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
                  type="button"
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

            </section>

            {/* STAT CARDS */}

            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <p className="text-sm text-zinc-400">
                  Views
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {stats.views.toLocaleString()}
                </p>

                <p className="mt-2 text-xs text-zinc-500">
                  {periodLabel}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <p className="text-sm text-zinc-400">
                  Likes
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {stats.likes.toLocaleString()}
                </p>

                <p className="mt-2 text-xs text-zinc-500">
                  {periodLabel}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <p className="text-sm text-zinc-400">
                  Comments
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {stats.comments.toLocaleString()}
                </p>

                <p className="mt-2 text-xs text-zinc-500">
                  {periodLabel}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <p className="text-sm text-zinc-400">
                  Subscribers Gained
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {stats.subscribersGained.toLocaleString()}
                </p>

                <p className="mt-2 text-xs text-zinc-500">
                  {periodLabel}
                </p>
              </div>

            </section>

            {/* WATCH TIME */}

            <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

              <p className="text-sm text-zinc-400">
                Estimated Watch Time
              </p>

              <p className="mt-2 text-3xl font-bold">
                {(
                  stats.estimatedMinutesWatched /
                  60
                ).toFixed(1)}{" "}
                hours
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Estimated minutes watched from YouTube Analytics.
              </p>

            </section>

            {/* CHART */}

            <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

              <p className="text-sm text-zinc-400">
                Views
              </p>

              <h2 className="mt-1 text-2xl font-semibold">
                Views Over the Last {periodLabel}
              </h2>

              <div className="mt-6">

                {loading ? (
                  <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
                    Loading YouTube analytics...
                  </div>
                ) : error ? (
                  <div className="flex h-64 items-center justify-center text-center text-sm text-red-400">
                    {error}
                  </div>
                ) : analytics.length > 0 ? (
                  <AnalyticsChart
                    data={analytics}
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
                    No analytics data available for this period.
                  </div>
                )}

              </div>

            </section>

          </div>
        </section>
      </div>
    </main>
  );
}                                                                                           