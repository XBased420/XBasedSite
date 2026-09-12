# Activate XBased project requests

The website and Google Apps Script receiver are prepared to work without Cloudflare Turnstile. The public form intentionally remains in Preview Mode until the receiver update is published.

## One-time Google update

1. Sign in to Google as **calipxj@gmail.com**.
2. Open the existing private **XBased — Project requests** Google Sheet.
3. Open **Extensions → Apps Script**.
4. In the repository, open `apps-script/Code.gs`. Copy the entire file and replace the Apps Script editor’s `Code.gs` contents with it.
5. Open **Project Settings → Script Properties**. Confirm there is a property named `SHEET_ID`. Its value is the part of the Google Sheet URL between `/d/` and `/edit`.
6. In the Apps Script function menu, select `setupLeads`, press **Run**, and approve the requested Sheet and email permissions. This validates the existing `Leads` tab without deleting rows.
7. Select **Deploy → Manage deployments**. Edit the existing Web app deployment, choose **New version**, and press **Deploy**. Keep **Execute as: Me** and **Who has access: Anyone**.
8. Confirm the deployment still uses the `/exec` URL already listed as `endpoint` in `site.config.mjs`.

## Turn on the website form

1. In `site.config.mjs`, change `bookingEnabled: false` to `bookingEnabled: true`.
2. Commit and push that one-line change to `main`.
3. Wait for the **Deploy to GitHub Pages** action to pass.
4. Open the live site in a private window and submit one controlled request using an email account you can check.
5. Confirm one new row appears in the Sheet, the owner notification reaches Xavier, and the visitor receives the auto-reply.

Wait at least 60 seconds before sending another request with the same email and phone. The receiver intentionally suppresses faster repeats.

## Protections that remain without Turnstile

- Hidden honeypot field
- Minimum three-second form completion time
- Strict field lengths, email, phone, budget, and timeline validation
- Ten-minute exact duplicate suppression
- Sixty-second cooldown for the same email and phone
- Spreadsheet formula neutralization
- Sheet write before email, so a mail failure does not lose the lead

This is appropriate lightweight protection for a small portfolio site, but a public endpoint can never be fully spam-proof without a challenge, login, or managed server. If abuse becomes noticeable, reintroduce a challenge or move the receiver behind a rate-limited server endpoint.
