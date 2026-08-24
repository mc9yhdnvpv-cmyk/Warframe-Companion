WARFRAME COMPANION — TENNO DECK CROSS-SAVE UPDATE

WHAT CHANGED
- Automatic PlayStation -> PC/Cross-Save profile redirect handling.
- If Digital Extremes returns:
    Retry with PC account: <24-character-id>,<name>
  the app extracts that ID and retries through the PC profile endpoint automatically.
- Separate PlayStation and PC/Cross-Save fallback buttons.
- JSON import remains available for Safari CORS/rate-limit failures.
- Existing visual collection cards, WFCD artwork, live PlayStation activities and mastery overlay remain intact.
- Service-worker cache version was bumped so installed Home Screen apps can receive the update.

UPDATE YOUR EXISTING GITHUB REPOSITORY
1. Extract this ZIP.
2. In the SAME Warframe GitHub repository, upload/replace all files from this ZIP.
3. Commit the changes to main.
4. Leave Settings > Pages unchanged: Deploy from a branch, main, /(root).
5. Wait for GitHub Pages to redeploy.
6. On iPhone, open the GitHub Pages URL in Safari and refresh it once.
7. Fully close the Home Screen Warframe app, then reopen it.
8. If the old version still appears, reload the Pages site in Safari again.

ACCOUNT FLOW
- Tap Connect.
- Login only at official warframe.com.
- Get user_id from warframe.com/api/user-data.
- Paste it and tap Sync account automatically.
- The app tries PlayStation first.
- Cross-Save responses are automatically retried via the PC endpoint.
