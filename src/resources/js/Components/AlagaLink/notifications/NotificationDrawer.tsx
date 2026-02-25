
import React from 'react';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onNavigate }) => {
  const { notifications, markNotificationRead, clearAllNotifications } = useAppContext();

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-[250] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white dark:bg-alaga-charcoal h-full shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right duration-500">
        <header className="p-10 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-alaga-blue text-white shrink-0 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
            <i className="fa-solid fa-bell text-[180px]"></i>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-black">Alert Hub</h3>
            <p className="text-xs opacity-70 font-black uppercase tracking-[0.2em] mt-1">
              {unreadCount} New Municipal Records
            </p>
          </div>
          <button onClick={onClose} className="relative z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all border border-white/10">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-white dark:bg-alaga-charcoal">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-6">
              <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                <i className="fa-solid fa-ghost text-5xl"></i>
              </div>
              <div className="text-center">
                <p className="text-xl font-black uppercase tracking-widest">Registry Clear</p>
                <p className="text-xs font-bold mt-2">No active notifications detected.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map(notif => (
                <div 
                  key={notif.id}
                  onClick={() => {
                    markNotificationRead(notif.id);
                    if (notif.link) {
                      onNavigate(notif.link);
                      onClose();
                    }
                  }}
                  className={`p-7 rounded-[28px] border-2 transition-all cursor-pointer relative group ${
                    notif.isRead 
                      ? 'bg-white dark:bg-alaga-charcoal border-gray-50 dark:border-white/5' 
                      : 'bg-alaga-blue/5 dark:bg-alaga-blue/10 border-alaga-blue/20 shadow-xl shadow-alaga-blue/5'
                  } hover:scale-[1.02] active:scale-95`}
                >
                  <div className="flex gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                      notif.type === 'Success' ? 'bg-alaga-teal text-white' :
                      notif.type === 'Urgent' ? 'bg-red-500 text-white animate-pulse' :
                      notif.type === 'Warning' ? 'bg-alaga-gold text-alaga-navy' :
                      'bg-alaga-blue text-white'
                    }`}>
                      <i className={`fa-solid ${
                        notif.type === 'Success' ? 'fa-circle-check' :
                        notif.type === 'Urgent' ? 'fa-triangle-exclamation' :
                        notif.type === 'Warning' ? 'fa-circle-exclamation' :
                        'fa-circle-info'
                      } text-xl`}></i>
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-black uppercase tracking-[0.15em] ${notif.isRead ? 'opacity-40' : 'text-alaga-blue dark:text-alaga-blue'}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2.5 h-2.5 bg-alaga-blue rounded-full shadow-[0_0_10px_rgba(37,70,240,0.5)]"></span>
                        )}
                      </div>
                      <p className={`text-base leading-relaxed font-semibold ${notif.isRead ? 'opacity-40' : 'text-gray-900 dark:text-white/90'}`}>
                        {notif.message}
                      </p>
                      <div className="pt-2 flex items-center gap-2">
                        <i className="fa-solid fa-clock text-[10px] opacity-20"></i>
                        <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">
                          {new Date(notif.date).toLocaleDateString()} • {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="p-10 border-t border-gray-100 dark:border-white/5 shrink-0 bg-alaga-gray dark:bg-alaga-navy/20">
          <button 
            onClick={clearAllNotifications}
            className="w-full py-5 bg-alaga-blue text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-alaga-blue/30 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Mark Everything as Read
          </button>
        </footer>
      </div>
    </div>
  );
};

export default NotificationDrawer;
