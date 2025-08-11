import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';

interface ColumnSlicerProps {
  columnName: string;
  selectedValues: string[];
  onSelectionChange: (columnName: string, selectedValues: string[]) => void;
  onError: (error: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ColumnSlicer: React.FC<ColumnSlicerProps> = ({
  columnName,
  selectedValues,
  onSelectionChange,
  onError,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [availableValues, setAvailableValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadColumnValues();
  }, [columnName]);

  const loadColumnValues = async () => {
    setLoading(true);
    try {
      const response = await apiService.getColumnValues(columnName);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        setAvailableValues(response.data.values);
      }
    } catch (error) {
      onError(`Failed to load values for ${columnName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredValues = useMemo(() => {
    if (!searchTerm) return availableValues;
    return availableValues.filter(value => 
      value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableValues, searchTerm]);

  const handleValueToggle = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    onSelectionChange(columnName, newSelection);
  };

  const handleSelectAll = () => {
    const allFilteredValues = filteredValues;
    const newSelection = Array.from(new Set([...selectedValues, ...allFilteredValues]));
    onSelectionChange(columnName, newSelection);
  };

  const handleDeselectAll = () => {
    const newSelection = selectedValues.filter(v => !filteredValues.includes(v));
    onSelectionChange(columnName, newSelection);
  };

  const handleClearAll = () => {
    onSelectionChange(columnName, []);
  };

  const getDisplayText = () => {
    const totalSelected = selectedValues.length;
    const totalAvailable = availableValues.length;
    
    if (totalSelected === 0) {
      return 'All';
    } else if (totalSelected === totalAvailable) {
      return 'All';
    } else if (totalSelected === 1) {
      return selectedValues[0];
    } else {
      return `${totalSelected} selected`;
    }
  };

  const hasActiveFilter = selectedValues.length > 0 && selectedValues.length < availableValues.length;

  if (isCollapsed) {
    return (
      <div className="slicer-collapsed">
        <button 
          className="slicer-toggle-btn"
          onClick={onToggleCollapse}
        >
          🔽 Show Filters
        </button>
      </div>
    );
  }

  return (
    <div className="column-slicer">
      <div className="slicer-header">
        <div className="slicer-title">
          <span className="column-name">{columnName}</span>
          {hasActiveFilter && <span className="filter-indicator">●</span>}
        </div>
        <div className="slicer-controls">
          <button 
            className="slicer-dropdown-btn"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={loading}
          >
            <span className="selected-text">{getDisplayText()}</span>
            <span className="dropdown-arrow">{showDropdown ? '▲' : '▼'}</span>
          </button>
          {onToggleCollapse && (
            <button 
              className="collapse-btn"
              onClick={onToggleCollapse}
              title="Hide filters"
            >
              🔼
            </button>
          )}
        </div>
      </div>

      {showDropdown && (
        <div className="slicer-dropdown">
          <div className="slicer-search">
            <input
              type="text"
              placeholder={`Search in ${columnName}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="slicer-search-input"
            />
            {searchTerm && (
              <button 
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="slicer-actions">
            <button 
              className="action-btn select-all-btn"
              onClick={handleSelectAll}
              disabled={filteredValues.every(v => selectedValues.includes(v))}
            >
              Select All
            </button>
            <button 
              className="action-btn deselect-all-btn"
              onClick={handleDeselectAll}
              disabled={!filteredValues.some(v => selectedValues.includes(v))}
            >
              Deselect All
            </button>
            <button 
              className="action-btn clear-all-btn"
              onClick={handleClearAll}
              disabled={selectedValues.length === 0}
            >
              Clear
            </button>
          </div>

          {loading ? (
            <div className="slicer-loading">Loading values...</div>
          ) : (
            <div className="slicer-values">
              <div className="values-count">
                {filteredValues.length} of {availableValues.length} values
                {searchTerm && ` (filtered by "${searchTerm}")`}
              </div>
              <div className="values-list">
                {filteredValues.length === 0 ? (
                  <div className="no-values">No values found</div>
                ) : (
                  filteredValues.map((value, index) => (
                    <label key={index} className="value-item">
                      <input
                        type="checkbox"
                        checked={selectedValues.includes(value)}
                        onChange={() => handleValueToggle(value)}
                        className="value-checkbox"
                      />
                      <span className="value-text">{value}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {availableValues.length > 0 && (
            <div className="slicer-footer">
              <div className="selection-summary">
                {selectedValues.length === 0 
                  ? 'All values selected'
                  : selectedValues.length === availableValues.length
                  ? 'All values selected'
                  : `${selectedValues.length} of ${availableValues.length} selected`
                }
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ColumnSlicer;