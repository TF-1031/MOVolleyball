# Planned next phase

1. Create hosted Supabase project with teams, districts, games, advancement links, provenance and audit history.
2. Import `data/teams.csv`, `data/games.csv`, and district source URLs after schema validation.
3. Move public site off embedded data onto read-only Supabase queries.
4. Build authenticated admin login with manual winner selection and a review-before-publish flow.
5. Add PDF/image/CSV ingestion through a server-side service, plus optional source checks when permitted and technically accessible.
6. Recompute future opponent possibilities from confirmed winners; never silently publish uncertain outcomes.
7. Test GitHub Pages deployment and mobile behavior.

Do not expose editing endpoints or privileged database keys to the browser.
