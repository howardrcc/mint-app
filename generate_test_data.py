#!/usr/bin/env python3
"""
Generate test data for Mint Analytics application.
Creates large datasets in Parquet format for performance testing.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import argparse
import os
from pathlib import Path

def generate_sales_data(num_rows: int = 1000000) -> pd.DataFrame:
    """Generate realistic sales transaction data."""
    np.random.seed(42)  # For reproducible results
    
    # Generate date range
    start_date = datetime(2020, 1, 1)
    end_date = datetime(2024, 12, 31)
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Product categories and names
    categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Beauty', 'Automotive']
    products = {
        'Electronics': ['Laptop', 'Smartphone', 'Tablet', 'Headphones', 'Monitor'],
        'Clothing': ['T-Shirt', 'Jeans', 'Dress', 'Jacket', 'Shoes'],
        'Books': ['Fiction', 'Non-Fiction', 'Textbook', 'Magazine', 'Comic'],
        'Home & Garden': ['Furniture', 'Tools', 'Plants', 'Decor', 'Appliances'],
        'Sports': ['Equipment', 'Apparel', 'Footwear', 'Accessories', 'Supplements'],
        'Beauty': ['Skincare', 'Makeup', 'Fragrance', 'Hair Care', 'Tools'],
        'Automotive': ['Parts', 'Accessories', 'Fluids', 'Tools', 'Electronics']
    }
    
    # Generate random data
    data = {
        'transaction_id': [f'TXN_{i:08d}' for i in range(1, num_rows + 1)],
        'date': np.random.choice(date_range, num_rows),
        'customer_id': np.random.randint(1, 100000, num_rows),
        'category': np.random.choice(categories, num_rows),
        'quantity': np.random.randint(1, 10, num_rows),
        'unit_price': np.round(np.random.uniform(5.99, 999.99, num_rows), 2),
        'discount_percent': np.random.choice([0, 5, 10, 15, 20, 25], num_rows, p=[0.4, 0.2, 0.15, 0.15, 0.05, 0.05]),
        'region': np.random.choice(['North', 'South', 'East', 'West', 'Central'], num_rows),
        'sales_rep_id': np.random.randint(1, 1000, num_rows),
    }
    
    df = pd.DataFrame(data)
    
    # Add product names based on category
    df['product_name'] = df['category'].apply(lambda x: np.random.choice(products[x]))
    
    # Calculate derived fields
    df['subtotal'] = df['quantity'] * df['unit_price']
    df['discount_amount'] = df['subtotal'] * (df['discount_percent'] / 100)
    df['total_amount'] = df['subtotal'] - df['discount_amount']
    
    # Add some seasonal patterns
    df['month'] = df['date'].dt.month
    df['quarter'] = df['date'].dt.quarter
    df['year'] = df['date'].dt.year
    df['day_of_week'] = df['date'].dt.dayofweek
    
    return df

def generate_user_activity_data(num_rows: int = 1000000) -> pd.DataFrame:
    """Generate user activity/session data."""
    np.random.seed(123)
    
    # Generate timestamp range
    start_time = datetime(2023, 1, 1)
    end_time = datetime(2024, 12, 31)
    
    data = {
        'session_id': [f'SES_{i:010d}' for i in range(1, num_rows + 1)],
        'user_id': np.random.randint(1, 50000, num_rows),
        'timestamp': pd.to_datetime(np.random.randint(
            start_time.timestamp(), 
            end_time.timestamp(), 
            num_rows
        ), unit='s'),
        'page_views': np.random.randint(1, 50, num_rows),
        'session_duration_minutes': np.random.exponential(15, num_rows).astype(int),
        'device_type': np.random.choice(['desktop', 'mobile', 'tablet'], num_rows, p=[0.5, 0.4, 0.1]),
        'browser': np.random.choice(['Chrome', 'Firefox', 'Safari', 'Edge'], num_rows, p=[0.6, 0.2, 0.15, 0.05]),
        'country': np.random.choice(['US', 'UK', 'CA', 'DE', 'FR', 'JP', 'AU'], num_rows),
        'bounce_rate': np.random.uniform(0, 1, num_rows),
        'conversion': np.random.choice([0, 1], num_rows, p=[0.97, 0.03]),
    }
    
    df = pd.DataFrame(data)
    
    # Add derived metrics
    df['pages_per_minute'] = np.where(df['session_duration_minutes'] > 0, 
                                     df['page_views'] / df['session_duration_minutes'], 0)
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    
    return df

def generate_financial_data(num_rows: int = 1000000) -> pd.DataFrame:
    """Generate financial time series data."""
    np.random.seed(456)
    
    # Generate daily data
    start_date = datetime(2020, 1, 1)
    dates = pd.date_range(start=start_date, periods=min(num_rows, 1826), freq='D')  # ~5 years max
    
    # If we need more rows, create multiple assets
    assets = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NFLX', 'NVDA']
    
    data_list = []
    rows_per_asset = max(1, num_rows // len(assets))
    
    for asset in assets:
        if len(data_list) * rows_per_asset >= num_rows:
            break
            
        # Generate price data with random walk
        initial_price = np.random.uniform(50, 500)
        price_changes = np.random.normal(0, 0.02, len(dates))  # 2% daily volatility
        prices = [initial_price]
        
        for change in price_changes[1:]:
            prices.append(prices[-1] * (1 + change))
        
        volumes = np.random.lognormal(15, 1, len(dates)).astype(int)
        
        asset_data = {
            'date': dates,
            'symbol': asset,
            'open_price': prices,
            'high_price': [p * np.random.uniform(1.0, 1.05) for p in prices],
            'low_price': [p * np.random.uniform(0.95, 1.0) for p in prices],
            'close_price': prices,
            'volume': volumes,
            'market_cap': np.array(prices) * volumes * np.random.uniform(0.8, 1.2, len(dates)),
        }
        
        df_asset = pd.DataFrame(asset_data)
        df_asset['daily_return'] = df_asset['close_price'].pct_change()
        df_asset['volatility'] = df_asset['daily_return'].rolling(30).std()
        
        data_list.append(df_asset)
    
    df = pd.concat(data_list, ignore_index=True)
    return df.head(num_rows)

def main():
    parser = argparse.ArgumentParser(description='Generate test data for Mint Analytics')
    parser.add_argument('--type', choices=['sales', 'activity', 'financial'], 
                       default='sales', help='Type of data to generate')
    parser.add_argument('--rows', type=int, default=1000000, 
                       help='Number of rows to generate')
    parser.add_argument('--output', type=str, 
                       help='Output file path (default: data/{type}_data.parquet)')
    
    args = parser.parse_args()
    
    # Create data directory if it doesn't exist
    data_dir = Path('data')
    data_dir.mkdir(exist_ok=True)
    
    # Set default output path if not provided
    if args.output is None:
        args.output = data_dir / f'{args.type}_data.parquet'
    
    print(f"Generating {args.rows:,} rows of {args.type} data...")
    
    # Generate data based on type
    if args.type == 'sales':
        df = generate_sales_data(args.rows)
    elif args.type == 'activity':
        df = generate_user_activity_data(args.rows)
    elif args.type == 'financial':
        df = generate_financial_data(args.rows)
    
    print(f"Data shape: {df.shape}")
    print(f"Memory usage: {df.memory_usage(deep=True).sum() / 1024**2:.1f} MB")
    
    # Write to Parquet
    print(f"Writing to {args.output}...")
    df.to_parquet(args.output, compression='snappy', index=False)
    
    # Show file size
    file_size = os.path.getsize(args.output) / 1024**2
    print(f"File size: {file_size:.1f} MB")
    
    # Display sample data
    print("\nSample data:")
    print(df.head())
    print(f"\nData types:")
    print(df.dtypes)

if __name__ == '__main__':
    main()