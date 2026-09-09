"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  const [channelName, setChannelName] = useState("");
  const [youtubeChannelId, setYoutubeChannelId] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/profile/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel_name: channelName,
          youtube_channel_id: youtubeChannelId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      setMessage("Profile saved successfully.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="text-3xl font-bold">
          Channel Profile
        </h1>

        <p className="mt-2 text-sm text-zinc-400">
          Save your channel information.
        </p>

        <form onSubmit={handleSave} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="channelName"
              className="mb-2 block text-sm font-medium"
            >
              Channel Name
            </label>

            <input
              id="channelName"
              type="text"
              value={channelName}
              onChange={(event) =>
                setChannelName(event.target.value)
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none"
              placeholder="My YouTube Channel"
            />
          </div>

          <div>
            <label
              htmlFor="youtubeChannelId"
              className="mb-2 block text-sm font-medium"
            >
              YouTube Channel ID
            </label>

            <input
              id="youtubeChannelId"
              type="text"
              value={youtubeChannelId}
              onChange={(event) =>
                setYoutubeChannelId(event.target.value)
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none"
              placeholder="YouTube Channel ID"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-white transition hover:bg-zinc-800"
          >
            Back to Dashboard
          </button>
        </form>
      </div>
    </main>
  );
}