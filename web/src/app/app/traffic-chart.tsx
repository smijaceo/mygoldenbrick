import { countTicks, labelIndexes } from "@/lib/chart";
import { dateFromIso } from "@/lib/format";

const PLOT = 112; // px

/**
 * Page views per day as gold columns (#b8891a, 3.2:1 on white so the bars read as marks) on a zero baseline, with a round y scale whose
 * top tick sits above the busiest day, and x labels on one step that lands on today.
 */
export function TrafficChart({ daily }: { daily: { day: string; views: number }[] }) {
  const max = Math.max(0, ...daily.map((d) => d.views));
  const ticks = countTicks(max);
  const top = ticks.at(-1)!;
  const labelled = new Set(labelIndexes(daily.length, daily.length > 7 ? 4 : 2));
  const name = (day: string, i: number) =>
    i === daily.length - 1 ? "Today" : dateFromIso(day)?.toLocaleDateString("en-US", { month: "short", day: "numeric" }) ?? day;
  const edge = (i: number) => (i === daily.length - 1 ? "justify-self-end" : i === 0 ? "justify-self-start" : "justify-self-center");

  return (
    <figure>
      <figcaption className="text-sm text-muted">Page views a day, last {daily.length} days</figcaption>
      <div className="mt-3 grid grid-cols-[2rem_minmax(0,1fr)]" role="img" aria-label={`Page views a day for the last ${daily.length} days, at most ${max} in a day`}>
        <div className="relative" style={{ height: PLOT }} aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="figures-col absolute right-2 text-xs text-muted" style={{ bottom: `${(t / top) * 100}%`, transform: "translateY(50%)" }}>
              {t}
            </span>
          ))}
        </div>
        <div className="relative" style={{ height: PLOT }} aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className={`absolute inset-x-0 ${t === 0 ? "h-0.5 bg-input" : "h-px bg-rule"}`} style={{ bottom: `${(t / top) * 100}%` }} />
          ))}
          <div className="absolute inset-0 grid items-end gap-[3px]" style={{ gridTemplateColumns: `repeat(${daily.length}, minmax(0, 1fr))` }}>
            {daily.map((d) => (
              <span key={d.day} className="relative rounded-t-[3px] bg-[#b8891a]" style={{ height: `${(d.views / top) * 100}%` }} />
            ))}
          </div>
        </div>
        <span />
        <div className="mt-2 grid" style={{ gridTemplateColumns: `repeat(${daily.length}, minmax(0, 1fr))` }} aria-hidden="true">
          {daily.map((d, i) => (
            <span key={d.day} className={`whitespace-nowrap text-xs text-muted ${edge(i)}`}>
              {labelled.has(i) ? name(d.day, i) : ""}
            </span>
          ))}
        </div>
      </div>
      {/* The numbers behind the bars, for screen readers. */}
      <table className="sr-only">
        <caption>Page views a day</caption>
        <tbody>
          {daily.map((d, i) => (
            <tr key={d.day}>
              <th scope="row">{name(d.day, i)}</th>
              <td className="text-right">{d.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
