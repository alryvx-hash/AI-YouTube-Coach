"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "../components/Sidebar";

type Video = {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  publishedAt: string | null;
  duration: string | null;
  views: number;
  likes: number;
  comments: number;
};

export default function VideosPage() {
  const router = useRouter();

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  async function loadVideos() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/youtube/videos");

      if (!response.ok) {
        throw new Error("Failed to load YouTube videos.");
      }

      const data = await response.json();

      setVideos(
        Array.isArray(data.videos)
          ? data.videos
          : []
      );
    } catch (err) {
      console.error(
        "Videos loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load videos."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    if (syncing) {
      return;
    }

    try {
      setSyncing(true);
      setError("");

      const response = await fetch(
        "/api/youtube/videos/sync",
        {
          method: "POST",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to sync YouTube videos."
        );
      }

      await loadVideos();
    } catch (err) {
      console.error(
        "Video sync error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to sync videos."
      );
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, []);

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
                  YouTube Content
                </p>

                <h1 className="mt-1 text-3xl font-bold">
                  Videos
                </h1>

                <p className="mt-2 text-sm text-zinc-500">
                  Manage and analyze your YouTube videos.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncing}
                  className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
                >
                  {syncing
                    ? "Syncing..."
                    : "Sync Videos"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/dashboard")
                  }
                  className="rounded-xl border border-zinc-800 px-5 py-3 text-sm text-zinc-300 transition hover:bg-zinc-900"
                >
                  Back
                </button>
              </div>
            </header>

            {/* ERROR */}

            {error && (
              <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* SUMMARY */}

            <section className="mt-8 grid gap-4 sm:grid-cols-3">

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <p className="text-sm text-zinc-400">
                  Total Videos
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {videos.length.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <p className="text-sm text-zinc-400">
                  Total Views
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {videos
                    .reduce(
                      (sum, video) =>
                        sum + Number(video.views || 0),
                      0
                    )
                    .toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <p className="text-sm text-zinc-400">
                  Total Likes
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {videos
                    .reduce(
                      (sum, video) =>
                        sum + Number(video.likes || 0),
                      0
                    )
                    .toLocaleString()}
                </p>
              </div>

            </section>

            {/* VIDEO GRID */}

            <section className="mt-8">

              {loading ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center text-sm text-zinc-500">
                  Loading videos...
                </div>
              ) : videos.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">

                  <p className="text-lg font-semibold">
                    No videos found
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    Connect your YouTube channel and sync your videos.
                  </p>

                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={syncing}
                    className="mt-5 rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {syncing
                      ? "Syncing..."
                      : "Sync Videos"}
                  </button>

                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

                  {videos.map((video) => (
                    <article
                      key={video.id}
                      className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
                    >
                      <div className="aspect-video bg-zinc-950">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
                            No thumbnail
                          </div>
                        )}
                      </div>

                      <div className="p-5">

                        <h2 className="line-clamp-2 text-lg font-semibold">
                          {video.title}
                        </h2>

                        {video.publishedAt && (
                          <p className="mt-2 text-xs text-zinc-500">
                            Published{" "}
                            {new Date(
                              video.publishedAt
                            ).toLocaleDateString()}
                          </p>
                        )}

                        <div className="mt-5 grid grid-cols-3 gap-3">

                          <div>
                            <p className="text-xs text-zinc-500">
                              Views
                            </p>

                            <p className="mt-1 font-semibold">
                              {Number(
                                video.views || 0
                              ).toLocaleString()}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-zinc-500">
                              Likes
                            </p>

                            <p className="mt-1 font-semibold">
                              {Number(
                                video.likes || 0
                              ).toLocaleString()}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-zinc-500">
                              Comments
                            </p>

                            <p className="mt-1 font-semibold">
                              {Number(
                                video.comments || 0
                              ).toLocaleString()}
                            </p>
                          </div>

                        </div>

                      </div>
                    </article>
                  ))}

                </div>
              )}

            </section>

          </div>
        </section>
      </div>
    </main>
  );
}