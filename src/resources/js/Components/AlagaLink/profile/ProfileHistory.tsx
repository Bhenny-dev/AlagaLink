
import React, { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Notification, ProgramAvailment } from '@/Providers/AlagaLink/types';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';
import { getNotificationPresentation, parseNotificationLink } from '@/Components/AlagaLink/notifications/notificationPresentation';

interface ProfileHistoryProps {
  history: ProgramAvailment[];
}

const ProfileHistory: React.FC<ProfileHistoryProps> = ({ history }) => {
  const { notifications, users, programRequests, reports, setSearchSignal } = useAppContext();
  const [activeTab, setActiveTab] = useState<'Services' | 'Activities'>('Services');
  const [activeNotif, setActiveNotif] = useState<Notification | null>(null);

  const activityItems = useMemo(() => {
    return [...notifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notifications]);

  const activePresentation = useMemo(() => {
    if (!activeNotif) return null;
    return getNotificationPresentation({
      notif: activeNotif,
      users,
      programRequests,
      reports,
    });
  }, [activeNotif, users, programRequests, reports]);

  const activeCategory = useMemo(() => {
    const action = (activeNotif as any)?.data?.action as string | undefined;
    if (action === 'role_changed') return 'Registry';

    if (!activeNotif?.link) return 'System';
    const link = activeNotif.link;
    if (link.startsWith('programs:')) return 'Programs';
    if (link.startsWith('lost-found:')) return 'Lost & Found';
    if (link.startsWith('members:')) return 'Registry';
    return 'System';
  }, [activeNotif]);

  const handleOpenNotification = (notif: Notification) => {
    if (!notif.link) return;

    const parsed = parseNotificationLink(notif.link);
    const page = parsed?.page || '';
    if (!page) return;

    const routeByPage: Record<string, string> = {
      home: '/dashboard',
      programs: '/programs',
      'lost-found': '/lost-found',
      members: '/members',
      profile: '/identity-profile',
      about: '/about',
    };

    const url = routeByPage[page];
    if (!url) return;

    if (parsed?.section || parsed?.itemId) {
      setSearchSignal({ page, section: parsed?.section, itemId: parsed?.itemId });
    }

    setActiveNotif(null);
    router.visit(url);
  };

  const renderServices = () => (
    <div className="space-y-4 animate-in fade-in duration-300">
      {history.length === 0 ? (
        <div className="text-center py-20 bg-alaga-gray dark:bg-alaga-navy/10 rounded-[20px] border-2 border-dashed border-gray-200 dark:border-white/5">
          <i className="fa-solid fa-clock-rotate-left text-5xl opacity-20 mb-4"></i>
          <p className="opacity-40 font-bold">No programs or services availed yet.</p>
          <p className="text-xs opacity-40 mt-2">Browse the Programs page to see what is available.</p>
        </div>
      ) : (
        history.map((p, i) => (
          <div key={i} className="flex items-center justify-between p-6 bg-alaga-gray dark:bg-alaga-navy/20 rounded-3xl hover:translate-x-2 transition-transform cursor-default group">
            <div className="flex items-center space-x-5">
              <div className="w-14 h-14 bg-white dark:bg-alaga-charcoal rounded-2xl flex items-center justify-center text-alaga-blue shadow-sm group-hover:bg-alaga-blue group-hover:text-white transition-colors">
                <i className="fa-solid fa-file-invoice text-xl"></i>
              </div>
              <div>
                <p className="font-black text-lg text-gray-900 dark:text-white">{p.title}</p>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{p.programType} • {p.dateApplied}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                p.status === 'Completed' || p.status === 'Approved' || p.status === 'Claimed' ? 'bg-alaga-teal text-white' :
                p.status === 'Rejected' ? 'bg-red-500 text-white' :
                p.status === 'Ready for Claiming' ? 'bg-purple-500 text-white' :
                'bg-alaga-gold text-alaga-navy'
              }`}>
                {p.status}
              </span>
              {p.paymentStatus && <p className="text-[9px] mt-1 font-bold text-gray-400 dark:text-gray-500">{p.paymentStatus} Payment</p>}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderActivities = () => (
    <div className="space-y-4 animate-in fade-in duration-300">
      {notifications.length === 0 ? (
        <div className="text-center py-20 bg-alaga-gray dark:bg-alaga-navy/10 rounded-[20px] border-2 border-dashed border-gray-200 dark:border-white/5">
          <i className="fa-solid fa-list-check text-5xl opacity-20 mb-4"></i>
          <p className="opacity-40 font-bold">No activity logs recorded.</p>
        </div>
      ) : (
        activityItems.map((notif) => (
          (() => {
            const presentation = getNotificationPresentation({
              notif,
              users,
              programRequests,
              reports,
            });

            return (
          <button
            type="button"
            key={notif.id}
            onClick={() => setActiveNotif(notif)}
            className="w-full text-left p-6 bg-alaga-gray dark:bg-alaga-navy/20 rounded-3xl flex items-start gap-6 border border-transparent hover:border-alaga-blue/20 transition-all"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
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
                 <p className="text-xs font-black uppercase tracking-widest text-gray-950 dark:text-white">{presentation.title}</p>
                 <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{new Date(notif.date).toLocaleDateString()}</span>
               </div>
               <p className="text-sm font-medium leading-relaxed text-gray-700 dark:text-gray-300">{presentation.message}</p>
               {presentation.meta && (
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-2">{presentation.meta}</p>
               )}
            </div>
            <div className="shrink-0 pt-1 opacity-30">
              <i className="fa-solid fa-chevron-right"></i>
            </div>
          </button>
            );
          })()
        ))
      )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-alaga-charcoal rounded-[20px] p-10 shadow-sm border border-gray-100 dark:border-white/5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <h3 className="text-2xl font-black text-gray-900 dark:text-white">Registry Activity Log</h3>
        <div className="flex p-1 bg-alaga-gray dark:bg-alaga-navy/40 rounded-xl">
           <button
             onClick={() => setActiveTab('Services')}
             className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Services' ? 'bg-white dark:bg-alaga-charcoal text-alaga-blue shadow-sm' : 'opacity-40'}`}
           >
             Services
           </button>
           <button
             onClick={() => setActiveTab('Activities')}
             className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Activities' ? 'bg-white dark:bg-alaga-charcoal text-alaga-blue shadow-sm' : 'opacity-40'}`}
           >
             Activities
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {activeTab === 'Services' ? renderServices() : renderActivities()}
      </div>

      {activeNotif && activePresentation && (
        <div className="fixed inset-0 z-[220] bg-black/70 backdrop-blur-md flex items-start justify-center p-0 md:p-10 alagalink-overlay-scroll alagalink-topbar-safe" role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-alaga-charcoal w-full h-full md:h-auto md:max-h-[85vh] md:rounded-[32px] overflow-hidden relative shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/10">
            <button
              onClick={() => setActiveNotif(null)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-20 shadow-xl border border-white/10"
              aria-label="Close"
              type="button"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>

            <div className="p-8 md:p-12 space-y-8 overflow-y-auto no-scrollbar max-h-[85vh]">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-alaga-gray dark:bg-alaga-navy/30">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Category</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-alaga-blue">{activeCategory}</span>
                </div>
                <h4 className="text-2xl md:text-4xl font-black text-3d">{activePresentation.title}</h4>
                <p className="text-sm md:text-base opacity-70 font-medium leading-relaxed">{activePresentation.message}</p>
                {activePresentation.meta && (
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">{activePresentation.meta}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-alaga-gray dark:bg-alaga-navy/20 rounded-[24px] border border-gray-100 dark:border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">When</p>
                  <p className="font-black text-sm">{new Date(activeNotif.date).toLocaleString()}</p>
                </div>
                <div className="p-6 bg-alaga-gray dark:bg-alaga-navy/20 rounded-[24px] border border-gray-100 dark:border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Type</p>
                  <p className="font-black text-sm">{activeNotif.type}</p>
                </div>
              </div>

              {(activeNotif.link || activePresentation.destination) && (
                <div className="p-6 bg-white dark:bg-alaga-charcoal rounded-[24px] border border-gray-100 dark:border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-3">Reference</p>
                  <div className="space-y-1">
                    {activePresentation.destination && (
                      <p className="text-sm font-bold opacity-80">Destination: <span className="font-black text-alaga-blue">{activePresentation.destination}</span></p>
                    )}
                    {activeNotif.link && (
                      <p className="text-xs font-mono opacity-50 break-words">Link: {activeNotif.link}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-4">
                {activeNotif.link && (
                  <button
                    onClick={() => handleOpenNotification(activeNotif)}
                    className="px-8 py-3 bg-alaga-gray dark:bg-alaga-navy/30 rounded-xl text-xs font-black shadow-lg border border-gray-100 dark:border-white/5"
                    type="button"
                  >
                    Open
                  </button>
                )}
                <button
                  onClick={() => setActiveNotif(null)}
                  className="px-8 py-3 bg-alaga-blue text-white rounded-xl text-xs font-black shadow-lg"
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileHistory;
