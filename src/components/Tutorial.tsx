"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { SPRITES, type SpriteKey } from "@/lib/sprites";
import SpeechBubble from "./SpeechBubble";

const STORAGE_KEY = "tutorial_seen_v1";
/** Custom event other components dispatch to (re-)open the tutorial. */
export const TUTORIAL_OPEN_EVENT = "run-challenge:open-tutorial";

type Step = {
  sprite: SpriteKey;
  text: string;
  /** DOM id of the section to highlight. Omit to center the bubble. */
  targetId?: string;
};

const STEPS: Step[] = [
  {
    sprite: "seb",
    text: "Welcome to the Team Run Challenge! 👋 Lets show you around in just a few clicks.",
  },
  {
    sprite: "robert",
    targetId: "nav-log",
    text: "Log your runs manually, or drop in a GPX / TCX / CSV file (Strava, Garmin — whatever). Duplicates are auto-skipped.",
  },
  {
    sprite: "clea",
    targetId: "race-section",
    text: "This is the race. Every team's mascot moves as your team runners log distance. Reach the goals to grab route prizes!",
  },
  {
    sprite: "filip",
    targetId: "route-prizes",
    text: "Route prizes are unlocked when your team's TOTAL distance crosses each checkpoint. Every team can earn all of them — no fighting.",
  },
  {
    sprite: "seb",
    targetId: "achievements",
    text: "These are the competitive records — one champion each. Beat them to steal the crown! Good luck out there. 🏁",
  },
];

const BUBBLE_WIDTH = 440;
const BUBBLE_HEIGHT_EST = 200;

export default function Tutorial() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  // First-time auto-open + listener for external "open" trigger.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(TUTORIAL_OPEN_EVENT, handler);
    return () => window.removeEventListener(TUTORIAL_OPEN_EVENT, handler);
  }, []);

  // Keep the viewport size fresh while open — the mount-time capture above
  // can go stale (e.g. rotating the phone, or resizing on a step with no
  // target, which doesn't otherwise register a resize listener).
  useEffect(() => {
    if (!open) return;
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open]);

  // Track the target element's rect for the current step.
  useEffect(() => {
    if (!open) return;
    const current = STEPS[step];
    if (!current.targetId) {
      setRect(null);
      return;
    }
    const target = document.getElementById(current.targetId);
    if (!target) {
      setRect(null);
      return;
    }
    const update = () => {
      setRect(target.getBoundingClientRect());
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    update();
    target.scrollIntoView({ block: "center", behavior: "smooth" });
    // Give scroll a moment to settle before reading final rect.
    const settle = setTimeout(update, 400);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(settle);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [step, open]);

  const finish = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setOpen(false);
    setStep(0);
  };

  if (!open) return null;
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const sprite = SPRITES[current.sprite];

  // Shrink to fit narrow phones (with 16px margin either side) instead of
  // overflowing the viewport at the fixed 440px width.
  const bubbleWidth =
    viewport.w > 0 ? Math.min(BUBBLE_WIDTH, viewport.w - 32) : BUBBLE_WIDTH;

  // Figure out where to anchor the character + bubble. When there's a target,
  // place it on whichever side of the target has more room; otherwise centre.
  let bubbleTop = viewport.h / 2 - BUBBLE_HEIGHT_EST / 2;
  let bubbleLeft = viewport.w / 2 - bubbleWidth / 2;
  let notch: "above" | "below" | null = null;
  if (rect) {
    const spaceAbove = rect.top;
    const spaceBelow = viewport.h - rect.bottom;
    if (spaceAbove > spaceBelow && spaceAbove > BUBBLE_HEIGHT_EST + 40) {
      bubbleTop = Math.max(16, rect.top - BUBBLE_HEIGHT_EST - 24);
      notch = "below";
    } else {
      bubbleTop = Math.min(
        viewport.h - BUBBLE_HEIGHT_EST - 16,
        rect.bottom + 24,
      );
      notch = "above";
    }
    bubbleLeft = Math.max(
      16,
      Math.min(
        viewport.w - bubbleWidth - 16,
        rect.left + rect.width / 2 - bubbleWidth / 2,
      ),
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Dim backdrop; clicking it skips the tutorial. */}
      <div
        className="absolute inset-0 bg-black/45"
        onClick={finish}
        aria-label="Close tutorial"
      />

      {/* Spotlight ring around the target — the box-shadow trick punches a hole
          in the dim overlay so the target reads clearly. */}
      {rect && (
        <div
          className="pointer-events-none absolute rounded-xl transition-all duration-200"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow:
              "0 0 0 9999px rgba(0,0,0,0.55), 0 0 0 3px #FFCC00 inset",
          }}
        />
      )}

      {/* Character + bubble (positioned; anchored to the target when present). */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute z-10 flex items-end gap-3"
        style={{
          top: bubbleTop,
          left: bubbleLeft,
          width: bubbleWidth,
        }}
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          className="flex-shrink-0"
        >
          <Image
            src={sprite.src}
            alt={sprite.name}
            width={80}
            height={128}
            className="pixelated h-32 w-auto object-contain drop-shadow-lg"
            priority
          />
        </motion.div>
        <div className="flex-1">
          <SpeechBubble notch={notch}>
            <p className="text-sm leading-relaxed text-ink">{current.text}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="font-pixel text-[9px] text-gray-400">
                {step + 1} / {STEPS.length}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {!isLast && (
                  <button
                    onClick={finish}
                    className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:text-ink"
                  >
                    Skip
                  </button>
                )}
                {step > 0 && !isLast && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:text-ink"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={() => (isLast ? finish() : setStep(step + 1))}
                  className="rounded-md border-2 border-ink bg-dhlYellow px-3 py-1 font-pixel text-[10px] font-bold text-ink shadow-pixelSm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                >
                  {isLast ? "LET'S GO" : "NEXT →"}
                </button>
              </div>
            </div>
          </SpeechBubble>
        </div>
      </motion.div>
    </div>
  );
}
