import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Prints the Gmail search window for the next run as JSON. The agent reads
 * `query` and passes it to `pnpm gmail:list`. Logic:
 *
 *   since = lastProcessedTimestamp  (only emails strictly newer get processed)
 *   first run (no state) → fall back to the last 48 hours
 *
 * Using the stored timestamp — rather than always "last 48h" — means a missed
 * day is recovered on the next run instead of silently skipped.
 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../');
const STATE_PATH = join(ROOT, 'content', 'state.json');
const WINDOW_HOURS = 48;

function readLastTimestamp(): number {
  if (!existsSync(STATE_PATH)) return 0;
  try {
    const parsed = JSON.parse(readFileSync(STATE_PATH, 'utf-8')) as { lastProcessedTimestamp?: unknown };
    return typeof parsed.lastProcessedTimestamp === 'number' ? parsed.lastProcessedTimestamp : 0;
  } catch {
    return 0;
  }
}

const last = readLastTimestamp();
const fallback = Math.floor(Date.now() / 1000) - WINDOW_HOURS * 60 * 60;
const since = last > 0 ? last : fallback;

console.log(
  JSON.stringify(
    {
      sinceEpoch: since,
      sinceISO: new Date(since * 1000).toISOString(),
      usedFallbackWindow: last === 0,
      windowHours: WINDOW_HOURS,
      query: `in:inbox after:${since}`,
    },
    null,
    2,
  ),
);
