"use client";

import { motion } from "framer-motion";
import { characterEmoji } from "@/lib/characters";

type Props = {
  character: string;
  color: string;
  size?: number;
  /** Animate the running cycle (false = standing still, e.g. no distance yet). */
  running?: boolean;
};

/** A cute little runner: a colored jersey carrying the team emoji, with bobbing
 *  body, pumping legs, and a bouncing shadow. Pure presentation. */
export default function RunnerCharacter({
  character,
  color,
  size = 56,
  running = true,
}: Props) {
  const emoji = characterEmoji(character);
  const legW = Math.max(4, size * 0.12);
  const legH = Math.max(6, size * 0.22);

  return (
    <div
      className="relative select-none"
      style={{ width: size, height: size * 1.25 }}
      aria-hidden
    >
      {/* shadow */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 rounded-[50%] bg-black/15"
        style={{ bottom: 0, width: size * 0.7, height: size * 0.14 }}
        animate={running ? { scaleX: [1, 0.82, 1] } : { scaleX: 1 }}
        transition={{ repeat: Infinity, duration: 0.42, ease: "easeInOut" }}
      />

      {/* body bobbing */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ bottom: legH * 0.6 }}
        animate={running ? { y: [0, -size * 0.08, 0] } : { y: 0 }}
        transition={{ repeat: Infinity, duration: 0.42, ease: "easeInOut" }}
      >
        <div className="relative flex items-center justify-center">
          {/* jersey */}
          <div
            className="flex items-center justify-center rounded-full shadow-md ring-2 ring-white"
            style={{
              width: size * 0.86,
              height: size * 0.86,
              background: color,
              fontSize: size * 0.5,
              lineHeight: 1,
            }}
          >
            <span>{emoji}</span>
          </div>

          {/* legs */}
          <motion.div
            className="absolute"
            style={{
              bottom: -legH * 0.8,
              left: size * 0.28,
              width: legW,
              height: legH,
              borderRadius: legW,
              background: color,
              transformOrigin: "top center",
            }}
            animate={running ? { rotate: [25, -25, 25] } : { rotate: 0 }}
            transition={{ repeat: Infinity, duration: 0.42, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute"
            style={{
              bottom: -legH * 0.8,
              right: size * 0.28,
              width: legW,
              height: legH,
              borderRadius: legW,
              background: color,
              transformOrigin: "top center",
            }}
            animate={running ? { rotate: [-25, 25, -25] } : { rotate: 0 }}
            transition={{ repeat: Infinity, duration: 0.42, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
}
