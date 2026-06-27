# INSTRUCTION.md — daily newsletter → website agent

You are an AI agent that runs **once a day**. Your job: read the last ~48 hours

of email, find the **technical newsletters worth keeping**, turn each into a

**self-contained, blog-style article + a short quiz**, and rebuild the static

website.

You do the reading, judging, summarizing and quiz-writing yourself. The repo only

gives you small scripts to **fetch email**, **validate your output**, and **build**

**the site**. You never edit the React/UI code — you only add files under

`content/`.

```
inbox ──(gmail scripts)──▶ you read & summarize ──▶ content/editions/<date>/index.json
                                                  ├▶ content/editions/<date>/<slug>.json (one per article)
                                                  └▶ content/state.json
                                                           │
                                               pnpm newsletter:validate
                                                           │
                                                      pnpm build ──▶ dist/  (deploy)
```

Each kept newsletter becomes **its own article page** (like a blog post). A day

groups up to 5 of them.

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

# 4. Author today's folder:
#      content/editions/<YYYY-MM-DD>/<slug>.json   (one per article)
#      content/editions/<YYYY-MM-DD>/index.json    (day metadata + order)
# 5. Update the bookmark:
#      content/state.json

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

Prints e.g.:

```json
{ "sinceEpoch": 1782455400, "sinceISO": "2026-06-26T06:30:00.000Z",
  "usedFallbackWindow": false, "windowHours": 48, "query": "in:inbox after:1782455400" }
```

- `since` is the timestamp of the **newest email you processed last time**

  (`content/state.json → lastProcessedTimestamp`). Only emails **strictly newer**

  than this are considered — the "only emails superior to that timestamp" rule.
- On the **very first run** there's no state, so it falls back to the **last 48**

  **hours** (`usedFallbackWindow: true`).
- Using the stored bookmark (instead of always "last 48h") means a **missed day is**

  **recovered** on the next run rather than silently skipped.

Use the `query` string verbatim next.

---

## Step 2 — List candidate emails

```bash
pnpm gmail:list -- --query "in:inbox after:1782455400" --json
```

Returns an array of `{ id, threadId, from, subject, date, snippet }`. It uses normal

Gmail search syntax; `after:<epoch>` is the floor from step 1.

---

## Step 3 — Decide what is relevant

Classify each candidate from `from` / `subject` / `snippet`.

### ✅ KEEP — technical newsletters &amp; digests about

Software engineering, programming languages, web/frontend/backend, AI &amp; machine

learning, data engineering, developer tools, DevOps, cloud, infrastructure,

security, computer science / research, notable hardware, and substantive tech-

industry news (major launches, funding, acquisitions) **when the email actually**

**explains them**.

### ❌ IGNORE — never summarize

- **Promotions / marketing / sales** (Gmail `category:promotions` is a strong signal).
- **Personal email** — 1:1 messages from real people.
- **Transactional** — receipts, invoices, orders, shipping, bills, bank/payment

  alerts, password resets, OTP/2FA codes, login alerts, calendar invites.
- **Social / platform notifications** — LinkedIn, X, GitHub, YouTube, recruiters, job alerts.
- **Pure event/webinar/survey invites** with no real content of their own.
- Anything **off-topic** (lifestyle, general non-tech news).

> Rule of thumb: *"Is this a newsletter whose body teaches me something about*
>
> *tech / programming / AI?"* If yes → keep. If it's trying to **sell, notify, or**
>
> **chat** → ignore. When in doubt, **exclude** — quality over quantity.

---

## Step 4 — Read the full content

```bash
pnpm gmail:get <messageId> -- --json
```

Returns `{ id, from, to, subject, date, snippet, text, html }`. Use `text` (already

stripped of HTML); dig into `html` only to recover a link the text dropped.

---

## Step 5 — Write the article (summary)

Produce **one article per kept email** (summarize the *issue as a whole*, not one

per story inside it). The article is a **blog post**: it must stand on its own.

### ✍️ The two rules that matter most

1. **Broad &amp; complete.** Cover the full substance — the context, the core

   development, *why it matters*, the concrete specifics (names, numbers, versions),

   and any caveats or nuance the author raises. A reader should come away

   understanding the topic **without ever opening the original**. Typically **4–8**

   **paragraphs (~900–2500 characters)**. Separate paragraphs with a blank line;

   `**bold**` and ``code`` are allowed inline.
2. **Mirror the original author's voice — including grammatical person.**
  - Author writes in **first person** ("I built…", "we shipped…") → write the
  
     summary in that **same first person**, relaying their account in their voice.
  - Author uses **second person** ("you should…") → keep the second person.
  - Author writes **third-person / impersonal** reporting → keep it third person.
  - Also match **register** (formal vs casual, measured vs enthusiastic). The
  
    summary should read like a faithful, condensed version of the piece — not a
  
    detached outside description of it. **Never invent first-person claims for a**
  
    **third-person source, or flatten a personal essay into neutral reportage.**

