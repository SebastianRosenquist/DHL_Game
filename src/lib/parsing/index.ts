import { parseCsv } from "./csv";
import { parseGpx } from "./gpx";
import { parseTcx } from "./tcx";
import type { ParsedActivity } from "./types";

export type ParseOutput = {
  activities: ParsedActivity[];
  skipped: number;
};

/** Dispatch to the right parser by file extension. */
export function parseActivityFile(
  filename: string,
  text: string,
): ParseOutput {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "gpx":
      return { activities: [parseGpx(text)], skipped: 0 };
    case "tcx":
      return { activities: [parseTcx(text)], skipped: 0 };
    case "csv":
      return parseCsv(text);
    default:
      throw new Error(
        "Unsupported file type. Upload a .gpx, .tcx, or .csv file.",
      );
  }
}

export type { ParsedActivity };
