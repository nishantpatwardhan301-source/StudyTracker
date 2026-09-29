# Nishant Patwardhan: Official Website

Website for **Prof. Nishant Patwardhan** ([YouTube channel](https://www.youtube.com/@MATRIXSCIENCEACADEMY)), Pune.

## Features

| Page | What it does |
| --- | --- |
| **Home** | Hero, channel stats, quick links to every portal, running courses, latest videos |
| **Courses** | Running courses (AADHAR Batch, One Shot Revision, Crash Course), upcoming courses (ACE Test Series, PYQ Series, December attempt), and a filterable library of all 29 YouTube playlists |
| **Test Portal** | Timed MHT-CET-pattern tests: question palette, mark for review, auto-submit, score and subject-wise analysis, full solutions, attempt history |
| **PYQ Portal** | Free chapter-wise questions for Physics, Chemistry and Maths, with instant answer check, solutions, year filter, search and a solved counter |
| **Study Tracker** | Chapter-by-chapter checklist (Lecture → Notes → PYQs → Revision 1 → Revision 2), confidence level, weak-chapter list, exam countdown, progress rings |
| **About / Contact** | Bio, stats, phone, WhatsApp channel, app link |

## Backend (Supabase)

The site uses its own Supabase project, **Nishant Patwardhan** (`cugmfkuiqayuqlqkjham`, Mumbai region). It is separate from Gurutva.

| Table | Purpose |
| --- | --- |
| `papers` | One row per real MHT-CET shift |
| `chapters` | MHT-CET PCM chapter list (used by the PYQ Portal and Study Tracker) |
| `questions` | PYQs. `correct_option` and `explanation` are **not readable** from the browser |
| `profiles` | One per student, created automatically on sign-up |
| `tracker_progress`, `pyq_progress`, `test_attempts` | Per-student data, protected by Row Level Security |

Answers are revealed only through two database functions:
- `check_answer`: after a student attempts a PYQ
- `submit_test`: scores a test on the server and returns the solutions

Students can use everything without logging in; their progress is then kept in the browser. After logging in (email + password) it is stored in Supabase and follows them across devices. Anything ticked before logging in is carried over.

The schema lives in `supabase/migrations/`. The Supabase URL and publishable key are in `src/lib/supabase.js`. They are safe to be public; override them with `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Editing content (no coding needed)

All content lives in `src/data/`:

- `site.js`: name, bio, stats, links, phone, latest videos
- `courses.js`: running/upcoming courses and the playlist library
- `tests.js`: test durations and upcoming tests

Questions, papers and chapters live in the Supabase database, not in these files.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Deploy

- **GitHub Pages:** merge to `main`, then in *Settings → Pages* set **Source = GitHub Actions**. The workflow in `.github/workflows/deploy.yml` builds and publishes the site.
- **Vercel / Netlify:** import the repo. Build command `npm run build`, output directory `dist`.
