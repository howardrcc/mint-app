from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import duckdb
import os
from typing import Dict, Any, Optional
import json

app = FastAPI(title="Mint Analytics API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global DuckDB connection
conn = None

@app.on_event("startup")
async def startup_event():
    global conn
    conn = duckdb.connect(":memory:")
    print("DuckDB connection initialized")

@app.on_event("shutdown")
async def shutdown_event():
    global conn
    if conn:
        conn.close()

@app.get("/")
async def root():
    return {"message": "Mint Analytics API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/load-parquet")
async def load_parquet(file_path: str):
    """Load a Parquet file into DuckDB"""
    global conn
    try:
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        conn.execute(f"CREATE OR REPLACE TABLE data AS SELECT * FROM '{file_path}'")
        row_count = conn.execute("SELECT COUNT(*) FROM data").fetchone()[0]
        
        return {"message": "Parquet file loaded successfully", "rows": row_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/data")
async def get_data(limit: int = 1000, offset: int = 0):
    """Get paginated data from the loaded table"""
    global conn
    try:
        result = conn.execute(f"SELECT * FROM data LIMIT {limit} OFFSET {offset}").fetchall()
        columns = [desc[0] for desc in conn.description]
        
        return {
            "data": [dict(zip(columns, row)) for row in result],
            "columns": columns,
            "total_rows": conn.execute("SELECT COUNT(*) FROM data").fetchone()[0]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)