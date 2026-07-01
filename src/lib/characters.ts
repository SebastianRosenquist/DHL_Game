/** Selectable team characters. The emoji rides the animated runner body. */
export const CHARACTERS = [
  { key: "fox", emoji: "🦊", label: "Fox" },
  { key: "panda", emoji: "🐼", label: "Panda" },
  { key: "tiger", emoji: "🐯", label: "Tiger" },
  { key: "rocket", emoji: "🚀", label: "Rocket" },
  { key: "dino", emoji: "🦖", label: "Dino" },
  { key: "unicorn", emoji: "🦄", label: "Unicorn" },
  { key: "robot", emoji: "🤖", label: "Robot" },
  { key: "shark", emoji: "🦈", label: "Shark" },
  { key: "owl", emoji: "🦉", label: "Owl" },
  { key: "frog", emoji: "🐸", label: "Frog" },
] as const;

export type CharacterKey = (typeof CHARACTERS)[number]["key"];

export const CHARACTER_KEYS = CHARACTERS.map((c) => c.key) as [
  CharacterKey,
  ...CharacterKey[],
];

export function characterEmoji(key: string): string {
  return CHARACTERS.find((c) => c.key === key)?.emoji ?? "🏃";
}

/** A friendly default palette the admin can pick from for team colors. */
export const TEAM_COLORS = [
  "#FFCC00",
  "#D40511",
  "#0EA5E9",
  "#22C55E",
  "#A855F7",
  "#F97316",
  "#EC4899",
  "#14B8A6",
];
