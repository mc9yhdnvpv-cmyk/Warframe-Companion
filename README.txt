WARFRAME COMPANION — ONE-TAP SYNC ARCHITECTURE

This update solves the Safari/GitHub Pages CORS issue by splitting the app into:

1) FRONT END
   Your existing GitHub Pages app.
   It renders the collection, mastery cards, live activities and recommendations.

2) READ-ONLY SYNC SERVICE
   A tiny Cloudflare Worker included in /sync-worker.
   It fetches your public Warframe profile server-side, follows Cross-Save redirects,
   adds the browser permissions Safari requires, and returns JSON to the app.

PRIVACY / SECURITY
- The service never asks for a Warframe or PlayStation password.
- It only receives the 24-character Warframe account ID.
- It does not write to your Warframe account.
- It does not persist profile data in a database.
- Upstream responses are cached for 5 minutes to reduce Digital Extremes rate-limit pressure.
- CORS is limited to your GitHub Pages origin.

GITHUB UPDATE
Replace the current files in your existing Warframe GitHub repository with:
index.html
app.js
styles.css
manifest.webmanifest
sw.js
icon-180.png
README.txt

Do NOT upload the sync-worker folder into the GitHub Pages root unless you want it there just for source control.
It does not run on GitHub Pages. Deploy it separately to Cloudflare Workers.

AFTER CLOUDFLARE DEPLOYMENT
1. Copy your Worker address, such as:
   https://warframe-companion-sync.<your-subdomain>.workers.dev
2. Open the Warframe Companion.
3. Tap Connect.
4. Paste the Worker address into Sync Service URL.
5. Paste your 24-character Warframe user_id.
6. Tap Sync Warframe account.
7. From then on, tapping sync refreshes your profile without JSON handling.

The Worker URL is saved locally on your iPhone.
