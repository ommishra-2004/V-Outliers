"""
Phase 1 Data Audit Script - EV ChargePoint Intelligence
Inspects all datasets and produces detailed audit findings.
"""
import pandas as pd
import numpy as np
import json
import os

pd.set_option('display.max_columns', None)
pd.set_option('display.width', 200)
pd.set_option('display.max_rows', 50)

BASE = r"D:\Vidhi\Hackathons\VOutliers\EV page\datasets"

# ─────────────────────────────────────────────
# 1. VAHAN Monthly EV Registrations
# ─────────────────────────────────────────────
print("=" * 70)
print("1. VAHAN Monthly EV Registrations")
print("=" * 70)
f1 = os.path.join(BASE, "India_RTO_Monthly_EV_Registrations.xlsx")

xl = pd.ExcelFile(f1)
print(f"Sheet names: {xl.sheet_names}")
df1 = xl.parse(xl.sheet_names[0])
print(f"Shape: {df1.shape}")
print(f"\nColumns ({len(df1.columns)}):")
for c in df1.columns:
    print(f"  '{c}' -> dtype={df1[c].dtype}, nulls={df1[c].isnull().sum()}, unique={df1[c].nunique()}")
print(f"\nFirst 5 rows:\n{df1.head()}")
print(f"\nLast 5 rows:\n{df1.tail()}")

# Identify state/rto/year cols
print("\n--- Value samples per column ---")
for c in df1.columns:
    vals = df1[c].dropna().unique()
    print(f"  '{c}': {vals[:8]} ... (total unique: {len(vals)})")

# Duplicates
dup_cols = [c for c in df1.columns if c != df1.columns[-1]]
dups = df1.duplicated(subset=dup_cols).sum()
print(f"\nDuplicate rows (all cols): {df1.duplicated().sum()}")

# Numeric columns - registration counts
num_cols = df1.select_dtypes(include=[np.number]).columns.tolist()
print(f"\nNumeric columns: {num_cols}")
if num_cols:
    print(df1[num_cols].describe())
    neg = (df1[num_cols] < 0).sum()
    print(f"Negative values per col:\n{neg}")

print("\n\n" + "=" * 70)
print("2. EV Charging Stations")
print("=" * 70)
f2 = os.path.join(BASE, "India_EV_charge_station.xlsx")
xl2 = pd.ExcelFile(f2)
print(f"Sheet names: {xl2.sheet_names}")
for sheet in xl2.sheet_names:
    df2 = xl2.parse(sheet)
    print(f"\n  --- Sheet: '{sheet}' ---")
    print(f"  Shape: {df2.shape}")
    print(f"  Columns: {list(df2.columns)}")
    for c in df2.columns:
        vals = df2[c].dropna().unique()
        print(f"    '{c}': dtype={df2[c].dtype}, nulls={df2[c].isnull().sum()}, unique={df2[c].nunique()}, samples={vals[:5]}")
    print(f"  First 3 rows:\n{df2.head(3)}")
    if df2.shape[0] > 0:
        print(f"  Duplicates: {df2.duplicated().sum()}")

print("\n\n" + "=" * 70)
print("3. Land Cost")
print("=" * 70)
f3 = os.path.join(BASE, "India_City_Land_Costs_Only.csv")
df3 = pd.read_csv(f3)
print(f"Shape: {df3.shape}")
print(f"Columns: {list(df3.columns)}")
print(f"\nAll data:\n{df3.to_string()}")
print(f"\nDtypes:\n{df3.dtypes}")
print(f"Nulls:\n{df3.isnull().sum()}")
print(f"Duplicates: {df3.duplicated().sum()}")
for c in df3.columns:
    vals = df3[c].dropna().unique()
    print(f"  '{c}': unique={len(vals)}, samples={vals[:10]}")
