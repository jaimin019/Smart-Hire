# Smart Hire — Frontend Build Plan

A production-grade, fully-styled multi-page frontend for **Smart Hire**, a Multi-Agent AI Resume Intelligence platform. All UI only — wired to an external API via `VITE_API_URL` and `localStorage["talentiq_api_key"]`.

## Stack adjustments (vs. your spec)

Your spec says "React Router v6". This project is a **TanStack Start** template (file-based routing via TanStack Router). Swapping to React Router would mean tearing out the bootstrap. I will instead:

- Use **TanStack Router** file-based routes (`src/routes/*.tsx`) — equivalent navigation semantics, type-safe `<Link>`.
- Keep **Tailwind CSS v4** (already configured in `src/styles.css`) — utility classes only, no extra CSS files. Design tokens added as CSS variables in `styles.css` so Tailwind arbitrary values (`bg-[var(--card)]`) stay clean.
- Use `lucide-react` for icons, `sonner` for toasts (already in template).

If you want strict React Router v6 instead, say so and I'll rip out TanStack — but it's not recommended.

## Design system setup

Update `src/styles.css`:
- Inject Inter + JetBrains Mono via `<link>` in `__root.tsx` head.
- Add CSS variables for the full palette (`--bg`, `--surface`, `--card`, `--card-hover`, `--elevated`, `--primary`, `--secondary`, `--green`, `--amber`, `--red`, `--border-subtle`, `--border-default`, `--text-primary`, `--text-secondary`, `--text-muted`).
- Map them to Tailwind theme tokens in `@theme inline` so `bg-card`, `text-muted`, `border-border-default` work natively.
- Add keyframes: `fadeInUp`, `shimmer`, `pulse-dot`, `flow-dot`, `glow-pulse`.
- Add utility shadows via `--shadow-card`, `--shadow-glow-purple`, `--shadow-glow-cyan`.

## Routes

```
src/routes/
  __root.tsx          → shell + Navbar + <Outlet/> + <Toaster/>
  index.tsx           → Home / landing
  analyze.tsx         → Analyze page (2-column)
  candidates.tsx      → Candidates grid + profile modal
  compare.tsx         → Compare (sidebar + leaderboard)
  taxonomy.tsx        → Taxonomy categories list
```

Each route gets its own `head()` metadata (title, description, og:*).

## Shared components (`src/components/`)

- `Navbar.tsx` — sticky 56px blurred bar; logo, pill nav with active state, LangGraph badge.
- `Footer.tsx`
- `SkillChip.tsx` — variants: green / red / purple / cyan / amber.
- `ScoreBadge.tsx` — circle 32px, color by threshold.
- `ScoreGauge.tsx` — donut for match score.
- `Button.tsx` — variants: primary (purple gradient pill), secondary (outline pill), amber (pulsing).
- `Card.tsx` — base card with fadeInUp.
- `Skeleton.tsx` — shimmer block.
- `EmptyState.tsx` — icon + title + subtitle.
- `ConfirmDialog.tsx` — centered modal.
- `Modal.tsx` — base modal (used by candidate profile).
- `AgentPipeline.tsx` — 3-node flow with animated dots; states idle/active/complete.
- `Tabs.tsx` — underline tabs.
- `Toggle.tsx` — pill toggle (Single/Multiple, Select Job/Custom JD, Multi/1v1).
- `FileDropzone.tsx` + `FileQueueRow.tsx`.
- `RangeSlider.tsx` (purple accent), `NumberStepper.tsx`.
- `CountUp.tsx` — viewport-triggered count animation.

## API layer (`src/lib/api.ts`)

- `apiFetch(path, init)` — reads `VITE_API_URL` + `localStorage.talentiq_api_key`, attaches `Authorization` header, `try/catch` → `toast.error` on failure, returns parsed JSON.
- Typed helpers: `getCandidates`, `deleteCandidate`, `getJobs`, `uploadResumes`, `analyze`, `getAIInsights`, `rankCandidates`, `getTaxonomy`, `searchSkills`.
- All list views show skeletons while loading and an EmptyState when results are empty.

## Page-by-page

### Home (`/`)
Hero (radial purple glow, eyebrow badge, gradient "AI" word, two CTAs) → Stats row with CountUp (29/3/3) → Agent Pipeline card (Parser → Normaliser → Matcher with flowing dot animation) → "Everything You Need" 3×2 feature grid (6 cards, color-coded icons, hover top bar) → CTA section → Footer. Staggered fadeInUp via CSS animation-delay.

### Analyze (`/analyze`)
Sub-header + status badge → full-width AgentPipeline bar with live states driven by analysis progress → 50/50 columns separated by vertical divider.
- **Left (Setup):** Single/Multiple toggle cards, FileDropzone, FileQueue with progress bar, MATCH AGAINST toggle (Select Job ↔ Custom JD textarea), required-skills tag input, Analyze button.
- **Right (Results):** EmptyState until results; then resume nav (← N of M ·  Name →), green "saved" banner with copyable UUID, candidate header, "MATCHED AGAINST" line, ScoreGauge, Tabs (Overview / Experience / Skills / Projects & Certs), AI Insights Leaderboard with expandable rows + Export CSV, pulsing amber "Get AI Insights" button.

### Candidates (`/candidates`)
Header + "Upload Resume" CTA (routes to /analyze) → Toolbar (search, Name/Date sort pills, refresh icon, count, Compare link) → 4-col grid of cards (avatar, name, email, date, SAVED badge, mono UUID, › arrow, hover delete with ConfirmDialog) → click opens **CandidateProfileModal** with 4 tabs (Overview / Experience / Skills / Projects & Certs, timeline with purple left border, proficiency dots, Download JSON).

### Compare (`/compare`)
300px sidebar + flexible right panel.
- Sidebar: Multi/1v1 toggle, search, "Select All", scrollable checkbox list of candidates, counter, JD dropdown, Result Filters (Match Threshold slider with "Off"/"65%" label, Top K stepper showing "All" at max), Rank button.
- Right: EmptyState → leaderboard with rank medals, scores, skill breakdown bars, AI recommendation card.

### Taxonomy (`/taxonomy`)
Header + purple "3,208 skills" pill + subtitle → centered search bar with purple focus glow → 14-row category list (book icon, name, subcategory + skill counts, › arrow, hover dark fill). Counts as specified. Search filters category list and (when API supports) expands to skill-level results.

## Quality bar

- All cards animate in with `fadeInUp` (CSS, staggered via inline `animationDelay`).
- All interactive elements: `cursor-pointer`, hover translateY/glow.
- Responsive down to 1280px (grid breakpoints, sidebar collapses to single column below).
- No hardcoded candidate data — empty/skeleton states when API not configured.
- Loading skeletons for every async list/card.
- Toasts for every API error.
- No overlapping elements; consistent 8px spacing scale via Tailwind.

## Out of scope (frontend-only build)

- No backend, no Supabase/Lovable Cloud. App expects an external API at `VITE_API_URL`.
- Without that env var the app still renders — all data sections show EmptyState/skeleton, never crash.

Approve and I'll build it.
