import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

type Totals = Record<string, Record<string, number>>;
// One process, one private durable file: only UTC day + reference + count are retained.
export function dailyTotals(file: string) {
  let queue = Promise.resolve();
  const update = (ref: string, now: Date) => {
    const next = queue.then(async () => {
      let totals: Totals = {};
      try {
        totals = JSON.parse(await readFile(file, 'utf8'));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
      const day = now.toISOString().slice(0, 10);
      const cutoff = new Date(now.getTime() - 89 * 86400000).toISOString().slice(0, 10);
      for (const old of Object.keys(totals)) if (old < cutoff) delete totals[old];
      totals[day] ??= {};
      totals[day][ref] = (totals[day][ref] || 0) + 1;
      await mkdir(dirname(file), { recursive: true, mode: 0o700 });
      await writeFile(file + '.tmp', JSON.stringify(totals) + '\n', { mode: 0o600 });
      await rename(file + '.tmp', file);
    });
    queue = next.catch(() => {});
    return next;
  };
  return update;
}
