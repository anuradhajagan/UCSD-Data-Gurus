# DSC 209R Project 3: Living Conditions 1960–2020

**Question:** How have living conditions and development changed across countries from 1960 to 2020?

Team: Juan Mo, Nick Puckdee, Snigdha Tiwari, Anuradha Jaganathan

All charts are made with D3 v7 only (plain HTML/CSS/JS, no other plotting libraries). Data loads from static files in `data/`. There's no server-side code.

## Files

```
index.html                 the page
css/style.css              styles (kept plain on purpose)
graphs/main.js             loads the data, draws the charts, redraws on resize
graphs/fertilityChart.js   chart 1: births per woman, World, 1960–2019 (line + 2.1 replacement line)
graphs/internetChart.js    chart 2: % using the internet by income group, ~2000 vs ~2019 (grouped bars)
data/fertility_world.csv   year, fertility
data/internet_income.csv   group, period (start/end), year, internet
scripts/prepare_data.py    downloads the raw World Bank csvs and writes data/
```

## Run it locally

The browser blocks loading data from `file://`, so start a small server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Regenerate the data with `python3 scripts/prepare_data.py`. It uses only built-in Python and prints which years each chart has data for.

## Deploy (GitHub Pages)

Push to `master` on a public repo, then go to Settings → Pages → Deploy from a branch → `master`, `/ (root)`. All paths are relative, so `/docs` works too.

## Data notes

- **Source:** https://github.com/light-and-salt/World-Bank-Data-by-Indicators
  - `gender` (fertility rate)
  - `infrastructure` (internet users)
- **Fertility:** uses the World Bank "World" row, every year 1960–2019 (there's no 2020 value).
- **Internet years:** chart 2 uses each income group's value for 2000 and 2019. If a year is missing, it uses the closest year within ±3. Only low income needed this: its latest value is 2017, and that year is shown above the bar.

## Planned interactions (not built yet)

- Chart 1: dropdown to pick a country or World, hover for exact values
- Chart 2: hover for the exact % and year for each income group
