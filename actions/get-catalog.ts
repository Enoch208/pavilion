import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { CATALOG } from "../shared/catalog.js";

export default defineAction({
  description:
    "List the equipment and fixed geometry that can be placed, with footprint in millimetres, seats each provides and unit cost in cents. Prices are example data, not supplier quotes; never invent others.",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  run: async () => ({ pricesAreExamples: true, items: CATALOG }),
});
