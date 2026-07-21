import type { StaticImageData } from "next/image";
import cleaImg from "@/media/VG/CleaVG.png";
import cleaCheerImg from "@/media/Cheer/CleaCheer.png";
import filipImg from "@/media/VG/FilipVG.png";
import filipCheerImg from "@/media/Cheer/FilipCheer.png";
import robertImg from "@/media/VG/RobertVG.png";
import robertCheerImg from "@/media/Cheer/RobertCheer_Cropped.png";
import sebImg from "@/media/VG/SebVG.png";
import sebCheerImg from "@/media/Cheer/SebCheer.png";
import kirstineImg from "@/media/VG/KirstineVG.png";
import kirstineCheerImg from "@/media/Cheer/KirstineCheer.png";
import kristianImg from "@/media/VG/KristianVG.png";
import kristianCheerImg from "@/media/Cheer/KristianCheer.png";
import lukasImg from "@/media/VG/LukasVG.png";
import lukasCheerImg from "@/media/Cheer/LukasCheer.png";
import madsImg from "@/media/VG/MadsVG.png";
import madsCheerImg from "@/media/Cheer/MadsCheer.png";
import madsLImg from "@/media/VG/MadsLVG.png";
import madsLCheerImg from "@/media/Cheer/MadsLCheer.png";
import olaImg from "@/media/VG/OlaVG.png";
import olaCheerImg from "@/media/Cheer/OlaCheer.png";
import signeImg from "@/media/VG/SigneVG.png";
import signeCheerImg from "@/media/Cheer/SigneCheer.png";
import steenImg from "@/media/VG/SteenVG.png";
import steenCheerImg from "@/media/Cheer/SteenCheer.png";
import lasseImg from "@/media/VG/LasseVG.png";
import lasseCheerImg from "@/media/Cheer/LasseCheer.png";
import ebbeImg from "@/media/VG/EbbeVG.png";
import ebbeCheerImg from "@/media/Cheer/EbbeCheer.png";
import emilieImg from "@/media/VG/EmilieVG.png";
import emilieCheerImg from "@/media/Cheer/EmilieCheer.png";
import frandsenImg from "@/media/VG/FrandsenVG.png";
import frandsenCheerImg from "@/media/Cheer/FrandsenCheer.png";
import izabelaImg from "@/media/VG/IzabelaVG.png";
import izabelaCheerImg from "@/media/Cheer/IzabelaCheer.png";

type SpriteEntry = {
  name: string;
  src: StaticImageData;
  cheerSrc: StaticImageData;
  /** Optional per-character zoom applied only to `cheerSrc` (defaults to 1x).
   *  Some cheer photos are cropped much wider/squarer than the idle photos,
   *  so `object-contain` shrinks them to fit — bump this to compensate. It
   *  scales up from the character's feet, so their position on the stand
   *  doesn't shift. */
  cheerScale?: number;
};

export const SPRITE_KEYS = [
  "seb",
  "clea",
  "filip",
  "robert",
  "kirstine",
  "kristian",
  "lukas",
  "mads",
  "madsL",
  "ola",
  "signe",
  "steen",
  "lasse",
  "ebbe",
  "emilie",
  "frandsen",
  "izabela",
] as const;
export type SpriteKey = (typeof SPRITE_KEYS)[number];

/**
 * Pixel-art character portraits. Two frames per character — an idle pose (`src`)
 * and an arms-up celebrating pose (`cheerSrc`) — swapped by the cheerleader
 * section for proper 2-frame sprite animation.
 *
 * Used as cheerleaders on the race section and as tutorial guides. They don't
 * map to teams or specific users. Tutorial + Join still only need `src`.
 */
export const SPRITES: Record<SpriteKey, SpriteEntry> = {
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
    cheerScale: 1.9,
  },
  kirstine: {
    name: "Kirstine",
    src: kirstineImg as StaticImageData,
    cheerSrc: kirstineCheerImg as StaticImageData,
  },
  kristian: {
    name: "Kristian",
    src: kristianImg as StaticImageData,
    cheerSrc: kristianCheerImg as StaticImageData,
  },
  lukas: {
    name: "Lukas",
    src: lukasImg as StaticImageData,
    cheerSrc: lukasCheerImg as StaticImageData,
  },
  mads: {
    name: "Mads",
    src: madsImg as StaticImageData,
    cheerSrc: madsCheerImg as StaticImageData,
  },
  madsL: {
    name: "Mads L",
    src: madsLImg as StaticImageData,
    cheerSrc: madsLCheerImg as StaticImageData,
  },
  ola: {
    name: "Ola",
    src: olaImg as StaticImageData,
    cheerSrc: olaCheerImg as StaticImageData,
  },
  signe: {
    name: "Signe",
    src: signeImg as StaticImageData,
    cheerSrc: signeCheerImg as StaticImageData,
  },
  steen: {
    name: "Steen",
    src: steenImg as StaticImageData,
    cheerSrc: steenCheerImg as StaticImageData,
  },
  lasse: {
    name: "Lasse",
    src: lasseImg as StaticImageData,
    cheerSrc: lasseCheerImg as StaticImageData,
  },
  ebbe: {
    name: "Ebbe",
    src: ebbeImg as StaticImageData,
    cheerSrc: ebbeCheerImg as StaticImageData,
  },
  emilie: {
    name: "Emilie",
    src: emilieImg as StaticImageData,
    cheerSrc: emilieCheerImg as StaticImageData,
  },
  frandsen: {
    name: "Frandsen",
    src: frandsenImg as StaticImageData,
    cheerSrc: frandsenCheerImg as StaticImageData,
  },
  izabela: {
    name: "Izabela",
    src: izabelaImg as StaticImageData,
    cheerSrc: izabelaCheerImg as StaticImageData,
  },
};
