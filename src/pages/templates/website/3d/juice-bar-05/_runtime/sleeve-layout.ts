// Measured word layout for the curved front panel. No glyph slicing, forced
// horizontal compression or font smaller than the readable floor.
export const SLEEVE_ARC = (Math.PI * 2) / 3;
export const SLEEVE_WIDTH = 900; // logical pixels; inset within the 120° panel
export const SLEEVE_MIN_FONT = 128;
export const SLEEVE_MAX_FONT = 176;

type Measure = (text: string, fontSize: number) => number;
export function layoutSleeveName(value: string, measure: Measure) {
  const words = value.trim().split(/\s+/u).filter(Boolean);
  const text = words.join(' ');
  const result = (lines: string[], fontSize: number, truncated = false) => ({
    lines,
    fontSize,
    truncated,
  });
  if (!text) return result(['…'], SLEEVE_MIN_FONT, true);
  for (let size = SLEEVE_MAX_FONT; size >= SLEEVE_MIN_FONT; size -= 2)
    if (measure(text, size) <= SLEEVE_WIDTH) return result([text], size);

  function wrap(size: number) {
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      if (measure(word, size) > SLEEVE_WIDTH) return [];
      const next = line ? `${line} ${word}` : word;
      if (measure(next, size) <= SLEEVE_WIDTH) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
  for (let size = SLEEVE_MAX_FONT; size >= SLEEVE_MIN_FONT; size -= 2) {
    const lines = wrap(size);
    if (lines.length && lines.length <= 2) return result(lines, size);
  }

  // At the minimum font, retain complete words in two lines and append an
  // ellipsis. An individually over-wide token becomes “…” rather than splitting.
  const remaining = [...words],
    lines: string[] = [];
  for (let row = 0; row < 2 && remaining.length; row++) {
    const line: string[] = [];
    while (
      remaining.length &&
      measure([...line, remaining[0]].join(' '), SLEEVE_MIN_FONT) <= SLEEVE_WIDTH
    )
      line.push(remaining.shift()!);
    if (row === 0 && !line.length) return result(['…'], SLEEVE_MIN_FONT, true);
    if (row === 1 && remaining.length) {
      while (line.length && measure(line.join(' ') + '…', SLEEVE_MIN_FONT) > SLEEVE_WIDTH)
        line.pop();
      lines.push(line.join(' ') + '…');
    } else lines.push(line.join(' '));
  }
  return result(lines, SLEEVE_MIN_FONT, true);
}
