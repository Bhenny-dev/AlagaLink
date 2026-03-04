
'use client';
import React from 'react';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';

import ProfileHeader from '@/Components/AlagaLink/profile/ProfileHeader';
import ProfileSidebar from '@/Components/AlagaLink/profile/ProfileSidebar';
import ProfileHistory from '@/Components/AlagaLink/profile/ProfileHistory';
import DigitalIdCard from '@/Components/AlagaLink/profile/DigitalIdCard';

const Profile: React.FC = () => {
  const { currentUser, programRequests } = useAppContext();

  if (!currentUser) return (
    <div className="py-40 text-center space-y-4">
      <i className="fa-solid fa-lock text-5xl text-red-500 opacity-20"></i>
      <h2 className="text-2xl font-black">Secure Profile Area</h2>
      <p className="opacity-40">Please authenticate to view your records.</p>
    </div>
  );

  // Show digital ID for eligible users once an ID request exists (except rejected).
  const idRequest = programRequests.find(r => r.userId === currentUser?.id && r.programType === 'ID' && r.status !== 'Rejected');
  const hasApprovedID = currentUser?.status === 'Active' && !!idRequest && !!currentUser?.idMetadata;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-12">
      <ProfileHeader user={currentUser} />

      {hasApprovedID && currentUser && (
        <section className="animate-in slide-in-from-bottom-6 duration-1000">
          <div className="flex flex-col lg:flex-row items-center gap-12 bg-white dark:bg-alaga-charcoal p-6 md:p-12 rounded-[24px] md:rounded-[48px] border border-gray-100 dark:border-white/5 shadow-2xl relative">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-alaga-blue/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="flex-1 space-y-6 relative z-10 text-center lg:text-left">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-alaga-blue/10 text-alaga-blue rounded-full">
                  <i className="fa-solid fa-id-card-clip text-sm"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">Approved Digital Identity</span>
                </div>
                <h3 className="text-3xl md:text-5xl font-black tracking-tighter leading-none">Your Official ePWD ID</h3>
                <p className="opacity-60 text-base md:text-lg font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Your approved PWD identification card. Click to view full details and QR code.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <div className="flex items-center gap-2 px-5 py-2.5 bg-alaga-teal/10 text-alaga-teal rounded-xl border border-alaga-teal/20 text-[10px] font-black uppercase tracking-widest">
                  <i className="fa-solid fa-shield-check animate-pulse"></i>
                  Verified & Active
                </div>
              </div>
            </div>

            <div className="shrink-0 relative z-10 w-full lg:w-auto">
              <DigitalIdCard user={currentUser} />
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1">
          <ProfileSidebar user={currentUser} />
        </div>

        <div className="lg:col-span-2">
          <ProfileHistory history={currentUser.history.programs} />
        </div>
      </div>
    </div>
  );
};

export default Profile;
