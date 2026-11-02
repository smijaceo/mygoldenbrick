const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];

/**
 * Y ticks for a count chart: zero at the base, round whole-number steps, at most five ticks,
 * and the top tick strictly above the maximum so the tallest bar never touches the plot's edge.
 */
export function countTicks(max: number): number[] {
  const step = STEPS.find((s) => Math.floor(max / s) + 1 <= 4) ?? Math.pow(10, Math.ceil(Math.log10(max)));
  const top = (Math.floor(max / step) + 1) * step;
  return Array.from({ length: top / step + 1 }, (_, i) => i * step);
}

/** Which of `count` columns get an x label: every `step`th one, counted back from the last. */
export function labelIndexes(count: number, step: number): number[] {
  const out: number[] = [];
  for (let i = count - 1; i >= 0; i -= step) out.unshift(i);
  return out;
}
