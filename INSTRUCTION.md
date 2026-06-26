# INSTRUCTION.md — daily newsletter → website agent

You are an AI agent that runs **once a day**. Your job: read the last ~48 hours
of email, find the **technical newsletters worth keeping**, turn each into a
**self-contained summary + a short quiz**, and rebuild the static website.

You do the reading, judging, summarizing and quiz-writing yourself. The repo only
gives you small scripts to **fetch email**, **validate your output**, and **build
the site**. You never edit the React/UI code — you only add files under
`content/`.

```
inbox ──(gmail scripts)──▶ you read & summarize ──▶ content/editions/<date>.json
                                                  └▶ content/state.json
                                                          │
                                              pnpm newsletter:validate
                                                          │
                                                     pnpm build ──▶ dist/  (deploy)
```

---

## TL;DR — the daily run

```bash
# One-time setup (only if not done before)
pnpm install
pnpm gmail:auth                      # opens browser, read-only Gmail OAuth

# 1. Work out which emails are new since last time
pnpm newsletter:since                # → JSON incl. a ready-made `query`

# 2. List candidate emails in that window (use the query from step 1)
pnpm gmail:list -- --query "in:inbox after:<epoch>" --json

# 3. For every email that looks relevant, read its full content
pnpm gmail:get <messageId> -- --json

# 4. Write today's digest  → content/editions/<YYYY-MM-DD>.json   (you author this)
# 5. Update the bookmark   → content/state.json                  (you author this)

# 6. Verify and build
pnpm newsletter:validate             # must print ✅
pnpm build                           # → dist/  (then deploy dist/)
```

`<YYYY-MM-DD>` is **today's local date** (the day you are running).

---

## Step 1 — Find the time window

```bash
pnpm newsletter:since
```

Prints something like:

```json
{
  "sinceEpoch": 1782455400,
  "sinceISO": "2026-06-26T06:30:00.000Z",
  "usedFallbackWindow": false,
  "windowHours": 48,
  "query": "in:inbox after:1782455400"
}
```

- `since` is the timestamp of the **newest email you processed last time**
  (`content/state.json → lastProcessedTimestamp`). Only emails **strictly newer**
  than this should be considered — that is the "only emails superior to that
  timestamp" rule.
- On the **very first run** there is no state, so it falls back to the **last 48
  hours** (`usedFallbackWindow: true`).
- Using the stored bookmark (instead of always "last 48h") means a **missed day is
  recovered** on the next run rather than silently skipped.

Use the `query` string verbatim in the next step.

---

## Step 2 — List candidate emails

```bash
pnpm gmail:list -- --query "in:inbox after:1782455400" --json
```

Returns an array of lightweight rows:

```json
[
  { "id": "1899abc…", "threadId": "…", "from": "TLDR <dan@tldrnewsletter.com>",
    "subject": "⚡ Long-context models…", "date": "Wed, 25 Jun 2026 13:05:00 +0000",
    "snippet": "…" }
]
```

> The Gmail query uses normal Gmail search syntax. `after:<epoch>` is the floor
> from step 1. You can add filters if useful (e.g. `-category:promotions`), but you
> must still apply the relevance rules below yourself.

---

## Step 3 — Decide what is relevant

For each candidate, classify from the `from` / `subject` / `snippet` (open the full
body in step 4 only if you're unsure or you'll keep it).

### ✅ KEEP — technical newsletters & digests about

- Software engineering, programming languages, web / frontend / backend
- AI & machine learning, LLMs, data engineering
- Developer tools, DevOps, cloud, infrastructure
- Security / cybersecurity
- Computer science, research, notable hardware/systems
- Substantive tech-industry news (major launches, funding, acquisitions) **when the
  email actually explains them**

### ❌ IGNORE — never summarize

- **Promotions / marketing / sales**: discounts, coupons, "Black Friday", upsells,
  product ads (Gmail `category:promotions` is a strong signal).
- **Personal email**: 1:1 messages from real people, anything conversational.
- **Transactional**: receipts, invoices, orders, shipping, bills, bank/payment
  alerts, password resets, OTP/2FA codes, login alerts, calendar invites.
- **Social / platform notifications**: LinkedIn, X, GitHub notifications, YouTube,
  Instagram, recruiter outreach, job alerts.
