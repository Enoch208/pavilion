import { buildSetupPack } from "@shared/export/pack";
import { describe, expect, it } from "vitest";

import { novaSource } from "./fixtures";

describe("setup pack", () => {
  it("lists what to bring, grouped, with sizes and totals that match the layout cost", () => {
    const pack = buildSetupPack(novaSource());
    expect(
      pack.items.map((item) => [
        item.name,
        item.quantity,
        item.widthMm,
        item.depthMm,
        item.lineCostCents,
      ]),
    ).toEqual([
      ["Presentation stage", 1, 5_000, 3_000, 120_000],
      ["Chair", 120, 500, 500, 54_000],
      ["Registration desk", 1, 2_000, 750, 15_000],
      ["Refreshment station", 1, 2_500, 750, 35_000],
      ["Display screen", 2, 1_500, 500, 80_000],
    ]);
    const total = pack.items.reduce((sum, item) => sum + item.lineCostCents, 0);
    expect(total).toBe(pack.summary.totalCostCents);
    expect(pack.summary.seats).toBe(120);
  });

  it("keeps fixed venue features out of the item list and lists them separately", () => {
    const pack = buildSetupPack(novaSource());
    const kinds = new Set(pack.items.map((item) => item.kind));
    expect(kinds.has("exit-zone")).toBe(false);
    expect(kinds.has("obstacle")).toBe(false);
    expect(pack.features.map((entry) => entry.label)).toEqual([
      "Structural pillar",
      "Exit west",
      "Exit east",
    ]);
    expect(pack.features.every((entry) => entry.locked)).toBe(true);
  });

  it("groups chairs into rows numbered from the north wall", () => {
    const { rows } = buildSetupPack(novaSource());
    expect(rows).toHaveLength(6);
    expect(rows[0]).toEqual({
      number: 1,
      yMm: 4_500,
      depthMm: 500,
      chairs: 20,
      fromXMm: 3_250,
      toXMm: 14_750,
      firstLabel: "Chair A1",
      lastLabel: "Chair A20",
    });
    expect(rows.map((row) => row.yMm)).toEqual([
      4_500, 5_500, 6_500, 7_500, 8_500, 9_500,
    ]);
  });

  it("places equipment by its footprint after a turn but lists its catalog size", () => {
    const pack = buildSetupPack(
      novaSource((objects) =>
        objects.map((object) =>
          object.kind === "stage" ? { ...object, rotationDeg: 90 } : object,
        ),
      ),
    );
    const stage = pack.equipment.find((entry) => entry.kind === "stage");
    expect(stage).toMatchObject({ widthMm: 3_000, depthMm: 5_000 });
    expect(pack.items[0]).toMatchObject({ widthMm: 5_000, depthMm: 3_000 });
  });

  it("gives resized or repriced items their own line", () => {
    const pack = buildSetupPack(
      novaSource((objects) =>
        objects.map((object) =>
          object.label === "Chair A1"
            ? { ...object, unitCostCents: 900 }
            : object,
        ),
      ),
    );
    const chairs = pack.items.filter((item) => item.kind === "chair");
    expect(chairs.map((item) => [item.quantity, item.unitCostCents])).toEqual([
      [119, 450],
      [1, 900],
    ]);
  });

  it("orders equipment from the north wall, then west to east", () => {
    const pack = buildSetupPack(novaSource());
    expect(pack.equipment.map((entry) => entry.label)).toEqual([
      "Presentation stage",
      "Display screen left",
      "Display screen right",
      "Refreshment station",
      "Registration desk",
    ]);
    expect(pack.issues).toBeNull();
  });
});
