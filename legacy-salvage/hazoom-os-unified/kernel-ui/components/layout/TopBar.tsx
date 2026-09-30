import React, { useState, useEffect } from 'react';

interface TopBarProps {
  onNotificationsClick: () => void;
  notificationCount: number;
  systemHealth: number;
  onMenuClick: () => void;
  isOpen: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onNotificationsClick,
  notificationCount,
  systemHealth,
  onMenuClick,
  isOpen
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const getHealthColor = (health: number) => {
    if (health >= 85) return 'text-green-400';
    if (health >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Real-time clock update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-hazoom-dark border-b border-hazoom-border px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Sidebar toggle button - Always visible */}
          <button 
            onClick={onMenuClick}
            className="p-2 hover:bg-hazoom-surface rounded-lg transition-colors border border-hazoom-border hover:border-purple-500/50 relative group"
            title="Toggle Navigation Sidebar"
          >
            <div className="w-5 h-0.5 bg-white mb-1" />
            <div className="w-5 h-0.5 bg-white mb-1" />
            <div className="w-5 h-0.5 bg-white" />
            {/* Visual indicator for sidebar state */}
            <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full transition-all duration-300 ${
              isOpen ? 'bg-purple-500 animate-pulse' : 'bg-gray-500'
            }`} />
          </button>

          {/* System Health */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-hazoom-surface rounded-lg">
            <div className={`w-2 h-2 rounded-full ${getHealthColor(systemHealth)} animate-pulse`} />
            <span className={`text-sm font-semibold ${getHealthColor(systemHealth)}`}>
              {systemHealth.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400">Health</span>
          </div>

          {/* Quick Stats */}
          <div className="hidden lg:flex items-center gap-4 text-xs text-gray-400">
            <span>⚡ 45ms</span>
            <span>🚀 12 Agents</span>
            <span>✅ 96.8%</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Real-time Clock */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-hazoom-surface rounded-lg font-mono text-sm">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-purple-300 font-bold" id="live-clock">
              {currentTime.toLocaleTimeString()}
            </span>
          </div>

          {/* Notifications */}
          <button 
            onClick={onNotificationsClick}
            className="relative p-2 hover:bg-hazoom-surface rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
              />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {notificationCount}
              </span>
            )}
          </button>

          {/* User Avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity">
            A
          </div>
        </div>
      </div>
    </div>
  );
};