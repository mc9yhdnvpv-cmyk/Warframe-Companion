WARFRAME COMPANION — EASIER IPHONE PROFILE IMPORT

Replace these three files in the GitHub repository:
- index.html
- app.js
- sw.js

What changed:
- Removed the broken Cloudflare profile-sync step from the user flow.
- Open Profile JSON goes directly to the working PC/Cross-Save endpoint.
- Added an "Import copied JSON" button that reads the iPhone clipboard.
- Detects when Safari copied only the URL and gives a clear message.
- Keeps manual paste and file import as fallbacks.
- Updated the service worker cache so the new interface replaces the old cached version.

iPhone flow:
1. Enter the 24-character account ID.
2. Tap Open profile JSON.
3. On the large JSON page, press and hold in the text -> Select All -> Copy.
4. Return to Warframe Companion.
5. Tap Import copied JSON.
