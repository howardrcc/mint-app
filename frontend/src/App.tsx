import React, { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import ApiStatus from './components/ApiStatus';

interface DataResponse {
  data: any[];
  columns: string[];
  total_rows: number;
}

function App() {
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDataLoaded = (response: DataResponse) => {
    setData(response);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setData(null);
  };

  const clearData = () => {
    setData(null);
    setError(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌿 Mint Analytics</h1>
        <p>High-performance data analytics with DuckDB</p>
      </header>

      <main className="App-main">
        <ApiStatus />
        
        <FileUpload 
          onDataLoaded={handleDataLoaded}
          onError={handleError}
          onLoadingChange={setLoading}
        />

        {error && (
          <div className="error-message">
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={clearData} className="clear-btn">Clear</button>
          </div>
        )}

        {loading && (
          <div className="loading-message">
            <p>Loading data...</p>
          </div>
        )}

        {data && !loading && (
          <DataTable 
            data={data.data}
            columns={data.columns}
            totalRows={data.total_rows}
            onError={handleError}
          />
        )}
      </main>
    </div>
  );
}

export default App;
