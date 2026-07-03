"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import useSWR, { mutate } from "swr";
import Nav from "@/components/Nav";
import { characterEmoji } from "@/lib/characters";
import { fetcher } from "@/lib/fetcher";
import { SPRITES, SPRITE_KEYS, type SpriteKey } from "@/lib/sprites";

type Team = { id: string; name: string; character: string; colorHex: string };

export default function JoinPage() {
  const router = useRouter();
  const { data } = useSWR<{ teams: Team[] }>("/api/teams", fetcher);
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [needsTeam, setNeedsTeam] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Pick a random greeter *after* mount so SSR and client agree (no hydration mismatch).
  const [greeter, setGreeter] = useState<SpriteKey | null>(null);
  useEffect(() => {
    setGreeter(SPRITE_KEYS[Math.floor(Math.random() * SPRITE_KEYS.length)]);
  }, []);

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
        {/* Retro welcome banner — one of the 4 sprites waves you in. */}
        {greeter && (
          <div className="mb-6 flex items-end gap-4 rounded-lg border-[3px] border-ink bg-white p-4 shadow-pixel">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              className="flex-shrink-0"
            >
              <Image
                src={SPRITES[greeter].src}
                alt={SPRITES[greeter].name}
                width={72}
                height={112}
                className="pixelated h-24 w-auto object-contain drop-shadow-md"
                priority
              />
            </motion.div>
            <div className="min-w-0 flex-1 pb-2">
              <div className="font-pixel text-[10px] uppercase tracking-widest text-dhlRed">
                <motion.span
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  ▶
                </motion.span>{" "}
                Press Start
              </div>
              <div className="mt-1 font-pixel text-xs uppercase leading-tight text-ink">
                Hey, I&apos;m {SPRITES[greeter].name}!
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Type your name to sign in — or start a new account by also picking a team.
              </div>
            </div>
          </div>
        )}

        <h1 className="font-pixel text-lg text-ink">LOG IN OR JOIN</h1>
        <p className="mt-2 text-gray-500">
          Enter your name to log in. New here? Pick a team and we&apos;ll set you up.
        </p>

        <label className="mt-6 block font-pixel text-[10px] uppercase text-ink">
          Your name
        </label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNeedsTeam(false);
          }}
          placeholder="e.g. Alex"
          className="mt-1 w-full rounded-md border-[3px] border-ink px-4 py-2.5 outline-none focus:shadow-pixelSm"
          maxLength={40}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        <h2 className="mt-6 font-pixel text-[10px] uppercase text-ink">
          Choose your team{" "}
          <span className="font-sans text-xs font-normal normal-case text-gray-400">
            (only needed the first time)
          </span>
        </h2>
        {teams.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            No teams have been created yet — check back once the admin sets them up.
          </p>
        ) : (
          <div
            className={`mt-2 grid grid-cols-2 gap-3 rounded-md sm:grid-cols-3 ${
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
                  className={`flex flex-col items-center gap-1 rounded-md border-[3px] p-4 transition ${
                    selected
                      ? "shadow-pixel"
                      : "border-gray-200 hover:border-gray-300"
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
          className="mt-6 rounded-md border-[3px] border-ink bg-ink px-6 py-2.5 font-pixel text-xs uppercase text-white shadow-pixel disabled:opacity-50 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-pixelSm"
        >
          {busy ? "Please wait…" : "Log in / Join"}
        </button>
      </main>
    </>
  );
}
