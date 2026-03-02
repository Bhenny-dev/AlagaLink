
'use client';

import React, { useRef, useEffect } from 'react';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, opts?: { force?: boolean }) => void;
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({ isOpen, onClose, onNavigate }) => {
  const { notifications, markNotificationRead, clearAllNotifications, setSearchSignal } = useAppContext();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div
      ref={popoverRef}
      className="absolute top-full right-0 mt-5 w-[400px] bg-white dark:bg-alaga-charcoal rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-white/10 z-[300] animate-in fade-in zoom-in-95 slide-in-from-top-3 duration-300 origin-top-right overflow-hidden"
    >
      {/* Tip of the popover */}
      <div className="absolute -top-1.5 right-6 w-4 h-4 bg-alaga-blue rotate-45"></div>

      <header className="relative p-6 bg-alaga-blue text-white overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
          <i className="fa-solid fa-bell text-6xl"></i>
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black uppercase tracking-widest text-white">Alert Center</h3>
            <p className="text-[11px] font-bold mt-0.5 text-white/90">
              {unreadCount > 0 ? `You have ${unreadCount} new notifications` : 'Your registry is up to date'}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); clearAllNotifications(); }}
            className="text-[10px] font-black uppercase tracking-widest bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl transition-all border border-white/10 text-white"
          >
            Clear All
          </button>
        </div>
      </header>

      <div className="max-h-[420px] overflow-y-auto no-scrollbar py-2 bg-white dark:bg-alaga-charcoal">
        {notifications.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center opacity-30 space-y-4">
            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-2">
              <i className="fa-solid fa-bell-slash text-3xl"></i>
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">No New Alerts</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => {
                  markNotificationRead(notif.id);
                  if (notif.link) {
                    // Support structured links of the form "page:section:itemId"
                    const parts = notif.link.split(':');
                    const page = parts[0] || notif.link;
                    const section = parts[1];
                    const itemId = parts[2];
                    // If structured, set searchSignal so target page can open the exact item
                    if (section) {
                      setSearchSignal({ page, section, itemId });
                    }
                    onNavigate(page, { force: true });
                    onClose();
                  }
                }}
                className={`p-5 flex gap-5 cursor-pointer transition-all hover:bg-alaga-gray dark:hover:bg-alaga-navy/40 relative group ${
                  !notif.isRead ? 'bg-blue-50/50 dark:bg-alaga-blue/5 border-l-4 border-l-alaga-blue' : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${
                  notif.type === 'Success' ? 'bg-green-100 text-green-700 dark:bg-alaga-teal/20 dark:text-alaga-teal' :
                  notif.type === 'Urgent' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-500' :
                  notif.type === 'Warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-alaga-gold/20 dark:text-alaga-gold' :
                  'bg-blue-100 text-blue-700 dark:bg-alaga-blue/20 dark:text-alaga-blue'
                }`}>
                  <i className={`fa-solid ${
                    notif.type === 'Success' ? 'fa-circle-check' :
                    notif.type === 'Urgent' ? 'fa-triangle-exclamation' :
                    notif.type === 'Warning' ? 'fa-circle-exclamation' :
                    'fa-circle-info'
                  } text-lg`}></i>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-xs font-black uppercase tracking-wider ${notif.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed font-semibold ${notif.isRead ? 'text-gray-500/80 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                    {notif.message}
                  </p>
                </div>

                {!notif.isRead && (
                  <div className="w-2.5 h-2.5 bg-alaga-blue rounded-full mt-1.5 shrink-0 shadow-[0_0_10px_rgba(37,70,240,0.5)]"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/80 dark:bg-black/20 text-center">
         <button
           onClick={() => { onNavigate('profile', { force: true }); onClose(); }}
           className="text-[10px] font-black uppercase text-alaga-blue dark:text-blue-400 tracking-[0.2em] hover:opacity-70 transition-opacity flex items-center justify-center gap-2 mx-auto"
         >
           Access Detailed History
           <i className="fa-solid fa-arrow-right-long"></i>
         </button>
      </footer>
    </div>
  );
};

export default NotificationPopover;