### Fields


| Field                | Rule                                                                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slug`               | Stable slug: lowercase letters, digits, hyphens. **Equals the file name** (`<slug>.json`). Unique within the day.                                                                                          |
| `date`               | The day folder, `YYYY-MM-DD`. Must match the folder name.                                                                                                                                                  |
| `title`              | Clear, specific headline. Rephrase the subject; drop emoji/clickbait/promo framing.                                                                                                                        |
| `category`           | Exactly one id from the [category list](#categories).                                                                                                                                                      |
| `newsletter`         | Source name (e.g. `TLDR AI`, `Bytes`).                                                                                                                                                                     |
| `author`             | *(optional)* original author, if known.                                                                                                                                                                    |
| `sourceUrl`          | Absolute `https://` link to the original. **Prefer the "view in browser / read online" web version**; else the main story URL; else the newsletter homepage. Never an unsubscribe/tracking/`mailto:` link. |
| `language`           | ISO code of the **email's original language** (`en`, `es`, …). Detect it; **don't translate**.                                                                                                             |
| `readingTimeMinutes` | *(optional)* integer estimate.                                                                                                                                                                             |
| `receivedAt`         | ISO datetime the email was received (from its `date`).                                                                                                                                                     |
| `tldr`               | One punchy sentence — the hook / standfirst.                                                                                                                                                               |
| `summary`            | The full write-up. **Follow the two rules above.**                                                                                                                                                         |
| `keyPoints`          | 3–6 crisp must-know bullets (same language).                                                                                                                                                               |
| `tags`               | *(optional)* 2–5 lowercase tags.                                                                                                                                                                           |
| `quiz`               | See step 6.                                                                                                                                                                                                |


**Language:** if the newsletter is in Spanish, then `title`, `tldr`, `summary`,

`keyPoints`, `tags` and the whole `quiz` are in Spanish. Keep `category`, `slug` and

