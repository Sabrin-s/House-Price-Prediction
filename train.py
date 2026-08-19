import json
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from pipeline_utils import FeatureEngineering


def train_model(csv_path="housing.csv", model_output_path="model.joblib", metrics_output_path="model_metrics.json"):
    print(f"[*] Loading dataset from {csv_path}...")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset {csv_path} not found.")

    df = pd.read_csv(csv_path)
    print(f"[+] Loaded {len(df):,} rows and {len(df.columns)} columns.")

    # Target and features
    target_col = "median_house_value"
    X = df.drop(columns=[target_col])
    y = df[target_col]

    # Split dataset (80% train, 20% test) with stratified income category to ensure balanced evaluation
    income_categories = pd.cut(
        df["median_income"],
        bins=[0.0, 1.5, 3.0, 4.5, 6.0, np.inf],
        labels=[1, 2, 3, 4, 5]
    )
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=income_categories
    )

    # Feature definitions
    base_num_cols = [
        "longitude",
        "latitude",
        "housing_median_age",
        "total_rooms",
        "total_bedrooms",
        "population",
        "households",
        "median_income",
    ]
    cat_cols = ["ocean_proximity"]
    all_num_cols = base_num_cols + ["rooms_per_household", "bedrooms_per_room", "population_per_household"]

    # Preprocessing pipelines
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, all_num_cols),
            ("cat", cat_pipeline, cat_cols),
        ]
    )

    # Full Model Pipeline
    full_pipeline = Pipeline([
        ("feat_engineering", FeatureEngineering()),
        ("preprocessor", preprocessor),
        ("regressor", RandomForestRegressor(
            n_estimators=180,
            max_depth=26,
            min_samples_split=4,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )),
    ])

    print("[*] Training Random Forest Regressor pipeline...")
    full_pipeline.fit(X_train, y_train)

    print("[*] Evaluating model on test set...")
    y_pred_test = full_pipeline.predict(X_test)
    y_pred_train = full_pipeline.predict(X_train)

    r2_test = float(r2_score(y_test, y_pred_test))
    r2_train = float(r2_score(y_train, y_pred_train))
    mae_test = float(mean_absolute_error(y_test, y_pred_test))
    rmse_test = float(np.sqrt(mean_squared_error(y_test, y_pred_test)))

    print(f"\n==========================================")
    print(f" Model Performance Metrics")
    print(f"==========================================")
    print(f" Train R² Score : {r2_train:.4f}")
    print(f" Test R² Score  : {r2_test:.4f}")
    print(f" Test MAE       : ${mae_test:,.2f}")
    print(f" Test RMSE      : ${rmse_test:,.2f}")
    print(f"==========================================\n")

    # Extract feature importances
    onehot_encoder = full_pipeline.named_steps["preprocessor"].named_transformers_["cat"].named_steps["onehot"]
    cat_feature_names = list(onehot_encoder.get_feature_names_out(cat_cols))
    all_feature_names = all_num_cols + cat_feature_names

    importances = full_pipeline.named_steps["regressor"].feature_importances_
    feature_importance_dict = [
        {"feature": name, "importance": round(float(imp) * 100, 2)}
        for name, imp in sorted(zip(all_feature_names, importances), key=lambda x: x[1], reverse=True)
    ]

    # Save model artifact
    joblib.dump(full_pipeline, model_output_path)
    print(f"[SUCCESS] Model pipeline successfully saved to: {model_output_path}")

    # Dataset distribution stats for UI reference & sliders
    dataset_summary = {
        "metrics": {
            "r2_score": round(r2_test, 4),
            "r2_train": round(r2_train, 4),
            "mae": round(mae_test, 2),
            "rmse": round(rmse_test, 2),
            "samples_trained": len(X_train),
            "samples_tested": len(X_test),
        },
        "feature_importances": feature_importance_dict,
        "feature_ranges": {
            col: {
                "min": float(df[col].min()),
                "max": float(df[col].max()),
                "mean": round(float(df[col].mean()), 2),
                "median": round(float(df[col].median()), 2),
            }
            for col in base_num_cols
        },
        "ocean_proximity_categories": list(df["ocean_proximity"].unique()),
    }

    with open(metrics_output_path, "w", encoding="utf-8") as f:
        json.dump(dataset_summary, f, indent=2)
    print(f"[SUCCESS] Metadata and metrics saved to: {metrics_output_path}")

    return full_pipeline, dataset_summary


if __name__ == "__main__":
    train_model()
