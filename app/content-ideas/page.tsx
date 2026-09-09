"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "../components/Sidebar";

type ContentIdea = {
  title: string;
  angle: string;
  reason: string;
};

export default function ContentIdeasPage() {
  const router = useRouter();

  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  async function generateIdeas() {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");

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

      setIdeas(
        Array.isArray(data.ideas)
          ? data.ideas
          : []
      );
    } catch (err) {
      console.error(
        "Content ideas error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate content ideas."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setInitialLoading(false);
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}

        <Sidebar />

        {/* MAIN */}

        <section className="flex-1">
          <div className="mx-auto max-w-7xl px-6 py-10">

            {/* HEADER */}

            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm text-zinc-400">
                  AI Content Strategy
                </p>

                <h1 className="mt-1 text-3xl font-bold">
                  Content Ideas
                </h1>

                <p className="mt-2 text-sm text-zinc-500">
                  Discover video ideas tailored to your channel.
                </p>
              </div>

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={generateIdeas}
                  disabled={loading}
                  className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
                >
                  {loading
                    ? "Generating..."
                    : "Generate Ideas"}
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

            {/* EMPTY STATE */}

            {!initialLoading &&
              ideas.length === 0 &&
              !loading && (
                <section className="mt-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900 p-12 text-center">

                  <div className="mx-auto max-w-lg">

                    <p className="text-lg font-semibold">
                      No content ideas yet
                    </p>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      Generate personalized video ideas based on your channel data, audience, and content strategy.
                    </p>

                    <button
                      type="button"
                      onClick={generateIdeas}
                      className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200"
                    >
                      Generate My Ideas
                    </button>

                  </div>

                </section>
              )}

            {/* LOADING */}

            {loading && (
              <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">

                <p className="text-lg font-semibold">
                  AI Coach is generating ideas...
                </p>

                <p className="mt-2 text-sm text-zinc-500">
                  Analyzing your available channel data.
                </p>

              </section>
            )}

            {/* IDEAS */}

            {ideas.length > 0 && !loading && (
              <section className="mt-8">

                <div className="mb-6">
                  <p className="text-sm text-zinc-400">
                    Generated Ideas
                  </p>

                  <h2 className="mt-1 text-2xl font-semibold">
                    Your Next Video Ideas
                  </h2>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">

                  {ideas.map((idea, index) => (
                    <article
                      key={`${idea.title}-${index}`}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-zinc-700"
                    >

                      <div className="flex items-center justify-between">

                        <span className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
                          IDEA {index + 1}
                        </span>

                      </div>

                      <h3 className="mt-5 text-xl font-semibold leading-7">
                        {idea.title}
                      </h3>

                      <div className="mt-5">

                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          Angle
                        </p>

                        <p className="mt-2 text-sm leading-6 text-zinc-300">
                          {idea.angle}
                        </p>

                      </div>

                      <div className="mt-5">

                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          Why This Idea
                        </p>

                        <p className="mt-2 text-sm leading-6 text-zinc-500">
                          {idea.reason}
                        </p>

                      </div>

                    </article>
                  ))}

                </div>

              </section>
            )}

          </div>
        </section>
      </div>
    </main>
  );
}