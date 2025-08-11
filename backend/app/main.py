import csv
import io
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import duckdb
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

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

@app.get("/files/parquet")
async def list_parquet_files():
    """List all Parquet files in the data directory"""
    try:
        # Get data directory path
        data_dir = os.environ.get("PARQUET_DATA_DIR", "data")
        if not os.path.exists(data_dir):
            return {"files": []}
        
        # Find all .parquet files
        parquet_files = []
        for file_path in Path(data_dir).rglob("*.parquet"):
            file_info = {
                "name": file_path.name,
                "path": str(file_path),
                "relative_path": str(file_path.relative_to(data_dir)),
                "size": file_path.stat().st_size,
                "modified": file_path.stat().st_mtime
            }
            parquet_files.append(file_info)
        
        # Sort by modification time (newest first)
        parquet_files.sort(key=lambda x: x["modified"], reverse=True)
        
        return {"files": parquet_files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@app.get("/export/csv")
async def export_csv(limit: Optional[int] = None, offset: int = 0, filters: str = ""):
    """Export data to CSV format with optional filters"""
    global conn
    try:
        # Base query
        base_query = "SELECT * FROM data"
        count_query = "SELECT COUNT(*) FROM data"
        
        # Parse filters if provided (JSON string)
        where_conditions = []
        if filters:
            try:
                import json
                filters_dict = json.loads(filters)
                
                for column, values in filters_dict.items():
                    if values and isinstance(values, list):
                        # Escape and quote values for SQL
                        escaped_values = [f"'{str(v).replace(chr(39), chr(39)+chr(39))}'" for v in values]
                        values_str = ", ".join(escaped_values)
                        where_conditions.append(f'"{column}" IN ({values_str})')
                        
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid filters format")
        
        # Add WHERE clause if filters exist
        if where_conditions:
            where_clause = " WHERE " + " AND ".join(where_conditions)
            base_query += where_clause
            count_query += where_clause
        
        # Get total row count with filters
        total_rows = conn.execute(count_query).fetchone()[0]
        
        if total_rows == 0:
            raise HTTPException(status_code=404, detail="No data to export")
        
        # Apply limit if specified, otherwise export all filtered data
        if limit is None:
            query = f"{base_query} OFFSET {offset}"
            export_rows = total_rows - offset
        else:
            query = f"{base_query} LIMIT {limit} OFFSET {offset}"
            export_rows = min(limit, total_rows - offset)
        
        # Execute query and get results
        result = conn.execute(query).fetchall()
        columns = [desc[0] for desc in conn.description]
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow(columns)
        
        # Write data rows
        for row in result:
            writer.writerow(row)
        
        output.seek(0)
        
        # Create streaming response
        response = StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=data_export_{export_rows}_rows.csv"
            }
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/export/excel")
async def export_excel(limit: Optional[int] = None, offset: int = 0, filters: str = ""):
    """Export data to Excel format with row limit warnings and optional filters"""
    global conn
    try:
        # Base query
        base_query = "SELECT * FROM data"
        count_query = "SELECT COUNT(*) FROM data"
        
        # Parse filters if provided (JSON string)
        where_conditions = []
        if filters:
            try:
                import json
                filters_dict = json.loads(filters)
                
                for column, values in filters_dict.items():
                    if values and isinstance(values, list):
                        # Escape and quote values for SQL
                        escaped_values = [f"'{str(v).replace(chr(39), chr(39)+chr(39))}'" for v in values]
                        values_str = ", ".join(escaped_values)
                        where_conditions.append(f'"{column}" IN ({values_str})')
                        
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid filters format")
        
        # Add WHERE clause if filters exist
        if where_conditions:
            where_clause = " WHERE " + " AND ".join(where_conditions)
            base_query += where_clause
            count_query += where_clause
        
        # Get total row count with filters
        total_rows = conn.execute(count_query).fetchone()[0]
        
        if total_rows == 0:
            raise HTTPException(status_code=404, detail="No data to export")
        
        # Excel has a maximum of 1,048,576 rows (including header)
        EXCEL_MAX_ROWS = 1048575  # Minus 1 for header
        
        # Apply limit if specified, otherwise use Excel limit
        if limit is None:
            export_rows = min(total_rows - offset, EXCEL_MAX_ROWS)
        else:
            export_rows = min(limit, total_rows - offset, EXCEL_MAX_ROWS)
        
        query = f"{base_query} LIMIT {export_rows} OFFSET {offset}"
        
        # Execute query and get results
        result = conn.execute(query).fetchall()
        columns = [desc[0] for desc in conn.description]
        
        # Create Excel file in memory using xlsxwriter
        output = io.BytesIO()
        
        try:
            import xlsxwriter
            
            workbook = xlsxwriter.Workbook(output, {'in_memory': True})
            worksheet = workbook.add_worksheet('Data')
            
            # Add header format
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#D7E4BC',
                'border': 1
            })
            
            # Write headers
            for col, header in enumerate(columns):
                worksheet.write(0, col, header, header_format)
            
            # Write data rows
            for row_idx, row_data in enumerate(result, 1):
                for col_idx, cell_value in enumerate(row_data):
                    # Handle None values
                    if cell_value is None:
                        cell_value = ''
                    worksheet.write(row_idx, col_idx, cell_value)
            
            # Auto-adjust column widths (limited to prevent very wide columns)
            for col, header in enumerate(columns):
                max_width = min(len(str(header)) + 2, 50)  # Max width of 50 characters
                worksheet.set_column(col, col, max_width)
            
            workbook.close()
            
        except ImportError:
            raise HTTPException(
                status_code=500, 
                detail="xlsxwriter package not available. Please install with: pip install xlsxwriter"
            )
        
        output.seek(0)
        
        # Create streaming response
        filename = f"data_export_{export_rows}_rows.xlsx"
        response = StreamingResponse(
            io.BytesIO(output.read()),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/data/columns/{column_name}/values")
async def get_column_values(column_name: str):
    """Get unique values for a specific column"""
    global conn
    try:
        # Check if table exists and has data
        total_rows = conn.execute("SELECT COUNT(*) FROM data").fetchone()[0]
        
        if total_rows == 0:
            raise HTTPException(status_code=404, detail="No data loaded")
        
        # Get column names to validate
        columns_result = conn.execute("PRAGMA table_info(data)").fetchall()
        column_names = [row[1] for row in columns_result]
        
        if column_name not in column_names:
            raise HTTPException(status_code=404, detail=f"Column '{column_name}' not found")
        
        # Get unique values for the column, excluding NULL values, ordered
        query = f"""
        SELECT DISTINCT "{column_name}" 
        FROM data 
        WHERE "{column_name}" IS NOT NULL 
        ORDER BY "{column_name}"
        """
        
        result = conn.execute(query).fetchall()
        unique_values = [str(row[0]) if row[0] is not None else '' for row in result]
        
        return {
            "column": column_name,
            "values": unique_values,
            "count": len(unique_values)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/data/filtered")
async def get_filtered_data(limit: int = 1000, offset: int = 0, filters: str = ""):
    """Get paginated data with column filters applied"""
    global conn
    try:
        # Base query
        base_query = "SELECT * FROM data"
        count_query = "SELECT COUNT(*) FROM data"
        
        # Parse filters if provided (JSON string)
        where_conditions = []
        if filters:
            try:
                import json
                filters_dict = json.loads(filters)
                
                for column, values in filters_dict.items():
                    if values and isinstance(values, list):
                        # Escape and quote values for SQL
                        escaped_values = [f"'{str(v).replace(chr(39), chr(39)+chr(39))}'" for v in values]
                        values_str = ", ".join(escaped_values)
                        where_conditions.append(f'"{column}" IN ({values_str})')
                        
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid filters format")
        
        # Add WHERE clause if filters exist
        if where_conditions:
            where_clause = " WHERE " + " AND ".join(where_conditions)
            base_query += where_clause
            count_query += where_clause
        
        # Get total count with filters
        total_rows = conn.execute(count_query).fetchone()[0]
        
        # Add pagination
        query = f"{base_query} LIMIT {limit} OFFSET {offset}"
        
        # Execute query
        result = conn.execute(query).fetchall()
        columns = [desc[0] for desc in conn.description]
        
        return {
            "data": [dict(zip(columns, row)) for row in result],
            "columns": columns,
            "total_rows": total_rows,
            "filtered_rows": total_rows,
            "filters_applied": bool(filters)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)