import type { StaticImageData } from "next/image";
import cleaImg from "@/media/VG/CleaVG.png";
import cleaCheerImg from "@/media/Cheer/CleaCheer.png";
import filipImg from "@/media/VG/FilipVG.png";
import filipCheerImg from "@/media/Cheer/FilipCheer.png";
import robertImg from "@/media/VG/RobertVG.png";
import robertCheerImg from "@/media/Cheer/RobertCheer_Cropped.png";
import sebImg from "@/media/VG/SebVG.png";
import sebCheerImg from "@/media/Cheer/SebCheer.png";

/**
 * Pixel-art character portraits. Two frames per character — an idle pose (`src`)
 * and an arms-up celebrating pose (`cheerSrc`) — swapped by the cheerleader
 * section for proper 2-frame sprite animation.
 *
 * Used as cheerleaders on the race section and as tutorial guides. They don't
 * map to teams or specific users. Tutorial + Join still only need `src`.
 */
export const SPRITES = {
  seb: {
    name: "Seb",
    src: sebImg as StaticImageData,
    cheerSrc: sebCheerImg as StaticImageData,
  },
  clea: {
    name: "Clea",
    src: cleaImg as StaticImageData,
    cheerSrc: cleaCheerImg as StaticImageData,
  },
  filip: {
    name: "Filip",
    src: filipImg as StaticImageData,
    cheerSrc: filipCheerImg as StaticImageData,
  },
  robert: {
    name: "Robert",
    src: robertImg as StaticImageData,
    cheerSrc: robertCheerImg as StaticImageData,
  },
} as const;

export type SpriteKey = keyof typeof SPRITES;
export const SPRITE_KEYS = Object.keys(SPRITES) as SpriteKey[];
