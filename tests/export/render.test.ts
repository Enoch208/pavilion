import { packFileName } from "@shared/export/format";
import { renderSetupPackHtml } from "@shared/export/html";
import { buildSetupPack } from "@shared/export/pack";
import { renderFloorPlanSvg } from "@shared/export/svg";
import { describe, expect, it } from "vitest";

import { novaSource } from "./fixtures";

const HOSTILE = `<img src=x onerror="alert(1)"> & 'quotes'`;

function hostilePack() {
  const source = novaSource((objects) =>
    objects.map((object) =>
      object.kind === "stage" ? { ...object, label: HOSTILE } : object,
    ),
  );
  return buildSetupPack({
    ...source,
    event: { ...source.event, title: `Launch <b>night</b>` },
  });
}

describe("floor plan SVG", () => {
  it("draws every object once, at venue scale, with margins for dimensions", () => {
    const pack = buildSetupPack(novaSource());
    const { svg, widthPx, heightPx } = renderFloorPlanSvg(pack, 2_040);
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(
      true,
    );
    expect(svg).toContain('viewBox="-1200 -1200 20400 15900"');
    expect([widthPx, heightPx]).toEqual([2_040, 1_590]);
    expect(svg.match(/data-object-id="/g)).toHaveLength(128);
    expect(svg).toContain(">18 m</text>");
    expect(svg).toContain(">12 m</text>");
    expect(svg).toContain(">5 m</text>");
  });

  it("escapes labels and titles", () => {
    const { svg } = renderFloorPlanSvg(hostilePack());
    expect(svg).not.toContain("<img");
    expect(svg).not.toContain("<b>");
    expect(svg).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });
});

describe("printable setup pack", () => {
  it("holds the plan, the item list, the rows and the honest limits", () => {
    const pack = buildSetupPack(novaSource());
    const { svg } = renderFloorPlanSvg(pack);
    const html = renderSetupPackHtml(pack, svg);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain(svg);
    expect(html).toContain("<td>Chair</td>");
    expect(html).toContain("$3,040.00");
    expect(html).toContain("Seating rows (6 rows)");
    expect(html).toContain("Chair A1 to Chair A20");
    expect(html).toContain("Walls and overlaps clear");
    expect(html).toContain("not a legal occupancy figure");
    expect(html).toContain("2026-11-08 05:50 UTC");
    expect(html).not.toContain("<script");
  });

  it("escapes everything a person typed", () => {
    const pack = hostilePack();
    const html = renderSetupPackHtml(pack, renderFloorPlanSvg(pack).svg);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<b>");
    expect(html).toContain("Launch &lt;b&gt;night&lt;/b&gt; setup pack");
  });

  it("names files after the event and version", () => {
    expect(packFileName("Nova Product Launch", 13, "setup-pack.html")).toBe(
      "nova-product-launch-v13-setup-pack.html",
    );
    expect(packFileName("  ***  ", 2, "floor-plan.svg")).toBe(
      "event-v2-floor-plan.svg",
    );
  });
});
