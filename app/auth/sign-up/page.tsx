"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const supabase = createClient();

      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.session) {
        setError(
          "Account created. Please check your email to confirm your account."
        );
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Sign up error:", error);

      setError(
        "Something went wrong while creating your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold">
            Create your account
          </h1>

          <p className="mt-3 text-zinc-400">
            Start growing your YouTube channel with AI.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
          <form
            onSubmit={handleSignUp}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-400"
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-400"
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-300">
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-400"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating account..."
                : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <a
              href="/auth/login"
              className="text-white hover:underline"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}