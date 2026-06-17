import React, { useState, useEffect } from 'react';
import { SystemObservation } from '../types';
import { systemService } from '../services/systemService';
import { useNotifications } from '../hooks/useNotifications';

const Observations: React.FC = () => {
  const [observations, setObservations] = useState<SystemObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: 'all', severity: 'all', source: 'all' });
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadObservations();
    const interval = setInterval(loadObservations, 369);
    return () => clearInterval(interval);
  }, []);

  const loadObservations = async () => {
    try {
      const data = await systemService.getObservations();
      setObservations(data);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to load observations',
        message: 'Could not fetch observation data',
        timestamp: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'error': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'info': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'metric': return '📊';
      case 'log': return '📝';
      case 'event': return '📅';
      case 'trace': return '🔍';
      default: return '📄';
    }
  };

  const filteredObservations = observations.filter(obs => {
    if (filter.type !== 'all' && obs.type !== filter.type) return false;
    if (filter.severity !== 'all' && obs.severity !== filter.severity) return false;
    if (filter.source !== 'all' && obs.source !== filter.source) return false;
    return true;
  });

  const exportObservations = async () => {
    try {
      const data = await systemService.exportData('json');
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `observations-${Date.now()}.json`;
      a.click();
      addNotification({
        type: 'success',
        title: 'Export Complete',
        message: 'Observations exported successfully',
        timestamp: new Date()
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not export observations',
        timestamp: new Date()
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Observations</h1>
          <p className="text-gray-400 mt-1">Real-time system observations and events</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportObservations}
            className="px-4 py-2 bg-hazoom-accent hover:bg-hazoom-accent/80 rounded-lg font-medium transition-all"
          >
            Export
          </button>
          <button 
            onClick={loadObservations}
            className="px-4 py-2 bg-hazoom-surface hover:bg-hazoom-surface/80 rounded-lg font-medium transition-all"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card glow">
        <h3 className="text-lg font-semibold mb-4 text-white">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Type</label>
            <select 
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="w-full bg-hazoom-dark border border-hazoom-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Types</option>
              <option value="metric">Metric</option>
              <option value="log">Log</option>
              <option value="event">Event</option>
              <option value="trace">Trace</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Severity</label>
            <select 
              value={filter.severity}
              onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
              className="w-full bg-hazoom-dark border border-hazoom-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Source</label>
            <select 
              value={filter.source}
              onChange={(e) => setFilter({ ...filter, source: e.target.value })}
              className="w-full bg-hazoom-dark border border-hazoom-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Sources</option>
              <option value="agent-1">Goose-Primary</option>
              <option value="agent-2">MCP-Worker-1</option>
              <option value="agent-3">Copilot-Assistant</option>
              <option value="agent-4">Goose-Backup</option>
              <option value="system">System</option>
              <option value="deployment">Deployment</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card glow text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading observations...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-400 px-2">
            <span>Showing {filteredObservations.length} observations</span>
            <span>Auto-refresh: 3s</span>
          </div>
          
          {filteredObservations.map((obs) => (
            <div key={obs.id} className="card glow hover:border-purple-500/50 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getTypeIcon(obs.type)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getSeverityColor(obs.severity)}`}>
                        {obs.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">{obs.type}</span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">{obs.data.message}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{new Date(obs.timestamp).toLocaleTimeString()}</p>
                  <p className="text-xs text-purple-400 mt-1">{obs.source}</p>
                </div>
              </div>

              <div className="bg-hazoom-dark rounded-lg p-3 border border-hazoom-border mt-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Value:</span>
                    <span className="ml-2 font-mono text-purple-400">{obs.data.value.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Correlation ID:</span>
                    <span className="ml-2 font-mono text-xs text-gray-300">{obs.data.metadata.correlationId}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button 
                  className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs transition-all"
                  onClick={() => addNotification({
                    type: 'info',
                    title: 'Observation Details',
                    message: `Viewing details for ${obs.id}`,
                    timestamp: new Date()
                  })}
                >
                  Details
                </button>
                <button 
                  className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-xs transition-all"
                  onClick={() => addNotification({
                    type: 'success',
                    title: 'Analysis Started',
                    message: `Analyzing observation ${obs.id}`,
                    timestamp: new Date()
                  })}
                >
                  Analyze
                </button>
              </div>
            </div>
          ))}

          {filteredObservations.length === 0 && (
            <div className="card glow text-center py-12">
              <p className="text-gray-400">No observations match the current filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Observations;