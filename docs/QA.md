# Verification at handoff

- **23 automated checks passed**, using Node’s test runner with mocked Apps Script services. They cover successful lead storage, correct email recipients and reply-to fields, six required fields, bot/token/hostname/action rejection, invalid fields, lock and write failures, duplicate suppression, spreadsheet formula injection, and persistence when emails fail.
- Generated HTML asset references were checked for a GitHub repository base path, and the custom-domain/profile-repository variants were checked separately.
- Public JavaScript and the shared renderer passed Node syntax checks. The HTTP preview returned status 200.
- Both self-hosted font files were checked for real WOFF2 headers and include their OFL licenses.
- The standalone preview comes from the same renderer as the Astro page and deliberately disables network submission and analytics.
- The optional WebMCP `stage_project_request` interface prepares the same visible form without submitting it. Registration and execution were **not verified in a WebMCP-capable browser**; unsupported browsers use the ordinary form.

Not yet verified: real Google Sheet writes and email delivery from the currently deployed Apps Script version, Android frame rate, Lighthouse scores, measured CLS, analytics reporting, or domain DNS. No claims of those checks passing are made. Use the ordered checks in LAUNCH.md after publishing the supplied Apps Script code as a new web-app version.

The local GitHub CLI account was present but its authentication was invalid. No remote repository was created, no domain purchased, no client repository inspected, and no email sent during this build.
