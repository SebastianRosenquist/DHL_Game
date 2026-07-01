"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { type Milestone, hasReached } from "@/lib/milestones";
import { SPRITE_KEYS, SPRITES } from "@/lib/sprites";
import type { TeamStanding } from "@/lib/types";
import standImg from "@/media/ThursdayCheerStand.png";

// Bilingual EN/DA chant pool — the crowd shouts one of these at random intervals.
const CHANTS = [
  "GO GO GO!",
  "KOM SÅ!",
  "YEAH!",
  "AFSTED!",
  "PUSH!",
  "MERE!",
  "LET'S GO!",
  "FASTER!",
  "HOLD FAST!",
  "YOU GOT THIS!",
  "KEEP RUNNING!",
  "WOOO!",
  "🏃💨",
  "⚡",
  "🔥🔥🔥",
];

// Shouted on milestone crossings (louder / yellow variant).
const MILESTONE_CHANTS = [
  "LEVEL UP!",
  "SIKKE ET MÅL!",
  "SUPER!",
  "PRIZE UNLOCKED!",
  "MILEPÆL!",
];

// How long each type of cheer holds the arms-up sprite pose (ms).
const CHEER_MS = {
  random: 380,
  wave: 450,
  reactive: 850,
  milestone: 1800,
} as const;

// Cadences (in ms) — [min, max] uniformly sampled for the next tick.
const RANDOM_INTERVAL: [number, number] = [3500, 7500]; // per cheerleader
const WAVE_INTERVAL: [number, number] = [11000, 15000]; // group

// Where each of the 4 characters stands on the stand's front bleacher. Left is
// a horizontal percentage of the container (character is centered on it), and
// STAND_BOTTOM lifts their feet up onto the front-row surface.
const STAND_POSITIONS: { left: string; bottom: string }[] = [
  { left: "22%", bottom: "8%"  },  // front row left
  { left: "65%", bottom: "8%"  },  // front row right
  { left: "40%", bottom: "22%" },  // middle row center
  { left: "75%", bottom: "34%" },  // back row right
];
const CHARACTER_WIDTH_PCT = "18%";

type Chant = {
  id: number;
  index: number;
  text: string;
  isMilestone: boolean;
};

let chantCounter = 0;

/**
 * The Thursday cheering stand — a pixel-art bleacher backdrop populated by the
 * 4 characters standing on the front row. Cheer state mixes four sources:
 *   - random idle cheers + chants every few seconds per cheerleader
 *   - a stadium wave that cascades across all four
 *   - a reactive cheer when a team's total distance ticks up (a run was logged)
 *   - a longer cheer + yellow milestone chant when a team crosses a checkpoint
 *
 * Cheer state is tracked with an "expiry" per index so a shorter cheer never
 * cuts off a longer one that was triggered around the same time.
 */
export default function Cheerleaders({
  teams,
  milestones,
}: {
  teams: TeamStanding[];
  milestones: Milestone[];
}) {
  const prevTotalsRef = useRef<Map<string, number> | null>(null);
  const [chants, setChants] = useState<Chant[]>([]);
  const [cheering, setCheering] = useState<Set<number>>(new Set());
  const cheerExpiryRef = useRef<Record<number, number>>({});

  /** Put cheerleader `index` into the arms-up pose for `durationMs`. Later
   *  cheers can extend the window; shorter cheers arriving during a longer one
   *  never cut it off. */
  const triggerCheer = useCallback((index: number, durationMs: number) => {
    const now = Date.now();
    const currentExpiry = cheerExpiryRef.current[index] ?? 0;
    const newExpiry = now + durationMs;
    if (newExpiry <= currentExpiry) return;
    cheerExpiryRef.current[index] = newExpiry;
    setCheering((prev) => {
      if (prev.has(index)) return prev;
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    setTimeout(() => {
      if (cheerExpiryRef.current[index] === newExpiry) {
        setCheering((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
        delete cheerExpiryRef.current[index];
      }
    }, durationMs);
  }, []);

  /** Show one chant above cheerleader `index`. Only one chant per cheerleader
   *  at a time — a new one replaces the current. */
  const showChant = useCallback(
    (index: number, text: string, isMilestone = false, ttlMs = 2200) => {
      const id = ++chantCounter;
      setChants((prev) => [
        ...prev.filter((c) => c.index !== index),
        { id, index, text, isMilestone },
      ]);
      setTimeout(
        () => setChants((prev) => prev.filter((c) => c.id !== id)),
        ttlMs,
      );
    },
    [],
  );

  // Random cheer + chant per cheerleader, independent timers.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let stopped = false;
    const schedule = (index: number) => {
      const delay =
        RANDOM_INTERVAL[0] +
        Math.random() * (RANDOM_INTERVAL[1] - RANDOM_INTERVAL[0]);
      const t = setTimeout(() => {
        if (stopped) return;
        triggerCheer(index, CHEER_MS.random);
        // ~60% of random cheers also chant.
        if (Math.random() < 0.6) {
          showChant(
            index,
            CHANTS[Math.floor(Math.random() * CHANTS.length)],
          );
        }
        schedule(index);
      }, delay);
      timers.push(t);
    };
    // Stagger initial fires so cheerleaders don't all shout at once on load.
    SPRITE_KEYS.forEach((_, i) => {
      const start = setTimeout(() => schedule(i), 1500 + i * 700);
      timers.push(start);
    });
    return () => {
      stopped = true;
      timers.forEach(clearTimeout);
    };
  }, [triggerCheer, showChant]);

  // Stadium wave — cascade across all cheerleaders every 10–14s.
  useEffect(() => {
    let stopped = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const runWave = () => {
      SPRITE_KEYS.forEach((_, i) => {
        const t = setTimeout(() => triggerCheer(i, CHEER_MS.wave), i * 260);
        timers.push(t);
      });
    };
    const scheduleNext = () => {
      const delay =
        WAVE_INTERVAL[0] +
        Math.random() * (WAVE_INTERVAL[1] - WAVE_INTERVAL[0]);
      const t = setTimeout(() => {
        if (stopped) return;
        runWave();
        scheduleNext();
      }, delay);
      timers.push(t);
    };
    // Kick off after a delay so it doesn't collide with the initial random wave.
    const kickoff = setTimeout(scheduleNext, 6000);
    timers.push(kickoff);
    return () => {
      stopped = true;
      timers.forEach(clearTimeout);
    };
  }, [triggerCheer]);

  // Reactive (any distance uptick) + milestone crossings.
  useEffect(() => {
    const prev = prevTotalsRef.current;
    const snapshot = new Map(teams.map((t) => [t.id, t.totalM]));

    if (prev) {
      // Reactive: any team's total went up → assigned cheerleader cheers.
      teams.forEach((team, teamIdx) => {
        const prevTotal = prev.get(team.id) ?? 0;
        if (team.totalM > prevTotal) {
          triggerCheer(teamIdx % SPRITE_KEYS.length, CHEER_MS.reactive);
        }
      });

      // Milestone crossings: longer cheer + yellow chant + a hype echo from
      // another random cheerleader so the whole row reacts.
      const events: {
        teamName: string;
        milestone: Milestone;
        cheerIndex: number;
      }[] = [];
      teams.forEach((team, teamIdx) => {
        const prevTotal = prev.get(team.id) ?? 0;
        for (const m of milestones) {
          if (!hasReached(prevTotal, m) && hasReached(team.totalM, m)) {
            events.push({
              teamName: team.name,
              milestone: m,
              cheerIndex: teamIdx % SPRITE_KEYS.length,
            });
          }
        }
      });

      for (const ev of events) {
        triggerCheer(ev.cheerIndex, CHEER_MS.milestone);
        showChant(
          ev.cheerIndex,
          `${ev.teamName} — ${ev.milestone.label}!`,
          true,
          3200,
        );
        // Hype echo from a random other cheerleader ~200ms later.
        const others = SPRITE_KEYS.map((_, i) => i).filter(
          (i) => i !== ev.cheerIndex,
        );
        if (others.length > 0) {
          const other = others[Math.floor(Math.random() * others.length)];
          setTimeout(() => {
            triggerCheer(other, CHEER_MS.wave);
            showChant(
              other,
              MILESTONE_CHANTS[
                Math.floor(Math.random() * MILESTONE_CHANTS.length)
              ],
              false,
              2200,
            );
          }, 220);
        }
      }
    }

    prevTotalsRef.current = snapshot;
  }, [teams, milestones, triggerCheer, showChant]);

  return (
    <div className="mt-2">
      <div className="mb-1 text-center font-pixel text-[9px] uppercase tracking-widest text-gray-500">
        🎉 The Thursday Stand 🎉
      </div>

      {/* The stand backdrop sets the aspect ratio; characters position over it. */}
      <div
        className="relative mx-auto w-full max-w-2xl overflow-hidden"
        style={{ aspectRatio: "1/1" }}
      >
        <Image
          src={standImg}
          alt="Thursday cheering stand"
          fill
          className="pixelated object-cover"
          style={{ objectPosition: "center 18%" }}
          priority
          sizes="(max-width: 672px) 100vw, 672px"
        />

        {SPRITE_KEYS.map((key, index) => {
          const sprite = SPRITES[key];
          const isCheering = cheering.has(index);
          const myChants = chants.filter((c) => c.index === index);
          const pos = STAND_POSITIONS[index];

          return (
            <div
              key={key}
              className="absolute flex flex-col items-center"
              style={{
                left: pos.left,
                bottom: pos.bottom,
                width: CHARACTER_WIDTH_PCT,
                transform: "translateX(-50%)",
              }}
            >
              {/* Chant bubble floats above the character — absolute so a bubble
                  appearing/disappearing never shifts the character's feet. */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 flex justify-center">
                <AnimatePresence>
                  {myChants.map((c) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 6, scale: 0.85 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className={`max-w-[150px] whitespace-nowrap rounded-md border-2 px-2 py-0.5 text-center font-pixel leading-tight shadow-pixelSm ${
                        c.isMilestone
                          ? "border-ink bg-dhlYellow text-[9px] text-ink"
                          : "border-ink bg-white text-[8px] text-ink"
                      }`}
                    >
                      {c.text}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Character — cross-fades between idle and cheer poses. The
                  wrapping motion.div bobs it up and down regardless of pose. */}
              <motion.div
                className="w-full"
                animate={
                  isCheering
                    ? { y: [-2, -10, -4, -10, -2] }
                    : { y: [0, -4, 0] }
                }
                transition={
                  isCheering
                    ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
                    : {
                        duration: 1.4 + index * 0.13,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.2,
                      }
                }
              >
                <div className="relative aspect-[5/8] w-full">
                  <Image
                    src={sprite.src}
                    alt={sprite.name}
                    fill
                    className={`pixelated object-contain drop-shadow-md transition-opacity duration-100 ${
                      isCheering ? "opacity-0" : "opacity-100"
                    }`}
                    priority={index === 0}
                    sizes="80px"
                  />
                  <Image
                    src={sprite.cheerSrc}
                    alt={`${sprite.name} cheering`}
                    fill
                    className={`pixelated object-contain drop-shadow-md transition-opacity duration-100 ${
                      isCheering ? "opacity-100" : "opacity-0"
                    }`}
                    sizes="80px"
                  />
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
