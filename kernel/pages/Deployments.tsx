import React, { useState, useEffect } from 'react';
import { Deployment } from '../types';
import { systemService } from '../services/systemService';
import { useNotifications } from '../hooks/useNotifications';

const Deployments: React.FC = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadDeployments();
    const interval = setInterval(loadDeployments, 369);
    return () => clearInterval(interval);
  }, []);

  const loadDeployments = async () => {
    try {
      const data = await systemService.getDeployments();
      setDeployments(data);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to load deployments',
        message: 'Could not fetch deployment data',
        timestamp: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeploymentAction = async (deploymentId: string, action: string) => {
    try {
      const result = await systemService.performDeploymentAction(deploymentId, action);
      addNotification({
        type: 'success',
        title: 'Deployment Action',
        message: result.message,
        timestamp: new Date()
      });
      loadDeployments();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Action Failed',
        message: `Failed to ${action} deployment`,
        timestamp: new Date()
      });
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'aws': return '☁️';
      case 'azure': return '🔷';
      case 'local': return '🏠';
      default: return '⚙️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const calculateCost = (cost: number) => {
    return `$${cost}/mo`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Deployments</h1>
          <p className="text-gray-400 mt-1">Manage and monitor deployment environments</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => addNotification({
              type: 'info',
              title: 'New Deployment',
              message: 'Deployment wizard started',
              timestamp: new Date()
            })}
            className="px-4 py-2 bg-hazoom-accent hover:bg-hazoom-accent/80 rounded-lg font-medium transition-all"
          >
            New Deployment
          </button>
          <button 
            onClick={loadDeployments}
            className="px-4 py-2 bg-hazoom-surface hover:bg-hazoom-surface/80 rounded-lg font-medium transition-all"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card glow text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading deployments...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {deployments.map((deployment) => (
            <div key={deployment.id} className="card glow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getProviderIcon(deployment.provider)}</div>
                  <div>
                    <h3 className="font-semibold text-white">{deployment.name}</h3>
                    <p className="text-xs text-gray-400 capitalize">{deployment.provider} • {deployment.region}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(deployment.status)}`}>
                  {deployment.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-400">Uptime</p>
                  <p className="text-lg font-bold gradient-text">{deployment.uptime}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Instances</p>
                  <p className="text-lg font-bold gradient-text">{deployment.instances}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Cost</p>
                  <p className="text-lg font-bold gradient-text">{calculateCost(deployment.cost)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Last Deployed</p>
                  <p className="text-sm font-semibold text-gray-300 mt-1">
                    {new Date(deployment.lastDeployed).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Resource Usage Bar */}
              <div className="bg-hazoom-dark rounded-lg p-3 border border-hazoom-border mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Resource Usage</span>
                  <span className="text-purple-400">{Math.round(deployment.uptime * 0.8)}%</span>
                </div>
                <div className="h-2 bg-hazoom-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${deployment.uptime * 0.8}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleDeploymentAction(deployment.id, 'deploy')}
                  className="flex-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-sm transition-all"
                >
                  Deploy
                </button>
                <button 
                  onClick={() => handleDeploymentAction(deployment.id, 'scale')}
                  className="flex-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-sm transition-all"
                >
                  Scale
                </button>
                <button 
                  onClick={() => handleDeploymentAction(deployment.id, 'logs')}
                  className="flex-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-sm transition-all"
                >
                  Logs
                </button>
                <button 
                  onClick={() => handleDeploymentAction(deployment.id, 'rollback')}
                  className="flex-1 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded text-sm transition-all"
                >
                  Rollback
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deployment Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card glow text-center py-6">
          <div className="text-3xl mb-2">🚀</div>
          <div className="text-2xl font-bold gradient-text">{deployments.length}</div>
          <div className="text-sm text-gray-400">Total Deployments</div>
        </div>
        <div className="card glow text-center py-6">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold gradient-text">
            {deployments.filter(d => d.status === 'active').length}
          </div>
          <div className="text-sm text-gray-400">Active</div>
        </div>
        <div className="card glow text-center py-6">
          <div className="text-3xl mb-2">⚡</div>
          <div className="text-2xl font-bold gradient-text">
            {deployments.reduce((sum, d) => sum + d.instances, 0)}
          </div>
          <div className="text-sm text-gray-400">Total Instances</div>
        </div>
        <div className="card glow text-center py-6">
          <div className="text-3xl mb-2">💰</div>
          <div className="text-2xl font-bold gradient-text">
            ${deployments.reduce((sum, d) => sum + d.cost, 0)}
          </div>
          <div className="text-sm text-gray-400">Monthly Cost</div>
        </div>
      </div>
    </div>
  );
};

export default Deployments;