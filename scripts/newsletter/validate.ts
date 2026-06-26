import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { validateEdition } from '../../lib/edition.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../');
const EDITIONS_DIR = join(ROOT, 'content', 'editions');
const STATE_PATH = join(ROOT, 'content', 'state.json');

function listEditionFiles(): string[] {
  if (!existsSync(EDITIONS_DIR)) return [];
  return readdirSync(EDITIONS_DIR)
    .filter((file) => file.endsWith('.json'))
    .sort();
}

function validateState(): string[] {
  if (!existsSync(STATE_PATH)) {
    return ['content/state.json is missing — create it (see INSTRUCTION.md).'];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  } catch (error) {
    return [`content/state.json is not valid JSON: ${(error as Error).message}`];
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return ['content/state.json must be a JSON object'];
  }
  const state = parsed as Record<string, unknown>;
  if (typeof state.lastProcessedTimestamp !== 'number') {
    return ['state.lastProcessedTimestamp: required number (epoch seconds)'];
  }
  return [];
}

function main(): void {
  const files = listEditionFiles();
  console.log(`\nValidating ${files.length} edition file(s) in content/editions …\n`);

  let problems = 0;
  let summaryCount = 0;
  const seenDates = new Set<string>();

  for (const file of files) {
    let data: unknown;
    try {
      data = JSON.parse(readFileSync(join(EDITIONS_DIR, file), 'utf-8'));
    } catch (error) {
      console.error(`✗ ${file}: invalid JSON — ${(error as Error).message}`);
      problems += 1;
      continue;
    }

    const errors = validateEdition(data, file);

    // Filename / date consistency checks (beyond the shared schema).
    const record = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>;
    const date = typeof record.date === 'string' ? record.date : undefined;
    if (date) {
      const expected = file.replace(/\.json$/, '');
      if (date !== expected) {
        errors.push(`date "${date}" must match the filename "${expected}.json"`);
      }
      if (seenDates.has(date)) errors.push(`duplicate edition date "${date}"`);
      seenDates.add(date);
    }

    if (errors.length > 0) {
      console.error(`✗ ${file}`);
      for (const error of errors) console.error(`    - ${error}`);
      problems += errors.length;
    } else {
      const count = Array.isArray(record.summaries) ? record.summaries.length : 0;
      summaryCount += count;
      console.log(`✓ ${file} (${count} ${count === 1 ? 'summary' : 'summaries'})`);
    }
  }

  const stateErrors = validateState();
  if (stateErrors.length > 0) {
    console.error('✗ content/state.json');
    for (const error of stateErrors) console.error(`    - ${error}`);
    problems += stateErrors.length;
  } else {
    console.log('✓ content/state.json');
  }

  console.log('');
  if (problems > 0) {
    console.error(`❌ ${problems} problem(s) found. Fix them before building.\n`);
    process.exit(1);
  }
  console.log(`✅ All good — ${files.length} edition(s), ${summaryCount} summary(ies).\n`);
}

main();
