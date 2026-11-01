#!/usr/bin/env python3
"""
data prep for dsc 209r project 3
question: how have living conditions and development changed across countries from 1960 to 2020?

downloads 3 csvs from light-and-salt/World-Bank-Data-by-Indicators plus a world outline file,
keeps just what the 3 charts need, and writes small files to ../data/
only uses built-in python (the csv module handles the commas in the column names)

run from the repo root:   python3 scripts/prepare_data.py
"""
import csv
import io
import json
import os
import urllib.request

REPO = "https://raw.githubusercontent.com/light-and-salt/World-Bank-Data-by-Indicators/master/"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
P = "average_value_"

# chart 1: share of people 65+, World, 1960-2020
AGING_FILE = "health/health.csv"
AGING = P + "Population ages 65 and above (% of total population)"

# chart 2: access to electricity by country, 2000 vs 2019 (the folder name really is misspelled)
ELEC_FILE = "engergy-and-mining/energy-and-mining.csv"
ELEC = P + "Access to electricity (% of population)"
ELEC_YEARS = (2000, 2019)

# chart 3: R&D spending as % of GDP, averaged over countries that report it each year
RD_FILE = "science-and-technology/science-and-technology.csv"
RD = P + "Research and development expenditure (% of GDP)"

# chart 4: fertility rate (births per woman), World, 1960-2019
FERT_FILE = "gender/gender.csv"
FERT = P + "Fertility rate, total (births per woman)"

# chart 5: internet users (% of population) by income group, ~2000 vs ~2019
NET_FILE = "infrastructure/infrastructure.csv"
NET = P + "Individuals using the Internet (% of population)"
NET_GROUPS = ["Low income", "Lower middle income", "Upper middle income", "High income", "World"]
NET_TARGETS = (2000, 2019)
WINDOW = 3  # if the exact year is missing, closest year within ±3 is fine

# country list: rows in this file with a Region are real countries, blank Region = aggregate
# (World, High income, Sub-Saharan Africa, etc.) so we use it to drop aggregates
META_FILE = "engergy-and-mining/Metadata_Country_API_5_DS2_en_csv_v2_3060772.csv"

# world outlines for the map, ids are ISO3 codes so they match "Country Code"
GEO_URL = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json"


def get(url):
    print(f"downloading {url.rsplit('/', 1)[-1]} ...")
    with urllib.request.urlopen(url) as r:
        return r.read().decode("utf-8-sig")


def rows(path):
    return list(csv.DictReader(io.StringIO(get(REPO + path))))


def num(v):
    """empty -> None, otherwise float"""
    try:
        return float(v) if v not in ("", None) else None
    except ValueError:
        return None


def rewind(geom):
    """d3 wants outer rings clockwise and holes counter-clockwise. this file has it the other way,
    which makes d3 fill the whole globe instead of the country, so flip any ring that's backwards"""
    def area(ring):  # shoelace, positive = counter-clockwise
        return sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(ring, ring[1:]))
    polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
    for poly in polys:
        for i, ring in enumerate(poly):
            outer = i == 0
            if (area(ring) > 0) == outer:  # outer is ccw or hole is cw -> flip it
                ring.reverse()


def write_csv(name, fields, data):
    with open(os.path.join(OUT, name), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(data)
    print(f"  wrote data/{name} ({len(data)} rows)")


def main():
    os.makedirs(OUT, exist_ok=True)
    countries = {r["Country Code"] for r in rows(META_FILE) if r["Region"].strip()}
    print(f"  {len(countries)} real countries (aggregates dropped)")

    # ---- chart 1 ----
    aging = sorted(
        ({"year": int(r["Year"]), "pct65": round(num(r[AGING]), 2)}
         for r in rows(AGING_FILE)
         if r["Country Name"] == "World" and num(r.get(AGING)) is not None
         and 1960 <= int(r["Year"]) <= 2020),
        key=lambda d: d["year"])
    write_csv("aging_world.csv", ["year", "pct65"], aging)
    missing = sorted(set(range(1960, 2021)) - {d["year"] for d in aging})
    print(f"  coverage: {aging[0]['year']}-{aging[-1]['year']}, missing years: {missing or 'none'}")

    # ---- chart 2 ----
    elec = [{"code": r["Country Code"], "country": r["Country Name"], "year": int(r["Year"]),
             "access": round(num(r[ELEC]), 1)}
            for r in rows(ELEC_FILE)
            if r["Country Code"] in countries and int(r["Year"]) in ELEC_YEARS
            and num(r.get(ELEC)) is not None]
    elec.sort(key=lambda d: (d["year"], d["country"]))
    write_csv("electricity.csv", ["code", "country", "year", "access"], elec)
    for y in ELEC_YEARS:
        vals = [d["access"] for d in elec if d["year"] == y]
        under50 = sum(v < 50 for v in vals)
        print(f"  coverage {y}: {len(vals)} countries, {under50} under 50% access")

    # ---- chart 3 ----
    by_year = {}
    for r in rows(RD_FILE):
        v = num(r.get(RD))
        if r["Country Code"] in countries and v is not None:
            by_year.setdefault(int(r["Year"]), []).append(v)
    rd = [{"year": y, "mean_rd": round(sum(v) / len(v), 3), "n_countries": len(v)}
          for y, v in sorted(by_year.items())]
    write_csv("rd_spending.csv", ["year", "mean_rd", "n_countries"], rd)
    print("  coverage (countries reporting R&D each year):")
    print("   " + "  ".join(f"{d['year']}:{d['n_countries']}" for d in rd))

    # ---- chart 4 ----
    fert = sorted(
        ({"year": int(r["Year"]), "fertility": round(num(r[FERT]), 2)}
         for r in rows(FERT_FILE)
         if r["Country Name"] == "World" and num(r.get(FERT)) is not None
         and 1960 <= int(r["Year"]) <= 2020),
        key=lambda d: d["year"])
    write_csv("fertility_world.csv", ["year", "fertility"], fert)
    print(f"  coverage: {fert[0]['year']}-{fert[-1]['year']} ({len(fert)} years)")

    # ---- chart 5 ----
    vals = {}
    for r in rows(NET_FILE):
        v = num(r.get(NET))
        if r["Country Name"] in NET_GROUPS and v is not None:
            vals.setdefault(r["Country Name"], {})[int(r["Year"])] = v
    net = []
    for g in NET_GROUPS:
        for period, target in zip(("start", "end"), NET_TARGETS):
            options = [y for y in vals.get(g, {}) if abs(y - target) <= WINDOW]
            if not options:
                print(f"  WARNING: no internet data for {g} near {target}")
                continue
            y = min(options, key=lambda y: (abs(y - target), y))
            net.append({"group": g, "period": period, "year": y, "internet": round(vals[g][y], 1)})
    write_csv("internet_income.csv", ["group", "period", "year", "internet"], net)
    for d in net:
        print(f"  {d['group']:<22}{d['period']:<6}{d['year']}  {d['internet']}%")

    # ---- map outlines (drop Antarctica, it just takes up space) ----
    geo = json.loads(get(GEO_URL))
    geo["features"] = [f for f in geo["features"] if f.get("id") != "ATA"]
    for f in geo["features"]:
        rewind(f["geometry"])
    with open(os.path.join(OUT, "world.geo.json"), "w", encoding="utf-8") as f:
        json.dump(geo, f, separators=(",", ":"))
    matched = {f["id"] for f in geo["features"]} & {d["code"] for d in elec}
    print(f"  wrote data/world.geo.json ({len(geo['features'])} shapes, {len(matched)} match electricity data)")


if __name__ == "__main__":
    main()
