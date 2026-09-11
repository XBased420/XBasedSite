# XBased launch guide

Prepared September 9, 2026. The website implementation and backend source are supplied. GitHub publishing and real Google/Cloudflare delivery have not been run. The GitHub CLI reported an expired sign-in. Prices are Xavier’s approved starting figures; future research does not automatically change them.

## 1. Connect the booking backend

1. Sign into Google **as calipxj@gmail.com**. Create the Sheet and Apps Script while using that account. MailApp sends as the account that owns/runs the script; setting `replyTo` does not change the sender account.
2. Create a private Google Sheet. Do not publish or share it publicly. Copy the Sheet ID from its URL.
3. Open **Extensions → Apps Script**. Replace `Code.gs` with the supplied complete file.
4. In **Project Settings → Script Properties**, add `SHEET_ID`, `TURNSTILE_SECRET`, and `ALLOWED_HOSTNAMES`. Put secrets here, never in source or a screenshot. `ALLOWED_HOSTNAMES` is a comma-separated list, initially `xbased420.github.io`; add `xbased.dev,www.xbased.dev` once those domains are in use. Values are hostnames, with no protocol or path.
5. In the Cloudflare dashboard, open **Turnstile → Add widget**. Choose Managed and add the hostname(s) the site will actually use. Put the public site key in `site.config.mjs` as `turnstileSiteKey`; put the secret in the script property above. Keep Turnstile hostname validation enabled. Do not use Cloudflare’s test keys for launch.
6. Optionally enable **Show appsscript.json manifest file** in Project Settings and use the supplied manifest. It declares the Sheet, URL fetch, and mail permissions, with America/Chicago time.
7. Select `setupLeads` in the function menu and run it once. Approve Google’s authorization prompts after checking that this is your own script. This creates the `Leads` tab/header if empty and checks an existing header without erasing records.
8. Choose **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Authorize the deployment with the same Gmail account. Copy the `/exec` URL, not the editor URL or `/dev` URL, to `endpoint` in `site.config.mjs`.
9. When the script changes, use **Deploy → Manage deployments → Edit → New version → Deploy** to preserve the endpoint URL. If you create a different deployment, update the website endpoint too.

The exact header, in order:

| Column | Value |
|---|---|
| A | Timestamp |
| B | Name |
| C | Email |
| D | Phone |
| E | Business |
| F | Type |
| G | Has Site |
| H | Needs |
| I | Budget |
| J | Timeline |
| K | Socials |
| L | Source |
| M | File Link |
| N | Status |
| O | Notes |

File Link is blank because uploads are deferred. Status and Notes stay blank for you to fill by hand. The backend validates every submitted field, verifies the Turnstile hostname and action, rejects a filled honeypot, protects formula-leading spreadsheet text, and suppresses identical verified submissions for ten minutes using a best-effort cache. The cache can be evicted, so it is duplicate suppression rather than a payment-style exactly-once guarantee.

### Why the browser request looks unusual

The fetch uses `Content-Type: text/plain;charset=utf-8` and `mode: 'no-cors'` so JSON travels as a simple request without the CORS preflight that this Apps Script endpoint does not handle. The resulting response is opaque, so the website cannot read the returned JSON or confirm a saved row; it shows “on its way” and asks the visitor to check for the confirmation email.

Do not turn an opaque response into “confirmed booking.” Nothing here books a time or takes a payment. A network error keeps entered details and shows a mailto fallback. With missing endpoint/key, the preview explicitly says nothing was sent.

### Email behavior and quota

The owner notification subject includes name, business, budget, and timeline, with `replyTo` set to the submitter. The short auto-reply confirms receipt, promises a reply within 24 hours with call times and a rough quote, and tells the sender to reply with missing details/files. Its `replyTo` is Xavier’s supplied address.

