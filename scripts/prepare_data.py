#!/usr/bin/env python3
"""
data prep for dsc 209r project 3
question: how have living conditions and development changed across countries from 1960 to 2020?

downloads 2 csvs from light-and-salt/World-Bank-Data-by-Indicators,
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


if __name__ == "__main__":
    main()
