"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import AchievementManager from "@/components/admin/AchievementManager";
import MilestoneManager from "@/components/admin/MilestoneManager";
import TeamManager from "@/components/admin/TeamManager";
import UserManager from "@/components/admin/UserManager";
import Nav from "@/components/Nav";
import { apiSend, fetcher } from "@/lib/fetcher";

export default function AdminPage() {
  const { data, isLoading } = useSWR<{ admin: boolean }>("/api/me", fetcher);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiSend("/api/admin/login", "POST", { passcode });
      setPasscode("");
      mutate("/api/me");
    } catch {
      setError("Incorrect passcode.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await apiSend("/api/admin/login", "DELETE");
    mutate("/api/me");
  }

  if (isLoading) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-md px-4 py-12 text-center text-gray-400">
          Loading…
        </main>
      </>
    );
  }

  if (!data?.admin) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-md px-4 py-12">
          <h1 className="text-2xl font-extrabold">Admin</h1>
          <p className="mt-1 text-gray-500">
            Enter the admin passcode to manage teams and achievements.
          </p>
          <form onSubmit={login} className="mt-6">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Passcode"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-ink"
            />
            {error && <p className="mt-2 text-sm text-dhlRed">{error}</p>}
            <button
              disabled={busy}
              className="mt-4 w-full rounded-xl bg-ink py-2.5 font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Checking…" : "Unlock admin"}
            </button>
          </form>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">Admin</h1>
          <button
            onClick={logout}
            className="rounded-lg border px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
          >
            Log out of admin
          </button>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <TeamManager />
          <AchievementManager />
          <MilestoneManager />
        </div>
        <div className="mt-6">
          <UserManager />
        </div>
      </main>
    </>
  );
}
