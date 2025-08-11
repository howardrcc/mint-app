import React, { useState } from 'react';
import { apiService } from '../services/api';
import FileBrowser from './FileBrowser';

interface FileUploadProps {
  onDataLoaded: (data: any) => void;
  onError: (error: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onError, onLoadingChange }) => {
  const [filePath, setFilePath] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'browser' | 'manual'>('browser');

  const handleLoadFile = async (path?: string) => {
    const targetPath = path || filePath.trim();
    
    if (!targetPath) {
      onError('Please select or enter a file path');
      return;
    }

    onLoadingChange(true);
    
    try {
      // First load the parquet file
      const loadResponse = await apiService.loadParquet(targetPath);
      
      if (loadResponse.error) {
        throw new Error(loadResponse.error);
      }

      // Then fetch the first batch of data
      const dataResponse = await apiService.getData(1000, 0);
      
      if (dataResponse.error) {
        throw new Error(dataResponse.error);
      }

      if (dataResponse.data) {
        onDataLoaded(dataResponse.data);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      onLoadingChange(false);
    }
  };

  const handleFileSelect = (selectedPath: string) => {
    setFilePath(selectedPath);
    handleLoadFile(selectedPath);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLoadFile();
    }
  };

  return (
    <div className="file-upload-section">
      <h2>Load Parquet File</h2>
      
      <div className="tab-controls">
        <button 
          className={`tab-btn ${activeTab === 'browser' ? 'active' : ''}`}
          onClick={() => setActiveTab('browser')}
        >
          📁 Browse Files
        </button>
        <button 
          className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          ✏️ Manual Path
        </button>
      </div>

      {activeTab === 'browser' ? (
        <FileBrowser 
          onFileSelect={handleFileSelect}
          onError={onError}
        />
      ) : (
        <div className="manual-input">
          <div className="file-input-group">
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter file path (e.g., data/sales_data.parquet)"
              className="file-input"
            />
            <button onClick={() => handleLoadFile()} className="load-btn">
              Load Data
            </button>
          </div>

          <div className="help-text">
            <p>💡 <strong>Tip:</strong> Make sure your Parquet files are in the <code>data/</code> directory</p>
            <p>🚀 Generate test data with: <code>python generate_test_data.py</code></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;