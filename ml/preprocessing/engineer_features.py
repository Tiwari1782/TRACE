"""
engineer_features.py — IBTrACS Feature Engineering (Step 2)
-------------------------------------------------------------
Reads ibtracs_clean.csv and adds derived features:

  wind_change_24hr      : knot change over preceding 24-hour window
  pressure_change_24hr  : mb change over preceding 24-hour window
  rapid_intensify       : 1 if wind_change_24hr >= 35, else 0

Optionally merges ERA5 SST and 850 hPa relative humidity by matching
on storm timestamp and nearest grid point.  If ERA5 files are not present
the script inserts NaN for those columns and emits a warning.

Output: ml/data/processed/ibtracs_features.csv

Run standalone:
    python ml/preprocessing/engineer_features.py
    python ml/preprocessing/engineer_features.py --era5-dir ml/data/raw --skip-era5
"""

import argparse
import glob
import os
import sys
import warnings

import numpy as np
import pandas as pd

DEFAULT_INPUT  = os.path.join(
    os.path.dirname(__file__), "..", "data", "processed", "ibtracs_clean.csv"
)
DEFAULT_OUTPUT = os.path.join(
    os.path.dirname(__file__), "..", "data", "processed", "ibtracs_features.csv"
)
DEFAULT_ERA5   = os.path.join(os.path.dirname(__file__), "..", "data", "raw")

RI_THRESHOLD = 35  # knots in 24 hours


def parse_args():
    parser = argparse.ArgumentParser(description="Feature engineering for TRACE ML pipeline")
    parser.add_argument("--input",     default=DEFAULT_INPUT,  help="Path to ibtracs_clean.csv")
    parser.add_argument("--output",    default=DEFAULT_OUTPUT, help="Output feature CSV path")
    parser.add_argument("--era5-dir",  default=DEFAULT_ERA5,   help="Directory containing ERA5 .nc files")
    parser.add_argument("--skip-era5", action="store_true",    help="Skip ERA5 merge (e.g. files not yet downloaded)")
    return parser.parse_args()


# ── Per-storm delta features ──────────────────────────────────────────────────

def add_delta_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add 24hr change features and RI label, computed within each storm track."""
    df = df.sort_values(["SID", "ISO_TIME"]).copy()

    # IBTrACS records every 6 hours → 4 rows = 24 hr
    df["wind_change_24hr"]     = df.groupby("SID")["USA_WIND"].diff(periods=4)
    df["pressure_change_24hr"] = df.groupby("SID")["USA_PRES"].diff(periods=4)

    # RI label: 1 if wind increases >= 35 kt in next 24 hr
    # We look *forward* (shift=-4) so the label means "will RI occur after this point"
    df["wind_fwd_24hr"] = df.groupby("SID")["USA_WIND"].shift(-4)
    df["rapid_intensify"] = (
        (df["wind_fwd_24hr"] - df["USA_WIND"]) >= RI_THRESHOLD
    ).astype(int)
    df = df.drop(columns=["wind_fwd_24hr"])

    return df


# ── ERA5 merge (optional) ─────────────────────────────────────────────────────

def merge_era5(df: pd.DataFrame, era5_dir: str) -> pd.DataFrame:
    """Merge SST and 850 hPa RH from ERA5 NetCDF files onto storm track."""
    try:
        import xarray as xr
    except ImportError:
        warnings.warn("[WARN] xarray not installed — skipping ERA5 merge. pip install xarray netcdf4")
        df["sea_surface_temp"]  = np.nan
        df["humidity_850hPa"]   = np.nan
        return df

    sst_files = sorted(glob.glob(os.path.join(era5_dir, "era5_single_*.nc")))
    rh_files  = sorted(glob.glob(os.path.join(era5_dir, "era5_pressure_*.nc")))

    if not sst_files:
        warnings.warn(
            f"[WARN] No ERA5 single-level .nc files found in {era5_dir}. "
            "Run ml/data/download_era5.py first or pass --skip-era5."
        )
        df["sea_surface_temp"] = np.nan
        df["humidity_850hPa"]  = np.nan
        return df

    print(f"[INFO] Loading {len(sst_files)} SST file(s) and {len(rh_files)} RH file(s) ...")
    ds_sst = xr.open_mfdataset(sst_files, combine="by_coords")["sst"]
    ds_rh  = xr.open_mfdataset(rh_files,  combine="by_coords")["r"].sel(pressure_level=850)

    sst_vals, rh_vals = [], []
    for _, row in df.iterrows():
        t = row["ISO_TIME"]
        lat, lon = float(row["LAT"]), float(row["LON"])
        # Nearest-neighbour selection
        try:
            sst = float(ds_sst.sel(time=t, latitude=lat, longitude=lon, method="nearest").values)
        except Exception:
            sst = np.nan
        try:
            rh = float(ds_rh.sel(time=t, latitude=lat, longitude=lon, method="nearest").values)
        except Exception:
            rh = np.nan
        sst_vals.append(sst)
        rh_vals.append(rh)

    df["sea_surface_temp"] = sst_vals
    df["humidity_850hPa"]  = rh_vals
    return df


def main():
    args = parse_args()

    if not os.path.isfile(args.input):
        sys.exit(f"[ERROR] Input file not found: {args.input}\nRun clean_ibtracs.py first.")

    print(f"[INFO] Reading {args.input} ...")
    df = pd.read_csv(args.input, parse_dates=["ISO_TIME"])

    print("[INFO] Adding delta features and RI label ...")
    df = add_delta_features(df)

    if args.skip_era5:
        print("[INFO] --skip-era5 set: inserting NaN for ERA5 columns.")
        df["sea_surface_temp"] = np.nan
        df["humidity_850hPa"]  = np.nan
    else:
        print("[INFO] Merging ERA5 SST and 850 hPa RH ...")
        df = merge_era5(df, args.era5_dir)

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    df.to_csv(args.output, index=False)

    ri_count = df["rapid_intensify"].sum()
    total    = len(df)
    print(f"\n[DONE] Feature CSV saved to: {os.path.abspath(args.output)}")
    print(f"       Shape: {df.shape}")
    print(f"       RI events (label=1): {ri_count:,}  ({ri_count/total*100:.1f}%)")
    print(f"       Columns: {list(df.columns)}")


if __name__ == "__main__":
    main()
