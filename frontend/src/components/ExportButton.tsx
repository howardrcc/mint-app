import React, { useState } from 'react';

interface ExportButtonProps {
  totalRows: number;
  onExport?: (format: 'csv' | 'excel', limit?: number) => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({ totalRows, onExport }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [exportLimit, setExportLimit] = useState<string>('all');
  const [customLimit, setCustomLimit] = useState<string>('');
  const [showWarning, setShowWarning] = useState(false);

  const EXCEL_MAX_ROWS = 1048575;

  const handleExport = (format: 'csv' | 'excel') => {
    console.log('🔵 ExportButton.handleExport called with:', { format, exportLimit, customLimit, totalRows });
    
    let limit: number | undefined;
    
    if (exportLimit === 'all') {
      limit = undefined;
    } else if (exportLimit === 'custom') {
      limit = parseInt(customLimit) || undefined;
    } else {
      limit = parseInt(exportLimit);
    }

    console.log('🔵 ExportButton calculated limit:', limit);

    // Show warning for Excel if exceeding limits
    if (format === 'excel' && totalRows > EXCEL_MAX_ROWS && (limit === undefined || limit > EXCEL_MAX_ROWS)) {
      console.log('🟡 ExportButton showing Excel warning');
      setShowWarning(true);
      return;
    }

    console.log('🔵 ExportButton calling onExport with:', { format, limit });
    console.log('🔵 ExportButton onExport function exists:', !!onExport);
    
    if (!onExport) {
      console.error('❌ ExportButton: onExport function is not provided!');
      return;
    }

    onExport(format, limit);
    setShowOptions(false);
    setShowWarning(false);
    
    console.log('🟢 ExportButton: onExport called successfully');
  };

  const getEffectiveRows = (): number => {
    let rows: number;
    
    if (exportLimit === 'all') {
      rows = totalRows;
    } else if (exportLimit === 'custom') {
      rows = Math.min(parseInt(customLimit) || totalRows, totalRows);
    } else {
      rows = Math.min(parseInt(exportLimit), totalRows);
    }

    return rows;
  };

  const willExceedExcelLimit = (): boolean => {
    return getEffectiveRows() > EXCEL_MAX_ROWS;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <div className="export-button-container">
      <button 
        className="export-btn"
        onClick={() => setShowOptions(!showOptions)}
      >
        📥 Export Data
      </button>

      {showOptions && (
        <div className="export-options">
          <div className="export-options-header">
            <h4>Export Options</h4>
            <button 
              className="close-btn"
              onClick={() => setShowOptions(false)}
            >
              ✕
            </button>
          </div>

          <div className="export-limit-section">
            <label>Number of rows to export:</label>
            <div className="limit-options">
              <label className="radio-option">
                <input
                  type="radio"
                  value="all"
                  checked={exportLimit === 'all'}
                  onChange={(e) => setExportLimit(e.target.value)}
                />
                All rows ({formatNumber(totalRows)})
              </label>
              
              <label className="radio-option">
                <input
                  type="radio"
                  value="10000"
                  checked={exportLimit === '10000'}
                  onChange={(e) => setExportLimit(e.target.value)}
                />
                10,000 rows
              </label>
              
              <label className="radio-option">
                <input
                  type="radio"
                  value="100000"
                  checked={exportLimit === '100000'}
                  onChange={(e) => setExportLimit(e.target.value)}
                />
                100,000 rows
              </label>
              
              <label className="radio-option">
                <input
                  type="radio"
                  value="1000000"
                  checked={exportLimit === '1000000'}
                  onChange={(e) => setExportLimit(e.target.value)}
                />
                1,000,000 rows
              </label>
              
              <label className="radio-option custom-option">
                <input
                  type="radio"
                  value="custom"
                  checked={exportLimit === 'custom'}
                  onChange={(e) => setExportLimit(e.target.value)}
                />
                Custom:
                <input
                  type="number"
                  value={customLimit}
                  onChange={(e) => setCustomLimit(e.target.value)}
                  placeholder="Enter limit"
                  min="1"
                  max={totalRows}
                  disabled={exportLimit !== 'custom'}
                  className="custom-limit-input"
                />
              </label>
            </div>
          </div>

          {willExceedExcelLimit() && (
            <div className="excel-warning">
              ⚠️ <strong>Excel Limitation Warning:</strong><br/>
              Excel has a maximum limit of {formatNumber(EXCEL_MAX_ROWS)} rows.
              Your selection ({formatNumber(getEffectiveRows())} rows) exceeds this limit.
              Excel export will be truncated to {formatNumber(EXCEL_MAX_ROWS)} rows.
              <br/>
              <em>Consider using CSV format for large datasets.</em>
            </div>
          )}

          <div className="export-format-buttons">
            <button 
              className="csv-btn"
              onClick={() => handleExport('csv')}
            >
              📄 Export as CSV
            </button>
            <button 
              className="excel-btn"
              onClick={() => handleExport('excel')}
            >
              📊 Export as Excel
            </button>
          </div>

          <div className="export-info">
            <p><strong>Will export:</strong> {formatNumber(getEffectiveRows())} rows</p>
            {willExceedExcelLimit() && (
              <p className="excel-limit-note">
                <strong>Excel limit:</strong> {formatNumber(EXCEL_MAX_ROWS)} rows max
              </p>
            )}
          </div>
        </div>
      )}

      {showWarning && (
        <div className="warning-modal">
          <div className="warning-content">
            <h3>⚠️ Excel Row Limit Exceeded</h3>
            <p>
              You're trying to export {formatNumber(totalRows)} rows, but Excel can only handle 
              a maximum of {formatNumber(EXCEL_MAX_ROWS)} rows.
            </p>
            <p>
              <strong>Options:</strong>
            </p>
            <ul>
              <li>Export {formatNumber(EXCEL_MAX_ROWS)} rows to Excel (truncated)</li>
              <li>Use CSV format (no row limit)</li>
              <li>Cancel and adjust export settings</li>
            </ul>
            <div className="warning-buttons">
              <button 
                className="csv-btn"
                onClick={() => handleExport('csv')}
              >
                📄 Export Full Data as CSV
              </button>
              <button 
                className="excel-btn"
                onClick={() => {
                  onExport?.('excel', EXCEL_MAX_ROWS);
                  setShowWarning(false);
                  setShowOptions(false);
                }}
              >
                📊 Export {formatNumber(EXCEL_MAX_ROWS)} rows as Excel
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setShowWarning(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;