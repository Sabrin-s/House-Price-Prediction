from sklearn.base import BaseEstimator, TransformerMixin

class FeatureEngineering(BaseEstimator, TransformerMixin):
    """Custom transformer to engineer domain-specific California real estate features."""
    def __init__(self):
        pass

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X_df = X.copy()
        eps = 1e-6
        X_df["rooms_per_household"] = X_df["total_rooms"] / (X_df["households"] + eps)
        X_df["bedrooms_per_room"] = X_df["total_bedrooms"] / (X_df["total_rooms"] + eps)
        X_df["population_per_household"] = X_df["population"] / (X_df["households"] + eps)
        return X_df
