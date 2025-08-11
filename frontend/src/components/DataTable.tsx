import React, { useState, useCallback, useEffect } from 'react';
import { apiService } from '../services/api';
import ExportButton from './ExportButton';
import SlicerPanel, { ColumnFilters } from './SlicerPanel';

interface DataTableProps {
  data: any[];
  columns: string[];
  totalRows: number;
  onError: (error: string) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data: initialData, columns, totalRows, onError }) => {
  const [data, setData] = useState(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ColumnFilters>({});
  const [filteredRows, setFilteredRows] = useState(totalRows);

  const totalPages = Math.ceil(filteredRows / pageSize);

  const loadPage = useCallback(async (page: number, size: number, currentFilters = filters) => {
    setLoading(true);
    try {
      const offset = (page - 1) * size;
      const response = await apiService.getFilteredData(size, offset, currentFilters);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        setData(response.data.data);
        setCurrentPage(page);
        setFilteredRows(response.data.filtered_rows);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [onError, filters]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      loadPage(page, pageSize);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    loadPage(1, size);
  };

  const handleFiltersChange = (newFilters: ColumnFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    loadPage(1, pageSize, newFilters);
  };

  // Load initial data when component mounts or filters change
  useEffect(() => {
    if (Object.keys(filters).length === 0) {
      // If no filters, use the initial data passed as props
      setData(initialData);
      setFilteredRows(totalRows);
    }
  }, [initialData, totalRows, filters]);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getPageNumbers = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleExport = async (format: 'csv' | 'excel', limit?: number) => {
    console.log('🟦 DataTable.handleExport called with:', { format, limit, filters });
    console.log('🟦 DataTable filters object:', JSON.stringify(filters));
    
    try {
      console.log('🟦 DataTable calling apiService export...');
      const result = format === 'csv' 
        ? await apiService.exportCSV(limit, 0, filters)
        : await apiService.exportExcel(limit, 0, filters);
      
      console.log('🟦 DataTable export result:', result);
      
      if (!result.success && result.error) {
        console.error('❌ DataTable export failed:', result.error);
        onError(`Export failed: ${result.error}`);
      } else {
        console.log('🟢 DataTable export completed successfully');
      }
    } catch (error) {
      console.error('❌ DataTable export threw error:', error);
      onError(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="data-table-container">
      <div className="data-summary">
        <div className="summary-header">
          <div>
            <h2>Data Preview</h2>
            <div className="summary-stats">
              <span>Total Rows: <strong>{totalRows.toLocaleString()}</strong></span>
              {filteredRows !== totalRows && (
                <span>Filtered Rows: <strong>{filteredRows.toLocaleString()}</strong></span>
              )}
              <span>Columns: <strong>{columns.length}</strong></span>
              <span>Showing: <strong>{((currentPage - 1) * pageSize + 1).toLocaleString()} - {Math.min(currentPage * pageSize, filteredRows).toLocaleString()}</strong></span>
            </div>
          </div>
          <div className="export-section">
            <ExportButton 
              totalRows={filteredRows}
              onExport={handleExport}
            />
          </div>
        </div>
      </div>

      <SlicerPanel 
        columns={columns}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onError={onError}
        totalRows={totalRows}
        filteredRows={filteredRows}
      />

      <div className="table-controls">
        <div className="page-size-selector">
          <label>Rows per page:</label>
          <select value={pageSize} onChange={(e) => handlePageSizeChange(Number(e.target.value))}>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading data...</div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th key={index}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <td key={colIndex}>{formatValue(row[column])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button 
          onClick={() => handlePageChange(1)} 
          disabled={currentPage === 1}
          className="page-btn"
        >
          First
        </button>
        <button 
          onClick={() => handlePageChange(currentPage - 1)} 
          disabled={currentPage === 1}
          className="page-btn"
        >
          Previous
        </button>
        
        <div className="page-numbers">
          {getPageNumbers().map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`page-btn ${page === currentPage ? 'active' : ''}`}
            >
              {page}
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => handlePageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
          className="page-btn"
        >
          Next
        </button>
        <button 
          onClick={() => handlePageChange(totalPages)} 
          disabled={currentPage === totalPages}
          className="page-btn"
        >
          Last
        </button>
      </div>
    </div>
  );
};

export default DataTable;