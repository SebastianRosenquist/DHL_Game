"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { type Milestone, hasReached } from "@/lib/milestones";
import { SPRITE_KEYS, SPRITES } from "@/lib/sprites";
import type { TeamStanding } from "@/lib/types";

type Toast = { id: number; text: string; index: number };
type Sparkle = { id: number; index: number; emoji: string; x: number; delay: number };

let toastCounter = 0;
let sparkleCounter = 0;

const SPARKLE_EMOJIS = ["✨", "🎉", "⭐", "💫"];

/**
 * A row of 4 pixel-art cheerleaders below the race track. They bob idly with
 * slight phase offsets. When a team crosses a milestone (detected between SWR
 * polls), the cheerleader assigned to that team jumps, spawns sparkle emojis,
 * and shows a "Team reached Prize!" toast for ~3 seconds.
 */
export default function Cheerleaders({
  teams,
  milestones,
}: {
  teams: TeamStanding[];
  milestones: Milestone[];
}) {
  // "Team totals we saw last render" — used to detect newly-crossed milestones.
  const prevTotalsRef = useRef<Map<string, number> | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [cheering, setCheering] = useState<Set<number>>(new Set());

  useEffect(() => {
    const prev = prevTotalsRef.current;
    const snapshot = new Map(teams.map((t) => [t.id, t.totalM]));

    // Skip the first render — otherwise every already-crossed milestone would
    // "celebrate" as if it just happened when the page loads.
    if (prev) {
      const events: {
        teamName: string;
        milestone: Milestone;
        cheerIndex: number;
      }[] = [];
      teams.forEach((team, teamIdx) => {
        const prevTotal = prev.get(team.id) ?? 0;
        for (const m of milestones) {
          if (!hasReached(prevTotal, m) && hasReached(team.totalM, m)) {
            // Deterministic mapping so the same team always cheers with the
            // same cheerleader (feels less chaotic than random).
            events.push({
              teamName: team.name,
              milestone: m,
              cheerIndex: teamIdx % SPRITE_KEYS.length,
            });
          }
        }
      });

      if (events.length > 0) {
        const newToasts: Toast[] = [];
        const newSparkles: Sparkle[] = [];
        const newCheering = new Set<number>();

        for (const ev of events) {
          const tid = ++toastCounter;
          newToasts.push({
            id: tid,
            text: `${ev.teamName} reached ${ev.milestone.label}!`,
            index: ev.cheerIndex,
          });
          newCheering.add(ev.cheerIndex);
          for (let i = 0; i < 6; i++) {
            newSparkles.push({
              id: ++sparkleCounter,
              index: ev.cheerIndex,
              emoji: SPARKLE_EMOJIS[i % SPARKLE_EMOJIS.length],
              x: 15 + Math.random() * 60,
              delay: Math.random() * 200,
            });
          }
        }

        setToasts((old) => [...old, ...newToasts]);
        setSparkles((old) => [...old, ...newSparkles]);
        setCheering(newCheering);

        // Clear the cheering set after the jump animation is done.
        const cheerT = setTimeout(() => setCheering(new Set()), 850);
        // Fade toasts after ~3 seconds.
        const toastTs = newToasts.map((t) =>
          setTimeout(() => {
            setToasts((old) => old.filter((x) => x.id !== t.id));
          }, 3000),
        );
        // Sparkles disappear after their CSS animation ends.
        const sparkleTs = newSparkles.map((s) =>
          setTimeout(() => {
            setSparkles((old) => old.filter((x) => x.id !== s.id));
          }, 1400 + s.delay),
        );

        prevTotalsRef.current = snapshot;
        return () => {
          clearTimeout(cheerT);
          toastTs.forEach(clearTimeout);
          sparkleTs.forEach(clearTimeout);
        };
      }
    }

    prevTotalsRef.current = snapshot;
  }, [teams, milestones]);

  return (
    <div className="mt-6 rounded-2xl border-[3px] border-ink bg-white/60 p-3 shadow-pixel">
      <div className="mb-2 text-center font-pixel text-[9px] uppercase tracking-widest text-gray-500">
        Cheering Section
      </div>
      <div className="grid grid-cols-4 gap-2">
        {SPRITE_KEYS.map((key, index) => {
          const sprite = SPRITES[key];
          const isCheering = cheering.has(index);
          const mySparkles = sparkles.filter((s) => s.index === index);
          const myToasts = toasts.filter((t) => t.index === index);

          return (
            <div key={key} className="relative flex flex-col items-center">
              {/* Milestone toast(s) floating above the character */}
              <AnimatePresence>
                {myToasts.map((t) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="pointer-events-none absolute -top-2 left-1/2 z-20 max-w-[160px] -translate-x-1/2 rounded-md border-2 border-ink bg-dhlYellow px-2 py-1 text-center font-pixel text-[8px] leading-tight text-ink shadow-pixelSm sm:max-w-[220px] sm:text-[9px]"
                  >
                    {t.text}
                  </motion.div>
                ))}
              </AnimatePresence>

              <div className="relative h-24 w-full sm:h-32">
                {/* Sparkle particles rising from the character */}
                {mySparkles.map((s) => (
                  <span
                    key={s.id}
                    className="pointer-events-none absolute bottom-10 z-10 animate-sparkle text-xl"
                    style={{
                      left: `${s.x}%`,
                      animationDelay: `${s.delay}ms`,
                    }}
                  >
                    {s.emoji}
                  </span>
                ))}

                {/* The character sprite */}
                <motion.div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2"
                  animate={
                    isCheering
                      ? { y: [0, -18, -28, -18, 0], rotate: [0, -6, 8, -4, 0] }
                      : { y: [0, -4, 0] }
                  }
                  transition={
                    isCheering
                      ? { duration: 0.8, ease: "easeOut" }
                      : {
                          duration: 1.4 + index * 0.13,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: index * 0.2,
                        }
                  }
                >
                  <Image
                    src={sprite.src}
                    alt={sprite.name}
                    width={72}
                    height={112}
                    className="pixelated h-24 w-auto object-contain drop-shadow-md sm:h-32"
                    priority={index === 0}
                  />
                </motion.div>
              </div>

              <div className="mt-1 font-pixel text-[8px] uppercase tracking-wider text-gray-500 sm:text-[9px]">
                {sprite.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
