/**
 * A pixel-styled speech bubble with an optional tail (notch) that can point
 * above or below. Used by the tutorial overlay and the cheerleader toasts.
 * The double triangle keeps the chunky border intact around the tail.
 */
export default function SpeechBubble({
  children,
  notch = null,
}: {
  children: React.ReactNode;
  notch?: "above" | "below" | null;
}) {
  return (
    <div className="relative rounded-lg border-[3px] border-ink bg-white p-4 shadow-pixel">
      {notch === "below" && (
        <>
          {/* black outer tail (border) */}
          <div
            className="pointer-events-none absolute -bottom-3 left-8"
            style={{
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderTop: "12px solid #1a1a1a",
            }}
          />
          {/* white inner tail (fill) */}
          <div
            className="pointer-events-none absolute -bottom-1 left-[34px]"
            style={{
              width: 0,
              height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "9px solid white",
            }}
          />
        </>
      )}
      {notch === "above" && (
        <>
          <div
            className="pointer-events-none absolute -top-3 left-8"
            style={{
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderBottom: "12px solid #1a1a1a",
            }}
          />
          <div
            className="pointer-events-none absolute -top-1 left-[34px]"
            style={{
              width: 0,
              height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderBottom: "9px solid white",
            }}
          />
        </>
      )}
      {children}
    </div>
  );
}
