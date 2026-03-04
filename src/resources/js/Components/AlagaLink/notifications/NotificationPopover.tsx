'use client';

import React, { useRef, useEffect } from 'react';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';
import { getNotificationPresentation, parseNotificationLink } from './notificationPresentation';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, opts?: { force?: boolean }) => void;
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({ isOpen, onClose, onNavigate }) => {
  const { notifications, users, programRequests, reports, markNotificationRead, clearAllNotifications, setSearchSignal } = useAppContext();
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
            onClick={(e) => {
              e.stopPropagation();
              clearAllNotifications();
            }}
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
            {notifications.map(notif => {
              const presentation = getNotificationPresentation({
                notif,
                users,
                programRequests,
                reports,
              });

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationRead(notif.id);
                    if (notif.link) {
                      const parsed = parseNotificationLink(notif.link);
                      const page = parsed?.page || notif.link;

                      if (parsed?.section || parsed?.itemId) {
                        setSearchSignal({ page, section: parsed?.section, itemId: parsed?.itemId });
                      }

                      onNavigate(page, { force: true });
                      onClose();
                    }
                  }}
                  className={`px-6 py-5 hover:bg-alaga-blue/5 dark:hover:bg-white/5 cursor-pointer transition-all ${
                    notif.isRead ? 'opacity-60' : 'opacity-100'
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        notif.type === 'Success' ? 'bg-alaga-teal text-white' :
                        notif.type === 'Urgent' ? 'bg-red-500 text-white' :
                        notif.type === 'Warning' ? 'bg-alaga-gold text-alaga-navy' :
                        'bg-alaga-blue text-white'
                      }`}
                    >
                      <i
                        className={`fa-solid ${
                          notif.type === 'Success' ? 'fa-circle-check' :
                          notif.type === 'Urgent' ? 'fa-triangle-exclamation' :
                          notif.type === 'Warning' ? 'fa-circle-exclamation' :
                          'fa-circle-info'
                        } text-sm`}
                      ></i>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white truncate">
                          {presentation.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 bg-alaga-blue rounded-full shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-white/80 mt-1 leading-relaxed">
                        {presentation.message}
                      </p>
                      {(presentation.meta || presentation.destination) && (
                        <div className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-40">
                          {[presentation.destination, presentation.meta].filter(Boolean).join(' • ')}
                        </div>
                      )}
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-3">
                        {new Date(notif.date).toLocaleDateString()} •{' '}
                        {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPopover;