field names in English (they're machine values).

---

## Step 6 — Write the quiz

For each article, write **3–5 multiple-choice questions** that test whether the

reader understood the article.

- Each question: **4 options** ideally (2–5 allowed), **exactly one** correct.
- `answerIndex` is the 0-based index of the correct option.
- Questions must be **answerable from your article** — not outside trivia. Make

  distractors plausible; avoid "all of the above".
- Add a one-line `explanation`. Same language as the article.

```json
{ "question": "…", "options": ["…","…","…","…"], "answerIndex": 1, "explanation": "…" }
```

---

## Step 7 — Keep only the 5 most relevant

A day holds **at most 5 articles**. If you kept more than five emails, rank and keep

the top 5, ordered **most relevant first** (this order is the `articles` list in

`index.json`). Rank by:

1. **Impact** — how significant for software / AI?
2. **Fit** — how closely it matches the owner's interests (programming, tech, AI)?
3. **Freshness** — newer beats older.
4. **Signal** — substantive analysis beats a thin link blast.

Drop the rest (not carried to future days). If you kept ≤5, keep them all.

---

## Step 8 — Write today's folder

Create one folder per day, one file per article, plus `index.json`:

```
content/editions/2026-06-26/
├── index.json                       # day metadata + ordered slugs
├── long-context-agents.json         # ← Article (file name = slug)
├── typescript-native-compiler.json
└── rolldown-llega-a-vite.json
```

`**index.json**` (day metadata):

```jsonc
{
  "date": "2026-06-26",                 // = folder name
  "generatedAt": "2026-06-26T08:00:00.000Z",
  "title": "Optional day headline",      // optional
  "intro": "Optional 1–2 sentence overview shown on the day page.",  // optional
  "articles": [                          // ordered slugs, most relevant first, ≤ 5
    "long-context-agents",
    "typescript-native-compiler",
    "rolldown-llega-a-vite"
  ]
}
```

`**<slug>.json**` (one article — see step 5 for the fields):

```jsonc
{
  "slug": "typescript-native-compiler",
  "date": "2026-06-26",
  "title": "We rewrote the TypeScript compiler in Go — and it's about 10× faster",
  "category": "devtools",
  "newsletter": "Bytes",
  "author": "The TypeScript Team",
  "sourceUrl": "https://devblogs.microsoft.com/typescript/",
  "language": "en",
  "readingTimeMinutes": 4,
  "receivedAt": "2026-06-26T06:30:00.000Z",
  "tldr": "A Go-based port of tsc is now in public preview…",
  "summary": "From the very beginning, we wrote the TypeScript compiler in TypeScript itself…\n\n…",
  "keyPoints": ["…", "…", "…"],
  "tags": ["typescript", "compilers", "tooling"],
  "quiz": [ /* 3–5 questions */ ]
}
```

Rules:

- **Every slug in `index.json.articles` must have a matching `<slug>.json`, and vice**

  **versa** (1:1 — the validator enforces this).
- `index.json.articles` defines the **order** shown on the site.
- One folder **per day**. If you run again the same day, **merge** into the existing

  folder: add new article files, **dedupe** (don't summarize the same email twice —

  match by `slug`), update `index.json` (re-rank, keep top 5; delete the files for

  any article you drop).
- See `content/editions/2026-06-26/` for a complete valid reference.
- Full schema + validation rules live in [`lib/edition.ts`](./lib/edition.ts) (the

  single source of truth).

---

## Step 9 — Update the bookmark (`content/state.json`)

```jsonc
{
  "lastProcessedTimestamp": 1782455400,         // epoch SECONDS, see below
  "lastProcessedISO": "2026-06-26T06:30:00.000Z",
  "lastRunAt": "2026-06-26T08:00:00.000Z",      // now, ISO
  "processedMessageIds": ["1899abc…"],          // optional, recent ids (cap ~200)
  "totals": { "days": 1, "articles": 3 }        // optional, informational
}
```

- Set `lastProcessedTimestamp` to the **newest email `date` (epoch seconds) among**

  **ALL messages the list returned this run** — including the ones you ignored — so

  promos/notifications in the window aren't re-examined tomorrow.
- If the list was **empty**, leave `lastProcessedTimestamp` unchanged.

> Epoch seconds from an ISO date:
>
> `node -e "console.log(Math.floor(Date.parse('2026-06-26T06:30:00Z')/1000))"`

---

## Step 10 — Validate, build, deploy

```bash
pnpm newsletter:validate     # structural + schema checks; must print ✅ (exit 0)
pnpm build                   # tsc + vite → static site in dist/
```

`newsletter:validate` checks every field, that folder/file names match the `date`/

`slug` inside, that `index.json` and the files agree 1:1, ≤5 articles, valid

`answerIndex`, etc. Fix anything it reports, then deploy `**dist/**`.

> The site uses **hash routing** (`#/edition/<date>` and `#/edition/<date>/<slug>`),
>
> so it works on any static host with **no server rewrite rules**.

---

## Categories

Pick exactly one `category` id per article (labels are what the UI shows):


| id            | Label              |     | id         | Label         |
| ------------- | ------------------ | --- | ---------- | ------------- |
| `ai`          | AI                 |     | `security` | Security      |
| `programming` | Programming        |     | `science`  | Science       |
| `web`         | Web &amp; Frontend |     | `business` | Tech Business |
| `devtools`    | Tools &amp; DevOps |     | `other`    | Other         |
| `data`        | Data &amp; ML      |     |            |               |


If an article spans several, choose the **dominant** one.

---

## What the website does with your files (for context)

Three levels, like a blog:

1. **Home** (`#/`) — lists each **day** as a card (newest first, with category

   chips); the latest day is featured with its article titles. Uses each

   `index.json`.
2. **Day page** (`#/edition/<date>`) — the day's `title`/`intro` plus a grid of

   **article preview cards**.
3. **Article page** (`#/edition/<date>/<slug>`) — the full blog post: standfirst,

   key takeaways, the complete write-up, a **Read the original** button, an inline

   **quiz**, and prev/next links to the day's other articles.

You only ever touch `content/`. Never edit `src/`, `components/`, or `lib/` to add

data — the data **is** the JSON.

---

## Commands cheat-sheet


| Command                                   | Purpose                                            |
| ----------------------------------------- | -------------------------------------------------- |
| `pnpm gmail:auth`                         | One-time read-only Gmail login.                    |
| `pnpm newsletter:since`                   | Compute the "process emails after" window.         |
| `pnpm gmail:list -- --query "<q>" --json` | List candidate emails as JSON.                     |
| `pnpm gmail:get <id> -- --json`           | Full email body (use `.text`) as JSON.             |
| `pnpm newsletter:validate`                | Validate all `content/` files (gate before build). |
| `pnpm build`                              | Type-check + build the static site into `dist/`.   |
| `pnpm preview`                            | Serve `dist/` locally to eyeball the result.       |


## Don'ts

- ❌ Don't summarize promotions, personal, transactional or notification email.
- ❌ Don't translate — summarize in the email's original language **and voice**.
- ❌ Don't exceed 5 articles per day.
- ❌ Don't let `index.json` and the article files drift out of sync.
- ❌ Don't commit `scripts/gmail/credentials.json` or `token.json` (git-ignored).
- ❌ Don't hand-edit the React/UI code to inject data — only write under `content/`.

