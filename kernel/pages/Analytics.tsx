import React, { useState, useEffect } from 'react';
import { PerformanceMetric } from '../types';
import { systemService } from '../services/systemService';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useNotifications } from '../hooks/useNotifications';

const Analytics: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      const data = await systemService.getPerformance();
      setPerformanceData(data);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to load analytics',
        message: 'Could not fetch performance data',
        timestamp: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate additional analytics data
  const generateAnalytics = () => {
    const successRate = 95 + Math.random() * 4;
    const avgResponse = 150 + Math.random() * 100;
    const throughput = 800 + Math.random() * 400;
    const errorRate = 1 + Math.random() * 3;

    return [
      { name: 'Success Rate', value: successRate, color: '#10b981' },
      { name: 'Avg Response', value: avgResponse, color: '#06b6d4' },
      { name: 'Throughput', value: throughput, color: '#8b5cf6' },
      { name: 'Error Rate', value: errorRate, color: '#ef4444' }
    ];
  };

  const analytics = generateAnalytics();

  // Generate trend data
  const generateTrendData = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      time: `${i * 5}m`,
      performance: 85 + Math.random() * 15,
      reliability: 90 + Math.random() * 10,
      efficiency: 80 + Math.random() * 20,
      tasks: 50 + Math.random() * 100
    }));
  };

  const trendData = generateTrendData();

  const exportAnalytics = async () => {
    try {
      const data = await systemService.exportData('json');
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${Date.now()}.json`;
      a.click();
      addNotification({
        type: 'success',
        title: 'Export Complete',
        message: 'Analytics data exported successfully',
        timestamp: new Date()
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not export analytics',
        timestamp: new Date()
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Analytics</h1>
          <p className="text-gray-400 mt-1">Performance metrics and system analytics</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportAnalytics}
            className="px-4 py-2 bg-hazoom-accent hover:bg-hazoom-accent/80 rounded-lg font-medium transition-all"
          >
            Export Data
          </button>
          <button 
            onClick={loadPerformanceData}
            className="px-4 py-2 bg-hazoom-surface hover:bg-hazoom-surface/80 rounded-lg font-medium transition-all"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card glow text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.map((metric, index) => (
              <div key={index} className="card glow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{metric.name}</span>
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: metric.color }}
                  />
                </div>
                <div className="text-3xl font-bold gradient-text">
                  {metric.value.toFixed(1)}
                  {metric.name === 'Success Rate' || metric.name === 'Error Rate' ? '%' : ''}
                  {metric.name === 'Avg Response' ? 'ms' : ''}
                  {metric.name === 'Throughput' ? '/min' : ''}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {metric.name === 'Success Rate' && '+2.3% vs last hour'}
                  {metric.name === 'Avg Response' && '-15ms vs last hour'}
                  {metric.name === 'Throughput' && '+12% vs last hour'}
                  {metric.name === 'Error Rate' && '-0.5% vs last hour'}
                </div>
              </div>
            ))}
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trend */}
            <div className="card glow">
              <h3 className="text-lg font-semibold mb-4 text-white">Performance Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="relGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
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
                      dataKey="performance" 
                      stroke="#8b5cf6" 
                      fill="url(#perfGradient)" 
                      name="Performance"
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="reliability" 
                      stroke="#10b981" 
                      fill="url(#relGradient)" 
                      name="Reliability"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Task Efficiency */}
            <div className="card glow">
              <h3 className="text-lg font-semibold mb-4 text-white">Task Efficiency</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
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
                    <Bar dataKey="tasks" fill="#06b6d4" name="Tasks/min" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="efficiency" fill="#f59e0b" name="Efficiency %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Advanced Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Response Time Distribution */}
            <div className="card glow lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 text-white">Response Time Analysis</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                    <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} />
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
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      dot={false}
                      name="Response Time (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* System Health Distribution */}
            <div className="card glow">
              <h3 className="text-lg font-semibold mb-4 text-white">Health Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                <Pie
                  data={analytics}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={55}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.map((item) => (
                    <Cell 
                      key={item.name} 
                      fill={item.color} 
                      stroke="#1a1a2e"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1a2e', 
                        border: '1px solid #2a2a3e',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {analytics.map((item) => (
                  <div key={item.name} className="flex items-center gap-1 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-400">{item.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Statistical Summary */}
          <div className="card glow">
            <h3 className="text-lg font-semibold mb-4 text-white">Statistical Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-hazoom-dark p-3 rounded-lg border border-hazoom-border">
                <p className="text-xs text-gray-400">Min Response</p>
                <p className="text-xl font-bold gradient-text">45ms</p>
              </div>
              <div className="bg-hazoom-dark p-3 rounded-lg border border-hazoom-border">
                <p className="text-xs text-gray-400">Max Response</p>
                <p className="text-xl font-bold gradient-text">320ms</p>
              </div>
              <div className="bg-hazoom-dark p-3 rounded-lg border border-hazoom-border">
                <p className="text-xs text-gray-400">95th Percentile</p>
                <p className="text-xl font-bold gradient-text">210ms</p>
              </div>
              <div className="bg-hazoom-dark p-3 rounded-lg border border-hazoom-border">
                <p className="text-xs text-gray-400">Std Deviation</p>
                <p className="text-xl font-bold gradient-text">42ms</p>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="card glow border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-white">Analytics Status</h4>
                <p className="text-sm text-gray-400">
                  Real-time performance monitoring active. Data points: {performanceData.length}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold gradient-text">96.8%</div>
                <div className="text-xs text-gray-400">Overall Score</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;