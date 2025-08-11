import React, { useState, useEffect } from 'react';
import { apiService, ParquetFile } from '../services/api';

interface FileBrowserProps {
  onFileSelect: (filePath: string) => void;
  onError: (error: string) => void;
}

const FileBrowser: React.FC<FileBrowserProps> = ({ onFileSelect, onError }) => {
  const [files, setFiles] = useState<ParquetFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await apiService.getParquetFiles();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        setFiles(response.data.files);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const handleFileSelect = (file: ParquetFile) => {
    setSelectedFile(file.path);
    onFileSelect(file.path);
  };

  return (
    <div className="file-browser">
      <div className="file-browser-header">
        <h3>Available Parquet Files</h3>
        <button onClick={loadFiles} className="refresh-btn" disabled={loading}>
          {loading ? '🔄' : '🔄'} Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-files">
          <p>Loading files...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="no-files">
          <p>No Parquet files found in the data directory.</p>
          <p className="hint">💡 Generate some test data with: <code>python generate_test_data.py</code></p>
        </div>
      ) : (
        <div className="file-list">
          {files.map((file, index) => (
            <div
              key={index}
              className={`file-item ${selectedFile === file.path ? 'selected' : ''}`}
              onClick={() => handleFileSelect(file)}
            >
              <div className="file-info">
                <div className="file-name">📄 {file.name}</div>
                <div className="file-details">
                  <span className="file-size">{formatFileSize(file.size)}</span>
                  <span className="file-date">{formatDate(file.modified)}</span>
                </div>
                <div className="file-path">{file.relative_path}</div>
              </div>
              <div className="file-actions">
                <button
                  className="load-file-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileSelect(file);
                  }}
                >
                  Load
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileBrowser;