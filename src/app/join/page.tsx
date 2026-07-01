"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import Nav from "@/components/Nav";
import { characterEmoji } from "@/lib/characters";
import { fetcher } from "@/lib/fetcher";

type Team = { id: string; name: string; character: string; colorHex: string };

export default function JoinPage() {
  const router = useRouter();
  const { data } = useSWR<{ teams: Team[] }>("/api/teams", fetcher);
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [needsTeam, setNeedsTeam] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const teams = data?.teams ?? [];

  async function submit() {
    setError(null);
    if (!name.trim()) return setError("Enter your name.");
    setBusy(true);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), teamId: teamId ?? undefined }),
      });
      const body = await res.json().catch(() => ({}));

      if (res.status === 409 && body.error === "new_user") {
        // First time with this name — ask them to pick a team, then resubmit.
        setNeedsTeam(true);
        setError("New name! Pick your team below to create your account.");
        return;
      }
      if (!res.ok) {
        setError(body.error ?? "Could not log in.");
        return;
      }
      mutate("/api/me");
      router.push("/log");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-extrabold">Log in or join</h1>
        <p className="mt-1 text-gray-500">
          Enter your name to log in. New here? Pick a team and we&apos;ll set you up.
        </p>

        <label className="mt-6 block text-sm font-medium">Your name</label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNeedsTeam(false);
          }}
          placeholder="e.g. Alex"
          className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-ink"
          maxLength={40}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        <h2 className="mt-6 text-sm font-medium">
          Choose your team{" "}
          <span className="font-normal text-gray-400">
            (only needed the first time)
          </span>
        </h2>
        {teams.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            No teams have been created yet — check back once the admin sets them up.
          </p>
        ) : (
          <div
            className={`mt-2 grid grid-cols-2 gap-3 rounded-2xl sm:grid-cols-3 ${
              needsTeam ? "ring-2 ring-dhlRed ring-offset-4" : ""
            }`}
          >
            {teams.map((t) => {
              const selected = teamId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTeamId(t.id)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-4 transition ${
                    selected ? "shadow-md" : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={selected ? { borderColor: t.colorHex } : undefined}
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-2xl ring-2 ring-white"
                    style={{ background: t.colorHex }}
                  >
                    {characterEmoji(t.character)}
                  </span>
                  <span className="text-center text-sm font-semibold">{t.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-dhlRed">{error}</p>}

        <button
          onClick={submit}
          disabled={busy}
          className="mt-6 rounded-xl bg-ink px-6 py-2.5 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Please wait…" : "Log in / Join"}
        </button>
      </main>
    </>
  );
}
