const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface DataResponse {
  data: any[];
  columns: string[];
  total_rows: number;
}

export interface LoadParquetResponse {
  message: string;
  rows: number;
}

export interface ParquetFile {
  name: string;
  path: string;
  relative_path: string;
  size: number;
  modified: number;
}

export interface ParquetFilesResponse {
  files: ParquetFile[];
}

export interface ColumnValuesResponse {
  column: string;
  values: string[];
  count: number;
}

export interface FilteredDataResponse {
  data: any[];
  columns: string[];
  total_rows: number;
  filtered_rows: number;
  filters_applied: boolean;
}

export interface ColumnFilters {
  [columnName: string]: string[];
}

export const apiService = {
  async checkHealth(): Promise<ApiResponse<{ status: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async loadParquet(filePath: string): Promise<ApiResponse<LoadParquetResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/load-parquet?file_path=${encodeURIComponent(filePath)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getData(limit: number = 1000, offset: number = 0): Promise<ApiResponse<DataResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/data?limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getParquetFiles(): Promise<ApiResponse<ParquetFilesResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/files/parquet`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async exportCSV(limit?: number, offset?: number, filters?: ColumnFilters): Promise<{ success: boolean; error?: string }> {
    console.log('🟪 API exportCSV called with:', { limit, offset, filters });
    
    try {
      const params = new URLSearchParams();
      if (limit !== undefined) params.append('limit', limit.toString());
      if (offset !== undefined) params.append('offset', offset.toString());
      if (filters && Object.keys(filters).length > 0) {
        params.append('filters', JSON.stringify(filters));
      }
      
      const url = `${API_BASE_URL}/export/csv?${params}`;
      console.log('🟪 API making request to:', url);
      
      const response = await fetch(url);
      console.log('🟪 API response status:', response.status, response.statusText);
      console.log('🟪 API response headers:', Array.from(response.headers.entries()));
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API response error:', errorData);
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Create blob and trigger download
      const blob = await response.blob();
      console.log('🟪 API created blob, size:', blob.size, 'type:', blob.type);
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      console.log('🟪 API Content-Disposition header:', contentDisposition);
      
      const filename = contentDisposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)?.[1]?.replace(/['"]/g, '') || 'data_export.csv';
      console.log('🟪 API download filename:', filename);
      
      a.download = filename;
      
      document.body.appendChild(a);
      console.log('🟪 API triggering download click...');
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('🟢 API CSV export completed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ API exportCSV error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async exportExcel(limit?: number, offset?: number, filters?: ColumnFilters): Promise<{ success: boolean; error?: string }> {
    console.log('🟣 API exportExcel called with:', { limit, offset, filters });
    
    try {
      const params = new URLSearchParams();
      if (limit !== undefined) params.append('limit', limit.toString());
      if (offset !== undefined) params.append('offset', offset.toString());
      if (filters && Object.keys(filters).length > 0) {
        params.append('filters', JSON.stringify(filters));
      }
      
      const url = `${API_BASE_URL}/export/excel?${params}`;
      console.log('🟣 API making request to:', url);
      
      const response = await fetch(url);
      console.log('🟣 API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API response error:', errorData);
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Create blob and trigger download
      const blob = await response.blob();
      console.log('🟣 API created blob, size:', blob.size, 'type:', blob.type);
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)?.[1]?.replace(/['"]/g, '') || 'data_export.xlsx';
      console.log('🟣 API download filename:', filename);
      
      a.download = filename;
      
      document.body.appendChild(a);
      console.log('🟣 API triggering download click...');
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('🟢 API Excel export completed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ API exportExcel error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getColumnValues(columnName: string): Promise<ApiResponse<ColumnValuesResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/data/columns/${encodeURIComponent(columnName)}/values`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getFilteredData(limit: number = 1000, offset: number = 0, filters: ColumnFilters = {}): Promise<ApiResponse<FilteredDataResponse>> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      
      // Convert filters to JSON string if there are any
      if (Object.keys(filters).length > 0) {
        params.append('filters', JSON.stringify(filters));
      }
      
      const response = await fetch(`${API_BASE_URL}/data/filtered?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};