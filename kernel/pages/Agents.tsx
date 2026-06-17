import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import { systemService } from '../services/systemService';
import { useNotifications } from '../hooks/useNotifications';

const Agents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadAgents();
    const interval = setInterval(loadAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAgents = async () => {
    try {
      const data = await systemService.getAgents();
      setAgents(data);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to load agents',
        message: 'Could not fetch agent data',
        timestamp: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAgentAction = async (agentId: string, action: string) => {
    try {
      const result = await systemService.performAgentAction(agentId, action);
      addNotification({
        type: 'success',
        title: 'Action Completed',
        message: result.message,
        timestamp: new Date()
      });
      loadAgents();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Action Failed',
        message: `Failed to ${action} agent`,
        timestamp: new Date()
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'offline': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'goose': return '🦢';
      case 'mcp': return '🔧';
      case 'copilot': return '🤖';
      default: return '⚙️';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Agents</h1>
          <p className="text-gray-400 mt-1">Monitor and manage all active agents</p>
        </div>
        <button 
          onClick={loadAgents}
          className="px-4 py-2 bg-hazoom-accent hover:bg-hazoom-accent/80 rounded-lg font-medium transition-all"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="card glow text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading agents...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="card glow cursor-pointer hover:scale-[1.02] transition-all" onClick={() => setSelectedAgent(agent)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getTypeIcon(agent.type)}</div>
                  <div>
                    <h3 className="font-semibold text-white">{agent.name}</h3>
                    <p className="text-xs text-gray-400 capitalize">{agent.type}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
                  {agent.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-400">CPU Usage</p>
                  <p className="text-lg font-bold gradient-text">{agent.cpuUsage}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Memory</p>
                  <p className="text-lg font-bold gradient-text">{agent.memoryUsage}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Response Time</p>
                  <p className="text-lg font-bold gradient-text">{agent.responseTime}ms</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Uptime</p>
                  <p className="text-lg font-bold gradient-text">{agent.uptime}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 border-t border-hazoom-border pt-3">
                <span>Tasks: {agent.tasksCompleted}</span>
                <span>Last seen: {new Date(agent.lastSeen).toLocaleTimeString()}</span>
              </div>

              <div className="flex gap-2 mt-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAgentAction(agent.id, 'restart'); }}
                  className="flex-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-sm transition-all"
                >
                  Restart
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAgentAction(agent.id, 'pause'); }}
                  className="flex-1 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded text-sm transition-all"
                >
                  Pause
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAgentAction(agent.id, 'logs'); }}
                  className="flex-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-sm transition-all"
                >
                  Logs
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedAgent(null)}>
          <div className="card glow max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold gradient-text">{selectedAgent.name}</h2>
              <button onClick={() => setSelectedAgent(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-hazoom-dark p-3 rounded-lg border border-hazoom-border">
                  <p className="text-xs text-gray-400">Type</p>
                  <p className="font-semibold">{selectedAgent.type}</p>
                </div>
                <div className="bg-hazoom-dark p-3 rounded-lg border border-hazoom-border">
                  <p className="text-xs text-gray-400">Status</p>
                  <p className="font-semibold capitalize">{selectedAgent.status}</p>
                </div>
                <div className="bg-hazoom-dark p-3 rounded-lg border border-hazoom-border">
                  <p className="text-xs text-gray-400">Uptime</p>
                  <p className="font-semibold">{selectedAgent.uptime}%</p>
                </div>
                <div className="bg-hazoom-dark p-3 rounded-lg border border-hazoom-border">
                  <p className="text-xs text-gray-400">Tasks Completed</p>
                  <p className="font-semibold">{selectedAgent.tasksCompleted}</p>
                </div>
              </div>

              <div className="bg-hazoom-dark p-4 rounded-lg border border-hazoom-border">
                <h3 className="font-semibold mb-3">Resource Usage</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>CPU</span>
                      <span>{selectedAgent.cpuUsage}%</span>
                    </div>
                    <div className="h-2 bg-hazoom-border rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: `${selectedAgent.cpuUsage}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Memory</span>
                      <span>{selectedAgent.memoryUsage}%</span>
                    </div>
                    <div className="h-2 bg-hazoom-border rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500" style={{ width: `${selectedAgent.memoryUsage}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Response Time</span>
                      <span>{selectedAgent.responseTime}ms</span>
                    </div>
                    <div className="h-2 bg-hazoom-border rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${Math.min(100, selectedAgent.responseTime / 5)}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => { handleAgentAction(selectedAgent.id, 'restart'); setSelectedAgent(null); }}
                  className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg font-medium transition-all"
                >
                  Restart Agent
                </button>
                <button 
                  onClick={() => { handleAgentAction(selectedAgent.id, 'diagnostics'); setSelectedAgent(null); }}
                  className="flex-1 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg font-medium transition-all"
                >
                  Run Diagnostics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;