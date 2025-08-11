import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

const ApiStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkStatus = async () => {
      const response = await apiService.checkHealth();
      setStatus(response.error ? 'offline' : 'online');
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'online': return '#4ade80';
      case 'offline': return '#f87171';
      default: return '#fbbf24';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online': return 'API Online';
      case 'offline': return 'API Offline';
      default: return 'Checking...';
    }
  };

  return (
    <div className="api-status">
      <div 
        className="status-indicator" 
        style={{ backgroundColor: getStatusColor() }}
      />
      <span className="status-text">{getStatusText()}</span>
    </div>
  );
};

export default ApiStatus;