import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { validateArticle, validateDayMeta } from '../../lib/edition.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../');
const EDITIONS_DIR = join(ROOT, 'content', 'editions');
const STATE_PATH = join(ROOT, 'content', 'state.json');
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface Report {
  problems: number;
  articles: number;
}

function readJson(path: string): { data?: unknown; error?: string } {
  try {
    return { data: JSON.parse(readFileSync(path, 'utf-8')) };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

function validateDayFolder(date: string, report: Report): void {
  const folder = join(EDITIONS_DIR, date);
  const problems: string[] = [];

  if (!DATE_RE.test(date)) {
    problems.push(`folder name "${date}" must be a date (YYYY-MM-DD)`);
  }

  // Day metadata (index.json) is required.
  const indexPath = join(folder, 'index.json');
  let listedSlugs: string[] = [];
  if (!existsSync(indexPath)) {
    problems.push('missing index.json (day metadata)');
  } else {
    const { data, error } = readJson(indexPath);
    if (error) {
      problems.push(`index.json: invalid JSON — ${error}`);
    } else {
      problems.push(...validateDayMeta(data, 'index.json'));
      const meta = data as { date?: unknown; articles?: unknown };
      if (typeof meta.date === 'string' && meta.date !== date) {
        problems.push(`index.json: date "${meta.date}" must match the folder name "${date}"`);
      }
      if (Array.isArray(meta.articles)) listedSlugs = meta.articles.filter((s): s is string => typeof s === 'string');
    }
  }

  // Article files = every *.json except index.json.
  const articleFiles = readdirSync(folder).filter((file) => file.endsWith('.json') && file !== 'index.json');
  const fileSlugs: string[] = [];

  for (const file of articleFiles) {
    const slug = file.replace(/\.json$/, '');
    fileSlugs.push(slug);
    const { data, error } = readJson(join(folder, file));
    if (error) {
      problems.push(`${file}: invalid JSON — ${error}`);
      continue;
    }
    problems.push(...validateArticle(data, file));
    const article = data as { slug?: unknown; date?: unknown };
    if (typeof article.slug === 'string' && article.slug !== slug) {
      problems.push(`${file}: slug "${article.slug}" must match the file name "${slug}"`);
    }
    if (typeof article.date === 'string' && article.date !== date) {
      problems.push(`${file}: date "${article.date}" must match the folder "${date}"`);
    }
    report.articles += 1;
  }

  // 1:1 consistency between index.json and the files on disk.
  for (const slug of listedSlugs) {
    if (!fileSlugs.includes(slug)) problems.push(`index.json lists "${slug}" but ${slug}.json does not exist`);
  }
  for (const slug of fileSlugs) {
    if (!listedSlugs.includes(slug)) problems.push(`${slug}.json exists but is not listed in index.json's "articles"`);
  }
  if (articleFiles.length === 0) problems.push('no article files found in this day folder');

  if (problems.length > 0) {
    console.error(`✗ ${date}/`);
    for (const problem of problems) console.error(`    - ${problem}`);
    report.problems += problems.length;
  } else {
    console.log(`✓ ${date}/ (${articleFiles.length} ${articleFiles.length === 1 ? 'article' : 'articles'})`);
  }
}

function validateState(report: Report): void {
  if (!existsSync(STATE_PATH)) {
    console.error('✗ content/state.json\n    - missing — create it (see INSTRUCTION.md).');
    report.problems += 1;
    return;
  }
  const { data, error } = readJson(STATE_PATH);
  if (error) {
    console.error(`✗ content/state.json\n    - invalid JSON — ${error}`);
    report.problems += 1;
    return;
  }
  if (typeof data !== 'object' || data === null || typeof (data as Record<string, unknown>).lastProcessedTimestamp !== 'number') {
    console.error('✗ content/state.json\n    - lastProcessedTimestamp: required number (epoch seconds)');
    report.problems += 1;
    return;
  }
  console.log('✓ content/state.json');
}

function main(): void {
  const report: Report = { problems: 0, articles: 0 };

  if (!existsSync(EDITIONS_DIR)) {
    console.error(`\n❌ content/editions does not exist.\n`);
    process.exit(1);
  }

  const entries = readdirSync(EDITIONS_DIR, { withFileTypes: true });
  const dayFolders = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const strayFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'));

  console.log(`\nValidating ${dayFolders.length} day folder(s) in content/editions …\n`);

  for (const date of dayFolders) validateDayFolder(date, report);

  for (const stray of strayFiles) {
    console.error(`✗ content/editions/${stray.name}: stray file — each day must be a folder with an index.json (see INSTRUCTION.md)`);
    report.problems += 1;
  }

  validateState(report);

  console.log('');
  if (report.problems > 0) {
    console.error(`❌ ${report.problems} problem(s) found. Fix them before building.\n`);
    process.exit(1);
  }
  console.log(`✅ All good — ${dayFolders.length} day(s), ${report.articles} article(s).\n`);
}

main();
