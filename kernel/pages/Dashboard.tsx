import React, { useState, useEffect } from 'react';
import { SystemMetrics, SystemHealth } from '../types';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  Cell, 
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart
} from 'recharts';

import HeatDisplay from '../components/HeatDisplay';

interface DashboardProps {
  metrics: SystemMetrics;
  health: SystemHealth;
}


const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({ metrics, health }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Real-time clock update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Generate historical data for charts
  const generateHistoricalData = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      time: `${i * 5}m`,
      cpu: 40 + Math.random() * 30,
      memory: 50 + Math.random() * 30,
      tasks: 20 + Math.random() * 40,
      response: 100 + Math.random() * 200
    }));
  };

  const historicalData = generateHistoricalData();

  const healthData = [
    { name: 'Overall', value: health.overall },
    { name: 'Agents', value: health.agents },
    { name: 'Infrastructure', value: health.infrastructure },
    { name: 'Performance', value: health.performance },
    { name: 'Reliability', value: health.reliability }
  ];

  const metricCards = [
    {
      title: 'CPU Usage',
      value: `${metrics.cpu.toFixed(1)}%`,
      change: '+2.3%',
      trend: 'up',
      color: 'from-purple-500 to-purple-700'
    },
    {
      title: 'Memory Usage',
      value: `${metrics.memory.toFixed(1)}%`,
      change: '-1.2%',
      trend: 'down',
      color: 'from-cyan-500 to-cyan-700'
    },
    {
      title: 'Active Agents',
      value: metrics.activeAgents,
      change: '+1',
      trend: 'up',
      color: 'from-green-500 to-green-700'
    },
    {
      title: 'Success Rate',
      value: `${metrics.successRate.toFixed(1)}%`,
      change: '+0.5%',
      trend: 'up',
      color: 'from-emerald-500 to-emerald-700'
    },
    {
      title: 'Avg Response',
      value: `${metrics.avgResponseTime.toFixed(0)}ms`,
      change: '-15ms',
      trend: 'down',
      color: 'from-blue-500 to-blue-700'
    },
    {
      title: 'Total Tasks',
      value: metrics.totalTasks,
      change: '+24',
      trend: 'up',
      color: 'from-orange-500 to-orange-700'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Live Clock */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time system monitoring and observation</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Beautiful Digital Clock */}
          <div className="px-4 py-2 bg-hazoom-surface rounded-lg border border-purple-500/30 shadow-lg shadow-purple-500/10">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-purple-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xl font-mono font-bold text-purple-300" id="dashboard-clock">
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/30">
            ● System Online
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((card, index) => (
          <div key={index} className="card glow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 font-medium">{card.title}</p>
                <p className="text-3xl font-bold mt-2 gradient-text">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-br ${card.color} opacity-80`}>
                {/* Simple icon representation */}
                <div className="w-4 h-4 bg-white/30 rounded-sm transform rotate-45" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={`text-sm font-medium ${
                card.trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                {card.trend === 'up' ? '↑' : '↓'} {card.change}
              </span>
              <span className="text-xs text-gray-500">vs last hour</span>
            </div>
            {/* Mini sparkline */}
            <div className="mt-3 h-1 w-full bg-hazoom-border rounded-full overflow-hidden">
              <div 
                className={`h-full ${card.trend === 'up' ? 'bg-green-500' : 'bg-red-500'} transition-all duration-500`}
                style={{ width: `${60 + Math.random() * 30}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU & Memory Trends */}
        <div className="card glow">
          <h3 className="text-lg font-semibold mb-4 text-white">Resource Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a2e', 
                    border: '1px solid #2a2a3e',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#8b5cf6" 
                  fill="url(#cpuGradient)" 
                  name="CPU %"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="memory" 
                  stroke="#06b6d4" 
                  fill="url(#memoryGradient)" 
                  name="Memory %"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health Distribution */}
        <div className="card glow">
          <h3 className="text-lg font-semibold mb-4 text-white">System Health</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a2e', 
                    border: '1px solid #2a2a3e',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {healthData.map((item) => (
                    <Cell key={item.name} fill={
                      item.value > 85 ? '#10b981' : 
                      item.value > 70 ? '#f59e0b' : '#ef4444'
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <HeatDisplay />

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Performance */}
        <div className="card glow lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-white">Task Performance & Response Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a2e', 
                    border: '1px solid #2a2a3e',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                  name="Tasks/min"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="response" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  dot={false}
                  name="Response (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Distribution Pie */}
        <div className="card glow">
          <h3 className="text-lg font-semibold mb-4 text-white">Health Breakdown</h3>
          <div className="h-64">
          <div className="h-64 flex items-center justify-center text-gray-400">
            Health data visualization
          </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {healthData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-gray-400">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card glow text-center py-6">
          <div className="text-4xl mb-2">🚀</div>
          <div className="text-2xl font-bold gradient-text">{metrics.activeAgents}</div>
          <div className="text-sm text-gray-400">Active Agents</div>
        </div>
        <div className="card glow text-center py-6">
          <div className="text-4xl mb-2">⚡</div>
          <div className="text-2xl font-bold gradient-text">{metrics.totalTasks}</div>
          <div className="text-sm text-gray-400">Total Tasks</div>
        </div>
        <div className="card glow text-center py-6">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-2xl font-bold gradient-text">{metrics.successRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-400">Success Rate</div>
        </div>
        <div className="card glow text-center py-6">
          <div className="text-4xl mb-2">⏱️</div>
          <div className="text-2xl font-bold gradient-text">{metrics.avgResponseTime.toFixed(0)}ms</div>
          <div className="text-sm text-gray-400">Avg Response</div>
        </div>
      </div>

      {/* System Status Banner */}
      <div className="card glow border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="pulse-dot" />
            <div>
              <h4 className="font-semibold text-white">System Status: Healthy</h4>
              <p className="text-sm text-gray-400">
                All systems operational. Monitoring {metrics.activeAgents} active agents in real-time.
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold gradient-text">{health.overall.toFixed(1)}%</div>
            <div className="text-xs text-gray-400">Overall Health</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;