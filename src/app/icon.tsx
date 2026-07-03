import { ImageResponse } from "next/og";

// Next.js picks this up automatically and serves it as the browser-tab
// favicon (and apple-touch-icon fallback) on both desktop and mobile —
// no <link> tags or public/ asset needed.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
        }}
      >
        🏃‍♀️
      </div>
    ),
    { ...size },
  );
}
