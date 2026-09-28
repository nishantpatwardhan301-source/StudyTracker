# Nishant Patwardhan: Official Website

Website for **Prof. Nishant Patwardhan** ([YouTube: @MATRIXSCIENCEACADEMY](https://www.youtube.com/@MATRIXSCIENCEACADEMY)), Matrix Science Academy, Pune.

## Features

| Page | What it does |
| --- | --- |
| **Home** | Hero, channel stats, quick links to every portal, running courses, latest videos |
| **Courses** | Running courses (AADHAR Batch, One Shot Revision, Crash Course), upcoming courses (ACE Test Series, PYQ Series, December attempt), and a filterable library of all 29 YouTube playlists |
| **Test Portal** | Timed MHT-CET-pattern tests: question palette, mark for review, auto-submit, score and subject-wise analysis, full solutions, attempt history |
| **PYQ Portal** | Free chapter-wise questions for Physics, Chemistry and Maths, with instant answer check, solutions, year filter, search and a solved counter |
| **Study Tracker** | Chapter-by-chapter checklist (Lecture → Notes → PYQs → Revision 1 → Revision 2), confidence level, weak-chapter list, exam countdown, progress rings |
| **About / Contact** | Bio, stats, phone, WhatsApp channel, app link |

Student progress (tests, PYQs, tracker) is saved in the student's browser (`localStorage`). No login is needed yet. A backend such as Supabase can be added later for accounts and leaderboards.

## Editing content (no coding needed)

All content lives in `src/data/`:

- `site.js`: name, bio, stats, links, phone, latest videos
- `courses.js`: running/upcoming courses and the playlist library
- `questions.js`: **question bank for PYQs and tests** (instructions at the top of the file)
- `tests.js`: which questions go into which test, durations, upcoming tests
- `syllabus.js`: MHT-CET chapter list used by the tracker and PYQ portal

> The questions currently in `questions.js` are practice questions (`year: null`).
> Add official MHT-CET PYQs with `year` and `shift` filled in; the PYQ Portal then shows year tags and the year filter automatically.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Deploy

- **GitHub Pages:** merge to `main`, then in *Settings → Pages* set **Source = GitHub Actions**. The workflow in `.github/workflows/deploy.yml` builds and publishes the site.
- **Vercel / Netlify:** import the repo. Build command `npm run build`, output directory `dist`.
