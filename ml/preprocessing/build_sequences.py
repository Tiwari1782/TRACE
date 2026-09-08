"""
build_sequences.py — Sequence Builder for LSTM (Step 3)
---------------------------------------------------------
Reads ibtracs_features.csv and constructs sliding-window sequences
suitable for the TRACE LSTM model.

Window:  24 timesteps × 8 features  (24 × 6-hour steps = 6 days lookback)
Features per step:
  0  wind_speed          (USA_WIND, knots)
  1  pressure            (USA_PRES, mb)
  2  lat                 (decimal degrees)
  3  lon                 (decimal degrees)
  4  sea_surface_temp    (K, from ERA5; may be NaN if ERA5 not merged)
  5  humidity_850hPa     (%, from ERA5; may be NaN)
  6  wind_change_24hr    (kt / 24 hr)
  7  pressure_change_24hr (mb / 24 hr)

Outputs (saved to ml/data/processed/):
  X.npy          shape (N, 24, 8)   float32
  y_intensity.npy shape (N, 4)      float32   [wind_6hr, wind_12hr, wind_24hr, pressure_24hr]
  y_ri.npy        shape (N,)        int32
  scaler.pkl      MinMaxScaler fitted on training split

Run standalone:
    python ml/preprocessing/build_sequences.py
    python ml/preprocessing/build_sequences.py --window 24 --split 0.8
"""

import argparse
import os
import pickle
import sys

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

DEFAULT_INPUT  = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "ibtracs_features.csv")
DEFAULT_OUTPUT = os.path.join(os.path.dirname(__file__), "..", "data", "processed")

FEATURE_COLS = [
    "USA_WIND",
    "USA_PRES",
    "LAT",
    "LON",
    "sea_surface_temp",
    "humidity_850hPa",
    "wind_change_24hr",
    "pressure_change_24hr",
]

WINDOW_SIZE = 24  # 24 × 6 hr = 6 days
STEPS_AHEAD = {   # how many 6-hr steps ahead each target is
    "6hr":  1,
    "12hr": 2,
    "24hr": 4,
}


def parse_args():
    parser = argparse.ArgumentParser(description="Build LSTM sequences for TRACE")
    parser.add_argument("--input",  default=DEFAULT_INPUT)
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    parser.add_argument("--window", type=int, default=WINDOW_SIZE, help="Lookback window (timesteps)")
    parser.add_argument("--split",  type=float, default=0.8,       help="Train fraction for scaler fitting")
    return parser.parse_args()


def impute_era5(df: pd.DataFrame) -> pd.DataFrame:
    """Fill ERA5 NaNs with basin-level medians, then global median."""
    for col in ["sea_surface_temp", "humidity_850hPa"]:
        if col in df.columns:
            df[col] = df.groupby("BASIN")[col].transform(lambda x: x.fillna(x.median()))
            df[col] = df[col].fillna(df[col].median())
    return df


def build_sequences(df: pd.DataFrame, window: int):
    """
    For each storm track, slide a window of `window` timesteps and create:
      X            : features for the window
      y_intensity  : [wind_6hr, wind_12hr, wind_24hr, pressure_24hr]
      y_ri         : rapid_intensify flag at t+4 (24 hr ahead)
    """
    X_list, y_int_list, y_ri_list = [], [], []

    for sid, group in df.groupby("SID"):
        group = group.sort_values("ISO_TIME").reset_index(drop=True)
        feats = group[FEATURE_COLS].values.astype(np.float32)
        winds = group["USA_WIND"].values.astype(np.float32)
        press = group["USA_PRES"].values.astype(np.float32)
        ri    = group["rapid_intensify"].values.astype(np.int32)
        n     = len(group)

        max_step = STEPS_AHEAD["24hr"]  # need 4 steps ahead minimum
        for i in range(window, n - max_step):
            window_feats = feats[i - window: i]   # shape (window, 8)
            y_w6  = winds[i + STEPS_AHEAD["6hr"]]
            y_w12 = winds[i + STEPS_AHEAD["12hr"]]
            y_w24 = winds[i + STEPS_AHEAD["24hr"]]
            y_p24 = press[i + STEPS_AHEAD["24hr"]]
            y_ri_val = ri[i + STEPS_AHEAD["24hr"]]

            if np.isnan(window_feats).any():
                continue  # skip windows with any NaN

            X_list.append(window_feats)
            y_int_list.append([y_w6, y_w12, y_w24, y_p24])
            y_ri_list.append(y_ri_val)

    X      = np.array(X_list,   dtype=np.float32)
    y_int  = np.array(y_int_list, dtype=np.float32)
    y_ri   = np.array(y_ri_list,  dtype=np.int32)
    return X, y_int, y_ri


def fit_scaler(X: np.ndarray, train_frac: float):
    """Fit MinMaxScaler on the training portion only (reshape to 2D for sklearn)."""
    n_train = int(len(X) * train_frac)
    X_2d = X[:n_train].reshape(-1, X.shape[2])
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaler.fit(X_2d)
    return scaler


def apply_scaler(X: np.ndarray, scaler: MinMaxScaler) -> np.ndarray:
    n, t, f = X.shape
    X_2d    = X.reshape(-1, f)
    X_scaled = scaler.transform(X_2d).reshape(n, t, f)
    return X_scaled.astype(np.float32)


def main():
    args = parse_args()

    if not os.path.isfile(args.input):
        sys.exit(f"[ERROR] Not found: {args.input}\nRun engineer_features.py first.")

    print(f"[INFO] Reading {args.input} ...")
    df = pd.read_csv(args.input, parse_dates=["ISO_TIME"])
    df = impute_era5(df)

    print(f"[INFO] Building sequences (window={args.window}) ...")
    X, y_int, y_ri = build_sequences(df, args.window)

    print(f"[INFO] Fitting scaler on first {args.split*100:.0f}% of sequences ...")
    scaler = fit_scaler(X, args.split)
    X = apply_scaler(X, scaler)

    os.makedirs(args.output, exist_ok=True)
    np.save(os.path.join(args.output, "X.npy"),           X)
    np.save(os.path.join(args.output, "y_intensity.npy"),  y_int)
    np.save(os.path.join(args.output, "y_ri.npy"),         y_ri)

    scaler_path = os.path.join(args.output, "scaler.pkl")
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)

    print(f"\n[DONE] Outputs in {os.path.abspath(args.output)}")
    print(f"       X.npy           shape: {X.shape}        dtype: {X.dtype}")
    print(f"       y_intensity.npy shape: {y_int.shape}     dtype: {y_int.dtype}")
    print(f"       y_ri.npy        shape: {y_ri.shape}  dtype: {y_ri.dtype}")
    print(f"       scaler.pkl      saved: {scaler_path}")
    print(f"       RI positive rate: {y_ri.mean()*100:.1f}%")


if __name__ == "__main__":
    main()
