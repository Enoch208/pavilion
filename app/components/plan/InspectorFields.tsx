import { useT } from "@agent-native/core/client/i18n";
import { useState, type KeyboardEvent } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { metres, parseMetres } from "./format";

function commitOnEnter(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter") event.currentTarget.blur();
}

export function TextField(props: {
  id: string;
  label: string;
  value: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(props.value);
  const [source, setSource] = useState(props.value);
  if (source !== props.value) {
    setSource(props.value);
    setDraft(props.value);
  }
  return (
    <div className="space-y-1">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        value={draft}
        maxLength={80}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={commitOnEnter}
        onBlur={() => {
          const next = draft.trim();
          if (next && next !== props.value) props.onCommit(next);
          else setDraft(props.value);
        }}
      />
    </div>
  );
}

export function MetreField(props: {
  id: string;
  label: string;
  mm: number;
  disabled: boolean;
  onCommit: (mm: number) => void;
}) {
  const t = useT();
  const shown = metres(props.mm);
  const [draft, setDraft] = useState(shown);
  const [source, setSource] = useState(shown);
  if (source !== shown) {
    setSource(shown);
    setDraft(shown);
  }
  return (
    <div className="space-y-1">
      <Label htmlFor={props.id} className="text-xs">
        {props.label}
      </Label>
      <Input
        id={props.id}
        inputMode="decimal"
        className="tabular-nums"
        value={draft}
        disabled={props.disabled}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={commitOnEnter}
        onBlur={() => {
          const mm = parseMetres(draft);
          if (mm === null) {
            toast.error(t("plan.invalidNumber"));
            setDraft(shown);
            return;
          }
          if (mm !== props.mm) props.onCommit(mm);
        }}
      />
    </div>
  );
}
