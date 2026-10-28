# 2026 Missouri Class 3 Girls Volleyball

Updated with the 16 state qualifiers and bracket supplied October 28, 2026. Sectionals October 29; quarterfinals October 31; semifinals November 6; championship and third place November 7. Quarterfinal times and venues are unconfirmed. No state winners have been assumed.

## Upload to your existing GitHub Pages repository

Upload this folder's contents to the repository root, replacing matching files. Keep `index.html`, `state-ui.js`, `state-engine.js`, and the `data` folder together. No build or database is required. The site also opens directly from `index.html` on your computer.

## Enter and publish winners

1. Open the site and click **Enter match winners**.
2. Select each winner from its match dropdown. Later games become selectable when both participants are known. Semifinal losers populate third place automatically.
3. Changes save in this browser. Correcting or clearing an earlier winner clears every dependent later result.
4. Click **Download results file** to save `state-data.js`.
5. Replace **data/state-data.js** in your GitHub repository with that file to publish your results for all visitors. Keep the downloaded file as a backup.

**Import results file** restores a downloaded file in this browser. **Use published results** discards this browser's selections and reloads the results shipped with the site. Visitors with saved manual selections continue seeing their own selections until they use that button. Editing is a personal browser feature, not authenticated administration of the public site.

## Data

`data/state-data.js` is the active state bracket source. It works online and when the site is opened locally. It includes participants, feeder games, dates, times, and published results. The older CSVs and embedded district data remain historical reference only; district match scores and individual district-round winners have not been reconstructed from the state screenshot. Earlier `local-admin/` files remain a separate legacy prototype and do not publish this state bracket.

Original favorites and district browsing remain available. Team views now show state qualification and the state path. State data does not refresh automatically from MSHSAA.

## Verification

Run `node test-bracket.cjs` to check advancement, third-place participants, dependent-result clearing, invalid-result rejection, and round-trip result preservation.

Independent fan site; not affiliated with MSHSAA or participating schools. Confirm travel details with official sources.
