import { useT } from "@agent-native/core/client/i18n";
import type { LayoutView } from "@shared/contracts/view";
import { IconArrowsShuffle } from "@tabler/icons-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { metres, parseMetres } from "./format";

type Mode = "theatre" | "banquet";

type Props = {
  view: LayoutView;
  busy: boolean;
  onPropose: (input: {
    mode: Mode;
    attendeeTarget: number;
    minAisleMm: number;
  }) => void;
};

function ModeChoice(props: { mode: Mode; onChange: (mode: Mode) => void }) {
  const t = useT();
  const option = (mode: Mode) => (
    <button
      type="button"
      aria-pressed={props.mode === mode}
      onClick={() => props.onChange(mode)}
      className={cn(
        "flex-1 rounded px-2 py-1 text-xs",
        props.mode === mode
          ? "bg-background font-medium shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {mode === "banquet" ? t("proposal.banquet") : t("proposal.theatre")}
    </button>
  );
  return (
    <div
      role="group"
      aria-label={t("proposal.style")}
      className="flex rounded-md bg-muted p-0.5"
    >
      {option("theatre")}
      {option("banquet")}
    </div>
  );
}

export function SuggestLayout({ view, busy, onPropose }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [guests, setGuests] = useState(String(view.event.attendeeTarget));
  const [aisle, setAisle] = useState(metres(view.plan.minAisleMm));
  const [mode, setMode] = useState<Mode>(
    view.plan.mode === "banquet" ? "banquet" : "theatre",
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const attendeeTarget = Number(guests);
    const minAisleMm = parseMetres(aisle);
    if (!Number.isInteger(attendeeTarget) || attendeeTarget < 0) {
      toast.error(t("proposal.invalidGuests"));
      return;
    }
    if (minAisleMm === null || minAisleMm < 600) {
      toast.error(t("plan.invalidNumber"));
      return;
    }
    onPropose({ mode, attendeeTarget, minAisleMm });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={busy}>
          <IconArrowsShuffle className="size-4" />
          {busy ? t("proposal.planning") : t("proposal.suggest")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <form onSubmit={submit} className="space-y-3">
          <ModeChoice mode={mode} onChange={setMode} />
          <div className="space-y-1">
            <Label htmlFor="suggest-guests">{t("proposal.guests")}</Label>
            <Input
              id="suggest-guests"
              inputMode="numeric"
              value={guests}
              onChange={(event) => setGuests(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="suggest-aisle">{t("proposal.aisle")}</Label>
            <Input
              id="suggest-aisle"
              inputMode="decimal"
              value={aisle}
              onChange={(event) => setAisle(event.target.value)}
            />
          </div>
          <Button type="submit" size="sm" className="w-full">
            {t("proposal.generate")}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
