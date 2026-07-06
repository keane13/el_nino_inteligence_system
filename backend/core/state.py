import pandas as pd
from features.data.data import (
    generate_complaints, generate_traffic, 
    generate_predictions, generate_recommendations, get_elnino_summary
)

# Initialize global state variables
_df: pd.DataFrame = generate_complaints(500)
_traffic = generate_traffic()
_predictions = generate_predictions(_df)
_recommendations = generate_recommendations(_df, _predictions)
_elnino_summary = get_elnino_summary()
