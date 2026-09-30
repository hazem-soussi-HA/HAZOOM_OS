import React from 'react';
import { Notification } from '../../types';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onClose,
  onMarkAsRead
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-hazoom-dark border-l border-hazoom-border shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-hazoom-border flex items-center justify-between">
        <h3 className="font-semibold text-white">Notifications</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">🔔</div>
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`
                p-3 rounded-lg border ${getTypeColor(notif.type)}
                ${notif.read ? 'opacity-50' : 'opacity-100'}
                hover:opacity-80 transition-opacity cursor-pointer
              `}
              onClick={() => onMarkAsRead(notif.id)}
            >
              <div className="flex items-start gap-3">
                <div className="text-xl">{getIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{notif.title}</span>
                    <span className="text-xs opacity-70">
                      {new Date(notif.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs opacity-80">{notif.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-4 border-t border-hazoom-border">
          <button 
            className="w-full px-4 py-2 bg-hazoom-surface hover:bg-hazoom-border rounded-lg text-sm transition-colors"
            onClick={() => notifications.forEach(n => onMarkAsRead(n.id))}
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
};