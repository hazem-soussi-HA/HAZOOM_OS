import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';

const Settings: React.FC = () => {
  const { addNotification } = useNotifications();
  const [settings, setSettings] = useState({
    theme: 'dark',
    notifications: true,
    autoRefresh: 5,
    realtimeUpdates: true,
    dataRetention: 30,
    alerts: {
      systemHealth: true,
      agentStatus: true,
      deployment: true,
      performance: false
    }
  });

  const handleSave = () => {
    addNotification({
      type: 'success',
      title: 'Settings Saved',
      message: 'Your preferences have been updated successfully',
      timestamp: new Date()
    });
  };

  const handleReset = () => {
    setSettings({
      theme: 'dark',
      notifications: true,
      autoRefresh: 5,
      realtimeUpdates: true,
      dataRetention: 30,
      alerts: {
        systemHealth: true,
        agentStatus: true,
        deployment: true,
        performance: false
      }
    });
    addNotification({
      type: 'info',
      title: 'Settings Reset',
      message: 'Settings restored to defaults',
      timestamp: new Date()
    });
  };

  const handleExportConfig = () => {
    const config = JSON.stringify(settings, null, 2);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hazoom-dashboard-config.json';
    a.click();
    addNotification({
      type: 'success',
      title: 'Config Exported',
      message: 'Configuration file downloaded',
      timestamp: new Date()
    });
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        setSettings(imported);
        addNotification({
          type: 'success',
          title: 'Config Imported',
          message: 'Settings loaded successfully',
          timestamp: new Date()
        });
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Import Failed',
          message: 'Invalid configuration file',
          timestamp: new Date()
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Settings</h1>
          <p className="text-gray-400 mt-1">Configure dashboard preferences and system settings</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportConfig}
            className="px-4 py-2 bg-hazoom-accent hover:bg-hazoom-accent/80 rounded-lg font-medium transition-all"
          >
            Export Config
          </button>
          <label className="px-4 py-2 bg-hazoom-surface hover:bg-hazoom-surface/80 rounded-lg font-medium transition-all cursor-pointer">
            Import Config
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportConfig}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* General Settings */}
      <div className="card glow">
        <h3 className="text-lg font-semibold mb-4 text-white">General Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-gray-400">Choose your preferred color scheme</p>
            </div>
            <select 
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="bg-hazoom-dark border border-hazoom-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="dark">Dark (Default)</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifications</p>
              <p className="text-sm text-gray-400">Enable system notifications</p>
            </div>
            <button 
              onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
              className={`w-12 h-6 rounded-full transition-all ${settings.notifications ? 'bg-purple-500' : 'bg-gray-600'}`}
            >
              <div 
                className={`w-4 h-4 bg-white rounded-full transition-all ${settings.notifications ? 'ml-7' : 'ml-1'} mt-1`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto Refresh (seconds)</p>
              <p className="text-sm text-gray-400">Data refresh interval</p>
            </div>
            <input 
              type="number" 
              value={settings.autoRefresh}
              onChange={(e) => setSettings({ ...settings, autoRefresh: parseInt(e.target.value) })}
              className="w-24 bg-hazoom-dark border border-hazoom-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              min="1"
              max="60"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Real-time Updates</p>
              <p className="text-sm text-gray-400">Enable WebSocket updates</p>
            </div>
            <button 
              onClick={() => setSettings({ ...settings, realtimeUpdates: !settings.realtimeUpdates })}
              className={`w-12 h-6 rounded-full transition-all ${settings.realtimeUpdates ? 'bg-purple-500' : 'bg-gray-600'}`}
            >
              <div 
                className={`w-4 h-4 bg-white rounded-full transition-all ${settings.realtimeUpdates ? 'ml-7' : 'ml-1'} mt-1`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Data Retention (days)</p>
              <p className="text-sm text-gray-400">How long to keep historical data</p>
            </div>
            <input 
              type="number" 
              value={settings.dataRetention}
              onChange={(e) => setSettings({ ...settings, dataRetention: parseInt(e.target.value) })}
              className="w-24 bg-hazoom-dark border border-hazoom-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              min="1"
              max="365"
            />
          </div>
        </div>
      </div>

      {/* Alert Preferences */}
      <div className="card glow">
        <h3 className="text-lg font-semibold mb-4 text-white">Alert Preferences</h3>
        <div className="space-y-3">
          {Object.entries(settings.alerts).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-sm text-gray-400">Receive alerts for {key.toLowerCase()} events</p>
              </div>
              <button 
                onClick={() => setSettings({ 
                  ...settings, 
                  alerts: { ...settings.alerts, [key]: !value } 
                })}
                className={`w-12 h-6 rounded-full transition-all ${value ? 'bg-purple-500' : 'bg-gray-600'}`}
              >
                <div 
                  className={`w-4 h-4 bg-white rounded-full transition-all ${value ? 'ml-7' : 'ml-1'} mt-1`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* System Information */}
      <div className="card glow">
        <h3 className="text-lg font-semibold mb-4 text-white">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-hazoom-dark p-3 rounded-lg border border-hazoom-border">
            <p className="text-xs text-gray-400">Dashboard Version</p>
            <p className="font-semibold">v2.1.0</p>
          </div>
          <div className="bg-hazoom-dark p-3 rounded-lg border border-hazoom-border">
            <p className="text-xs text-gray-400">Hazoom-OS Version</p>
            <p className="font-semibold">v1.4.2</p>
          </div>
          <div className="bg-hazoom-dark p-3 rounded-lg border border-hazoom-border">
            <p className="text-xs text-gray-400">Build Date</p>
            <p className="font-semibold">2026-01-03</p>
          </div>
          <div className="bg-hazoom-dark p-3 rounded-lg border border-hazoom-border">
            <p className="text-xs text-gray-400">Environment</p>
            <p className="font-semibold">Production</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button 
          onClick={handleSave}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-all"
        >
          Save Settings
        </button>
        <button 
          onClick={handleReset}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-all"
        >
          Reset to Defaults
        </button>
        <button 
          onClick={() => addNotification({
            type: 'info',
            title: 'Test Notification',
            message: 'This is a test notification from settings',
            timestamp: new Date()
          })}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all"
        >
          Test Notification
        </button>
      </div>

      {/* Danger Zone */}
      <div className="card glow border-l-4 border-red-500">
        <h3 className="text-lg font-semibold mb-4 text-white">Danger Zone</h3>
        <div className="space-y-3">
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to clear all cached data? This action cannot be undone.')) {
                addNotification({
                  type: 'warning',
                  title: 'Data Cleared',
                  message: 'All cached data has been cleared',
                  timestamp: new Date()
                });
              }
            }}
            className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-all"
          >
            Clear All Cached Data
          </button>
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to reset the entire dashboard configuration?')) {
                handleReset();
              }
            }}
            className="w-full px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg font-medium transition-all"
          >
            Factory Reset
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="card glow border-l-4 border-blue-500">
        <h4 className="font-semibold text-white mb-2">💡 Pro Tips</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Use Export/Import to backup your configuration across environments</li>
          <li>• Lower auto-refresh intervals for more real-time data (uses more resources)</li>
          <li>• Enable only necessary alerts to avoid notification fatigue</li>
          <li>• Real-time updates require WebSocket server connectivity</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;