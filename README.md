# Brief — your tech newsletters, distilled

A static website that turns the technical newsletters in your inbox into a clean,
Apple-styled daily digest. Every day an AI agent reads the last ~48 hours of email,
keeps only the relevant tech/programming/AI newsletters (no promos, no personal
mail), writes a **self-contained summary** of each with a link to the source, and
generates a **multiple-choice quiz** to test what you read.

Three levels, like a blog:

- **Home** — a timeline of days; the latest is featured.
- **Day page** — a grid of article previews for that day (up to 5).
- **Article page** — each newsletter as its own blog post: standfirst, key
  takeaways, the full write-up, "Read the original", an inline quiz, and prev/next
  navigation.

It's **100% static** — the data is JSON under `content/`, bundled at build time and
deployable anywhere (hash routing, no server needed).

## How it works

```
inbox ──(gmail scripts)──▶ AI agent reads & summarizes ──▶ content/editions/<date>/index.json
                                                         ├▶ content/editions/<date>/<slug>.json
                                                         └▶ content/state.json
                                                                  │
                                                  pnpm newsletter:validate → pnpm build → dist/
```

The agent's full playbook is in **[INSTRUCTION.md](./INSTRUCTION.md)** — read that to
understand (or run) the daily pipeline. Each summary is written in the newsletter's
**original language and voice** (first/second/third person mirrored from the source).

## Stack

Vite · React 19 · TypeScript · Tailwind v4 · shadcn/ui (radix-nova) · next-themes ·
Gmail API (read-only OAuth).

## Develop

```bash
pnpm install
pnpm dev                     # local dev server
pnpm build                   # type-check + build → dist/
pnpm preview                 # serve the built site
```

## The daily content pipeline

```bash
pnpm gmail:auth              # one-time read-only Gmail login
pnpm newsletter:since        # window to scan (emails newer than last run)
pnpm gmail:list -- --json    # candidate emails
pnpm gmail:get <id> -- --json
pnpm newsletter:validate     # gate: validates everything in content/
pnpm build
```

## Project layout

| Path | What |
| --- | --- |
| `INSTRUCTION.md` | The agent's daily playbook (read this first). |
| `content/editions/<date>/index.json` | Day metadata + ordered article slugs (≤ 5). |
| `content/editions/<date>/<slug>.json` | One article (blog post + quiz). Agent-generated. |
| `content/state.json` | Bookmark: last processed email timestamp. |
| `lib/edition.ts` | Data schema + validation (single source of truth). |
| `lib/content.ts` | Loads & bundles days/articles for the site. |
| `scripts/gmail/` | Read-only Gmail fetch scripts. |
| `scripts/newsletter/` | `since` (window) and `validate` (schema gate). |
| `src/`, `components/` | The React site. You don't edit these to add data. |

> `content/editions/2026-06-26/` is **sample data** to showcase the design —
> delete the folder on the first real run.