- **Pure event/webinar/survey invites** with no real content of their own.
- Anything **off-topic** (lifestyle, general non-tech news, etc.).

> Rule of thumb: *"Is this a newsletter whose body teaches me something about
> tech / programming / AI?"* If yes → keep. If it's trying to **sell, notify, or
> chat** → ignore. When in doubt, lean toward **excluding** — quality over quantity.

---

## Step 4 — Read the full content

For each email you decided to keep:

```bash
pnpm gmail:get <messageId> -- --json
```

Returns:

```json
{
  "id": "…", "threadId": "…",
  "from": "…", "to": "…", "subject": "…", "date": "…",
  "snippet": "…",
  "text": "clean plain-text body — use this",
  "html": "original HTML"
}
```

Use `text` (already stripped of HTML) as your source. Dig into `html` only if you
need to recover a link the text version dropped.

---

## Step 5 — Write the summary

Produce **one summary object per kept email** (summarize the *issue as a whole*, not
one object per story inside it). Goal: the reader **understands the important
developments without opening the original**.

| Field | Rule |
| --- | --- |
| `id` | Stable slug: lowercase letters, digits, hyphens. Unique within the day. Derive from the topic (e.g. `typescript-native-compiler`). Reuse the same id if you reprocess the same email. |
| `title` | Clear, specific headline. Rephrase the subject; drop emoji/clickbait/promo framing. |
| `category` | Exactly one id from the [category list](#categories). |
| `newsletter` | Source name (e.g. `TLDR AI`, `Bytes`). |
| `author` | *(optional)* original author, if obvious. |
| `sourceUrl` | Absolute `https://` link to the original. **Prefer the "view in browser / read online" web version**; else the main story URL; else the newsletter's homepage. Never an unsubscribe/tracking/`mailto:` link. |
| `language` | ISO code of the **email's original language** (`en`, `es`, …). Detect it; don't translate. |
| `readingTimeMinutes` | *(optional)* integer estimate of the summary's reading time. |
| `receivedAt` | ISO datetime the email was received (from its `date`). |
| `tldr` | One punchy sentence — the hook. |
| `summary` | The self-contained write-up. **Write it in the email's original language.** A few solid paragraphs (separate with a blank line). Cover *what happened, why it matters, and the crucial specifics* (names, numbers, versions). Inline you may use `**bold**` and `` `code` ``. Aim ~600–1500 characters (hard minimum 120). |
| `keyPoints` | 3–6 crisp must-know bullets (also in the original language). |
| `tags` | *(optional)* 2–5 lowercase tags. |
| `quiz` | See step 6. |

**Language matters:** if the newsletter is in Spanish, the `title`, `tldr`,
`summary`, `keyPoints`, `tags` and the whole `quiz` are in Spanish. Keep `category`
ids and field names in English (they're machine values).

---

## Step 6 — Write the quiz

For each summary, write **3–5 multiple-choice questions** that test whether the
reader understood the summary.

- Each question: **4 options** ideally (2–5 allowed), **exactly one** correct.
- `answerIndex` is the 0-based index of the correct option.
- Questions must be **answerable from your summary / keyPoints** — not outside
  trivia. Make distractors plausible; avoid "all of the above".
- Add a one-line `explanation` for the correct answer.
- Same language as the summary.

```json
{
  "question": "What language is the new TypeScript compiler written in?",
  "options": ["Rust", "Go", "C++", "Zig"],
  "answerIndex": 1,
  "explanation": "It's a Go port, chosen because it maps cleanly onto the existing compiler."
}
```

---

## Step 7 — Keep only the 5 most relevant

A digest holds **at most 5 summaries**. If you kept more than five emails, rank and
keep the top 5, ordered **most relevant first**. Rank by:

1. **Impact** — how significant is this for software / AI?
2. **Fit** — how closely does it match the owner's interests (programming, tech, AI)?
3. **Freshness** — newer beats older.
4. **Signal** — substantive analysis beats a thin link blast.

Drop the rest (they are not carried over to future days). If you kept ≤5, keep them
all.

---

## Step 8 — Write the edition file

Write `content/editions/<YYYY-MM-DD>.json` (filename = today's local date, and it
**must equal** the `date` field inside).

```jsonc
{
  "date": "2026-06-26",                         // = filename, YYYY-MM-DD
  "generatedAt": "2026-06-26T08:00:00.000Z",    // now, ISO
  "summaries": [ /* 1–5 summary objects, most relevant first */ ]
}
```

- One edition file **per day**. If you run again the same day, **merge** into the
  existing file: add new summaries, **dedupe** (don't summarize the same email
  twice — match by `id`), then re-trim to the top 5.
- See `content/editions/2026-06-26.json` for a complete, valid reference (it ships
  as **sample data — delete it on your first real run**).
- The full schema + validation rules live in
  [`lib/edition.ts`](./lib/edition.ts) (the single source of truth).

---

## Step 9 — Update the bookmark (`content/state.json`)

```jsonc
{
  "lastProcessedTimestamp": 1782455400,         // epoch SECONDS, see below
  "lastProcessedISO": "2026-06-26T06:30:00.000Z",
  "lastRunAt": "2026-06-26T08:00:00.000Z",      // now, ISO
  "processedMessageIds": ["1899abc…"],          // optional, recent ids (cap ~200)
  "totals": { "editions": 1, "summaries": 3 }   // optional, informational
}
```

- Set `lastProcessedTimestamp` to the **newest email `date` (in epoch seconds) among
  ALL messages the list returned this run** — including the ones you ignored. That
  way promos/notifications in the window aren't re-examined tomorrow.
- If the list was **empty**, leave `lastProcessedTimestamp` unchanged.
- `processedMessageIds` is an optional safety net to avoid double-summarizing an
  email whose timestamp sits exactly on the boundary.

> Epoch seconds from an ISO date:
> `node -e "console.log(Math.floor(Date.parse('2026-06-26T06:30:00Z')/1000))"`

---

## Step 10 — Validate, build, deploy

```bash
pnpm newsletter:validate     # structural + schema checks; must print ✅ (exit 0)
pnpm build                   # tsc + vite → static site in dist/
```

Fix anything `newsletter:validate` reports before building (it checks every field,
that `date` matches the filename, ≤5 summaries, valid `answerIndex`, etc.). Then
deploy the contents of **`dist/`** to your static host.

> The site uses **hash routing** (`#/edition/2026-06-26`), so it works on any static
> host with **no server rewrite rules** (GitHub Pages, Netlify, S3, Cloudflare
> Pages…). Just publish `dist/`.

---

## Categories

Pick exactly one `category` id per summary (labels are what the UI shows):

| id | Label |
| --- | --- |
| `ai` | AI |
| `programming` | Programming |
| `web` | Web & Frontend |
| `devtools` | Tools & DevOps |
| `data` | Data & ML |
| `security` | Security |
| `science` | Science |
| `business` | Tech Business |
| `other` | Other |

If a summary spans several, choose the **dominant** one.

---

## What the website does with your files (for context)

- Every `content/editions/*.json` is bundled at build time. The **home page** lists
  each day as a card (newest first, with category chips); the **most recent** day is
  featured.
- Clicking a day opens that **edition page**: up to 5 cards, each showing the TLDR,
  key points, an expandable full summary, a **"Read original"** link, and a
  **"Take the quiz"** button (multiple-choice, instant scoring).
- You only ever touch `content/`. Never edit `src/`, `components/`, or `lib/` to add
  data — the data **is** the JSON.

---

## Commands cheat-sheet

| Command | Purpose |
| --- | --- |
| `pnpm gmail:auth` | One-time read-only Gmail login. |
| `pnpm newsletter:since` | Compute the "process emails after" window. |
| `pnpm gmail:list -- --query "<q>" --json` | List candidate emails as JSON. |
| `pnpm gmail:get <id> -- --json` | Full email body (use `.text`) as JSON. |
| `pnpm newsletter:validate` | Validate all `content/` files (gate before build). |
| `pnpm build` | Type-check + build the static site into `dist/`. |
| `pnpm preview` | Serve `dist/` locally to eyeball the result. |

## Don'ts

- ❌ Don't summarize promotions, personal, transactional or notification email.
- ❌ Don't translate — summarize in the email's original language.
- ❌ Don't exceed 5 summaries per day.
- ❌ Don't commit `scripts/gmail/credentials.json` or `token.json` (git-ignored).
- ❌ Don't hand-edit the React/UI code to inject data — only write under `content/`.
