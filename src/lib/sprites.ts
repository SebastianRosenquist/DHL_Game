import type { StaticImageData } from "next/image";
import cleaImg from "@/media/CleaVG.png";
import filipImg from "@/media/FilipVG.png";
import robertImg from "@/media/RobertVG.png";
import sebImg from "@/media/SebVG.png";

// Pixel-art character portraits. Used as cheerleaders on the race section and as
// tutorial guides — they don't map to teams or specific users.
export const SPRITES = {
  seb: { name: "Seb", src: sebImg as StaticImageData },
  clea: { name: "Clea", src: cleaImg as StaticImageData },
  filip: { name: "Filip", src: filipImg as StaticImageData },
  robert: { name: "Robert", src: robertImg as StaticImageData },
} as const;

export type SpriteKey = keyof typeof SPRITES;
export const SPRITE_KEYS = Object.keys(SPRITES) as SpriteKey[];
