"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Phones: the stage tabs fold into one select, so the list starts high on the screen. */
export function StageFilter({ options, value }: { options: { id: string; label: string; count: number; href: string }[]; value: string }) {
  const router = useRouter();
  return (
    <Select value={value || "all"} onValueChange={(v) => router.push(options.find((o) => (o.id || "all") === v)!.href)}>
      <SelectTrigger aria-label="Filter by stage" className="w-full">
        <SelectValue />
      </SelectTrigger>
      {/* taste-skill-ignore: a listbox floats, so it keeps shadcn’s overlay shadow */}
      <SelectContent position="popper">
        <SelectGroup>
          {options.map((o) => (
            <SelectItem key={o.id || "all"} value={o.id || "all"}>
              {o.label} <span className="figures-col text-muted">{o.count}</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
