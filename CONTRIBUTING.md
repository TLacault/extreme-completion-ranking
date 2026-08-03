# Contributing to Extreme Tracker

Thanks for taking an interest in the project! This is a small, client-only
app (see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how it fits
together), so contributing is a pretty lightweight process.

## Reporting a bug or suggesting a feature

Before opening a new issue, please [search existing
issues](https://github.com/TLacault/extreme-tracker/issues) to check it
hasn't already been reported.

To open one: go to the [Issues
tab](https://github.com/TLacault/extreme-tracker/issues) → **New issue**.
There's no required template — just include what's relevant:

- **Bug report:** what you did, what you expected, what actually happened.
  Screenshots help a lot for UI issues. Include your browser if it might be
  browser-specific.
- **Feature request:** what you're trying to do and why the current
  behavior doesn't cover it. A rough idea of the UI/UX you have in mind is
  welcome but not required.

## Contributing code

### 1. Fork and clone

Click **Fork** on the [repo page](https://github.com/TLacault/extreme-tracker),
then clone your fork:

```bash
git clone https://github.com/<your-username>/extreme-tracker.git
cd extreme-tracker
npm install
```

### 2. Set up your dev environment

```bash
npm run dev      # start the dev server (http://localhost:5173)
npm test         # run the Vitest suite
npm run build    # type-check with vue-tsc, then production build
```

The app works with zero configuration — it needs no backend and no API
keys. If you want to test the featured-creator banner's live YouTube data,
copy `.env.example` to `.env` and fill in `VITE_YOUTUBE_API_KEY` (see the
comment in that file for how to get one); otherwise it just uses its static
fallback, which is fine for most changes.

### 3. Make your change on a branch

```bash
git checkout -b your-branch-name
```

A few conventions to match the existing codebase:

- TypeScript strict mode — keep it passing (`npm run build` type-checks).
- Components are Vue 3 `<script setup lang="ts">`; keep new components in
  that style.
- Styling uses the CSS custom properties defined in `src/style.css`
  (`--accent-*`, `--glow-*`, etc.) rather than hardcoded colors, so the
  theme stays consistent.
- If you touch logic in `composables/` or `services/`, add or update the
  co-located `*.spec.ts` — that's where this project's test coverage lives.
  Presentational component changes are generally verified manually via the
  dev server instead of with component tests.
- Keep commits scoped to one logical change, with a message describing the
  *why* when it isn't obvious from the diff.

### 4. Open a pull request

Push your branch to your fork and open a PR against `TLacault/extreme-tracker`'s
`main` branch:

```bash
git push -u origin your-branch-name
```

Then use the "Compare & pull request" button GitHub shows on your fork.
In the description:

- Explain what the PR does and why.
- Link the issue it addresses, if any (`Closes #123`).
- Call out anything you skipped, deferred, or are unsure about.

CI (`.github/workflows/deploy.yml`'s build job) runs type-checking and the
full test suite on every PR — make sure `npm run build` and `npm test` pass
locally first so you're not waiting on CI to catch something you could've
caught in ten seconds.

A maintainer will review and may ask for changes before merging — that's
normal, not a rejection.

## Questions

If something about the codebase or contribution process is unclear, open an
issue for it — that's useful signal that the docs need improving.
