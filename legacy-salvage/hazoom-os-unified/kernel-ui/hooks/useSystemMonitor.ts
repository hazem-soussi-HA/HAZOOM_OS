import { useState, useEffect, useCallback } from 'react';
import { systemService } from '../services/systemService';
import { SystemMetrics, SystemHealth } from '../types';

interface SystemMonitorHook {
  metrics: SystemMetrics;
  health: SystemHealth;
  updateMetrics: (data: any) => void;
  refresh: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useSystemMonitor = (): SystemMonitorHook => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    timestamp: new Date(),
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    activeAgents: 0,
    totalTasks: 0,
    successRate: 0,
    avgResponseTime: 0
  });

  const [health, setHealth] = useState<SystemHealth>({
    overall: 100,
    agents: 100,
    infrastructure: 100,
    performance: 100,
    reliability: 100
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [metricsData, healthData] = await Promise.all([
        systemService.getMetrics(),
        systemService.getHealth()
      ]);

      setMetrics(metricsData);
      setHealth(healthData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system data');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMetrics = useCallback((data: any) => {
    if (data.metrics) {
      setMetrics(prev => ({ ...prev, ...data.metrics, timestamp: new Date() }));
    }
    if (data.health) {
      setHealth(prev => ({ ...prev, ...data.health }));
    }
  }, []);

  useEffect(() => {
    refresh();
    
    // Auto-refresh every 996ms
    const interval = setInterval(refresh, 996);
    
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    metrics,
    health,
    updateMetrics,
    refresh,
    loading,
    error
  };
};