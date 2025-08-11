# Test Data Directory

This directory contains Parquet files for testing the Mint Analytics application.

## Generate Test Data

Use the `generate_test_data.py` script to create sample datasets:

```bash
# Generate 1M sales records (default)
python generate_test_data.py

# Generate different data types
python generate_test_data.py --type sales --rows 1000000
python generate_test_data.py --type activity --rows 500000
python generate_test_data.py --type financial --rows 100000

# Specify custom output path
python generate_test_data.py --type sales --rows 2000000 --output data/large_sales.parquet
```

## Data Types

### Sales Data (`sales_data.parquet`)
- Transaction records with customer info, products, pricing
- Includes derived fields like totals, discounts
- Realistic seasonal patterns

### User Activity Data (`activity_data.parquet`) 
- Web session data with page views, duration
- Device, browser, and geographic information
- Conversion and bounce rate metrics

### Financial Data (`financial_data.parquet`)
- Stock price time series for multiple assets
- OHLCV data with volume and market cap
- Daily returns and volatility calculations

## File Sizes
- 1M rows ≈ 50-100 MB compressed Parquet
- Memory usage during processing ≈ 200-400 MB