# 🏠 CaliValuate AI - California House Price Prediction Web App

An end-to-end Machine Learning web application that predicts California median house prices with an interactive real estate valuation dashboard powered by Scikit-Learn and Flask.

---

## 🌟 Key Features

- **Machine Learning Pipeline**: Trained on the California Housing Census dataset with Scikit-Learn Random Forest regression ($R^2 \approx 82.4\%$, MAE $\approx \$31.6\text{k}$).
- **Automated Feature Engineering**: Calculates real estate domain ratios including rooms per household, bedrooms per room, and population density.
- **Interactive California Map**: Built with Leaflet.js allowing users to click anywhere on the state map or drag a pin to update GPS coordinates.
- **Instant Location Presets**: One-click benchmark exploration for *San Francisco Bay Area*, *Silicon Valley Tech Hub*, *Central Valley Family Home*, and *Southern California Beachfront*.
- **Dynamic Valuation Cards**: Animated odometer price counters, confidence interval error bands ($\pm\text{MAE}$), price per room estimates, and feature importance diagnostics.
- **Glassmorphic Modern UI**: Responsive design with clean typography and dark mode styling.

---

## 📂 Project Structure

```text
├── housing.csv               # California Census Housing dataset
├── pipeline_utils.py         # Custom Scikit-Learn feature transformer
├── train.py                  # Model training, evaluation & export script
├── model.joblib              # Serialized ML model pipeline
├── model_metrics.json        # Test benchmarks & feature importance metadata
├── app.py                    # Flask web application & REST API
├── templates/
│   └── index.html            # Frontend user interface
├── static/
│   ├── css/
│   │   └── style.css         # Glassmorphism design system
│   └── js/
│       └── app.js            # Leaflet map & client logic
├── requirements.txt          # Python dependencies
└── README.md                 # Project documentation
```

---

## 🛠️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd "House price"
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. (Optional) Train or retrain the model
```bash
python train.py
```

### 4. Run the web application
```bash
python app.py
```

Open your browser at **`http://127.0.0.1:5000`**.

---

## 📊 Model Performance

| Metric | Test Set Value |
| :--- | :--- |
| **Model Algorithm** | `RandomForestRegressor` (180 trees, depth 26) |
| **$R^2$ Score** | **`0.8235` (82.4%)** |
| **Mean Absolute Error (MAE)** | **`$31,627.82`** |
| **Root Mean Squared Error (RMSE)** | **`$47,956.43`** |
| **Training Records** | 16,512 |
| **Holdout Test Set** | 4,128 |

---

## 📜 License
MIT License
