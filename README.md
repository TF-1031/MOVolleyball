# 2026 Girls Volleyball District Tournament

Unofficial, independent fan-made tournament tracker for 2026 Missouri Class 3 girls volleyball.

## Publish on GitHub Pages

1. Create a new GitHub repository (for example `mo-volleyball-2026`).
2. Upload **the contents of this folder** to the repository root. `index.html` must be in the root, not inside a nested ZIP folder.
3. In GitHub, go to **Settings → Pages** and select **Deploy from a branch**, branch `main`, folder `/(root)`, then Save.
4. Wait for GitHub to show your published Pages URL. Open it on your phone.

## What works today

- Public mobile-friendly team/district browser with favorites (stored in the visitor's browser).
- Seeded teams, district games, possible opponents, and available schedule information from the collected reference snapshot.
- Links to MSHSAA for official confirmation.

## Important limitations

- **This is a static site.** The CSV files under `data/` are reference copies. The current `index.html` contains its own embedded snapshot and does **not** automatically read changes from those CSVs.
- There is **no shared hosted database**, no automated results collection, and no synchronized updates yet.
- `local-admin/admin.html` is a **local prototype only**. It saves to browser storage and exports backups; it is **not password protected** and does **not** publish results to the public site. **Do not publish it as a secure admin page.**
- Files in a public GitHub repository (including `local-admin/`) are public. If you want to avoid uploading the prototype, upload only `index.html`, `.nojekyll`, `data/`, and `README.md`.
- Some venue, date, and matchup details are unverified; confirm travel details with official MSHSAA pages.

## Future live-data architecture

GitHub Pages (public site) → Supabase read-only API (teams, games, winners) ← authenticated admin + approved import workflow.

Keep Supabase service-role keys, upload processing credentials, and all private tokens **off GitHub Pages**. Configure row-level security and server-side permissions before enabling editing.

## Attribution

Independent fan site; not affiliated with, endorsed by, or maintained by MSHSAA, MaxPreps, or participating schools.
