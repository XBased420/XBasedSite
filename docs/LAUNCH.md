# XBased launch guide

The website publishes from the `main` branch to GitHub Pages. The booking form posts to Xavier’s existing Google Apps Script web app. Changes to `apps-script/Code.gs` must still be copied into Apps Script and released as a new deployment version before the live receiver changes.

## 1. Connect the booking backend

1. Sign into Google **as calipxj@gmail.com**. Create the Sheet and Apps Script while using that account. MailApp sends as the account that owns/runs the script; setting `replyTo` does not change the sender account.
2. Open the existing private **XBased — Project requests** Sheet. If it no longer exists, create a private Google Sheet. Do not publish or share it publicly.
3. Open **Extensions → Apps Script** from that Sheet. Replace `Code.gs` with the complete contents of `apps-script/Code.gs` from this repository.
4. In **Project Settings → Script Properties**, keep or add only `SHEET_ID`, using the ID between `/d/` and `/edit` in the Sheet URL. The site no longer uses Turnstile or a Turnstile secret.
5. Optionally enable **Show appsscript.json manifest file** in Project Settings and use the supplied manifest. It declares only the Sheet and mail permissions, with America/Chicago time.
6. Select `setupLeads` in the function menu and run it once. Approve Google’s authorization prompts after checking that this is your own script. This creates the `Leads` tab/header if empty and checks an existing header without erasing records.
7. For the existing web app, choose **Deploy → Manage deployments → Edit → New version → Deploy**. Keep **Execute as: Me** and **Who has access: Anyone**. Updating the existing deployment preserves the `/exec` URL already stored in `site.config.mjs`.
8. If the old deployment cannot be edited, choose **Deploy → New deployment → Web app**, use the same access settings, and copy the new `/exec` URL into `endpoint` in `site.config.mjs` before pushing the site again.
9. After the deployment succeeds, set `bookingEnabled: true` in `site.config.mjs`, commit, and push. This removes Preview Mode and lets the browser send requests to the receiver.

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

File Link is blank because uploads are deferred. Status and Notes stay blank for you to fill by hand. The backend validates every submitted field, rejects a filled honeypot and unrealistically fast submissions, protects formula-leading spreadsheet text, suppresses identical submissions for ten minutes, and applies a 60-second cooldown to the same email-and-phone combination. The Apps Script cache can be evicted, so these are practical spam controls rather than a guarantee against determined automated abuse.

### Why the browser request looks unusual

The fetch uses `Content-Type: text/plain;charset=utf-8` and `mode: 'no-cors'` so JSON travels as a simple request without the CORS preflight that this Apps Script endpoint does not handle. The resulting response is opaque, so the website cannot read the returned JSON or confirm a saved row; it shows “on its way” and asks the visitor to check for the confirmation email.

Do not turn an opaque response into “confirmed booking.” Nothing here books a time or takes a payment. A network error keeps entered details and shows a mailto fallback. With a missing endpoint, the preview explicitly says nothing was sent.

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
4. Push to `main`. The workflow runs the Node tests, reports launch configuration, then uses `withastro/action@v3` with Node 22 to build Astro on Linux. It uploads the Pages artifact and deploys it with `actions/deploy-pages@v4`. No local Astro command is needed.
5. Booking is active when the Apps Script `/exec` endpoint is configured and `bookingEnabled` is true. Keep the switch false until the matching Apps Script version is published. `launchReady` controls the broader launch checklist and search-engine visibility.
6. After the remaining content and configuration are complete, set `launchReady: true`, commit, and push. Missing required configuration then fails the workflow instead of publishing a build that claims to be launch-ready.

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

1. After publishing the new Apps Script version, open the deployed GitHub Pages URL and submit one real request using an email account you can check. Choose “Not sure yet” as the budget to prove it is accepted normally.
2. Confirm exactly one new row appears in `Leads`; verify all fields and the blank File Link/Status/Notes columns.
3. Confirm the owner notification arrives at Xavier’s Gmail and its subject includes all four triage fields. Hit Reply and check that the recipient is the submitter before sending anything.
4. Confirm the submitter’s auto-reply arrives and its Reply-To is Xavier’s address. Check spam folders too.
5. Wait at least 60 seconds before a second legitimate test from the same email and phone. The cooldown deliberately suppresses faster repeats even when the project description changes.
6. Test the network-failure path with the network temporarily offline: the form must retain entered data and show an email fallback. Reconnect before further submissions.
7. Run the repository tests; they verify honeypot rejection, minimum fill time, validation, duplicate suppression, sender cooldown, Sheet writes, and both email paths without touching the live Sheet.
8. Check the six required fields, blur validation, phone formatting, case-study keyboard expansion, visible focus, email links, small screens, and 200% text zoom. Turn reduced motion on and confirm all content remains readable and usable.
9. Run Lighthouse on the deployed production URL with a mobile profile: target **Performance ≥90, Accessibility ≥95**, and no observed layout shifts. These are targets, **not measured results from this handoff**.
10. Confirm the 24-hour response promise is one you can meet. Announce the form only after the real row and both emails have been observed.

File upload is intentionally cut under the brief’s allowed fallback: visitors are told to email files after submitting. No Drive permissions, base64 handling, or upload input is included.

## FILL THESE IN

- [[NEEDS XAVIER: reconnect GitHub and create or select the destination repository]]
- [[NEEDS XAVIER: publish the supplied Code.gs as a new version of the existing Apps Script web app]]
- [[NEEDS XAVIER: confirm the existing Sheet ID in Apps Script Properties]]
- [[NEEDS XAVIER: set bookingEnabled to true after the Apps Script update is live]]
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
