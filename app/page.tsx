"use client";

import { useState } from "react";

export default function Home() {
  const [connected, setConnected] = useState(false);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="text-xl font-bold tracking-tight">
            AI YouTube Coach
          </div>

          <button className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800">
            Sign In
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-24 sm:pt-32">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-96 w-96 -translate-x-1/2 rounded-full bg-white/[0.03] blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div className="mx-auto inline-flex rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-400 backdrop-blur">
            AI-powered YouTube growth assistant
          </div>

          <h1 className="mt-8 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Grow Your YouTube
            <span className="mt-2 block text-zinc-400">
              Smarter With AI
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-zinc-400 sm:text-xl">
            Understand your channel, discover what is working,
            and know exactly what to do next.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {connected ? (
              <p className="rounded-xl border border-green-900/50 bg-green-950/30 px-6 py-4 font-medium text-green-400">
                ✅ YouTube connection ready for the next step.
              </p>
            ) : (
              <button
                onClick={() => setConnected(true)}
                className="rounded-xl bg-white px-8 py-4 font-semibold text-black transition hover:bg-zinc-200"
              >
                Connect YouTube
              </button>
            )}

            {!connected && (
              <button className="rounded-xl border border-zinc-700 px-8 py-4 font-semibold text-zinc-200 transition hover:bg-zinc-800">
                Explore Dashboard
              </button>
            )}
          </div>

          <p className="mt-5 text-sm text-zinc-600">
            Turn your YouTube data into clear, actionable decisions.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-900 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
              Everything you need
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Your YouTube growth,
              <span className="text-zinc-500"> in one place.</span>
            </h2>

            <p className="mt-4 text-zinc-400">
              Turn your channel data into insights, recommendations,
              and ideas you can actually use.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {/* Analytics */}
            <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/70 p-7 transition hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-lg">
                ↗
              </div>

              <h3 className="mt-6 text-xl font-semibold">
                Analytics
              </h3>

              <p className="mt-3 leading-7 text-zinc-400">
                See your channel performance in one simple dashboard
                and understand the numbers that matter.
              </p>
            </div>

            {/* AI Coach */}
            <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/70 p-7 transition hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-lg">
                ✦
              </div>

              <h3 className="mt-6 text-xl font-semibold">
                AI Coach
              </h3>

              <p className="mt-3 leading-7 text-zinc-400">
                Get personalized recommendations based on your actual
                channel and video performance.
              </p>
            </div>

            {/* Content Ideas */}
            <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/70 p-7 transition hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-lg">
                ✎
              </div>

              <h3 className="mt-6 text-xl font-semibold">
                Content Ideas
              </h3>

              <p className="mt-3 leading-7 text-zinc-400">
                Discover what to create next using insights from
                your strongest-performing videos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-900 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
              Simple workflow
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              From data to your next move.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 font-semibold">
                01
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                Connect
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Connect your YouTube channel and bring your data
                into one place.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 font-semibold">
                02
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                Understand
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                See what is performing well, what is falling behind,
                and where your opportunities are.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 font-semibold">
                03
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                Grow
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Use AI-powered recommendations and content ideas
                to decide what to do next.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-zinc-900 px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl border border-zinc-800 bg-zinc-900/60 px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to understand your channel?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            Connect your YouTube channel and turn your data
            into your next growth decision.
          </p>

          <div className="mt-8">
            {!connected && (
              <button
                onClick={() => setConnected(true)}
                className="rounded-xl bg-white px-8 py-4 font-semibold text-black transition hover:bg-zinc-200"
              >
                Connect YouTube
              </button>
            )}

            {connected && (
              <p className="font-medium text-green-400">
                ✅ YouTube connection ready for the next step.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-zinc-500 sm:flex-row">
          <p>© 2026 AI YouTube Coach</p>

          <p>
            Your AI-powered YouTube growth assistant.
          </p>
        </div>
      </footer>
    </main>
  );
}