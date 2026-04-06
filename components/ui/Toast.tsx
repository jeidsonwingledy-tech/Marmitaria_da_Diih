import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { Notification } from '../../types';

interface ToastProps {
  notification: Notification;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 4000);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification.id]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgColors = {
    success: 'bg-white border-green-100',
    error: 'bg-white border-red-100',
    info: 'bg-white border-blue-100'
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl shadow-lg border ${bgColors[notification.type]} animate-in slide-in-from-right-full transition-all duration-300 pointer-events-auto min-w-[300px]`}>
      {icons[notification.type]}
      <p className="text-sm font-medium text-gray-700 flex-1">{notification.message}</p>
      <button 
        onClick={() => onClose(notification.id)}
        className="text-gray-400 hover:text-gray-600 p-1"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{ notifications: Notification[], removeNotification: (id: string) => void }> = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {notifications.map(note => (
        <Toast key={note.id} notification={note} onClose={removeNotification} />
      ))}
    </div>
  );
};