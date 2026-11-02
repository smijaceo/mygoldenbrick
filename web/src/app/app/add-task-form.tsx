"use client";

import { createTask } from "./actions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { DateField } from "@/components/date-field";
import { cx, inputBase } from "@/components/ui";
import { todayIso } from "@/lib/format";

export function AddTaskForm({ leadId }: { leadId?: number }) {
  return (
    <ActionForm action={createTask} success="Task added" className="flex flex-wrap items-center gap-2 px-5 pb-5 pt-3">
      {leadId && <input type="hidden" name="leadId" value={leadId} />}
      <input name="title" required placeholder="Add a task…" aria-label="Task" autoComplete="off" className={cx(inputBase, "min-w-0 flex-1 basis-48")} />
      <DateField name="due" label="Due" defaultValue={todayIso(1)} />
      <SubmitButton variant="secondary" pending="Adding…">Add</SubmitButton>
    </ActionForm>
  );
}
