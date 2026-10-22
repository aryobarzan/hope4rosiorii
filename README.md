# Hope 4 Rosiorii

Website for **Hope 4 Rosiorii**, a volunteer-run non-profit that brings rescue dogs from Romania to Luxembourg for adoption. Visitors can meet the animals, send an adoption request, contact the team and donate.

The site is available in Luxembourgish (the default), English, French and German. Pages: Home, Our dogs (listing and detail), Adopt (multi-step request), About and team (with a contact form), Donate (with updates on how the money was used) and a privacy policy.

## Stack

- [Next.js](https://nextjs.org) (App Router, Cache Components) with TypeScript and Tailwind CSS
- [next-intl](https://next-intl.dev) for the four languages, with locale-prefixed routes (`/lb`, `/en`, `/fr`, `/de`)
- [Sanity](https://www.sanity.io) as the CMS (animals, donation updates, site settings). The studio lives in a separate repository, `studio-hope-4-rosiorii`
- React Hook Form and Zod for the forms; the same Zod schema runs in the browser and again in the Server Action
- Gmail SMTP (`nodemailer`) to email form submissions to the team. Nothing is stored
- Vitest and Playwright for tests; GitHub Actions for CI
- Hosted on Vercel (Hobby plan)

## Getting started

You need **Node.js 24 or newer** and **pnpm** (the version is pinned in `package.json`; with Node's Corepack, `corepack enable` is enough).

```bash
pnpm install
```

Create a `.env.local` file in the project root (it is git-ignored) with the variables below, then start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000); it redirects to the language your browser asks for, or to `/lb`.

### Environment variables

| Variable | Needed | What it is |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | yes | Sanity project. Not a secret; the value is in the studio's README |
| `NEXT_PUBLIC_SANITY_DATASET` | yes | Sanity dataset, `production` |
| `SANITY_REVALIDATE_SECRET` | yes | Secret that signs the Sanity webhook (see below). Any long random string, the same on both sides |
| `GMAIL_USER` | for forms | The association's Gmail address, which sends the form emails |
| `GMAIL_APP_PASSWORD` | for forms | A Google [App Password](https://support.google.com/accounts/answer/185833) for that account (needs 2-step verification), not the account password |
| `MAIL_TO` | no | Where form emails go. Defaults to `GMAIL_USER` |
| `SITE_URL` | no | Public address, used in the sitemap. Defaults to `https://hope4rosiorii.lu` |

`VERCEL_ENV` is set by Vercel itself. Only the `production` deployment is indexed by search engines; every other deployment serves a `robots.txt` that disallows everything.

The same variables go into the project's settings on Vercel.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build, and serve it |
| `pnpm lint` | ESLint |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:watch` | Unit tests, re-running on every change |
| `pnpm test:e2e` | End-to-end tests (Playwright); see [Testing](#testing) |

`tsc` needs the route types that Next generates, which are git-ignored. On a fresh checkout run `pnpm exec next typegen` before `pnpm exec tsc --noEmit`.

## Content: the Sanity studio

Volunteers edit content in the hosted studio. The schemas live in the separate `studio-hope-4-rosiorii` repository, whose README explains how to run and deploy it.

- **Types:** `sanity.types.ts` in this repo is generated from the studio's schemas (`pnpm typegen` in the studio). Regenerate it after changing a schema.
- **Reading:** pages never query Sanity directly. They call the functions in `lib/animals.ts`, `lib/updates.ts` and `lib/site-settings.ts`, which cache the results and tag them (`animal`, `update`, `siteSettings`).
- **Publishing:** when content changes, a Sanity webhook calls `POST /api/revalidate`, which checks the signature (`SANITY_REVALIDATE_SECRET`) and invalidates the matching tag, so the change shows without a deploy. The route expects a body like `{ "tags": ["animal"] }` (the changed document's type).
- **Images** are served from Sanity's CDN through a custom loader (`lib/sanity/image.ts`), which keeps them under Vercel Hobby's image-transformation limit.

## Languages

- UI text lives in `messages/{lb,en,fr,de}.json`. Every string the visitor sees goes through `next-intl`; none are written into components.
- `lb.json` is the reference. Add a new message to **all four** files; a unit test fails if the keys or the `{placeholders}` differ.
- Message keys are type-checked (`global.d.ts`): a misspelled key is a compile error.
- CMS content falls back to Luxembourgish when a translation is missing.

## Project layout

```
app/[locale]/        pages, layout, error and not-found pages (one folder per route)
app/api/revalidate/  the Sanity webhook
app/global-error.tsx last-resort error page
app/sitemap.ts       sitemap with the translations of every page
e2e/                 Playwright tests
i18n/                routing and request configuration for next-intl
lib/                 data access (Sanity), form schemas, helpers, mail, rate limiting
messages/            translations
proxy.ts             language redirects, and a real 404 for unknown animals
```

Unit tests sit next to the code they test (`*.test.ts`).

## Testing

**Unit tests** (`pnpm test`) check logic in isolation: the animal filters, ages, form schemas, the Server Actions, the email builder, the webhook route, the proxy and the translations.

**End-to-end tests** ([Playwright](https://playwright.dev)) drive a real browser against a production build of the site: they open every page in every language, fill in forms, use the filters, and scan each page for accessibility problems (axe-core, WCAG 2.1 A and AA). `pnpm test:e2e` builds the site, starts it on port 3100 (or reuses a server already running there), runs all the tests headless and stops it again. The specs are in `e2e/`.

The tests never send email: the test server replaces the Gmail settings with dummy values, and no test submits a valid form.

The first time, download the browser Playwright uses:

```bash
pnpm exec playwright install chromium
```

Three commands help to see what the tests do and to write new ones:

```bash
# Run the tests in a visible browser window, so you can watch them click and type
pnpm exec playwright test --headed

# Open Playwright's UI: pick a test, run it, and step through every action with
# a screenshot of the page at each step
pnpm exec playwright test --ui

# Record your own clicks in a browser and get the test code for them. It needs
# the site running, so start `pnpm dev` in another terminal first
pnpm exec playwright codegen http://localhost:3000
```

Add a file name to run only some tests, for example `pnpm exec playwright test contact-form --headed`.

### Adding end-to-end tests

- **New page:** add it to `e2e/pages.ts`. Keep that list up to date whenever a page is introduced: the smoke tests and the accessibility scans loop over it, so one line gives the new page checks in every language. A page missing from the list is not tested at all.
- **New test:** create a `*.spec.ts` file in `e2e/`. Files ending in `.mobile.spec.ts` run on a phone-sized screen; all others run on a desktop browser.
- **Find things like a visitor does,** by role or label (`getByRole("button", { name: "Send" })`), with `exact: true` (a plain `"All"` also matches "Small"). Take texts from the message files (`import en from "../messages/en.json"`) and do not type them out.
- **Never submit a valid form:** it would reach the Server Action and try to send an email.
- **Do not rely on particular animals,** since the team changes them in the CMS. Check behaviour that holds for any data.
- **Do not use fixed pauses.** `expect(...)` assertions wait on their own; wait for the page to be ready (for example, one `#website` field on the contact page) instead of sleeping.

**CI** (`.github/workflows/ci.yml`) runs on every push to `main` and `dev` and on every pull request: install, lint, type check and the unit tests. The end-to-end tests are not part of it yet; they need the Sanity variables as repository settings.

## Deployment

Vercel builds and deploys the site on every push. Keep it within the Hobby plan: the site is donation-only (no online payments for fees, merchandise or tickets, no ads or affiliate links), and images go through Sanity's CDN. The domain is `hope4rosiorii.lu`.
