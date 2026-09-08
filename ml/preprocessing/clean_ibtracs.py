"""
clean_ibtracs.py — IBTrACS Preprocessing Step 1
------------------------------------------------
Reads the raw IBTrACS CSV and produces a clean, minimal dataset.

Kept columns:
  SID, NAME, SEASON, BASIN, ISO_TIME, LAT, LON,
  USA_WIND, USA_PRES, USA_SSHS

Filters:
  - Rows where USA_WIND is NaN are dropped.
  - ISO_TIME is parsed to datetime.

Output: ml/data/processed/ibtracs_clean.csv

Run standalone:
    python ml/preprocessing/clean_ibtracs.py
    python ml/preprocessing/clean_ibtracs.py --input ml/data/raw/ibtracs.csv
"""

import argparse
import os
import sys

import pandas as pd

# ── Defaults ──────────────────────────────────────────────────────────────────
DEFAULT_INPUT = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "ibtracs.csv")
FALLBACK_INPUT = os.path.join(
    os.path.dirname(__file__), "..", "..", "Data", "ibtracs.ALL.list.v04r00.csv"
)
DEFAULT_OUTPUT = os.path.join(
    os.path.dirname(__file__), "..", "data", "processed", "ibtracs_clean.csv"
)

KEEP_COLS = [
    "SID", "NAME", "SEASON", "BASIN", "ISO_TIME",
    "LAT", "LON", "USA_WIND", "USA_PRES", "USA_SSHS",
]

DTYPE_MAP = {
    "SID": str,
    "NAME": str,
    "SEASON": str,
    "BASIN": str,
    "ISO_TIME": str,
}


def parse_args():
    parser = argparse.ArgumentParser(description="Clean IBTrACS CSV for TRACE")
    parser.add_argument("--input",  default=None,          help="Path to raw ibtracs.csv")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help="Output path for cleaned CSV")
    return parser.parse_args()


def resolve_input(arg_input: str | None) -> str:
    if arg_input and os.path.isfile(arg_input):
        return arg_input
    if os.path.isfile(DEFAULT_INPUT):
        return DEFAULT_INPUT
    if os.path.isfile(FALLBACK_INPUT):
        print(f"[INFO] Using bundled IBTrACS at {FALLBACK_INPUT}")
        return FALLBACK_INPUT
    sys.exit(
        "[ERROR] Cannot find ibtracs.csv. Run ml/data/download_ibtracs.py first "
        "or pass --input <path>."
    )


def clean(input_path: str, output_path: str) -> pd.DataFrame:
    print(f"[INFO] Reading {input_path} ...")
    # IBTrACS v04 has a 2-row header; row 1 = column names, row 2 = units
    df = pd.read_csv(
        input_path,
        skiprows=[1],          # skip the units row
        dtype=DTYPE_MAP,
        low_memory=False,
        na_values=["", " ", "NaN", " NaN"],
    )

    print(f"[INFO] Raw shape: {df.shape}")

    # ── Select columns (case-insensitive safety) ──────────────────────────────
    df.columns = df.columns.str.strip()
    missing = [c for c in KEEP_COLS if c not in df.columns]
    if missing:
        sys.exit(f"[ERROR] Missing columns: {missing}. Check IBTrACS format version.")

    df = df[KEEP_COLS].copy()

    # ── Parse timestamp ───────────────────────────────────────────────────────
    df["ISO_TIME"] = pd.to_datetime(df["ISO_TIME"], errors="coerce", utc=True)

    # ── Coerce numeric columns ────────────────────────────────────────────────
    for col in ["LAT", "LON", "USA_WIND", "USA_PRES", "USA_SSHS"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # ── Drop rows without wind speed ──────────────────────────────────────────
    before = len(df)
    df = df.dropna(subset=["USA_WIND"])
    after = len(df)
    print(f"[INFO] Dropped {before - after:,} rows with missing USA_WIND.")

    # ── Sort by storm id + time ───────────────────────────────────────────────
    df = df.sort_values(["SID", "ISO_TIME"]).reset_index(drop=True)

    return df


def main():
    args = parse_args()
    input_path = resolve_input(args.input)

    df = clean(input_path, args.output)

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    df.to_csv(args.output, index=False)

    print(f"[DONE] Cleaned dataset saved to: {os.path.abspath(args.output)}")
    print(f"       Shape: {df.shape}  |  Unique storms: {df['SID'].nunique():,}")
    print(f"       Date range: {df['ISO_TIME'].min()} → {df['ISO_TIME'].max()}")


if __name__ == "__main__":
    main()
