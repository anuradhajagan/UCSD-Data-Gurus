# DSC 209R Project 3: Living Conditions 1960–2020

**Question:** How have living conditions and development changed across countries from 1960 to 2020?

Team: Juan Mo, Nick Puckdee, Snigdha Tiwari, Anuradha Jaganathan

All charts are made with D3 v7 only (plain HTML/CSS/JS, no other plotting libraries). Data loads from static files in `data/`. There's no server-side code.

## Files

```
index.html                 the page
css/style.css              styles (kept plain on purpose)
js/main.js                 loads the data, draws the charts, redraws on resize
js/agingChart.js           chart 1: % of world population 65+, 1960–2020 (line)
js/fertilityChart.js       chart 2: births per woman, World, 1960–2019 (line + 2.1 replacement line)
js/electricityMap.js       chart 3: % with electricity by country, 2000 vs 2019 (two maps)
js/internetChart.js        chart 4: % using the internet by income group, ~2000 vs ~2019 (grouped bars)
js/rdChart.js              chart 5: avg R&D spending, % of GDP, 1996–2018 (area/line)
data/aging_world.csv       year, pct65
data/electricity.csv       code, country, year, access
data/rd_spending.csv       year, mean_rd, n_countries
data/fertility_world.csv   year, fertility
data/internet_income.csv   group, period (start/end), year, internet
data/world.geo.json        country outlines for the map (ISO3 ids)
scripts/prepare_data.py    downloads the raw World Bank csvs and writes data/
```

## Run it locally

The browser blocks loading data from `file://`, so start a small server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Regenerate the data with `python3 scripts/prepare_data.py`. It uses only built-in Python and prints how many years and countries each chart has data for.

## Deploy (GitHub Pages)

Push to `master` on a public repo, then go to Settings → Pages → Deploy from a branch → `master`, `/ (root)`. All paths are relative, so `/docs` works too.

## Data notes

- **Source:** https://github.com/light-and-salt/World-Bank-Data-by-Indicators
  - `health` (65+)
  - `engergy-and-mining` (electricity; the folder name is misspelled in the repo)
  - `science-and-technology` (R&D)
  - `gender` (fertility rate)
  - `infrastructure` (internet users)
- **Aggregates removed:** regions and income groups like "High income" are dropped from the electricity and R&D data using the World Bank's country list. In that list, real countries have a Region and aggregates don't. Chart 1 uses the "World" row on purpose.
- **R&D average:** there's no World row for R&D, so chart 5 is a simple average of the countries that reported that year. That count goes from 53 to 101, so some of the ups and downs come from which countries are included.
- **Internet years:** chart 4 uses each income group's value for 2000 and 2019. If a year is missing, it uses the closest year within ±3. Only low income needed this: its latest value is 2017, and that year is shown above the bar.
- **Map outlines:** from johan/world.geo.json (Natural Earth). The prep script flips the direction of the outline points, because otherwise d3 fills the whole globe instead of the country.

## Planned interactions (not built yet)

- Chart 1: dropdown to pick a country or World
- Chart 2: dropdown to pick a country or World, hover for exact values
- Chart 3: year slider and hover for exact values
- Chart 4: hover for the exact % and year for each income group
- Chart 5: hover to see each year's average and how many countries are in it
