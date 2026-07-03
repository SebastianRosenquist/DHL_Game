"use client";

import { useEffect, useState } from "react";

const COMPETITION_END = new Date("2026-08-27T00:00:00");

function getTimeLeft() {
  const diffMs = COMPETITION_END.getTime() - Date.now();
  const clamped = Math.max(diffMs, 0);
  const totalSeconds = Math.floor(clamped / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    done: diffMs <= 0,
  };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="min-w-[2.5em] rounded-md border-[3px] border-ink bg-white px-2 py-1 text-center font-pixel text-lg tabular-nums text-ink shadow-pixelSm">
        {String(value).padStart(2, "0")}
      </div>
      <div className="mt-1 font-pixel text-[7px] uppercase tracking-widest text-gray-500">
        {label}
      </div>
    </div>
  );
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft> | null>(
    null,
  );

  useEffect(() => {
    setTimeLeft(getTimeLeft());
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border-[3px] border-ink bg-white/80 px-4 py-3 shadow-pixel sm:flex-row sm:gap-4">
      <div className="font-pixel text-[9px] uppercase tracking-widest text-dhlRed">
        {timeLeft.done ? "Competition ended!" : "Ends in"}
      </div>
      {!timeLeft.done && (
        <div className="flex items-center gap-2">
          <Unit value={timeLeft.days} label="Days" />
          <Unit value={timeLeft.hours} label="Hrs" />
          <Unit value={timeLeft.minutes} label="Min" />
          <Unit value={timeLeft.seconds} label="Sec" />
        </div>
      )}
    </div>
  );
}
