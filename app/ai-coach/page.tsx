"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "../components/Sidebar";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Analysis = {
  performanceScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
};

export default function AICoachPage() {
  const router = useRouter();

  const [chatMessages, setChatMessages] = useState<
    ChatMessage[]
  >([]);

  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [analysis, setAnalysis] =
    useState<Analysis | null>(null);

  const [analysisLoading, setAnalysisLoading] =
    useState(false);

  const [error, setError] = useState("");

  async function handleSendChat(
    event?: FormEvent<HTMLFormElement>
  ) {
    event?.preventDefault();

    const message = chatInput.trim();

    if (!message || chatLoading) {
      return;
    }

    setError("");

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
        "AI Coach chat error:",
        err
      );

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong.";

      setError(errorMessage);

      setChatMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content: errorMessage,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleGenerateAnalysis() {
    if (analysisLoading) {
      return;
    }

    try {
      setAnalysisLoading(true);
      setError("");

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

      setAnalysis({
        performanceScore: Number(
          data.analysis.performanceScore ?? 0
        ),
        strengths:
          Array.isArray(
            data.analysis.strengths
          )
            ? data.analysis.strengths
            : [],
        weaknesses:
          Array.isArray(
            data.analysis.weaknesses
          )
            ? data.analysis.weaknesses
            : [],
        recommendations:
          Array.isArray(
            data.analysis.recommendations
          )
            ? data.analysis.recommendations
            : [],
      });
    } catch (err) {
      console.error(
        "AI Coach analysis error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate AI analysis."
      );
    } finally {
      setAnalysisLoading(false);
    }
  }

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
                  AI-powered channel guidance
                </p>

                <h1 className="mt-1 text-3xl font-bold">
                  AI Coach
                </h1>

                <p className="mt-2 text-sm text-zinc-500">
                  Get personalized advice based on your YouTube data.
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

            {/* ERROR */}

            {error && (
              <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* =================================================
                AI ANALYSIS
            ================================================== */}

            <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-zinc-400">
                    Channel Analysis
                  </p>

                  <h2 className="mt-1 text-2xl font-semibold">
                    AI Performance Analysis
                  </h2>

                  <p className="mt-2 text-sm text-zinc-500">
                    Analyze your channel and receive actionable recommendations.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleGenerateAnalysis
                  }
                  disabled={analysisLoading}
                  className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
                >
                  {analysisLoading
                    ? "Analyzing..."
                    : "Analyze Channel"}
                </button>
              </div>

              {analysis ? (
                <div className="mt-8">

                  {/* SCORE */}

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">

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
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              analysis.performanceScore
                            )
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                  {/* STRENGTHS / WEAKNESSES */}

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">

                      <h3 className="text-lg font-semibold">
                        Strengths
                      </h3>

                      <div className="mt-5 space-y-3">

                        {analysis.strengths.length >
                        0 ? (
                          analysis.strengths.map(
                            (
                              strength,
                              index
                            ) => (
                              <p
                                key={`${strength}-${index}`}
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

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">

                      <h3 className="text-lg font-semibold">
                        Areas to Improve
                      </h3>

                      <div className="mt-5 space-y-3">

                        {analysis.weaknesses.length >
                        0 ? (
                          analysis.weaknesses.map(
                            (
                              weakness,
                              index
                            ) => (
                              <p
                                key={`${weakness}-${index}`}
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

                  {/* RECOMMENDATIONS */}

                  <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">

                    <h3 className="text-lg font-semibold">
                      Recommendations
                    </h3>

                    <div className="mt-5 space-y-3">

                      {analysis.recommendations.length >
                      0 ? (
                        analysis.recommendations.map(
                          (
                            recommendation,
                            index
                          ) => (
                            <p
                              key={`${recommendation}-${index}`}
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

                </div>
              ) : (
                <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-10 text-center">

                  <p className="text-lg font-semibold">
                    No AI analysis yet
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    Click "Analyze Channel" to generate your personalized analysis.
                  </p>

                </div>
              )}

            </section>

            {/* =================================================
                AI CHAT
            ================================================== */}

            <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

              <div>
                <p className="text-sm text-zinc-400">
                  AI Coach Chat
                </p>

                <h2 className="mt-1 text-2xl font-semibold">
                  Ask Your Coach
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Ask questions about your channel, videos, growth, titles, and content strategy.
                </p>
              </div>

              {/* MESSAGES */}

              <div className="mt-6 max-h-[32rem] space-y-4 overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5">

                {chatMessages.length === 0 ? (
                  <div className="py-8 text-center">

                    <p className="text-sm text-zinc-500">
                      Ask something like:
                    </p>

                    <p className="mt-2 text-sm text-zinc-300">
                      "What is my best video?"
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      "How can I grow my channel?"
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      "What should I improve?"
                    </p>

                  </div>
                ) : (
                  chatMessages.map(
                    (message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={
                          message.role === "user"
                            ? "ml-auto max-w-[85%] rounded-2xl bg-white p-4 text-black"
                            : "max-w-[85%] rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-zinc-200"
                        }
                      >
                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {message.content}
                        </p>
                      </div>
                    )
                  )
                )}

                {chatLoading && (
                  <div className="max-w-[85%] rounded-2xl border border-zinc-800 bg-zinc-900 p-4">

                    <p className="text-sm text-zinc-500">
                      AI Coach is thinking...
                    </p>

                  </div>
                )}

              </div>

              {/* INPUT */}

              <form
                onSubmit={handleSendChat}
                className="mt-5 flex flex-col gap-3 sm:flex-row"
              >

                <input
                  value={chatInput}
                  onChange={(event) =>
                    setChatInput(
                      event.target.value
                    )
                  }
                  placeholder="Ask your AI Coach..."
                  disabled={chatLoading}
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-zinc-500 disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={
                    chatLoading ||
                    !chatInput.trim()
                  }
                  className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
                >
                  {chatLoading
                    ? "Sending..."
                    : "Send"}
                </button>

              </form>

            </section>

          </div>
        </section>
      </div>
    </main>
  );
}