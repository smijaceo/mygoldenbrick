"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { Ellipsis } from "lucide-react";
import { toast } from "sonner";
import { changeStage } from "../actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NeedsYou, cx } from "@/components/ui";
import { STAGES, stageLabel, type Stage } from "@/lib/types";

export type BoardLead = {
  id: number;
  name: string;
  stage: Stage;
  detail: string;
  age: string;
  unread: boolean;
};

export function Board({ leads }: { leads: BoardLead[] }) {
  const [optimistic, moveOptimistic] = useOptimistic(leads, (state, move: { id: number; stage: Stage }) =>
    state.map((l) => (l.id === move.id ? { ...l, stage: move.stage } : l)),
  );
  const [, start] = useTransition();
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<Stage | null>(null);

  function move(id: number, stage: Stage) {
    const lead = optimistic.find((l) => l.id === id);
    if (!lead || lead.stage === stage) return;
    start(async () => {
      moveOptimistic({ id, stage });
      try {
        await changeStage(id, stage);
        toast.success(`${lead.name} moved to ${stageLabel(stage)}`);
      } catch {
        toast.error(`${lead.name} didn’t move. Try again.`);
      }
    });
  }

  return (
    // Seven 150px columns fit the 1160px column; tablets scroll the board inside its own frame, and
    // phones stack the stages as one list (one region at a time).
    <div className="grid grid-cols-1 gap-6 pb-4 md:-mx-6 md:auto-cols-[minmax(150px,1fr)] md:grid-flow-col md:grid-cols-none md:gap-3 md:overflow-x-auto md:px-6 lg:mx-0 lg:px-0">
      {STAGES.map((stage) => {
        const items = optimistic.filter((l) => l.stage === stage.id);
        return (
          <section
            key={stage.id}
            aria-labelledby={`stage-${stage.id}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(stage.id);
            }}
            onDragLeave={() => setOver((s) => (s === stage.id ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              const id = Number(e.dataTransfer.getData("text/plain"));
              setOver(null);
              setDragging(null);
              if (id) move(id, stage.id);
            }}
            className={cx("flex min-w-0 flex-col rounded-lg transition-colors", over === stage.id && "bg-surface outline-1 -outline-offset-1 outline-accent")}
          >
            <header className="flex h-10 items-center justify-between px-1">
              <h2 id={`stage-${stage.id}`} className="text-sm font-semibold text-ink">{stage.label}</h2>
              <span className="figures-col text-sm text-muted">{items.length}</span>
            </header>
            <ul className="flex flex-1 flex-col gap-2 pb-2 md:min-h-24">
              {items.map((lead) => (
                <li
                  key={lead.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", String(lead.id));
                    e.dataTransfer.effectAllowed = "move";
                    setDragging(lead.id);
                  }}
                  onDragEnd={() => setDragging(null)}
                  className={cx("cursor-grab select-none rounded-lg bg-surface p-3 transition-opacity active:cursor-grabbing", dragging === lead.id && "opacity-40")}
                >
                  <Link href={`/app/leads/${lead.id}`} className={cx("flex items-center gap-2 text-sm text-ink hover:underline", lead.unread ? "font-semibold" : "font-normal")}>
                    {lead.unread && <NeedsYou label="Unread" />}
                    <span className="truncate">{lead.name}</span>
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{lead.detail}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted">{lead.age}</span>
                    <MoveMenu name={lead.name} stage={lead.stage} onMove={(s) => move(lead.id, s)} />
                  </div>
                </li>
              ))}
              {items.length === 0 && <li className="rounded-lg border border-dashed border-rule px-3 py-3 text-sm text-muted">No leads here.</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function MoveMenu({ name, stage, onMove }: { name: string; stage: Stage; onMove: (stage: Stage) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`Move ${name}`} className="-m-1.5 flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-raised hover:text-ink data-[state=open]:bg-raised data-[state=open]:text-ink">
        <Ellipsis size={16} aria-hidden="true" />
      </DropdownMenuTrigger>
      {/* taste-skill-ignore: a menu floats, so it keeps shadcn’s overlay shadow */}
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-sm font-normal text-muted">Move to</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup value={stage} onValueChange={(v) => onMove(v as Stage)}>
            {STAGES.map((s) => (
              <DropdownMenuRadioItem key={s.id} value={s.id}>{s.label}</DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
