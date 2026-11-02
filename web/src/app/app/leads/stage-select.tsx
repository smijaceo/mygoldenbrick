"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { changeStage } from "../actions";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STAGES, stageLabel, type Stage } from "@/lib/types";

/** Moves a lead to another stage. `onMove` lets the pipeline board move the card before the server answers. */
export function StageSelect({
  leadId,
  stage,
  label = "Stage",
  size = "default",
  onMove,
}: {
  leadId: number;
  stage: Stage;
  label?: string;
  size?: "sm" | "default";
  onMove?: (stage: Stage) => void;
}) {
  const [pending, start] = useTransition();
  return (
    <Select
      value={stage}
      disabled={pending}
      onValueChange={(value) => {
        const next = value as Stage;
        if (next === stage) return;
        start(async () => {
          onMove?.(next);
          try {
            await changeStage(leadId, next);
            toast.success(`Moved to ${stageLabel(next)}`);
          } catch {
            toast.error("The stage didn’t change. Try again.");
          }
        });
      }}
    >
      <SelectTrigger size={size} aria-label={label} className="min-w-32">
        <SelectValue />
      </SelectTrigger>
      {/* taste-skill-ignore: a listbox floats, so it keeps shadcn’s overlay shadow */}
      <SelectContent position="popper" align="end">
        <SelectGroup>
          {STAGES.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
