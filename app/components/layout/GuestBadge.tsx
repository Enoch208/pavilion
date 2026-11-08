import { useT } from "@agent-native/core/client/i18n";
import { IconFlask } from "@tabler/icons-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function GuestBadge({ compact }: { compact: boolean }) {
  const t = useT();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "flex items-center gap-2 rounded-lg text-sm text-sidebar-accent-foreground outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            compact ? "size-8 justify-center" : "h-11 min-w-0 flex-1 px-3",
          )}
        >
          <IconFlask className="size-4 shrink-0" strokeWidth={1.8} />
          {compact ? null : (
            <span className="truncate">{t("guest.sandbox")}</span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="right">{t("guest.expires")}</TooltipContent>
    </Tooltip>
  );
}
