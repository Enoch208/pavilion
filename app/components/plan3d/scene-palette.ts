import type { BlockTone } from "@shared/scene/blocks";

export type ScenePalette = {
  background: string;
  sky: string;
  ground: string;
  grid: string;
  accent: string;
  moved: string;
  removed: string;
  tones: Record<BlockTone, string>;
};

export const LIGHT_PALETTE: ScenePalette = {
  background: "#f4f4f5",
  sky: "#ffffff",
  ground: "#d4d4d8",
  grid: "#d4d4d8",
  accent: "#0284c7",
  moved: "#38bdf8",
  removed: "#ef4444",
  tones: {
    floor: "#fafafa",
    wall: "#a1a1aa",
    zone: "#0284c7",
    exit: "#10b981",
    stage: "#52525b",
    seat: "#3f3f46",
    table: "#e4e4e7",
    counter: "#a1a1aa",
    screen: "#18181b",
    stand: "#27272a",
    pillar: "#71717a",
  },
};

export const DARK_PALETTE: ScenePalette = {
  background: "#1c1c1c",
  sky: "#d4d4d8",
  ground: "#18181b",
  grid: "#3f3f46",
  accent: "#38bdf8",
  moved: "#7dd3fc",
  removed: "#f87171",
  tones: {
    floor: "#2a2a2a",
    wall: "#52525b",
    zone: "#38bdf8",
    exit: "#34d399",
    stage: "#71717a",
    seat: "#d4d4d8",
    table: "#e4e4e7",
    counter: "#a1a1aa",
    screen: "#09090b",
    stand: "#71717a",
    pillar: "#a1a1aa",
  },
};
