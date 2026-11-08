import { useT } from "@agent-native/core/client/i18n";
import { packFileName } from "@shared/export/format";
import { renderFloorPlanSvg } from "@shared/export/svg";
import { IconDownload } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { saveFile, svgToPng, textFile } from "./download";
import { PNG_WIDTH_PX, type RenderedPack } from "./render";

export function PackDownloads({ rendered }: { rendered: RenderedPack }) {
  const t = useT();
  const [drawing, setDrawing] = useState(false);
  const { pack } = rendered;
  const fileName = (suffix: string) =>
    packFileName(pack.source.event.title, pack.source.plan.version, suffix);

  function downloadPng() {
    setDrawing(true);
    const plan = renderFloorPlanSvg(pack, PNG_WIDTH_PX);
    svgToPng(plan.svg, plan.widthPx, plan.heightPx)
      .then((blob) => saveFile(fileName("floor-plan.png"), blob))
      .catch(() => toast.error(t("pack.pngFailed")))
      .finally(() => setDrawing(false));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={drawing}>
          <IconDownload className="size-4" />
          {drawing ? t("pack.drawing") : t("pack.download")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() =>
            saveFile(
              fileName("floor-plan.svg"),
              textFile(rendered.svg, "image/svg+xml"),
            )
          }
        >
          {t("pack.svg")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={downloadPng}>
          {t("pack.png")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            saveFile(
              fileName("setup-pack.html"),
              textFile(rendered.html, "text/html"),
            )
          }
        >
          {t("pack.html")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
