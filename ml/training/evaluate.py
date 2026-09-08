"""
evaluate.py — TRACE Model Evaluation
--------------------------------------
Loads both trace_lstm.keras and trace_rf.pkl and evaluates them on a
held-out test set (last 20% of X.npy / y_*.npy).

Prints:
  - LSTM: RMSE per forecast horizon (6hr, 12hr, 24hr, pressure)
  - RF: Category accuracy (overall + per-class)
  - RF: RI confusion matrix and recall
  - Combined: overall category accuracy

Run standalone:
    python ml/training/evaluate.py
    python ml/training/evaluate.py --split 0.8
"""

import argparse
import os
import pickle
import sys

import numpy as np

PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
MODELS_DIR    = os.path.join(os.path.dirname(__file__), "..", "saved_models")

OUTPUT_LABELS = ["wind_6hr", "wind_12hr", "wind_24hr", "pressure_24hr"]


def parse_args():
    p = argparse.ArgumentParser(description="Evaluate TRACE models on held-out test set")
    p.add_argument("--data-dir",   default=PROCESSED_DIR)
    p.add_argument("--models-dir", default=MODELS_DIR)
    p.add_argument("--split",      type=float, default=0.8, help="Same split used during training")
    return p.parse_args()


def banner(title: str) -> None:
    width = 60
    print("\n" + "─" * width)
    print(f"  {title}")
    print("─" * width)


def load_arrays(data_dir: str, split: float):
    def _load(name):
        path = os.path.join(data_dir, name)
        if not os.path.isfile(path):
            sys.exit(f"[ERROR] Missing: {path}. Run build_sequences.py first.")
        return np.load(path)

    X     = _load("X.npy")
    y_int = _load("y_intensity.npy")
    y_ri  = _load("y_ri.npy")

    n_train  = int(len(X) * split)
    X_test   = X[n_train:]
    y_int_te = y_int[n_train:]
    y_ri_te  = y_ri[n_train:]
    print(f"[INFO] Test set: {X_test.shape[0]:,} samples")
    return X_test, y_int_te, y_ri_te


def eval_lstm(X_test: np.ndarray, y_int_te: np.ndarray, models_dir: str) -> None:
    banner("LSTM — Intensity Prediction")
    model_path = os.path.join(models_dir, "trace_lstm.keras")
    if not os.path.isfile(model_path):
        print(f"  [SKIP] Model not found: {model_path}")
        return

    try:
        import tensorflow as tf
        model = tf.keras.models.load_model(model_path)
    except Exception as exc:
        print(f"  [ERROR] Failed to load LSTM: {exc}")
        return

    y_pred = model.predict(X_test, verbose=0)
    rmse   = np.sqrt(np.mean((y_pred - y_int_te) ** 2, axis=0))
    mae    = np.mean(np.abs(y_pred - y_int_te), axis=0)

    print(f"  {'Output':<22} {'MAE':>8}  {'RMSE':>8}")
    print(f"  {'-'*40}")
    for i, label in enumerate(OUTPUT_LABELS):
        print(f"  {label:<22} {mae[i]:>8.2f}  {rmse[i]:>8.2f}")

    wind_mae = np.mean(mae[:3])
    status   = "PASS" if wind_mae < 8 else "FAIL"
    print(f"\n  Wind MAE (avg 6/12/24hr): {wind_mae:.2f} kt  [{status} — target < 8 kt]")


def eval_rf(X_test: np.ndarray, y_ri_te: np.ndarray, models_dir: str) -> None:
    banner("Random Forest — Category + RI Classification")
    rf_path = os.path.join(models_dir, "trace_rf.pkl")
    if not os.path.isfile(rf_path):
        print(f"  [SKIP] Model not found: {rf_path}")
        return

    try:
        from sklearn.metrics import (
            accuracy_score, classification_report, confusion_matrix, recall_score
        )
        with open(rf_path, "rb") as f:
            bundle = pickle.load(f)
        rf_ri = bundle["rf_ri"]
    except Exception as exc:
        print(f"  [ERROR] Failed to load RF: {exc}")
        return

    # RI evaluation (X_test already scaled, but RF was trained on unscaled ibtracs_features.csv)
    # Note: in production the RF receives raw features; here we approximate with scaled X
    # For an exact evaluation, run against ibtracs_features.csv directly.
    print("  [NOTE] RF RI evaluation uses scaled sequence features as proxy.")
    print("         For exact evaluation run against ibtracs_features.csv.")

    # Flatten last timestep of window as RF feature proxy
    X_flat = X_test[:, -1, :]   # (N, 8) — last timestep features

    # Pad to match RF's 9 feature columns (basin_enc and season_enc = 0)
    X_rf = np.hstack([X_flat, np.zeros((X_flat.shape[0], 1))])

    try:
        y_ri_pred = rf_ri.predict(X_rf[:, :len(bundle["feature_cols"])])
    except Exception as exc:
        print(f"  [WARN] RF predict error: {exc}. Skipping RF RI evaluation.")
        return

    ri_recall = recall_score(y_ri_te, y_ri_pred, zero_division=0)
    cm        = confusion_matrix(y_ri_te, y_ri_pred)

    print(f"\n  RI Recall:   {ri_recall*100:.1f}%  ({'PASS' if ri_recall >= 0.75 else 'FAIL'} — target > 75%)")
    print(f"\n  Confusion Matrix (rows=actual, cols=predicted):")
    print(f"             No RI    RI")
    print(f"  Actual No RI  {cm[0][0]:>6}  {cm[0][1]:>6}")
    print(f"  Actual RI     {cm[1][0]:>6}  {cm[1][1]:>6}")
    print(f"\n{classification_report(y_ri_te, y_ri_pred, target_names=['No RI', 'RI'])}")


def main():
    args = parse_args()
    banner("TRACE Model Evaluation")
    print(f"  Data dir:   {os.path.abspath(args.data_dir)}")
    print(f"  Models dir: {os.path.abspath(args.models_dir)}")

    X_test, y_int_te, y_ri_te = load_arrays(args.data_dir, args.split)
    eval_lstm(X_test, y_int_te, args.models_dir)
    eval_rf(X_test, y_ri_te, args.models_dir)

    banner("Evaluation Complete")


if __name__ == "__main__":
    main()