Google currently documents **100 email recipients per day for consumer accounts**, versus **1,500 for Workspace**; quotas reset on a rolling basis, not necessarily at midnight, and may change. Each normal inquiry uses two recipients, so a consumer account has capacity for at most about **50 inquiries/day** if no other scripts use the quota. This is a recipients limit, not a promise of inbox delivery. [Google quotas](https://developers.google.com/apps-script/guides/services/quotas), [MailApp reference](https://developers.google.com/apps-script/reference/mail/mail-app).

The lead is saved before email. If quota is below two or mail fails, the row remains and the script logs a generic warning; it does not queue automatic retries. Check the Sheet manually during launch and reply yourself if necessary. If a single email succeeds and the other fails, the successful one is not repeated automatically.

## 2. Fill the site’s missing content

- Add four approved screenshots, each **1600 × 1000 WebP**, preferably below 250 KB. Set their paths in `src/content.mjs`; width/height and lazy loading are already present.
- Confirm the unknown stack for Payday AJ and Friends & Family Event Planner. Set the factual `stack` array and remove `stackPending` from those objects. No private client repo data was read for this build.
- In `site.config.mjs`, fill `buildTiming` and `reviewTiming` with timings you can actually meet, and set `processApproved: true`.
- The brand, palette, and hero are provisional design decisions. The starting prices are explicitly approved. If the chosen brand changes, update `brand` plus the wordmark/title/copy in `src/render.mjs`; it is not a claim that any domain has been purchased.

Recommended screenshot filenames:

```text
public/assets/screenshots/elizabeth-loya.webp
public/assets/screenshots/payday-aj.webp
public/assets/screenshots/business-scheduling.webp
public/assets/screenshots/friends-family-events.webp
```

No portrait is needed. Do not include unreleased music, client email addresses, or booking details in screenshots. In the public screenshot, redact any private data before supplying the file.

## 3. Configure analytics

In Cloudflare, open **Web Analytics → Add a site** and enter the hostname you will deploy. For a site outside Cloudflare’s proxy, choose manual JavaScript installation; copy the `token` value from the provided beacon configuration to `analyticsToken` in `site.config.mjs`. The existing client script loads that beacon once when configured. No cookie banner is added. [Cloudflare setup](https://developers.cloudflare.com/web-analytics/get-started/).

## 4. Set up GitHub Pages

1. Reconnect the GitHub CLI with `gh auth login -h github.com` if using terminal publishing, or sign in through GitHub’s website. Do not paste your token into this project or chat.
2. Create an empty public repository under **XBased420**. `xbased-site` is a suggested name, not an existing verified URL. Copy the contents of this project to the repository root, including `.github/`, the lockfile, public font licenses, and all source. Do not upload the outer ZIP as the site.
3. In the repository, go to **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Push to `main`. The workflow runs the Node tests, checks launch configuration, then uses `withastro/action@v6` with Node 24 and locked pnpm 11.19.0 to build Astro on Linux. It uploads the Pages artifact. No local Astro command is needed.
5. While `launchReady` is false, the build job still runs and the deploy job is intentionally skipped. Download the build artifact from Actions if you need to inspect that first actual Astro build. This is the remote compiler check still outstanding at handoff.
6. After the remaining content and configuration are complete, set `launchReady: true`, commit, and push. Missing required configuration now fails the workflow instead of publishing an unfinished site. The deploy job uses `actions/deploy-pages@v5`; follow the actual URL shown by GitHub after it succeeds.

For terminal setup in this site folder (after GitHub authentication), initialize a repository only here:

```powershell
git init -b main
git add .
git commit -m "Build XBased portfolio and booking site"
gh repo create XBased420/xbased-site --public --source . --remote origin --push
```

If that repository already exists, do not create or overwrite it; use its appropriate remote or choose an unused name. Future updates are edit → commit → push. The deployment workflow derives the repository base path from `GITHUB_REPOSITORY` automatically. [Astro’s official Pages guide](https://docs.astro.build/en/guides/deploy/github/).

### The two Astro configurations

Current fallback, before purchasing a domain:

```js
export default defineConfig({
  site: 'https://xbased420.github.io',
  base: '/xbased-site/', // Replace with the actual repository name.
  output: 'static',
  trailingSlash: 'always'
});
```

With the purchased domain:

```js
export default defineConfig({
  site: 'https://xbased.dev',
  output: 'static',
  trailingSlash: 'always'
});
```

You do not need to swap files: the supplied `astro.config.mjs` derives these values from `site.config.mjs`. **Change `customDomain: ''` to `customDomain: 'xbased.dev'`** when ready. The helper returns `/` for the custom-domain base, equivalent to omitting it. Add `public/CNAME` containing the single line `xbased.dev` if you want the requested domain marker; the file is deliberately absent until the domain is owned. With a custom Actions workflow, GitHub says CNAME files are ignored for domain configuration, so **Settings → Pages → Custom domain** remains necessary.

All local HTML assets use the shared `base`: CSS, JS, favicon, preloaded fonts, and screenshots. CSS font URLs are relative to the CSS file. Canonical URL, JSON-LD IDs, sitemap and robots use the same deployment helper. Hash links stay on the current page. Avoid adding hardcoded paths such as `/assets/photo.webp` or `/styles.css`: they would break the repository variant.

### Exact DNS records after purchasing xbased.dev

At the registrar/DNS provider, add these records (typical TTL: Auto):

| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | xbased420.github.io |

Optional IPv6: four AAAA records at `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`. Remove conflicting default apex/WWW records, but preserve unrelated email records. Do not put a repository path in the `www` CNAME. Configure the custom domain as `xbased.dev` in **GitHub Settings → Pages**, then enable **Enforce HTTPS** after DNS and certificate provisioning finish. GitHub redirects `www` to the apex when both are configured. DNS/certificate provisioning can take time. [GitHub’s DNS and domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## 5. End-to-end test before announcing the site

1. From the deployed GitHub Pages or custom-domain URL, submit a real request using an email account you can check. Solve the real Turnstile challenge. Choose “Not sure yet” as the budget to prove it is accepted normally.
2. Confirm exactly one new row appears in `Leads`; verify all fields and the blank File Link/Status/Notes columns.
3. Confirm the owner notification arrives at Xavier’s Gmail and its subject includes all four triage fields. Hit Reply and check that the recipient is the submitter before sending anything.
4. Confirm the submitter’s auto-reply arrives and its Reply-To is Xavier’s address. Check spam folders too.
5. Test an otherwise valid request with `turnstileToken: ''` using a direct POST to `/exec`, and another with a nonempty honeypot. Both should return `{ "ok": false }` to a non-browser HTTP client and create **no row and no emails**. A no-cors browser fetch cannot read this rejection, by design.
6. Test an expired/invalid token. Test the network-failure path with the network temporarily offline: the form must retain entered data and show an email fallback. Reconnect before further submissions.
7. Check the six required fields, blur validation, phone formatting, case-study keyboard expansion, visible focus, email links, small screens, and 200% text zoom. Turn reduced motion on and confirm all content remains readable and usable.
8. Run Lighthouse on the deployed production URL with a mobile profile: target **Performance ≥90, Accessibility ≥95**, and no observed layout shifts. These are targets, **not measured results from this handoff**. Check motion on a real mid-range Android; CSS capability support and device workload affect frame rate. Do not describe 60 fps as verified until measured.
9. Confirm the domain/base-path variant, robots/sitemap, canonical URL, social title/description, and analytics events. Twitter uses a summary card; no fabricated project/brand image was added.
10. Confirm the 24-hour response promise is one you can meet. Announce the site only after the real row and both emails have been observed.

File upload is intentionally cut under the brief’s allowed fallback: visitors are told to email files after submitting. No Drive permissions, base64 handling, or upload input is included.

## FILL THESE IN

- [[NEEDS XAVIER: reconnect GitHub and create or select the destination repository]]
- [[NEEDS XAVIER: Apps Script /exec URL]]
- [[NEEDS XAVIER: production Turnstile site key]]
- [[NEEDS XAVIER: Sheet ID and Turnstile secret — Apps Script Properties only]]
- [[NEEDS XAVIER: Cloudflare Web Analytics token]]
- [[NEEDS XAVIER: typical build time after content and deposit]]
- [[NEEDS XAVIER: review and launch time]]
- [[NEEDS XAVIER: screenshot — Elizabeth Loya]]
- [[NEEDS XAVIER: screenshot — Payday AJ]]
- [[NEEDS XAVIER: screenshot — Business Scheduling App]]
- [[NEEDS XAVIER: screenshot — Friends & Family Event Planner]]
- [[NEEDS XAVIER: confirmed stack — Payday AJ]]
- [[NEEDS XAVIER: confirmed stack — Friends & Family Event Planner]]
- [[NEEDS XAVIER: domain purchase and DNS — only if using xbased.dev]]

The source document conflicts about mentioning excluded services. This build follows the locked instruction to keep them off the public site. It also follows your direct request to build now, rather than treating the document’s “stop after a decision pack” instructions as a new conversational command.
