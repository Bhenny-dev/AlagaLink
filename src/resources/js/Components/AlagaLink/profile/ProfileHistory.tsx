
import React, { useState } from 'react';
import { ProgramAvailment } from '@/Providers/AlagaLink/types';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';
import { getNotificationPresentation } from '@/Components/AlagaLink/notifications/notificationPresentation';

interface ProfileHistoryProps {
  history: ProgramAvailment[];
}

const ProfileHistory: React.FC<ProfileHistoryProps> = ({ history }) => {
  const { notifications, users, programRequests, reports } = useAppContext();
  const [activeTab, setActiveTab] = useState<'Services' | 'Activities'>('Services');

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
                p.status === 'Completed' || p.status === 'Approved' ? 'bg-alaga-teal text-white' :
                p.status === 'Rejected' ? 'bg-red-500 text-white' : 'bg-alaga-gold text-alaga-navy'
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
        notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((notif) => (
          (() => {
            const presentation = getNotificationPresentation({
              notif,
              users,
              programRequests,
              reports,
            });

            return (
          <div key={notif.id} className="p-6 bg-alaga-gray dark:bg-alaga-navy/20 rounded-3xl flex items-start gap-6 border border-transparent hover:border-alaga-blue/20 transition-all">
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
          </div>
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
    </div>
  );
};

export default ProfileHistory;
