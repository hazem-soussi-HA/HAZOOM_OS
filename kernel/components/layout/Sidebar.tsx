import React, { useState, useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPath: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, currentPath }) => {
  const [hazoomTime, setHazoomTime] = useState(new Date());
  const [clickCount, setClickCount] = useState(0);
  
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/agents', label: 'Agents', icon: '🚀' },
    { path: '/observations', label: 'Observations', icon: '🔍' },
    { path: '/deployments', label: 'Deployments', icon: '☁️' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/settings', label: 'Settings', icon: '⚙️' }
  ];

  // Real-time Hazoom Time Online clock update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setHazoomTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Handle Hazoom Time feature click
  const handleHazoomTimeClick = () => {
    setClickCount(prev => prev + 1);
    // You can add custom click behavior here
    console.log('Hazoom Time clicked!', clickCount + 1);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-hazoom-dark border-r border-hazoom-border
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-hazoom-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">Hazoom-OS</h1>
              <p className="text-xs text-gray-400">Admin Dashboard</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button 
            onClick={onToggle}
            className="lg:hidden p-1 hover:bg-hazoom-surface rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Hazoom Time Online Feature */}
        <div className="px-4 mb-4">
          <div 
            className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-lg p-3 border border-purple-500/30 hover:border-purple-400 transition-all cursor-pointer group" 
            id="hazoom-time-feature"
            onClick={handleHazoomTimeClick}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-300 font-semibold">⚡ HAZOOM TIME ONLINE</span>
              <span className="text-[10px] text-green-400 animate-pulse">● LIVE</span>
            </div>
            <div className="text-2xl font-mono font-bold text-purple-200 text-center" id="hazoom-time-display">
              {hazoomTime.toLocaleTimeString()}
            </div>
            <div className="text-[10px] text-gray-400 text-center mt-1" id="hazoom-time-date">
              {hazoomTime.toLocaleDateString()}
            </div>
            {clickCount > 0 && (
              <div className="text-[9px] text-purple-300 text-center mt-1 opacity-70">
                Clicks: {clickCount}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg
                  transition-all duration-200 group
                  ${isActive 
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                    : 'text-gray-400 hover:bg-hazoom-surface hover:text-white'
                  }
                `}
              >
                <span className="text-xl transition-transform group-hover:scale-110">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                )}
              </a>
            );
          })}
        </nav>

        {/* System Status */}
        <div className="absolute bottom-0 w-full p-4 border-t border-hazoom-border">
          <div className="bg-hazoom-surface rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">System Status</span>
              <span className="text-xs text-green-400">● Online</span>
            </div>
            <div className="text-xs text-gray-500">v2.1.0 • Production</div>
          </div>
        </div>
      </aside>
    </>
  );
};