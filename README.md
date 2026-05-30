# Spanish Tutor — Offline Flashcard PWA

A fully offline-capable Progressive Web App for learning Spanish vocabulary and verb conjugations. Built with vanilla JavaScript, no dependencies, no build step. All data lives in the browser via IndexedDB.

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Study Modes](#study-modes)
  - [Standard Study](#standard-study)
  - [Weak Cards Mode](#weak-cards-mode)
  - [Prefer Weak Cards Mode](#prefer-weak-cards-mode)
  - [Mastery Mode](#mastery-mode)
  - [Conjugation Practice](#conjugation-practice)
- [Answer Grading](#answer-grading)
- [Cards Management](#cards-management)
  - [Adding Cards Manually](#adding-cards-manually)
  - [CSV Import](#csv-import)
  - [Duplicate Removal](#duplicate-removal)
- [Built-in Vocabulary](#built-in-vocabulary)
- [Verb Conjugation Data](#verb-conjugation-data)
- [Data Model](#data-model)
- [Architecture](#architecture)
- [PWA & Offline Support](#pwa--offline-support)
- [Design System](#design-system)
- [File Reference](#file-reference)

---

## Features

- **500+ built-in flashcards** organized into levels and categories
- **Three study directions**: Spanish→English, English→Spanish, or Mixed
- **Mastery mode**: session repeats failed cards round-by-round until every card is answered correctly
- **Weak cards**: filter or weight toward cards with < 75% historical accuracy
- **Fuzzy answer grading**: tolerates minor typos, accent omissions, and alternate gender endings
- **Conjugation practice**: quiz over 31 irregular verbs across all 5 Spanish pronouns
- **Full card editor**: add, edit, delete, search, and filter by tag
- **CSV import**: bulk-load custom cards with deduplication
- **Per-card stats**: attempt count and accuracy percentage shown on each card during study
- **Fully offline**: service worker + IndexedDB — no server, no account required
- **Installable PWA**: add to home screen on iOS, Android, or desktop

---

## Getting Started

### Running Locally

Because the app uses a service worker (which requires a secure context), serve it over HTTP rather than opening the HTML file directly.

```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .

# Node.js (http-server)
npx http-server -p 8080
```

Then open `http://localhost:8080` in your browser.

### Hosting on GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source**: `main` branch, `/ (root)`
3. The app is live at `https://yourusername.github.io/spanish-flashcards-pwa`

HTTPS is required for service workers — GitHub Pages provides this automatically.

### Installing as a PWA

**iOS**: Safari → Share button → "Add to Home Screen"  
**Android**: Chrome → ⋮ menu → "Install app" or "Add to Home Screen"  
**Desktop**: Chrome/Edge → install icon in the address bar

After installation the app works completely offline.

### First Launch

On first load the app seeds the IndexedDB with ~500 built-in cards. This happens automatically in the background. A seed version key (`v10`) is stored in the `settings` object store to prevent re-seeding on future visits. Bumping the version in `seed-data.js` triggers a re-seed that updates tags on existing cards and appends any new ones.

---

## Study Modes

### Standard Study

Navigate to the **Study** tab and configure your session:

| Setting | Options |
|---|---|
| Direction | Spanish→English · English→Spanish · Mixed |
| Session size | 10 · 20 · 50 · All · Endless ∞ |
| Tag filter | Multi-select — hold Ctrl/Cmd for multiple |

Cards are drawn using a **weighted random algorithm**: cards you answered incorrectly earlier in the session are more likely to reappear. The weight formula is:

```
weight = (1 − session_accuracy) + 0.1
```

The `+0.1` baseline ensures every card stays in rotation regardless of performance.

In **Endless** mode there is no session limit and the progress bar is hidden. The session runs until you tap ← Exit.

---

### Weak Cards Mode

**Checkbox: "Weak cards only (< 75%)"**

Filters the pool to only cards where your **historical accuracy** (across all sessions) is below 75%, with a minimum of 2 recorded attempts. Cards with no history are excluded — run a standard session first to build stats.

If no weak cards exist yet, a toast message appears: _"No weak cards yet — keep studying!"_

---

### Prefer Weak Cards Mode

**Checkbox: "Prefer weak cards"**

Keeps the full card pool but changes the weighting algorithm to use historical accuracy instead of session accuracy:

```
weight = 3 − (2 × historical_accuracy)
```

This gives weights between 1 (perfect card) and 3 (never answered correctly), making your worst cards appear three times as often as your best ones.

---

### Mastery Mode

**Checkbox: "Mastery — repeat until all correct"**

Mastery mode changes the session into a multi-round drill:

1. A deck of N cards is shuffled (N = your chosen session size)
2. You answer every card in the deck
3. Cards answered **correctly or close** are permanently removed from the deck
4. The remaining wrong-answer cards are **reshuffled** into the next round
5. Rounds repeat until every card in the deck has been answered correctly at least once

The progress bar tracks how many of the original N cards have been mastered. The counter shows your round and position within it: `Round 2 · 3 / 7`.

The summary screen shows the total cards mastered, rounds required, and overall accuracy percentage.

Mastery mode is fully isolated — it does not touch the `pool`, `endless`, or `sessionLimit` variables used by standard/endless modes.

---

### Conjugation Practice

Navigate to the **Conjugate** tab.

Select one or more verbs from the list (leave blank for all 31), choose a session size, and tap Start. Each card shows a verb with its English meaning and a subject pronoun. Type the correct present-tense conjugated form.

Grading strips accents before comparison, so `hablo` and `habló` are treated identically. A final score is shown at the end of the session.

The five pronouns tested:

| Pronoun |
|---|
| yo |
| tú |
| él/ella/Ud. |
| nosotros(as) |
| ellos(as)/Uds. |

---

## Answer Grading

Answer grading is handled by `js/fuzzy.js` and uses a multi-step pipeline.

### 1. Normalization

Both the user answer and the expected answer are:
- Lowercased
- Diacritics removed (`normalize('NFD')` → strip combining marks)
- Inverted Spanish punctuation removed (`¿`, `¡`)
- Whitespace collapsed and trimmed

Forgetting an accent mark is never penalized.

### 2. Alternative Expansion

The expected answer is expanded into a list of acceptable variants before matching:

| Pattern | Example | Accepted |
|---|---|---|
| Semicolon-separated | `run; jog` | "run" or "jog" |
| Comma-separated | `big, large` | "big" or "large" |
| Parenthetical gender | `alto(a)` | "alto" or "alta" |
| Masculine base | `viejo` | "viejo" or "vieja" |
| Leading article | `el gato` | "el gato" or "gato" |
| Leading "to" | `to run` | "to run" or "run" |
| Leading "to be" | `to be hungry` | "to be hungry" or "hungry" |

### 3. Scoring

1. Exact match against any expansion → **Correct ✓**
2. Levenshtein edit distance to each expansion is computed
3. Tolerance: `min(3, floor(longestExpansionLength / 6))`
4. Minimum distance ≤ tolerance → **Close ≈** (counts as correct for stats)
5. Otherwise → **Incorrect ✗**

A 12-character answer allows up to 2 edit errors; a 6-character answer allows 1.

---

## Cards Management

### Adding Cards Manually

Open the **Cards** tab and tap **+ Add Card**.

| Field | Required | Notes |
|---|---|---|
| Spanish | Yes | The Spanish term or phrase |
| English | Yes | Translation — use semicolons for alternatives: `big; large` |
| Tags | No | Comma-separated: `verb, ar, level1` |
| Notes | No | Shown after each answer; useful for grammar notes |

### CSV Import

Tap **Import CSV** and select a `.csv` file. Expected format:

```csv
spanish,english,tags,notes
hablar,to speak,verb|ar|level1,regular -ar verb
caminar,to walk,verb|ar|level1,
el gato,the cat,noun|animal|level1,
```

- Headers are required in the first row
- `spanish` and `english` are required columns
- `tags` uses `|` as delimiter within the cell
- `notes` is optional
- Duplicate Spanish terms (case-insensitive) are skipped; the count is shown in a toast

### Duplicate Removal

Tap **Remove Dupes** to scan the entire deck for cards sharing the same Spanish term (case-insensitive). The first occurrence is kept; all later duplicates are deleted. A confirmation dialog reports the count removed.

---

## Built-in Vocabulary

The seed dataset contains approximately **500 cards** across two levels.

### Level 1

| Category | Count | Sample words |
|---|---|---|
| Regular verbs (-ar/-er/-ir) | 64 | hablar, comer, vivir, trabajar, estudiar |
| Numbers | 71 | 0–100 |
| House & Furniture | 48 | la cama, la silla, el sofá, el horno |
| Clothing | 34 | la camisa, los pantalones, los zapatos |
| Physical adjectives | ~15 | alto, bajo, delgado, gordo, calvo |
| Personality adjectives | ~15 | inteligente, tímido, gracioso, perezoso |
| Emotion adjectives | ~10 | feliz, triste, cansado, enojado, nervioso |
| Colors | 12 | rojo, azul, verde, amarillo… |
| Basic family | 14 | la madre, el padre, el hermano… |
| Days of the week | 7 | lunes, martes… domingo |
| Months | 12 | enero, febrero… diciembre |
| Professions | 17 | el abogado, el médico, el maestro |
| Materials | 10 | algodón, cuero, madera, metal |

### Level 2

| Category | Count | Sample words |
|---|---|---|
| Body parts | 40 | la cabeza, el brazo, el corazón, la rodilla |
| Irregular verbs | 31 | conocer, hacer, ir, tener, decir, poder… |
| Tener expressions | 11 | tener hambre, tener miedo, tener prisa… |
| Extended family (gendered) | 26 | el cuñado, la nuera, el suegro, el sobrino |

All cards carry category tags (e.g. `verb`, `noun`, `ar`, `irregular verb`) plus a `level1` or `level2` tag for filtering.

---

## Verb Conjugation Data

All 31 verbs in `js/conjugation-data.js` with present-tense conjugations:

### Irregular in _yo_ only

| Verb | English | yo form |
|---|---|---|
| conocer | to know (a person/place) | conozco |
| dar | to give | doy |
| hacer | to do / to make | hago |
| poner | to put / to place | pongo |
| saber | to know (information) | sé |
| salir | to leave / to go out | salgo |
| traer | to bring | traigo |
| ver | to see / to watch | veo |

### Highly irregular

| Verb | English |
|---|---|
| ir | to go |
| tener | to have |
| decir | to say / to tell |
| venir | to come |

### e → ie stem change

| Verb | English |
|---|---|
| preferir | to prefer |
| querer | to want / to love |
| cerrar | to close |
| pensar | to think |
| comenzar | to begin |
| empezar | to begin |
| entender | to understand |
| perder | to lose |

### o / u → ue stem change

| Verb | English |
|---|---|
| recordar | to remember |
| jugar | to play |
| devolver | to return (something) |
| dormir | to sleep |
| volver | to return |
| poder | to be able to / can |

### e → i stem change

| Verb | English |
|---|---|
| servir | to serve |
| pedir | to ask for |
| seguir | to follow / to continue |
| conseguir | to get |
| repetir | to repeat |

---

## Data Model

All data is stored client-side in IndexedDB under the database name **`SpanishTutor`** (schema version 1).

### Object store: `cards`

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `spanish` | string | Spanish term; has an index |
| `english` | string | English translation |
| `tags` | string[] | Category tags |
| `notes` | string | Optional grammar/context notes |
| `created_at` | ISO string | Creation timestamp |

### Object store: `results`

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `card_id` | string (UUID) | Foreign key to cards; has an index |
| `correct` | boolean | True if the answer was correct or close |
| `response_ms` | number | Milliseconds from card render to submission |
| `answered_at` | ISO string | Timestamp |

### Object store: `settings`

| Key | Value | Purpose |
|---|---|---|
| `seeded` | `'v10'` | Prevents re-seeding on revisit |

### Computed card stats

Aggregated on demand from the `results` store:

```js
{
  [card_id]: {
    total: number,    // total attempts
    correct: number,  // correct or close answers
    accuracy: number  // correct / total (0.0–1.0)
  }
}
```

**Weak card threshold**: `accuracy < 0.75` with at least 2 attempts.

---

## Architecture

The app is a set of self-contained IIFE modules with narrow public APIs. No framework, no bundler, no npm.

```
index.html               Single HTML file; all seven screens defined here
│
├── js/db.js             IndexedDB abstraction layer
├── js/fuzzy.js          Answer grading (normalize, expand, Levenshtein)
├── js/importer.js       CSV parser and bulk import
├── js/seed-data.js      Built-in vocabulary + seedIfEmpty()
│
├── js/conjugation-data.js   Static verb conjugation tables (31 verbs)
│
├── js/flashcard.js      Study session state machine
├── js/conjugate.js      Conjugation session state machine
├── js/editor.js         Cards view — CRUD, search, tag filter
│
├── js/app.js            Top-level controller — view routing and event wiring
│
├── css/style.css        All styles (CSS custom properties design system)
├── manifest.json        PWA manifest
└── service-worker.js    Cache-first offline strategy
```

### View routing

`App.setView(id)` toggles `display` on one of seven named `<div>` screens:

| ID | Screen |
|---|---|
| `study-setup` | Session configuration |
| `flashcard-screen` | Active flashcard |
| `summary-screen` | Session results |
| `conjugate-setup` | Conjugation configuration |
| `conjugate-screen` | Active conjugation card |
| `conjugate-summary` | Conjugation results |
| `cards-view` | Card editor |

### Keyboard handling

- **While typing**: `Enter` submits and checks the answer (via `onkeyup` on the input element)
- **After submitting**: `Enter` advances to the next card (via `document.onkeyup` — the input is disabled at this point and can no longer receive events)
- The document-level handler is cleared when a new card renders, the summary shows, or the user exits

### Session weighting

**Standard mode** — session accuracy:
```js
weight = (1 − session_accuracy) + 0.1
```

**Prefer-weak mode** — historical accuracy:
```js
weight = 3 − (2 × historical_accuracy)
```

Cards are selected by weighted random using cumulative sum: sum all weights, pick a random value in that range, walk the array until the running total exceeds it.

---

## PWA & Offline Support

### Service Worker (`service-worker.js`)

Cache name: `spanish-tutor-v2`

| Phase | Behavior |
|---|---|
| Install | Pre-caches all static assets (HTML, CSS, all JS files, manifest) |
| Activate | Deletes any old cache versions |
| Fetch | Cache-first — returns cached asset immediately; falls back to network on miss |

### manifest.json

```json
{
  "name": "Spanish Tutor",
  "short_name": "ES/EN",
  "display": "standalone",
  "start_url": "/spanish-flashcards-pwa/",
  "background_color": "#0f0e0c",
  "theme_color": "#0f0e0c",
  "orientation": "portrait-primary"
}
```

Icons are provided at 192×192 and 512×512 (both marked `maskable`).

---

## Design System

All colors and radii are CSS custom properties on `:root`:

| Variable | Value | Usage |
|---|---|---|
| `--bg` | `#0f0e0c` | Page background |
| `--bg-card` | `#1a1915` | Card / panel background |
| `--bg-hover` | `#222119` | Hover / active state |
| `--border` | `#2e2c26` | Borders and dividers |
| `--text` | `#f0ede4` | Primary text |
| `--muted` | `#7a7669` | Secondary / hint text |
| `--accent` | `#d4a843` | Gold — buttons, active nav |
| `--green` | `#4caf7d` | Correct answer feedback |
| `--red` | `#e05c5c` | Incorrect answer feedback |
| `--yellow` | `#e0b84a` | Close answer feedback |
| `--radius` | `10px` | Shared border radius |

### Component classes

| Class | Purpose |
|---|---|
| `.btn` | Base button reset + sizing |
| `.btn-primary` | Gold filled button |
| `.btn-ghost` | Transparent bordered button |
| `.btn-danger` | Red destructive button |
| `.btn-sm` | Compact button variant |
| `.panel` | Rounded card container with border |
| `.tag` | Inline category badge |
| `.fc-card` | Flashcard display box |
| `.fc-prompt` | Large bold prompt text (2rem) |
| `.fc-stats` | Small muted accuracy/attempt line |
| `.modal` / `.modal-inner` | Centered form modal overlay |
| `.card-row` | Single row in the card list |
| `.radio-group` / `.radio-row` | Vertical / horizontal option layouts |

The layout is capped at 600px width and centered. `viewport-fit: cover` and `env(safe-area-inset-*)` handle notched phones correctly.

---

## File Reference

| File | Exports | Public API |
|---|---|---|
| `js/db.js` | `DB` | `openDB()`, `getAllCards()`, `getCardStats()`, `getWeakCardIds()`, `recordResult()`, `addCard()`, `updateCard()`, `deleteCard()`, `getSetting()`, `setSetting()` |
| `js/fuzzy.js` | `gradeAnswer` | `gradeAnswer(userAnswer, expected)` → `'correct' \| 'close' \| 'incorrect'` |
| `js/importer.js` | `parseCSV` | `parseCSV(csvText)` → `[{ spanish, english, tags, notes }]` |
| `js/seed-data.js` | `seedIfEmpty` | `seedIfEmpty()` → Promise |
| `js/conjugation-data.js` | `CONJUGATION_DATA` | `[{ infinitive, english, forms: { pronoun: form } }]` |
| `js/flashcard.js` | `Flashcard` | `Flashcard.start({ cards, direction, weakOnly, weakPreferred, focusTags, size, mastery })` |
| `js/conjugate.js` | `Conjugate` | `Conjugate.load()`, `Conjugate.start()` |
| `js/editor.js` | `Editor` | `Editor.load()`, `Editor.render()`, `Editor.showAddForm()`, `Editor.save()`, `Editor.closeForm()`, `Editor.handleImport(file)`, `Editor.handleRemoveDupes()` |
| `js/app.js` | `App` | `App.setView(id)`, `App.showToast(msg)`, `App.init()` |
