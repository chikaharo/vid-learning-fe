# Video Learning — Next.js Frontend

Udemy-inspired video learning experience for the `vid-learning-api` NestJS backend. The UI mirrors course marketplaces: marketing homepage, catalog filters, detailed course pages, learner dashboard, and auth flows. Everything is Static Site Export (Next.js `output: "export"`) so you can ship the build straight to S3 + CloudFront.

## Prerequisites

- Node.js 18+
- pnpm 9/10 (project was bootstrapped with pnpm 10.13.1)
- Backend: `pnpm install && pnpm run start:dev` inside `vid-learning-api`

Copy `.env.example` → `.env.local` and adjust as needed:

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata (used at build time) |
| `NEXT_PUBLIC_API_URL` | Points to the NestJS API, e.g. `http://localhost:8080/api` |
| `NEXT_PUBLIC_USE_MOCK_DATA` | `true` keeps the static mock content, `false` attempts live API fetches (required for authenticated routes) |

## Available scripts

```bash
pnpm dev      # local development on http://localhost:3000
pnpm lint     # eslint (app router aware)
pnpm build    # next build && next export -> ./out
```

Because the config uses `output: "export"`, `pnpm build` emits plain HTML/CSS/JS to `frontend/out`. Upload that folder to S3 or any static host:

```bash
pnpm build
aws s3 sync out s3://your-static-site-bucket --delete
```

If you need client-side routing support on S3/CloudFront, create an error document that points to `index.html`.

## Project structure

- `app/` – App Router routes for marketing pages, catalog, course detail, auth, and dashboard
- `components/` – Reusable UI (catalog filters, curriculum blocks, enrollment cards)
- `data/mock-data.ts` – Seed data powering the static experience; doubles as fallback if the API is offline
- `lib/content-service.ts` – Data access functions that call the NestJS API when available and fall back to the mock data otherwise
- `public/` – Static assets (instructor avatars)

## Integrating with the NestJS backend

- Update `NEXT_PUBLIC_API_URL` so the frontend fetches the same host/port as your NestJS server (`http://localhost:8080/api` in dev).
- Toggle `NEXT_PUBLIC_USE_MOCK_DATA=false` to let `lib/content-service.ts` hit `/courses`, `/enrollments`, etc. Extend the mapping helpers if you add new fields to the API responses.
- Authentication forms (`/login`, `/register`) now call `POST /auth/login` and `POST /users` directly. Successful logins cache the returned `user`, `accessToken`, `refreshToken`, and token expiry in `localStorage` (keys prefixed with `vu:`) before redirecting to `/dashboard`. Authenticated fetches automatically attach the bearer token, refresh via `POST /auth/refresh`, and sign the user out if the refresh token fails.
- Lesson builder uploads hit `POST /lessons/video` (multipart). Uploaded files are served from `/uploads/lessons/*` by the NestJS server, so ensure it has write access to an `uploads/` directory and that the API host is reachable by learners for video playback.

## Deployment checklist for S3

1. `pnpm build` to generate `out/`
2. Upload `out/` to S3 (or Netlify, Vercel static, etc.)
3. Set CloudFront/S3 error document to `index.html` so client-side routing keeps working
4. Configure HTTPS + CDN caching headers
5. If you switch to live API data in production, remember to enable CORS for your S3/CloudFront domain in the NestJS app (`app/main.ts` already enables CORS globally)

Enjoy building! The frontend now provides a polished scaffold for connecting every NestJS module (courses, enrollments, quizzes, videos) to a modern learner experience.
