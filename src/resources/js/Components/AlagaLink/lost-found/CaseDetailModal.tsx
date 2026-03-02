
'use client';
import React from 'react';
import Image from 'next/image';
import { LostReport } from '@/Providers/AlagaLink/types';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';

interface CaseDetailModalProps {
  report: LostReport;
  onClose: () => void;
}

const CaseDetailModal: React.FC<CaseDetailModalProps> = ({ report, onClose }) => {
  const { currentUser, users, updateReport } = useAppContext();

  // Find the linked user profile
  const subjectUser = users.find(u => u.id === report.userId);
  const isFound = report.status === 'Found';

  const handleMarkFound = () => {
    // In a real app, this would open a narrative form
    if (confirm(`Confirm ${report.name} has been found? This will move the case to 'Found' status.`)) {
      updateReport({
        ...report,
        status: 'Found',
      });
    }
  };

  const canManageCase = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-10 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-alaga-charcoal w-full h-full md:max-w-4xl md:h-[85vh] md:rounded-[32px] shadow-2xl relative flex flex-col md:flex-row animate-in zoom-in-95 duration-300 overflow-hidden">

        {/* Left Side: Photo & Quick Status */}
        <div className="md:w-5/12 relative h-64 md:h-auto shrink-0 group">
          <Image
            src={report.photoUrl || subjectUser?.photoUrl || `https://picsum.photos/seed/${report.id}/800/800`}
            alt={report.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

          {/* Improved Visibility Back Button */}
          <button
            onClick={onClose}
            className="absolute top-6 left-6 w-12 h-12 flex items-center justify-center rounded-full bg-alaga-blue text-white shadow-[0_10px_30px_rgba(37,70,240,0.5)] border-2 border-white/20 hover:scale-110 active:scale-95 hover:bg-blue-600 transition-all z-20"
            aria-label="Return to list"
          >
            <i className="fa-solid fa-arrow-left text-xl"></i>
          </button>

          <div className="absolute bottom-8 left-8 right-8 text-white">
            <div className={`w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-xl ${isFound ? 'bg-alaga-teal' : 'bg-red-500 animate-pulse'}`}>
              {report.status} Status
            </div>
            <h2 className="text-4xl font-black mb-2">{report.name}</h2>
            <p className="text-sm opacity-80 font-medium flex items-center gap-2">
              <i className="fa-solid fa-fingerprint text-alaga-gold"></i>
              Registry ID: {report.userId}
            </p>
          </div>
        </div>

        {/* Right Side: Scrollable Details */}
        <div className="md:w-7/12 flex-1 flex flex-col bg-white dark:bg-alaga-charcoal overflow-y-auto no-scrollbar">
          <div className="p-8 md:p-10 space-y-10">

            {/* 1. Incident Details */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-red-500">
                <i className="fa-solid fa-person-circle-exclamation text-xl"></i>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Active Incident Profile</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Last Seen At', value: report.lastSeen, icon: 'fa-location-crosshairs' },
                  { label: 'Physical Height', value: report.height, icon: 'fa-ruler-vertical' },
                  { label: 'Body Type', value: report.bodyType, icon: 'fa-user-tag' },
                  { label: 'Time of Report', value: new Date(report.timeMissing).toLocaleDateString(), icon: 'fa-calendar-check' },
                  { label: 'Visibility Status', value: report.isPosted ? 'Publicly Distributed' : 'Internal Alert', icon: 'fa-bullhorn' }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-alaga-gray dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                    <p className="text-[9px] font-black uppercase opacity-40 mb-2 flex items-center gap-2">
                      <i className={`fa-solid ${item.icon}`}></i> {item.label}
                    </p>
                    <p className="text-xs font-black">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-alaga-gray dark:bg-white/5 rounded-2xl space-y-4">
                 <div>
                    <p className="text-[10px] font-black uppercase opacity-40 mb-1">Clothing Description</p>
                    <p className="text-xs font-bold leading-relaxed">{report.clothes}</p>
                 </div>
                 <div className="pt-4 border-t border-gray-200 dark:border-white/5">
                    <p className="text-[10px] font-black uppercase opacity-40 mb-1">Behavioral Context / Narrative</p>
                    <p className="text-xs opacity-70 leading-relaxed italic">&quot;{report.description}&quot;</p>
                 </div>
                 {report.missingNarrative && (
                    <div className="pt-4 border-t border-gray-200 dark:border-white/5 space-y-3">
                       <p className="text-[10px] font-black uppercase opacity-40 mb-2">Missing Incident Details</p>
                       <div className="grid grid-cols-2 gap-3 text-xs">
                         {report.missingNarrative.what && (
                           <div className="flex gap-2 items-start">
                             <i className="fa-solid fa-circle-question text-alaga-blue mt-0.5 flex-shrink-0"></i>
                             <div>
                               <p className="font-black opacity-60 text-[8px]">What</p>
                               <p className="font-medium">{report.missingNarrative.what}</p>
                             </div>
                           </div>
                         )}
                         {report.missingNarrative.when && (
                           <div className="flex gap-2 items-start">
                             <i className="fa-solid fa-clock text-alaga-blue mt-0.5 flex-shrink-0"></i>
                             <div>
                               <p className="font-black opacity-60 text-[8px]">When</p>
                               <p className="font-medium">{report.missingNarrative.when}</p>
                             </div>
                           </div>
                         )}
                         {report.missingNarrative.why && (
                           <div className="flex gap-2 items-start">
                             <i className="fa-solid fa-lightbulb text-alaga-blue mt-0.5 flex-shrink-0"></i>
                             <div>
                               <p className="font-black opacity-60 text-[8px]">Why</p>
                               <p className="font-medium">{report.missingNarrative.why}</p>
                             </div>
                           </div>
                         )}
                         {report.missingNarrative.how && (
                           <div className="flex gap-2 items-start">
                             <i className="fa-solid fa-link text-alaga-blue mt-0.5 flex-shrink-0"></i>
                             <div>
                               <p className="font-black opacity-60 text-[8px]">How</p>
                               <p className="font-medium">{report.missingNarrative.how}</p>
                             </div>
                           </div>
                         )}
                       </div>
                    </div>
                 )}
                 {report.dissemination && (
                    <div className="pt-4 border-t border-gray-200 dark:border-white/5 space-y-2">
                       <p className="text-[10px] font-black uppercase opacity-40 mb-2">Dissemination Status</p>
                       <div className="flex gap-3 flex-wrap text-xs">
                         {report.dissemination.radio && (
                           <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full border border-red-200 dark:border-red-900">
                             <i className="fa-solid fa-broadcast-tower"></i>
                             <span className="font-bold">Radio Alert</span>
                           </div>
                         )}
                         {report.dissemination.socialMedia && (
                           <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-900">
                             <i className="fa-solid fa-share-nodes"></i>
                             <span className="font-bold">Social Media</span>
                           </div>
                         )}
                       </div>
                    </div>
                 )}
              </div>
            </section>

            {/* 2. Official Member Credentials */}
            {subjectUser && (
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-alaga-blue">
                  <i className="fa-solid fa-id-card-clip text-xl"></i>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Registry Data</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-4 bg-alaga-blue/5 border border-alaga-blue/10 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-alaga-blue text-white flex items-center justify-center shrink-0">
                       <i className="fa-solid fa-handicap text-sm"></i>
                    </div>
                    <div>
                       <p className="text-[8px] font-black uppercase opacity-40">Disability Category</p>
                       <p className="text-xs font-black truncate max-w-[150px]">{subjectUser.disabilityCategory}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-alaga-blue/5 border border-alaga-blue/10 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-alaga-blue text-white flex items-center justify-center shrink-0">
                       <i className="fa-solid fa-cake-candles text-sm"></i>
                    </div>
                    <div>
                       <p className="text-[8px] font-black uppercase opacity-40">Age / Sex</p>
                       <p className="text-xs font-black">{subjectUser.age} Yrs • {subjectUser.sex}</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 3. Emergency Contacts & Family */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-alaga-teal">
                <i className="fa-solid fa-people-group text-xl"></i>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Emergency & Family Network</h4>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {/* Primary Emergency Contact */}
                 <div className="p-6 bg-alaga-teal/5 border border-alaga-teal/10 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-5">
                       <div className="w-10 h-10 rounded-full bg-white dark:bg-alaga-charcoal flex items-center justify-center text-alaga-teal shadow-sm">
                          <i className="fa-solid fa-phone-volume"></i>
                       </div>
                       <div>
                          <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">Primary Guardian Contact</p>
                          <p className="text-lg font-black text-alaga-navy dark:text-white">{subjectUser?.emergencyContact.name}</p>
                          <p className="text-[10px] font-bold opacity-60 uppercase">{subjectUser?.emergencyContact.relation}</p>
                       </div>
                    </div>
                    <a href={`tel:${subjectUser?.emergencyContact.contact}`} className="px-5 py-2.5 bg-alaga-teal text-white rounded-2xl font-black text-[10px] shadow-xl hover:scale-105 transition-all">
                       Call Now
                    </a>
                 </div>

                 {/* Other Registered Family Members */}
                 <div className="grid grid-cols-1 gap-4">
                    {subjectUser?.familyComposition && subjectUser.familyComposition.length > 0 ? (
                      subjectUser.familyComposition.map(fam => (
                        <div key={fam.id} className="p-4 bg-white dark:bg-alaga-navy/20 border border-gray-100 dark:border-white/5 rounded-2xl flex items-center justify-between">
                           <div>
                              <p className="text-xs font-black">{fam.fullName}</p>
                              <p className="text-[9px] font-bold opacity-40 uppercase">{fam.relation} • {fam.age} Yrs</p>
                           </div>
                           <button className="w-8 h-8 rounded-full bg-alaga-gray dark:bg-white/5 flex items-center justify-center text-alaga-blue hover:bg-alaga-blue hover:text-white transition-all">
                              <i className="fa-solid fa-message text-[10px]"></i>
                           </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 bg-alaga-gray dark:bg-white/5 rounded-2xl text-center opacity-40 border border-dashed border-gray-200">
                         <p className="text-[10px] font-bold italic">No secondary family members registered.</p>
                      </div>
                    )}
                 </div>
              </div>
            </section>

            {/* Official Hotlines & Actions */}
            <div className="pt-8 border-t border-gray-100 dark:border-white/5 space-y-6">
              <div className="bg-alaga-gold text-alaga-navy p-6 rounded-[24px] shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 transition-transform group-hover:scale-125">
                    <i className="fa-solid fa-phone-flip text-5xl"></i>
                 </div>
                 <div className="relative z-10 text-center space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60">PDAO Hotline</p>
                    <p className="text-3xl font-black">0912-345-6789</p>
                    <p className="text-[10px] font-medium opacity-70">Official coordination line.</p>
                 </div>
              </div>

              {!isFound && (
                <div className="flex flex-col sm:flex-row gap-4">
                   <button className="flex-1 bg-alaga-blue text-white py-4 rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                      <i className="fa-solid fa-share-nodes"></i> Share Public Alert
                   </button>
                   {canManageCase && (
                     <button
                        onClick={handleMarkFound}
                        className="flex-1 bg-alaga-teal text-white py-4 rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                        <i className="fa-solid fa-circle-check"></i> Mark as Found
                     </button>
                   )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailModal;
