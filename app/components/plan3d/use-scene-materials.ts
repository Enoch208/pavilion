import type { BlockTone } from "@shared/scene/blocks";
import { useCallback, useEffect, useMemo } from "react";
import { BoxGeometry, CylinderGeometry, MeshStandardMaterial } from "three";

import type { ScenePalette } from "./scene-palette";

export type BlockState = "plain" | "selected" | "added" | "moved" | "removed";

const FLAT_TONES = new Set<BlockTone>(["zone", "exit"]);
const OPACITY: Partial<Record<BlockTone, number>> = { zone: 0.14, exit: 0.45 };

function colourFor(palette: ScenePalette, tone: BlockTone, state: BlockState) {
  if (tone === "stand" || FLAT_TONES.has(tone)) return palette.tones[tone];
  switch (state) {
    case "selected":
    case "added":
      return palette.accent;
    case "moved":
      return palette.moved;
    case "removed":
      return palette.removed;
    case "plain":
      return palette.tones[tone];
  }
}

function createMaterial(
  palette: ScenePalette,
  tone: BlockTone,
  state: BlockState,
) {
  const removed = state === "removed";
  const opacity = removed ? 0.3 : (OPACITY[tone] ?? 1);
  return new MeshStandardMaterial({
    color: colourFor(palette, tone, state),
    roughness: tone === "screen" ? 0.35 : 0.8,
    metalness: tone === "stand" ? 0.3 : 0,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity === 1,
  });
}

export function useSceneMaterials(palette: ScenePalette) {
  const materials = useMemo(
    () => new Map<string, MeshStandardMaterial>(),
    [palette],
  );
  useEffect(
    () => () => {
      for (const material of materials.values()) material.dispose();
    },
    [materials],
  );
  return useCallback(
    (tone: BlockTone, state: BlockState) => {
      const key = `${tone}:${state}`;
      const cached = materials.get(key);
      if (cached) return cached;
      const created = createMaterial(palette, tone, state);
      materials.set(key, created);
      return created;
    },
    [materials, palette],
  );
}

export function useSceneGeometries() {
  const geometries = useMemo(
    () => ({
      box: new BoxGeometry(1, 1, 1),
      cylinder: new CylinderGeometry(0.5, 0.5, 1, 40),
    }),
    [],
  );
  useEffect(
    () => () => {
      geometries.box.dispose();
      geometries.cylinder.dispose();
    },
    [geometries],
  );
  return geometries;
}
