"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import Sidebar from "../components/Sidebar";

type Profile = {
  id: string;
  channel_name: string | null;
  youtube_channel_id: string | null;
};

export default function SettingsPage() {
  const router = useRouter();

  // Keep one stable Supabase client for this component.
  const [supabase] = useState(() => createClient());

  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const [channelName, setChannelName] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] =
    useState(false);
  const [changingPassword, setChangingPassword] =
    useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/auth/login");
          return;
        }

        setEmail(user.email ?? "");

        const response = await fetch("/api/profile");

        if (response.ok) {
          const data = await response.json();

          if (data.profile) {
            setProfile(data.profile);

            setChannelName(
              data.profile.channel_name ?? ""
            );
          }
        } else {
          const data =
            await response.json().catch(() => null);

          if (data?.error) {
            setError(data.error);
          }
        }
      } catch (err) {
        console.error(
          "Settings loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load settings."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [router, supabase]);

  async function handleProfileSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (savingProfile) {
      return;
    }

    try {
      setSavingProfile(true);
      setMessage("");
      setError("");

      const response = await fetch(
        "/api/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            channel_name:
              channelName.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update profile."
        );
      }

      setProfile(data.profile);

      setChannelName(
        data.profile?.channel_name ?? ""
      );

      setMessage(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordChange(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (changingPassword) {
      return;
    }

    setMessage("");
    setError("");

    if (newPassword.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    try {
      setChangingPassword(true);

      const { error: passwordError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (passwordError) {
        throw passwordError;
      }

      setNewPassword("");
      setConfirmPassword("");

      setMessage(
        "Password updated successfully."
      );
    } catch (err) {
      console.error(
        "Password update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleLogout() {
    try {
      setError("");

      const { error: logoutError } =
        await supabase.auth.signOut();

      if (logoutError) {
        throw logoutError;
      }

      router.push("/auth/login");
      router.refresh();
    } catch (err) {
      console.error(
        "Logout error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to logout."
      );
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <p className="text-lg font-medium">
            Loading settings...
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            Please wait a moment.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}

        <Sidebar />

        {/* MAIN CONTENT */}

        <section className="flex-1">
          <div className="mx-auto max-w-4xl px-6 py-10">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-zinc-400">
                  Account
                </p>

                <h1 className="mt-1 text-3xl font-bold">
                  Settings
                </h1>

                <p className="mt-2 text-sm text-zinc-500">
                  Manage your account and channel settings.
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
            </div>

            {message && (
              <div className="mt-6 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
                {message}
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="mt-8 space-y-6">

              {/* Account */}

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <h2 className="text-xl font-semibold">
                  Account
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Your authentication information.
                </p>

                <div className="mt-6">
                  <label className="text-sm text-zinc-400">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    disabled
                    className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-500 outline-none"
                  />
                </div>
              </section>

              {/* Channel */}

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <h2 className="text-xl font-semibold">
                  Channel Profile
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Customize your channel profile.
                </p>

                <form
                  onSubmit={handleProfileSave}
                  className="mt-6"
                >
                  <label className="text-sm text-zinc-400">
                    Channel Name
                  </label>

                  <input
                    type="text"
                    value={channelName}
                    onChange={(event) =>
                      setChannelName(
                        event.target.value
                      )
                    }
                    placeholder="Your channel name"
                    maxLength={100}
                    className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-zinc-500"
                  />

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="mt-4 rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {savingProfile
                      ? "Saving..."
                      : "Save Profile"}
                  </button>
                </form>
              </section>

              {/* Security */}

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <h2 className="text-xl font-semibold">
                  Security
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Change your account password.
                </p>

                <form
                  onSubmit={handlePasswordChange}
                  className="mt-6 space-y-4"
                >
                  <div>
                    <label className="text-sm text-zinc-400">
                      New Password
                    </label>

                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) =>
                        setNewPassword(
                          event.target.value
                        )
                      }
                      placeholder="At least 8 characters"
                      minLength={8}
                      autoComplete="new-password"
                      className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-zinc-400">
                      Confirm New Password
                    </label>

                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value
                        )
                      }
                      placeholder="Repeat your password"
                      minLength={8}
                      autoComplete="new-password"
                      className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-zinc-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {changingPassword
                      ? "Updating..."
                      : "Update Password"}
                  </button>
                </form>
              </section>

              {/* YouTube */}

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <h2 className="text-xl font-semibold">
                  YouTube
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Manage your connected YouTube account.
                </p>

                <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  {profile?.youtube_channel_id ? (
                    <>
                      <p className="text-sm font-medium text-white">
                        YouTube Connected
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        Channel ID connected to your account.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-white">
                        YouTube Not Connected
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        Connect your YouTube channel from the dashboard.
                      </p>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/dashboard")
                  }
                  className="mt-4 rounded-xl border border-zinc-800 px-5 py-3 text-sm text-zinc-300 transition hover:bg-zinc-800"
                >
                  Manage YouTube Connection
                </button>
              </section>

              {/* Logout */}

              <section className="rounded-2xl border border-red-950 bg-red-950/10 p-6">
                <h2 className="text-xl font-semibold">
                  Session
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Sign out from this device.
                </p>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-5 rounded-xl border border-red-900 px-5 py-3 font-semibold text-red-400 transition hover:bg-red-950/40"
                >
                  Logout
                </button>
              </section>

            </div>
          </div>
        </section>
      </div>
    </main>
  );
}