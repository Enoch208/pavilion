import type { PlacedObject } from "../contracts/layout.js";
import { footprint, type Rect, type VenueSize } from "../geometry/index.js";

export type BlockTone =
  | "floor"
  | "wall"
  | "zone"
  | "exit"
  | "stage"
  | "seat"
  | "table"
  | "counter"
  | "screen"
  | "stand"
  | "pillar";

export type SceneBlock = {
  key: string;
  shape: "box" | "cylinder";
  tone: BlockTone;
  centre: readonly [number, number, number];
  size: readonly [number, number, number];
};

export const APPROXIMATE_HEIGHTS_M = {
  stage: 0.6,
  seat: 0.46,
  chairBack: 0.86,
  tableTop: 0.75,
  registrationDesk: 1.05,
  refreshmentStation: 0.9,
  screenBottom: 1.3,
  pillar: 3.2,
  wall: 0.5,
} as const;

const WALL_THICKNESS_M = 0.15;
const FLOOR_THICKNESS_M = 0.05;
const CHAIR_GAP_M = 0.08;
const H = APPROXIMATE_HEIGHTS_M;

type Footprint = { x: number; z: number; w: number; d: number };

function metresOf(rect: Rect): Footprint {
  return {
    x: rect.x / 1_000,
    z: rect.y / 1_000,
    w: rect.width / 1_000,
    d: rect.height / 1_000,
  };
}

function slab(
  key: string,
  tone: BlockTone,
  area: Footprint,
  bottom: number,
  top: number,
  shape: SceneBlock["shape"] = "box",
): SceneBlock {
  return {
    key,
    shape,
    tone,
    centre: [area.x + area.w / 2, (bottom + top) / 2, area.z + area.d / 2],
    size: [area.w, top - bottom, area.d],
  };
}

function inset(area: Footprint, fraction: number): Footprint {
  const w = area.w * fraction;
  const d = area.d * fraction;
  return {
    x: area.x + (area.w - w) / 2,
    z: area.z + (area.d - d) / 2,
    w,
    d,
  };
}

function backEdge(
  area: Footprint,
  rotationDeg: PlacedObject["rotationDeg"],
  depth: number,
): Footprint {
  switch (rotationDeg) {
    case 0:
      return { ...area, z: area.z + area.d - depth, d: depth };
    case 90:
      return { ...area, w: depth };
    case 180:
      return { ...area, d: depth };
    case 270:
      return { ...area, x: area.x + area.w - depth, w: depth };
  }
}

function shrink(area: Footprint, margin: number): Footprint {
  const x = Math.min(margin, area.w / 4);
  const z = Math.min(margin, area.d / 4);
  return { x: area.x + x, z: area.z + z, w: area.w - 2 * x, d: area.d - 2 * z };
}

function chair(
  id: string,
  footprintArea: Footprint,
  rotationDeg: PlacedObject["rotationDeg"],
) {
  const area = shrink(footprintArea, CHAIR_GAP_M / 2);
  const back = Math.min(area.w, area.d) * 0.14;
  return [
    slab(`${id}:leg`, "stand", inset(area, 0.3), 0, H.seat - 0.05),
    slab(`${id}:seat`, "seat", area, H.seat - 0.05, H.seat),
    slab(
      `${id}:back`,
      "seat",
      backEdge(area, rotationDeg, back),
      H.seat,
      H.chairBack,
    ),
  ];
}

function roundTable(id: string, area: Footprint) {
  return [
    slab(
      `${id}:leg`,
      "stand",
      inset(area, 0.08),
      0,
      H.tableTop - 0.04,
      "cylinder",
    ),
    slab(`${id}:top`, "table", area, H.tableTop - 0.04, H.tableTop, "cylinder"),
  ];
}

function displayScreen(id: string, area: Footprint) {
  const wide = area.w >= area.d;
  const length = wide ? area.w : area.d;
  const panelHeight = (length * 9) / 16;
  const panel = wide
    ? { ...area, z: area.z + area.d / 2 - 0.03, d: 0.06 }
    : { ...area, x: area.x + area.w / 2 - 0.03, w: 0.06 };
  const post = inset(area, 0.12);
  return [
    slab(`${id}:base`, "stand", area, 0, 0.04),
    slab(`${id}:post`, "stand", post, 0.04, H.screenBottom),
    slab(
      `${id}:panel`,
      "screen",
      panel,
      H.screenBottom,
      H.screenBottom + panelHeight,
    ),
  ];
}

export function objectBlocks(object: PlacedObject): SceneBlock[] {
  const area = metresOf(footprint(object));
  const { id } = object;
  switch (object.kind) {
    case "chair":
      return chair(id, area, object.rotationDeg);
    case "round-table":
      return roundTable(id, area);
    case "display-screen":
      return displayScreen(id, area);
    case "stage":
      return [slab(id, "stage", area, 0, H.stage)];
    case "registration-desk":
      return [slab(id, "counter", area, 0, H.registrationDesk)];
    case "refreshment-station":
      return [slab(id, "counter", area, 0, H.refreshmentStation)];
    case "obstacle":
      return [slab(id, "pillar", area, 0, H.pillar)];
    case "zone":
      return [slab(id, "zone", area, 0.002, 0.008)];
    case "exit-zone":
      return [slab(id, "exit", area, 0.004, 0.01)];
  }
}

export function venueBlocks(venue: VenueSize): SceneBlock[] {
  const w = venue.widthMm / 1_000;
  const d = venue.heightMm / 1_000;
  const t = WALL_THICKNESS_M;
  const wall = (key: string, area: Footprint) =>
    slab(`wall:${key}`, "wall", area, -FLOOR_THICKNESS_M, H.wall);
  return [
    slab("floor", "floor", { x: 0, z: 0, w, d }, -FLOOR_THICKNESS_M, 0),
    wall("north", { x: -t, z: -t, w: w + 2 * t, d: t }),
    wall("south", { x: -t, z: d, w: w + 2 * t, d: t }),
    wall("west", { x: -t, z: 0, w: t, d }),
    wall("east", { x: w, z: 0, w: t, d }),
  ];
}
