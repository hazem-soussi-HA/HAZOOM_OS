// Core types for hazoom-os dashboard

export interface Agent {
  id: string;
  name: string;
  type: 'goose' | 'mcp' | 'copilot';
  status: 'online' | 'offline' | 'warning';
  uptime: number;
  tasksCompleted: number;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  lastSeen: Date;
}

export interface SystemMetrics {
  timestamp: Date;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  activeAgents: number;
  totalTasks: number;
  successRate: number;
  avgResponseTime: number;
}

export interface Deployment {
  id: string;
  name: string;
  provider: 'aws' | 'azure' | 'local';
  region: string;
  status: 'active' | 'pending' | 'failed';
  uptime: number;
  instances: number;
  cost: number;
  lastDeployed: Date;
}

export interface SystemObservation {
  id: string;
  timestamp: Date;
  type: 'metric' | 'log' | 'event' | 'trace';
  source: string;
  data: {
    message: string;
    value: number;
    metadata: { correlationId: string };
  };
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface PerformanceMetric {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface Alert {
  id: string;
  type: 'system' | 'agent' | 'deployment';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  successRate: number;
  avgResponseTime: number;
  systemHealth: number;
  deployments: number;
  alerts: number;
}

export interface SystemHealth {
  overall: number;
  agents: number;
  infrastructure: number;
  performance: number;
  reliability: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: Date;
  read: boolean;
}

export interface WebSocketMessage {
  type: 'update' | 'alert' | 'metric' | 'log';
  data: any;
  timestamp: Date;
}