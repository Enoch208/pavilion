import type { PackSource } from "@shared/contracts/export";
import { renderSetupPackHtml } from "@shared/export/html";
import { buildSetupPack, type SetupPack } from "@shared/export/pack";
import { renderFloorPlanSvg } from "@shared/export/svg";

export const PNG_WIDTH_PX = 3_200;

export type RenderedPack = { pack: SetupPack; svg: string; html: string };

export function renderPack(source: PackSource): RenderedPack {
  const pack = buildSetupPack(source);
  const { svg } = renderFloorPlanSvg(pack);
  return { pack, svg, html: renderSetupPackHtml(pack, svg) };
}
