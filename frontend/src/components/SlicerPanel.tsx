import React, { useState } from 'react';
import ColumnSlicer from './ColumnSlicer';

export interface ColumnFilters {
  [columnName: string]: string[];
}

interface SlicerPanelProps {
  columns: string[];
  filters: ColumnFilters;
  onFiltersChange: (filters: ColumnFilters) => void;
  onError: (error: string) => void;
  totalRows?: number;
  filteredRows?: number;
}

const SlicerPanel: React.FC<SlicerPanelProps> = ({
  columns,
  filters,
  onFiltersChange,
  onError,
  totalRows,
  filteredRows
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set());

  const handleColumnFilterChange = (columnName: string, selectedValues: string[]) => {
    const newFilters = { ...filters };
    
    if (selectedValues.length === 0) {
      delete newFilters[columnName];
    } else {
      newFilters[columnName] = selectedValues;
    }
    
    onFiltersChange(newFilters);
  };

  const handleClearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;
  const activeFilterCount = Object.keys(filters).length;

  const toggleColumnExpanded = (columnName: string) => {
    const newExpanded = new Set(expandedColumns);
    if (newExpanded.has(columnName)) {
      newExpanded.delete(columnName);
    } else {
      newExpanded.add(columnName);
    }
    setExpandedColumns(newExpanded);
  };

  if (isCollapsed) {
    return (
      <div className="slicer-panel collapsed">
        <div className="slicer-panel-header">
          <button 
            className="panel-toggle-btn"
            onClick={() => setIsCollapsed(false)}
          >
            🔽 Show Filters {hasActiveFilters && `(${activeFilterCount} active)`}
          </button>
          {hasActiveFilters && (
            <div className="filter-summary">
              <span className="active-filters-count">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
              </span>
              {totalRows !== undefined && filteredRows !== undefined && (
                <span className="row-summary">
                  Showing {filteredRows.toLocaleString()} of {totalRows.toLocaleString()} rows
                </span>
              )}
              <button 
                className="clear-all-compact-btn"
                onClick={handleClearAllFilters}
                title="Clear all filters"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="slicer-panel">
      <div className="slicer-panel-header">
        <div className="panel-title">
          <h3>Column Filters</h3>
          {hasActiveFilters && (
            <span className="active-filters-badge">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div className="panel-controls">
          {totalRows !== undefined && filteredRows !== undefined && (
            <div className="row-count-display">
              <span className="filtered-count">{filteredRows.toLocaleString()}</span>
              <span className="total-count">/ {totalRows.toLocaleString()} rows</span>
            </div>
          )}
          <button 
            className="clear-all-btn"
            onClick={handleClearAllFilters}
            disabled={!hasActiveFilters}
          >
            Clear All
          </button>
          <button 
            className="panel-collapse-btn"
            onClick={() => setIsCollapsed(true)}
            title="Hide filters"
          >
            🔼
          </button>
        </div>
      </div>

      {columns.length === 0 ? (
        <div className="no-columns">
          <p>No columns available for filtering</p>
        </div>
      ) : (
        <div className="slicer-grid">
          {columns.map((columnName) => (
            <ColumnSlicer
              key={columnName}
              columnName={columnName}
              selectedValues={filters[columnName] || []}
              onSelectionChange={handleColumnFilterChange}
              onError={onError}
            />
          ))}
        </div>
      )}

      {hasActiveFilters && (
        <div className="active-filters-summary">
          <h4>Active Filters:</h4>
          <div className="filter-tags">
            {Object.entries(filters).map(([columnName, values]) => (
              <div key={columnName} className="filter-tag">
                <span className="filter-column">{columnName}:</span>
                <span className="filter-values">
                  {values.length === 1 
                    ? values[0] 
                    : `${values.length} values`
                  }
                </span>
                <button 
                  className="remove-filter-btn"
                  onClick={() => handleColumnFilterChange(columnName, [])}
                  title={`Remove ${columnName} filter`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlicerPanel;