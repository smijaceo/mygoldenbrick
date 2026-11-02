"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { dateFromIso, isoFromDate, todayIso } from "@/lib/format";
import { buttonClass, cx } from "@/components/ui";

function describe(iso: string) {
  if (iso === todayIso()) return "Today";
  if (iso === todayIso(1)) return "Tomorrow";
  return dateFromIso(iso)?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) ?? "Pick a date";
}

/**
 * A date picked from a calendar popover. The value posts as "YYYY-MM-DD" under `name`,
 * so server actions read it exactly as they read the old native date input.
 */
export function DateField({ name, defaultValue, label, fromToday = true }: { name: string; defaultValue: string; label: string; fromToday?: boolean }) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const today = dateFromIso(todayIso());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <input type="hidden" name={name} value={value} />
      <PopoverTrigger className={cx(buttonClass("secondary"), "min-w-36 justify-start")} aria-label={`${label}: ${describe(value)}`}>
        <CalendarDays size={16} aria-hidden="true" className="text-muted" />
        {describe(value)}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-1">
        <Calendar
          mode="single"
          className="[--cell-size:--spacing(10)]"
          selected={dateFromIso(value)}
          defaultMonth={dateFromIso(value)}
          disabled={fromToday && today ? { before: today } : undefined}
          onSelect={(d) => {
            if (!d) return;
            setValue(isoFromDate(d));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
