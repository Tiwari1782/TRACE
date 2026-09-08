"""
train_lstm.py — TRACE LSTM Intensity Predictor
------------------------------------------------
Trains a multi-output LSTM to predict tropical cyclone wind speed at
+6hr, +12hr, +24hr and pressure at +24hr.

Architecture:
  Input(24, 8) → LSTM(128, return_sequences=True) → Dropout(0.2)
               → LSTM(64)                          → Dropout(0.2)
               → Dense(32, relu)                   → Dense(4)

Targets (y_intensity):  [wind_6hr, wind_12hr, wind_24hr, pressure_24hr]

Metrics:  MAE, RMSE per output
Target:   MAE < 8 knots on wind outputs

Outputs saved to ml/saved_models/:
  trace_lstm.keras
  scaler.pkl  (copied from data/processed/ for Render deployment convenience)

Run standalone:
    python ml/training/train_lstm.py
    python ml/training/train_lstm.py --epochs 100 --batch-size 64
"""

import argparse
import os
import pickle
import shutil
import sys

import numpy as np

# ── Paths ─────────────────────────────────────────────────────────────────────
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
MODELS_DIR    = os.path.join(os.path.dirname(__file__), "..", "saved_models")


def parse_args():
    p = argparse.ArgumentParser(description="Train TRACE LSTM intensity model")
    p.add_argument("--data-dir",    default=PROCESSED_DIR, help="Directory with X.npy, y_intensity.npy")
    p.add_argument("--models-dir",  default=MODELS_DIR,    help="Output directory for saved models")
    p.add_argument("--epochs",      type=int, default=150,  help="Max training epochs (early stopping applies)")
    p.add_argument("--batch-size",  type=int, default=128,  help="Batch size")
    p.add_argument("--split",       type=float, default=0.8, help="Train/test split fraction")
    p.add_argument("--val-split",   type=float, default=0.1, help="Validation fraction of training data")
    return p.parse_args()


def load_data(data_dir: str, split: float):
    X_path = os.path.join(data_dir, "X.npy")
    y_path = os.path.join(data_dir, "y_intensity.npy")
    for p in [X_path, y_path]:
        if not os.path.isfile(p):
            sys.exit(f"[ERROR] Missing: {p}\nRun build_sequences.py first.")

    X = np.load(X_path)
    y = np.load(y_path)
    print(f"[INFO] Loaded X: {X.shape}, y: {y.shape}")

    n_train = int(len(X) * split)
    return X[:n_train], y[:n_train], X[n_train:], y[n_train:]


def build_model(window: int, n_features: int, n_outputs: int):
    """Build the TRACE LSTM architecture."""
    try:
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, Dense, Dropout, Input
        from tensorflow.keras.optimizers import Adam
    except ImportError:
        sys.exit("[ERROR] TensorFlow not installed. Run: pip install tensorflow")

    model = Sequential([
        Input(shape=(window, n_features)),
        LSTM(128, return_sequences=True),
        Dropout(0.2),
        LSTM(64, return_sequences=False),
        Dropout(0.2),
        Dense(32, activation="relu"),
        Dense(n_outputs),
    ], name="TRACE_LSTM")

    model.compile(optimizer=Adam(learning_rate=1e-3), loss="mse", metrics=["mae"])
    model.summary()
    return model


def main():
    args = parse_args()

    import tensorflow as tf
    from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint

    print(f"[INFO] TensorFlow version: {tf.__version__}")
    print(f"[INFO] GPUs available: {len(tf.config.list_physical_devices('GPU'))}")

    X_train, y_train, X_test, y_test = load_data(args.data_dir, args.split)

    model = build_model(
        window=X_train.shape[1],
        n_features=X_train.shape[2],
        n_outputs=y_train.shape[1],
    )

    os.makedirs(args.models_dir, exist_ok=True)
    checkpoint_path = os.path.join(args.models_dir, "trace_lstm_checkpoint.keras")

    callbacks = [
        EarlyStopping(monitor="val_loss", patience=10, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=5, verbose=1),
        ModelCheckpoint(checkpoint_path, monitor="val_loss", save_best_only=True, verbose=0),
    ]

    print(f"\n[INFO] Training for up to {args.epochs} epochs (early stopping patience=10) ...")
    history = model.fit(
        X_train, y_train,
        epochs=args.epochs,
        batch_size=args.batch_size,
        validation_split=args.val_split,
        callbacks=callbacks,
        verbose=1,
    )

    # ── Evaluation ────────────────────────────────────────────────────────────
    y_pred = model.predict(X_test, verbose=0)
    mae    = np.mean(np.abs(y_pred - y_test), axis=0)
    rmse   = np.sqrt(np.mean((y_pred - y_test) ** 2, axis=0))
    labels = ["wind_6hr", "wind_12hr", "wind_24hr", "pressure_24hr"]

    print("\n── Test Set Metrics ─────────────────────────────────────")
    for i, label in enumerate(labels):
        print(f"  {label:<20} MAE={mae[i]:.2f}  RMSE={rmse[i]:.2f}")
    print("─────────────────────────────────────────────────────────")

    wind_mae = np.mean(mae[:3])
    if wind_mae < 8:
        print(f"[PASS] Wind MAE = {wind_mae:.2f} knots  (target < 8 knots)")
    else:
        print(f"[WARN] Wind MAE = {wind_mae:.2f} knots  (target < 8 knots — consider more data or tuning)")

    # ── Save model ────────────────────────────────────────────────────────────
    model_path = os.path.join(args.models_dir, "trace_lstm.keras")
    model.save(model_path)
    print(f"\n[DONE] Model saved: {os.path.abspath(model_path)}")

    # Copy scaler alongside model for Render deployment
    scaler_src = os.path.join(args.data_dir, "scaler.pkl")
    scaler_dst = os.path.join(args.models_dir, "scaler.pkl")
    if os.path.isfile(scaler_src) and not os.path.isfile(scaler_dst):
        shutil.copy2(scaler_src, scaler_dst)
        print(f"[INFO] Scaler copied to {scaler_dst}")


if __name__ == "__main__":
    main()
