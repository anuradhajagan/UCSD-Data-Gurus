#!/usr/bin/env python3
"""
data prep for dsc 209r project 3
question: how have living conditions and development changed across countries from 1960 to 2020?

downloads 5 csvs from light-and-salt/World-Bank-Data-by-Indicators,
keeps just what the charts need, and writes small files to ../data/
only uses built-in python (the csv module handles the commas in the column names)

run from the repo root:   python3 scripts/prepare_data.py
"""
import csv
import io
import os
import urllib.request

REPO = "https://raw.githubusercontent.com/light-and-salt/World-Bank-Data-by-Indicators/master/"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
P = "average_value_"

# chart 1: fertility rate (births per woman), World, 1960-2019
FERT_FILE = "gender/gender.csv"
FERT = P + "Fertility rate, total (births per woman)"

# chart 2: internet users (% of population) by income group, ~2000 vs ~2019
NET_FILE = "infrastructure/infrastructure.csv"
NET = P + "Individuals using the Internet (% of population)"
NET_GROUPS = ["Low income", "Lower middle income", "Upper middle income", "High income", "World"]
NET_TARGETS = (2000, 2019)
WINDOW = 3  # if the exact year is missing, closest year within ±3 is fine

# chart 3: electricity access by country
ELEC_FILE = "engergy-and-mining/energy-and-mining.csv"
ELEC = P + "Access to electricity (% of population)"
AGGREGATE_CODES = set("""
    AFE AFW ARB CEB CSS EAP EAR EAS ECA ECS EMU EUU FCS
    HIC HPC IBD IBT IDA IDB IDX INX LAC LCN LDC LIC LMC
    LMY LTE MEA MIC MNA NAC OED OSS PRE PSS PST SAS SSA
    SSF SST TEA TEC TLA TMN TSA TSS UMC WLD
""".split())

# chart 4: Population aging
AGING_FILE = "health/health.csv"
AGING = P + "Population ages 65 and above (% of total population)"

# chart 5: research and development expenditure (% of GDP) by country
RD_FILE = "science-and-technology/science-and-technology.csv"
RD = "average_value_Research and development expenditure (% of GDP)"


def rows(path):
    print(f"downloading {path.rsplit('/', 1)[-1]} ...")
    with urllib.request.urlopen(REPO + path) as r:
        return list(csv.DictReader(io.StringIO(r.read().decode("utf-8-sig"))))


def num(v):
    """empty -> None, otherwise float"""
    try:
        return float(v) if v not in ("", None) else None
    except ValueError:
        return None


def write_csv(name, fields, data):
    with open(os.path.join(OUT, name), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(data)
    print(f"  wrote data/{name} ({len(data)} rows)")


def main():
    os.makedirs(OUT, exist_ok=True)

    # ---- chart 1 ----
    fert = sorted(
        ({"year": int(r["Year"]), "fertility": round(num(r[FERT]), 2)}
         for r in rows(FERT_FILE)
         if r["Country Name"] == "World" and num(r.get(FERT)) is not None
         and 1960 <= int(r["Year"]) <= 2020),
        key=lambda d: d["year"])
    write_csv("fertility_world.csv", ["year", "fertility"], fert)
    print(f"  coverage: {fert[0]['year']}-{fert[-1]['year']} ({len(fert)} years)")

    # ---- chart 2 ----
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

    # ---- chart 3 ----
    electricity = []
    for r in rows(ELEC_FILE):
        access = num(r.get(ELEC))
        year_value = num(r.get("Year"))
        code = r.get("Country Code", "").strip().upper()
        country = r.get("Country Name", "").strip()
        # Skip missing or invalid observations.
        if access is None or not 0 <= access <= 100:
            continue
        # Keep only 2000 and 2019.
        if year_value not in (2000, 2019):
            continue
        # Keep countries and economies, excluding aggregates.
        if (
            not country
            or len(code) != 3
            or not code.isalpha()
            or code in AGGREGATE_CODES
        ):
            continue
        electricity.append({
            "country": country,
            "code": code,
            "year": int(year_value),
            "access": round(access, 2)
        })
    electricity.sort(key=lambda d: (d["year"], d["code"]))
    write_csv(
        "electricity_access.csv",
        ["country", "code", "year", "access"],
        electricity
    )
    if electricity:
        years = sorted({d["year"] for d in electricity})
        print(f"  electricity coverage: {years[0]}-{years[-1]}")

    # ---- chart 4: population aging ----
    aging = []
    for r in rows(AGING_FILE):
        aged65 = num(r.get(AGING))
        year_value = num(r.get("Year"))
        code = r.get("Country Code", "").strip().upper()
        country = r.get("Country Name", "").strip()
        # Skip missing or invalid percentages.
        if aged65 is None or not 0 <= aged65 <= 100:
            continue
        # Keep 4 years from 1960 1980 2000 2020.
        if year_value not in (1960, 1980, 2000, 2019):
            continue
        if not year_value.is_integer():
            continue
        # Exclude regional and income-group aggregates.
        if (
            not country
            or len(code) != 3
            or not code.isalpha()
            or code in AGGREGATE_CODES
        ):
            continue
        aging.append({
            "country": country,
            "code": code,
            "year": int(year_value),
            "aged65": round(aged65, 3)
        })
    aging.sort(key=lambda d: (d["country"], d["year"]))
    write_csv(
        "population_aging.csv",
        ["country", "code", "year", "aged65"],
        aging
    )
    if aging:
        years = sorted({d["year"] for d in aging})
        print(
            f"  aging coverage: {years[0]}-{years[-1]}"
        )

    # ---- chart 5: research and development expenditure (% of GDP) ----
    research = []
    for r in rows(RD_FILE):
        value = num(r.get(RD))
        year = num(r.get("Year"))
        code = r.get("Country Code", "").strip().upper()
        country = r.get("Country Name", "").strip()
        # Skip missing or invalid values. Keep real zeros.
        if value is None or not 0 <= value <= 100:
            continue
        if year is None or not 1960 <= year <= 2020:
            continue
        if not year.is_integer():
            continue
        # Exclude regional and income-group totals.
        if not country or len(code) != 3 or code in AGGREGATE_CODES:
            continue
        research.append({
            "country": country,
            "code": code,
            "year": int(year),
            "rd": value
        })
    # One observation per country and year.
    unique = {}
    for d in research:
        unique[(d["code"], d["year"])] = d
    # Group values by year.
    by_year = {}
    for d in unique.values():
        by_year.setdefault(d["year"], []).append(d["rd"])
    # Calculate an equally weighted country average.
    averages = []
    for year, values in sorted(by_year.items()):
        averages.append({
            "year": year,
            "average": round(sum(values) / len(values), 4),
            "count": len(values)
        })
    write_csv(
        "rd_average.csv",
        ["year", "average", "count"],
        averages
    )


if __name__ == "__main__":
    main()
