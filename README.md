# Mint Analytics - High-Performance Data Analytics Web Application

A high-performance web application for analyzing large datasets with Python/DuckDB backend and React/TypeScript frontend.

## Architecture

- **Backend**: FastAPI with DuckDB for high-performance data processing
- **Frontend**: React with TypeScript for responsive data visualization
- **Data**: Parquet file processing with memory-efficient operations
- **Deployment**: Docker containerized services

## Quick Start

1. **Start the application**:
   ```bash
   docker-compose up --build
   ```

2. **Access the services**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Development

### Backend Development
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `POST /load-parquet` - Load Parquet file into DuckDB
- `GET /data` - Get paginated data (supports limit and offset parameters)

## Features

- ✅ Memory-efficient Parquet file processing
- ✅ High-performance data querying with DuckDB
- ✅ Paginated API responses for large datasets
- 🚧 React data grid with virtualization
- 🚧 Excel export functionality
- 🚧 Performance benchmarking tools

## Data Directory

Place your Parquet files in the `./data` directory, which is mounted to `/data` in the backend container.