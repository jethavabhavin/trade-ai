import numpy as np
import torch
from timesfm import TimesFM3Forecaster

def run_timesfm_test():
    # 1. Device configuration (GPU if available, fallback to CPU)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading TimesFM 3.0 on device: {device}...")

    # 2. Load TimesFM 3.0 model from Hugging Face checkpoint
    forecaster = TimesFM3Forecaster.from_pretrained(
        "google/timesfm-3.0-pytorch",
        device=device
    )
    print("TimesFM 3.0 loaded successfully!\n")

    # 3. Create sample time series context (e.g., 3 series of 128 past steps)
    context_len = 128
    horizon = 24  # Forecast next 24 steps
    target_series = np.sin(np.linspace(0, 8 * np.pi, context_len)).reshape(1, -1).astype(np.float32)

    print(f"Forecasting {horizon} steps into the future from context of length {context_len}...")

    # 4. Generate forecast
    output = forecaster.predict(
        context=target_series,
        horizon=horizon,
        return_quantiles=True
    )

    print(f"Point Forecast shape: {output.forecast.shape}")
    print("Sample predicted values:", np.round(output.forecast[0, :5], 4))
    if output.quantiles is not None:
        print(f"Quantiles shape: {output.quantiles.shape}")

if __name__ == "__main__":
    run_timesfm_test()
