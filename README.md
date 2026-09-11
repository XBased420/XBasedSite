# XBased

Xavier’s one-page Astro site: work, services, prices, story, and project requests. The approved starting prices are **$450 / $1,200 / +$600 / $125 per month / 50% deposit**. The production design is an accessible phosphor-green civic terminal with a visitor login gate and a sequenced boot reveal. It uses self-hosted fonts and plain CSS/JavaScript—no animation library or React runtime.

## Terminal redesign lab

Open `http://127.0.0.1:4321/terminal-lab.html` while the portable preview is
running to compare the three original redesign directions. Direction A has now
been promoted into the production renderer. The rationale and token systems are in
[`docs/TERMINAL-REDESIGN.md`](docs/TERMINAL-REDESIGN.md).

## Change something

- **Prices, form connection, analytics, domain:** edit `site.config.mjs`. Prices are numbers; leave `pricesApproved: true` after an approved change.
- **Case studies or services:** edit `src/content.mjs`. To add a project, copy an object and change its fields. Keep status honest; only add a public URL when one exists.
- **Screenshots:** export WebP at **1600 × 1000**, place in `public/assets/screenshots/`, then set the project’s `screenshot` to `assets/screenshots/filename.webp`. Keep screenshots under about 250 KB each. Use only approved website screenshots, never the Loya repo’s music or private contact details.
- **Copy and markup:** edit `src/render.mjs`. `src/pages/index.astro` uses that shared renderer; the portable preview uses the same one. Text interpolated into HTML is escaped.
- **Look and motion:** edit `public/styles.css`; behavior is in `public/site.js`. Normal reading works without scroll-animation support. Reduced-motion disables transforms and animation.
- **Booking backend:** paste the complete `apps-script/Code.gs` into Apps Script and redeploy a new version after changes. Website pushes alone do not deploy that backend.

## Publish or redeploy

Complete [the launch guide](docs/LAUNCH.md) once. Then edit, commit, and push to `main`; GitHub Actions installs the locked dependencies, builds Astro on Linux, and deploys to Pages. Do not run `npm run dev` or the Astro compiler on this Windows machine. `launchReady: false` currently allows CI builds but holds public deployment; set it to `true` after the launch checklist passes. The workflow then checks required configuration before deploying.

The provisional repository name is `xbased-site`. CI automatically uses the real repository name for the base path. No custom domain is configured yet. Set `customDomain: 'xbased.dev'` only once you own it and complete DNS setup.

## Preview and checks without Astro

Open the supplied standalone `xbased-preview.html`, or run `node scripts/preview.mjs` from this folder for an optional preview on `http://127.0.0.1:4321/`. This preview runs plain JavaScript, without invoking Astro or its native compiler. Restart it after changing source or settings. CSS and public JavaScript are served fresh.

`node --test scripts/backend.test.mjs scripts/render.test.mjs` checks the backend with mocked Google services and checks generated HTML/base paths. `node scripts/check-launch.mjs --strict` lists unfinished launch settings. These checks do not prove Google delivery, mobile frame rate, Lighthouse scores, or the Astro build; those are verified on the actual deployment.

No secret belongs in this repository. The public endpoint, public site key, and analytics token are safe to configure here. The **Turnstile secret** and Sheet ID belong in Apps Script Properties.
