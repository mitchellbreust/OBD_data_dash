import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import re

# --- Load CSV ---
filename = "21-October-2025_1.csv"  # change if needed
df = pd.read_csv(filename, header=None)

# --- First column is timestamp ---
df.rename(columns={0: "timestamp"}, inplace=True)
df["timestamp"] = pd.to_datetime(df["timestamp"])
df = df.set_index("timestamp")

# --- Split the rest of the columns dynamically ---
# Each other column looks like "Engine RPM=3088.75"
# We'll split column names and clean them.
clean_cols = {}

for col in df.columns[1:]:
    pass  # (safety placeholder — not used since data columns are all unnamed)

# Build a new clean DataFrame
clean_data = pd.DataFrame(index=df.index)

# Loop through every non-timestamp column
for col_idx in range(1, df.shape[1]):
    for i, row_val in enumerate(df.iloc[:, col_idx]):
        if pd.isna(row_val):
            continue
        # Split key=value
        parts = str(row_val).split("=")
        if len(parts) == 2:
            key, val = parts
            key = key.strip()
            # Extract number safely (handle decimals or negatives)
            match = re.search(r"[-+]?\d*\.?\d+", val)
            if match:
                num = float(match.group(0))
                if key not in clean_data.columns:
                    clean_data[key] = np.nan
                clean_data.at[df.index[i], key] = num

# --- Show summary stats ---
print("\n📊 Summary Statistics (min / max / mean):\n")
print(clean_data.describe().loc[["min", "max", "mean"]].T)

# --- Plot key metrics ---
if "Engine RPM" in clean_data.columns and "Vehicle Speed" in clean_data.columns:
    plt.figure(figsize=(10, 6))
    plt.plot(clean_data.index, clean_data["Engine RPM"], label="Engine RPM (rpm)", color="tab:red")
    plt.plot(clean_data.index, clean_data["Vehicle Speed"], label="Vehicle Speed (km/h)", color="tab:blue")
    plt.xlabel("Time")
    plt.ylabel("Value")
    plt.title("OBD-II Telemetry: RPM & Speed over Time")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.show()

# --- Optional subplots for all sensors ---
fig, axes = plt.subplots(len(clean_data.columns)//2 + 1, 2, figsize=(12, 12))
axes = axes.flatten()
for i, col in enumerate(clean_data.columns):
    axes[i].plot(clean_data.index, clean_data[col], label=col)
    axes[i].set_title(col)
    axes[i].legend()
    axes[i].grid(True)
plt.tight_layout()
plt.savefig("all_sensors_plot.png")     # ✅ save this one too
plt.close()
