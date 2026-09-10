# Booking requests with Google Sheets and Apps Script

This replaces the previous booking instructions in LAUNCH.md. The Sheet stays private; use one tab, Leads.
Create the script, run setup, and deploy as **calipxj@gmail.com**.
The GitHub integration denied repository writes during preparation. Website changes still need uploading. The owner has supplied the deployed Apps Script /exec URL, now filled into site.config.mjs. Live form and email delivery still need verification.

## Behavior

- Website submission saves a Pending row and notifies calipxj@gmail.com. Reply-To is the customer's email.
- The owner notification includes every form field and a direct link to the row.
- No customer email is sent at submission.
- Change Leads column N (Status) to Confirmed, one row at a time, to email the customer.
- P records Confirmation Email, Q records Confirmation Sent At, and R records Owner Notification.
- Pending, Declined, and Cancelled do not email the customer. Repeated confirmation edits do not resend.
- No Cloudflare configuration or public Sheet read endpoint is needed.

## Batch 1: Create the Apps Script project

1. In the Sheet click your account picture. Verify **calipxj@gmail.com**.
2. If the empty bottom tab is Sheet1, double-click it, type **Leads**, and press Enter. Leave the cells empty.
3. Click **Extensions → Apps Script**.
4. Click **Untitled project**, enter **XBased - Booking Requests**, and click **Rename**.
5. Click **Code.gs**. Replace all starter code with the COMPLETE supplied apps-script/Code.gs. Save with Ctrl+S.
6. Click **Project Settings** (gear). Under General settings enable **Show "appsscript.json" manifest file in editor**.
7. Return to **Editor**, click **appsscript.json**, and replace it with the COMPLETE supplied apps-script/appsscript.json. Save.
8. Stop and confirm that both files are saved.

## Batch 2: Connect the Sheet and enable confirmation emails

1. Copy the Sheet ID: the text between /d/ and /edit in its URL, not the gid.
2. Open **Project Settings → Script Properties → Add script property**.
3. Property: **SHEET_ID**. Value: your Sheet ID. Click **Save script properties**. This is the only required property.
4. Return to **Editor**. Select **setupLeads** in the function dropdown next to Run. Click **Run**.
5. Click **Review permissions** if requested and choose **calipxj@gmail.com**.
6. If Google's unverified-app screen appears, verify it is your own XBased - Booking Requests script. Click **Advanced → Go to XBased - Booking Requests (unsafe)**. Allow the requested spreadsheet, email, account identity, and trigger permissions. Click **Allow** or **Continue** as shown.
7. If authorization did not complete the function, click Run again.
8. Expect **Execution completed**. In the Sheet expect Leads headers A–R, with Status in N.
9. In Apps Script click **Triggers** (clock). Expect one **handleLeadStatusEdit** trigger, **From spreadsheet — On edit**. setupLeads creates it; do not add a second.
10. Stop and confirm headers and trigger exist.

setupLeads is safe to rerun. It preserves existing rows and can append the three email tracking headers to the old 15-column layout. It refuses conflicting headers. Do not type headers manually.

## Batch 3: Deploy

1. Click **Deploy → New deployment**.
2. Click the gear beside Select type, then **Web app**.
3. Description: **Booking requests with owner confirmation**.
4. **Execute as:** Me (calipxj@gmail.com).
5. **Who has access:** Anyone.
6. Click **Deploy** and complete authorization if requested.
7. Under Web app copy the URL ending in **/exec**. The /dev test URL is restricted to editors and cannot serve the public form.
8. Send the /exec URL to Codex to fill endpoint in the prepared site.config.mjs.
9. Stop here. Do not upload a placeholder endpoint.

After later backend changes use **Deploy → Manage deployments → Edit → Version: New version → Deploy** to preserve the URL.

## Batch 4: Publish the changed files

After endpoint is filled, upload these complete replacement files to their matching repository-root paths through GitHub's web editor or file upload, then commit:

- apps-script/Code.gs
- apps-script/appsscript.json
- site.config.mjs
- public/site.js
- src/render.mjs
- scripts/check-launch.mjs
- scripts/backend.test.mjs
- scripts/render.test.mjs
- scripts/frontend.test.mjs
- docs/BOOKING.md

Do not upload the ZIP itself. The existing root workflow publishes pushes to main.
A GitHub commit does not update the separately deployed Apps Script project.
Prices are $450, $1,200, $600, $125/month, and a 50% deposit.
The form uses site.config.mjs budgets, and tests check exact equality with backend BUDGETS.

## Batch 5: Test live

1. Submit from the live site with an email you control and a distinctive business name.
2. Expect “Your request is on its way” and wording that confirmation follows owner review.
3. In Leads expect a new row, Pending in N, Sent in R, and blank P/Q.
4. At calipxj@gmail.com expect a [Pending request] email with all details and the row link. Click Reply and verify the customer is the recipient without sending.
5. Verify the customer has received no confirmation email yet.
6. Change that row's N dropdown from Pending to Confirmed. Change one cell; do not paste a block.
7. Expect Sent in P and a timestamp in Q. The customer should receive “Your project request is confirmed — XBased”, with replies addressed to calipxj@gmail.com.
8. Change Status to Pending and back to Confirmed. Expect no additional email.
9. Submit the exact same fields within ten minutes. Expect no additional row or owner notification (best-effort cache).
10. Enter an invalid phone and submit. Expect a field error and no new row.
11. For backend rejection, open browser developer tools with F12 and choose Network. If the browser supports Edit and Resend, use it on a valid POST and change the JSON budget to invalid-budget. Send it. Expect no new row or email. No installation is required. The opaque browser response cannot show the validation result.
12. Only call this live-verified after observing the real row, owner email, and customer email after approval.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Preview mode remains | Fill endpoint and check the GitHub Actions deployment. |
| No row, ERR, or network failure | Check /exec, Anyone access, execution as the owner, SHEET_ID, and setupLeads. In Apps Script select **Executions**, click the doPost run, and inspect its logs. |
| Pending row but no owner email | Check Spam and column R. Quota/send failure preserves the row and does not automatically retry. |
| Confirmed but no customer email | Check Triggers for handleLeadStatusEdit and Executions for its run. Manually change one status cell. Programmatic edits do not invoke this trigger. Read P/Q; populated Q means already sent. |
| P says Quota exhausted | When quota is available, change Status to Pending then Confirmed to retry. |
| P says Sending or Review needed | Delivery is uncertain. Check with the customer before retrying. Only after confirming no delivery, clear P (leave Q blank) and set Status to Pending then Confirmed. Do not clear a recorded sent timestamp. |
| No Turnstile widget | Expected; it has been removed. |

The frontend uses a text/plain POST with mode:no-cors. A successful fetch indicates dispatch, not server acceptance. The private Sheet is the persistence check.
Keep the Sheet private. Editors can operate Status. Sort whole rows, and leave email tracking columns alone during normal use.
The tests mock Google and browser services. They do not prove real authorization, delivery, or deployment.

Local verification: node --test scripts/backend.test.mjs scripts/render.test.mjs scripts/frontend.test.mjs

References:
- [Google installable triggers](https://developers.google.com/apps-script/guides/triggers/installable)
- [Google authorization](https://developers.google.com/apps-script/guides/services/authorization)
- [Apps Script web apps](https://developers.google.com/apps-script/guides/web)
- [MailApp](https://developers.google.com/apps-script/reference/mail/mail-app)
