/** A round axis maximum with 4–5 clean ticks; whole steps for counts. */
export const niceTicks = (max: number, integer = false) => {
  if (max <= 0) return [0];
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const nice = [1, 2, 5, 10].map((k) => k * pow).find((s) => s >= rough)!;
  const step = integer ? Math.max(1, nice) : nice;
  const ticks = [];
  for (let tick = 0; tick <= max + step * 0.999; tick += step) {
    ticks.push(tick);
  }
  return ticks;
};
