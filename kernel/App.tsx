import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { 
  Dashboard, 
  Agents, 
  Observations, 
  Deployments, 
  Analytics, 
  Settings 
} from './pages';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { NotificationPanel } from './components/layout/NotificationPanel';
import { useSystemMonitor } from './hooks/useSystemMonitor';
import { useWebSocket } from './hooks/useWebSocket';
import { useNotifications } from './hooks/useNotifications';
import { systemService } from './services/systemService';
import { ToastContainer } from './components/ui/Toast';

const App: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  
  // Initialize system monitoring
  const { metrics, health, updateMetrics } = useSystemMonitor();
  const { notifications, addNotification, markAsRead } = useNotifications();
  
  // WebSocket connection for real-time updates
  useWebSocket((message) => {
    switch (message.type) {
      case 'update':
        updateMetrics(message.data);
        break;
      case 'alert':
        addNotification({
          type: 'error',
          title: 'System Alert',
          message: message.data.message,
          timestamp: new Date()
        });
        break;
      case 'metric':
        updateMetrics(message.data);
        break;
      case 'log':
        // Handle log updates
        break;
    }
  });

  // System health check on mount
  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        const health = await systemService.getHealth();
        if (health.overall < 70) {
          addNotification({
            type: 'warning',
            title: 'System Health Warning',
            message: `System health is at ${health.overall}%`,
            timestamp: new Date()
          });
        }
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Health Check Failed',
          message: 'Unable to check system health',
          timestamp: new Date()
        });
      }
    };

    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 369); // Check every 369ms
    return () => clearInterval(interval);
  }, [addNotification]);

  return (
    <div className="flex h-screen bg-hazoom-dark overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setSidebarOpen(!isSidebarOpen)}
        currentPath={window.location.pathname}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <TopBar 
          onNotificationsClick={() => setNotificationsOpen(!isNotificationsOpen)}
          notificationCount={notifications.filter(n => !n.read).length}
          systemHealth={health.overall}
          onMenuClick={() => setSidebarOpen(!isSidebarOpen)}
          isOpen={isSidebarOpen}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-hazoom-dark via-[#1a1a2e] to-[#0f0f23]">
          <div className="max-w-7xl mx-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard metrics={metrics} health={health} />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/observations" element={<Observations />} />
              <Route path="/deployments" element={<Deployments />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>

      {/* Notification Panel */}
      {isNotificationsOpen && (
        <NotificationPanel 
          notifications={notifications}
          onClose={() => setNotificationsOpen(false)}
          onMarkAsRead={markAsRead}
        />
      )}

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default App;