import json
import os
import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, render_template, request

# Import FeatureEngineering so joblib can unpickle custom transformer seamlessly
from pipeline_utils import FeatureEngineering

app = Flask(__name__)

# Load model and metrics on startup
MODEL_PATH = "model.joblib"
METRICS_PATH = "model_metrics.json"

model = None
metrics_data = {}

if os.path.exists(MODEL_PATH):
    try:
        model = joblib.load(MODEL_PATH)
        print("[SUCCESS] Loaded model pipeline.")
    except Exception as e:
        print(f"[ERROR] Failed loading model: {e}")

if os.path.exists(METRICS_PATH):
    try:
        with open(METRICS_PATH, "r", encoding="utf-8") as f:
            metrics_data = json.load(f)
        print("[SUCCESS] Loaded model metrics.")
    except Exception as e:
        print(f"[ERROR] Failed loading metrics: {e}")

# Preset real estate profiles for instant exploration
PRESETS = [
    {
        "id": "sf_bay",
        "name": "San Francisco Bay Luxury",
        "tag": "High Valuation",
        "icon": "fa-building-columns",
        "data": {
            "longitude": -122.25,
            "latitude": 37.85,
            "housing_median_age": 42,
            "total_rooms": 2800,
            "total_bedrooms": 480,
            "population": 1150,
            "households": 460,
            "median_income": 8.35,
            "ocean_proximity": "NEAR BAY",
        },
    },
    {
        "id": "silicon_valley",
        "name": "Silicon Valley Executive Home",
        "tag": "Prime Tech Hub",
        "icon": "fa-microchip",
        "data": {
            "longitude": -122.08,
            "latitude": 37.38,
            "housing_median_age": 26,
            "total_rooms": 4200,
            "total_bedrooms": 680,
            "population": 1500,
            "households": 640,
            "median_income": 11.50,
            "ocean_proximity": "<1H OCEAN",
        },
    },
    {
        "id": "inland_family",
        "name": "Central Valley Family Residence",
        "tag": "Affordable Living",
        "icon": "fa-house-chimney-window",
        "data": {
            "longitude": -119.78,
            "latitude": 36.74,
            "housing_median_age": 20,
            "total_rooms": 2200,
            "total_bedrooms": 410,
            "population": 1100,
            "households": 390,
            "median_income": 3.45,
            "ocean_proximity": "INLAND",
        },
    },
    {
        "id": "socal_coast",
        "name": "Southern California Beachfront",
        "tag": "Oceanfront Vista",
        "icon": "fa-umbrella-beach",
        "data": {
            "longitude": -118.49,
            "latitude": 34.01,
            "housing_median_age": 32,
            "total_rooms": 3100,
            "total_bedrooms": 560,
            "population": 1280,
            "households": 520,
            "median_income": 9.20,
            "ocean_proximity": "NEAR OCEAN",
        },
    },
]


@app.route("/")
def index():
    return render_template("index.html", metrics=metrics_data, presets=PRESETS)


@app.route("/api/stats", methods=["GET"])
def get_stats():
    return jsonify(
        {
            "success": True,
            "metrics": metrics_data.get("metrics", {}),
            "feature_importances": metrics_data.get("feature_importances", []),
            "feature_ranges": metrics_data.get("feature_ranges", {}),
        }
    )


@app.route("/api/presets", methods=["GET"])
def get_presets():
    return jsonify({"success": True, "presets": PRESETS})


@app.route("/predict", methods=["POST"])
def predict():
    global model
    if model is None:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
        else:
            return jsonify({"success": False, "error": "Model has not been trained yet. Please run train.py."}), 500

    try:
        data = request.get_json() or request.form.to_dict()
        if not data:
            return jsonify({"success": False, "error": "No input payload provided."}), 400

        # Required fields and casting
        longitude = float(data.get("longitude", -122.25))
        latitude = float(data.get("latitude", 37.85))
        housing_median_age = float(data.get("housing_median_age", 30))
        total_rooms = float(data.get("total_rooms", 2000))
        total_bedrooms = float(data.get("total_bedrooms", 400))
        population = float(data.get("population", 1200))
        households = float(data.get("households", 400))
        median_income = float(data.get("median_income", 4.5))
        ocean_proximity = str(data.get("ocean_proximity", "<1H OCEAN")).strip()

        # Sanity validation
        if total_rooms <= 0 or total_bedrooms <= 0 or population <= 0 or households <= 0 or median_income <= 0:
            return jsonify({"success": False, "error": "All room, population, household, and income counts must be positive numbers."}), 400

        # Construct single-row DataFrame
        input_df = pd.DataFrame([{
            "longitude": longitude,
            "latitude": latitude,
            "housing_median_age": housing_median_age,
            "total_rooms": total_rooms,
            "total_bedrooms": total_bedrooms,
            "population": population,
            "households": households,
            "median_income": median_income,
            "ocean_proximity": ocean_proximity,
        }])

        # Perform prediction
        raw_pred = float(model.predict(input_df)[0])
        # California dataset cap is typically $500,001, but allow smooth bounding
        predicted_price = max(10000.0, raw_pred)

        # Derived engineering metrics for rich UI feedback
        rooms_per_household = round(total_rooms / households, 2)
        bedrooms_per_room = round(total_bedrooms / total_rooms, 3)
        population_per_household = round(population / households, 2)
        price_per_room = round(predicted_price / total_rooms, 2)
        actual_income_usd = round(median_income * 10000, 2)

        # Calculate estimated range based on model MAE (~$31.6k)
        mae = metrics_data.get("metrics", {}).get("mae", 31600)
        lower_bound = max(15000.0, predicted_price - mae)
        upper_bound = predicted_price + mae

        return jsonify({
            "success": True,
            "prediction": {
                "median_house_value": round(predicted_price, 2),
                "formatted_price": f"${predicted_price:,.0f}",
                "lower_bound": round(lower_bound, 2),
                "upper_bound": round(upper_bound, 2),
                "formatted_range": f"${lower_bound:,.0f} - ${upper_bound:,.0f}",
                "confidence_mae": f"±${mae:,.0f}",
                "price_per_room": f"${price_per_room:,.0f}",
                "median_income_usd": f"${actual_income_usd:,.0f}/yr",
            },
            "derived_metrics": {
                "rooms_per_household": rooms_per_household,
                "bedrooms_per_room": bedrooms_per_room,
                "population_per_household": population_per_household,
            },
            "inputs": {
                "longitude": longitude,
                "latitude": latitude,
                "housing_median_age": housing_median_age,
                "total_rooms": total_rooms,
                "total_bedrooms": total_bedrooms,
                "population": population,
                "households": households,
                "median_income": median_income,
                "ocean_proximity": ocean_proximity,
            }
        })

    except Exception as ex:
        return jsonify({"success": False, "error": str(ex)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
