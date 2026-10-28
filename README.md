# Missouri Class 3 Volleyball — 2026 state tournament

Static GitHub Pages site with the 16 state qualifiers, favorites, automatic official results, and optional manual winner selection.

## Automatic results

`.github/workflows/sync-mshsaa.yml` checks MSHSAA every 30 minutes (at :07 and :37 UTC) during October 28–November 9, 2026. GitHub schedules may run late. After that window, scheduled runs do not import; manual runs remain available under **Actions → Sync MSHSAA results → Run workflow**.

The dependency-free Python importer reads the scoreboard pages for the tournament dates that have occurred, including earlier rounds so late scores and corrections can be picked up. It imports only games marked **Final**, linked to the 2026 Class 3 girls state tournament, with both recognized schools and a valid completed best-of-five match score. Home/away order does not matter. TBD, in-progress, other-class, ambiguous, and unrelated games are ignored. Earlier-round winners must establish both participants before later-round results can be imported. A corrected winner clears affected later results. Failed downloads or unrecognized page markup leave the existing results file unchanged and fail the workflow visibly.

Imported scores and winners live in `data/official-results.json`. The workflow commits only result changes and explicitly requests a GitHub Pages rebuild, because bot-token commits do not trigger the usual Pages build. No additional secrets are required: the workflow requests repository contents and Pages write permissions through GitHub's built-in token. This repository must already have GitHub Pages enabled from `main` / root, with GitHub Actions allowed.

The site loads the official results when opened and refreshes them every five minutes while open. It shows the time of the latest result change, not a claim that a score has just been checked. MSHSAA must report the result before this site can import it.

## Manual results

Click **Enter match winners** and select winners. They advance automatically; semifinal losers populate third place. Correcting an earlier game clears dependent later results. Manual selections are separate browser-local overrides and do not publish to other visitors. **Use official results** clears the overrides and returns to imported results. Legacy browser saves from the earlier prototype do not override official updates.

**Download results file** and **Import results file** provide personal backups. The downloaded `state-data.js` also works as the initial embedded bracket snapshot. Favorites and local selections require the same browser/site origin to persist. Favorite matches turn faint yellow and sort first within each round. Stars beside each team let you favorite it directly. Date buttons filter the state scoreboard.

## Source files

- `index.html`, `state-ui.js`, `state-engine.js`: site and advancement logic.
- `data/state-data.js`: supplied state bracket snapshot and schedule.
- `data/official-results.json`: automatically imported official winners, scores, and source links.
- `scripts/import_scoreboard.py`: importer; Python 3.12, standard library only.
- `tests/`, `test-*.cjs`: importer and site interaction checks.

The older district CSVs, embedded district snapshot, and `local-admin/` prototype are retained as historical reference. They do not drive state results. The state reference is https://www.mshsaa.org/Activities/DistrictWinners.aspx?alg=57&class=3&year=2026 .

## Verify locally

```bash
python3 -m unittest discover -s tests -v
node test-bracket.cjs
node test-favorites.cjs
node test-official.cjs
python3 scripts/import_scoreboard.py
```

Independent fan site; not affiliated with MSHSAA or participating schools. Confirm travel details with official sources.
