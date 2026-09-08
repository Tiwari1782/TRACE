"""
train_rf.py — TRACE Random Forest Classifier
----------------------------------------------
Trains a multi-output Random Forest for:
  1. Storm category prediction (0–5, Saffir-Simpson scale)
  2. Rapid Intensification (RI) flag (binary: 0 / 1)

Features:
  wind_speed, pressure, lat, lon, sea_surface_temp, humidity_850hPa,
  wind_change_24hr, basin (label-encoded), season (label-encoded)

Targets:
  category      — Saffir-Simpson category (derived from wind speed)
  rapid_intensify — 1 if RI event expected in 24 hr

Config: n_estimators=100, max_depth=12, random_state=42
Class imbalance handled with class_weight='balanced'

Outputs: ml/saved_models/trace_rf.pkl
Metrics: category accuracy (target > 80%), RI recall (target > 75%)

Run standalone:
    python ml/training/train_rf.py
    python ml/training/train_rf.py --data-dir ml/data/processed
"""

import argparse
import os
import pickle
import sys

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, recall_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
MODELS_DIR    = os.path.join(os.path.dirname(__file__), "..", "saved_models")

FEATURE_COLS = [
    "USA_WIND", "USA_PRES", "LAT", "LON",
    "sea_surface_temp", "humidity_850hPa",
    "wind_change_24hr", "basin_enc", "season_enc",
]


def parse_args():
    p = argparse.ArgumentParser(description="Train TRACE Random Forest classifier")
    p.add_argument("--data-dir",   default=PROCESSED_DIR)
    p.add_argument("--models-dir", default=MODELS_DIR)
    p.add_argument("--test-size",  type=float, default=0.2)
    return p.parse_args()


def wind_to_category(wind_kt: float) -> int:
    """Saffir-Simpson scale in knots."""
    if wind_kt >= 137: return 5
    if wind_kt >= 113: return 4
    if wind_kt >= 96:  return 3
    if wind_kt >= 83:  return 2
    if wind_kt >= 64:  return 1
    if wind_kt >= 34:  return 0   # Tropical Storm
    return -1                      # Tropical Depression


def load_and_prepare(data_dir: str):
    feat_path = os.path.join(data_dir, "ibtracs_features.csv")
    if not os.path.isfile(feat_path):
        sys.exit(f"[ERROR] Not found: {feat_path}\nRun engineer_features.py first.")

    df = pd.read_csv(feat_path, parse_dates=["ISO_TIME"])
    print(f"[INFO] Loaded feature CSV: {df.shape}")

    # ── Encode categorical features ───────────────────────────────────────────
    basin_enc  = LabelEncoder()
    season_enc = LabelEncoder()
    df["basin_enc"]  = basin_enc.fit_transform(df["BASIN"].fillna("NA").astype(str))
    df["season_enc"] = season_enc.fit_transform(df["SEASON"].fillna("0").astype(str))

    # ── Derive category target ────────────────────────────────────────────────
    df["category_target"] = df["USA_WIND"].apply(wind_to_category)

    # ── Impute remaining NaNs ─────────────────────────────────────────────────
    for col in ["sea_surface_temp", "humidity_850hPa", "wind_change_24hr", "pressure_change_24hr"]:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())

    df = df.dropna(subset=FEATURE_COLS + ["category_target", "rapid_intensify"])

    X = df[FEATURE_COLS].values.astype(np.float32)
    y_cat = df["category_target"].values.astype(int)
    y_ri  = df["rapid_intensify"].values.astype(int)

    return X, y_cat, y_ri, basin_enc, season_enc


def main():
    args = parse_args()
    X, y_cat, y_ri, basin_enc, season_enc = load_and_prepare(args.data_dir)

    X_train, X_test, y_cat_tr, y_cat_te, y_ri_tr, y_ri_te = train_test_split(
        X, y_cat, y_ri,
        test_size=args.test_size,
        random_state=42,
        stratify=y_ri,
    )

    print(f"[INFO] Train: {X_train.shape}  Test: {X_test.shape}")
    print(f"[INFO] RI positive rate  train={y_ri_tr.mean()*100:.1f}%  test={y_ri_te.mean()*100:.1f}%")

    # ── Category classifier ───────────────────────────────────────────────────
    print("\n[INFO] Training category RF ...")
    rf_cat = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )
    rf_cat.fit(X_train, y_cat_tr)
    y_cat_pred = rf_cat.predict(X_test)
    cat_acc    = accuracy_score(y_cat_te, y_cat_pred)
    print(f"  Category accuracy: {cat_acc*100:.1f}%  (target > 80%)")
    print(classification_report(y_cat_te, y_cat_pred, labels=sorted(set(y_cat_te))))

    # ── RI classifier ─────────────────────────────────────────────────────────
    print("\n[INFO] Training RI Random Forest ...")
    rf_ri = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )
    rf_ri.fit(X_train, y_ri_tr)
    y_ri_pred = rf_ri.predict(X_test)
    ri_recall  = recall_score(y_ri_te, y_ri_pred, zero_division=0)
    print(f"  RI recall:         {ri_recall*100:.1f}%  (target > 75%)")
    print(classification_report(y_ri_te, y_ri_pred, target_names=["No RI", "RI"]))

    # ── Warnings ──────────────────────────────────────────────────────────────
    if cat_acc < 0.80:
        print(f"[WARN] Category accuracy {cat_acc*100:.1f}% below 80% target — consider more features.")
    if ri_recall < 0.75:
        print(f"[WARN] RI recall {ri_recall*100:.1f}% below 75% target — consider threshold tuning or SMOTE.")

    # ── Save bundle ───────────────────────────────────────────────────────────
    os.makedirs(args.models_dir, exist_ok=True)
    bundle = {
        "rf_category":  rf_cat,
        "rf_ri":        rf_ri,
        "basin_encoder": basin_enc,
        "season_encoder": season_enc,
        "feature_cols":  FEATURE_COLS,
    }
    model_path = os.path.join(args.models_dir, "trace_rf.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(bundle, f)

    print(f"\n[DONE] RF bundle saved: {os.path.abspath(model_path)}")


if __name__ == "__main__":
    main()
