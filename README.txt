WARFRAME COMPANION — TENNO DECK UPDATE

New visual collection:
- Warframe, Primary, Secondary, Melee, Sentinel, Pet and Arcane card galleries.
- Artwork is loaded dynamically from the WFCD item-image CDN.
- Item metadata is loaded from WFCD's automatically updated warframe-items JSON.
- Matching public-profile XP item IDs are marked MASTERED.
- Tap cards for a larger image, description, MR requirement and official Wiki search.
- Collection search and category filters.
- Gamified home dashboard, collection statistics and objective/medal styling.
- Existing safe PlayStation profile connection and JSON fallback retained.
- Existing live PlayStation Fissures, Sortie, Cetus and Nightwave retained.

UPDATE EXISTING GITHUB APP
Replace the old repository files with the files from this ZIP (index.html, styles.css, app.js, manifest.webmanifest, sw.js, icon-180.png).
Keep GitHub Pages set to main / (root).
After GitHub redeploys, fully close/reopen the Home Screen app. If an old service worker is sticky, open the Pages URL in Safari once and refresh.

NOTE
The visual collection requires internet access to retrieve current WFCD catalog data and images. Profile matching depends on the public profile fields Digital Extremes exposes.
