"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/auth/login");
    router.refresh();
  }

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <aside className="hidden w-64 border-r border-zinc-800 bg-zinc-900/50 p-6 md:block">
      <div className="text-xl font-bold">
        AI YouTube Coach
      </div>

      <nav className="mt-10 space-y-2">

        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className={`w-full rounded-lg px-4 py-3 text-left transition ${
            isActive("/dashboard")
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          Overview
        </button>

        <button
          type="button"
          onClick={() => router.push("/analytics")}
          className={`w-full rounded-lg px-4 py-3 text-left transition ${
            isActive("/analytics")
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          Analytics
        </button>

        <button
          type="button"
          onClick={() => router.push("/videos")}
          className={`w-full rounded-lg px-4 py-3 text-left transition ${
            isActive("/videos")
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          Videos
        </button>

        <button
          type="button"
          onClick={() => router.push("/ai-coach")}
          className={`w-full rounded-lg px-4 py-3 text-left transition ${
            isActive("/ai-coach")
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          AI Coach
        </button>

        <button
          type="button"
          onClick={() => router.push("/content-ideas")}
          className={`w-full rounded-lg px-4 py-3 text-left transition ${
            isActive("/content-ideas")
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          Content Ideas
        </button>

        <button
          type="button"
          onClick={() => router.push("/settings")}
          className={`w-full rounded-lg px-4 py-3 text-left transition ${
            isActive("/settings")
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          Settings
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 w-full rounded-lg border border-zinc-800 px-4 py-3 text-left text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          Logout
        </button>

      </nav>
    </aside>
  );
}