
'use client';
import React from 'react';
import Image from 'next/image';
import { UserProfile } from '@/Providers/AlagaLink/types';

interface ProfileHeaderProps {
  user: UserProfile;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const canEditProfile = user.role === 'Admin' || user.role === 'SuperAdmin';

  return (
    <div className="bg-white dark:bg-alaga-charcoal rounded-[48px] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-top-10 duration-1000 inflated-card">
      {/* Minimalist "Blank" Background Section */}
      <div className="h-48 relative bg-alaga-gray dark:bg-alaga-navy/30 border-b border-gray-100 dark:border-white/5 shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 dark:to-white/5"></div>
      </div>

      <div className="px-12 pb-16 -mt-24 relative z-10">
        <div className="flex flex-col items-center md:items-start md:flex-row md:items-end justify-between gap-10">

          <div className="flex flex-col items-center md:items-start gap-8">
            {/* 3D Inflated Floating Avatar */}
            <div className="relative group animate-float">
              {/* Complex Layered Glow/Shadow for 3D Effect */}
              <div className="absolute inset-0 rounded-full bg-alaga-blue/20 blur-3xl group-hover:bg-alaga-teal/30 transition-colors duration-700"></div>

              <div className="relative p-3 bg-white dark:bg-alaga-charcoal rounded-full shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] border-8 border-white dark:border-alaga-charcoal transform transition-transform duration-500 group-hover:scale-105">
                <Image
                  src={user.photoUrl}
                  alt={user.firstName}
                  width={192}
                  height={192}
                  className="w-48 h-48 rounded-full object-cover relative z-10 shadow-inner border-2 border-gray-100 dark:border-white/10"
                />

                {/* Orbital Ring Decoration */}
                <div className="absolute -inset-2 rounded-full border-4 border-dashed border-alaga-blue/20 animate-[spin_20s_linear_infinite]"></div>
              </div>

              {/* Verified Badge */}
              <div className="absolute bottom-4 right-4 w-12 h-12 bg-alaga-teal rounded-2xl border-4 border-white dark:border-alaga-charcoal flex items-center justify-center shadow-2xl z-20 rotate-12 group-hover:rotate-0 transition-transform">
                <i className="fa-solid fa-check-double text-white text-lg"></i>
              </div>
            </div>

            <div className="text-center md:text-left space-y-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <h2 className="text-6xl font-black text-3d-heavy tracking-tighter leading-none">
                    {user.firstName} {user.lastName}
                  </h2>
                </div>
                <p className="text-xs font-black uppercase tracking-[0.4em] opacity-30">
                  Municipal Registry Backbone • ID {user.id}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="bg-alaga-blue text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl inner-glow flex items-center gap-3">
                  <i className="fa-solid fa-id-card-clip"></i>
                  {user.role === 'User' ? 'Community Member' : user.role}
                </span>
                <span className="bg-alaga-teal/10 text-alaga-teal px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-alaga-teal/20">
                  Active Status
                </span>
                <span className="px-5 py-2 bg-alaga-gray dark:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-40 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all">
                  <i className="fa-solid fa-map-marker-alt mr-2 text-alaga-blue"></i>
                  {user.address}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {canEditProfile && (
              <button className="px-10 py-5 bg-white dark:bg-alaga-navy/40 border-2 border-gray-100 dark:border-white/10 hover:border-alaga-blue rounded-[28px] font-black text-sm transition-all flex items-center gap-3 shadow-xl group hover:scale-105 active:scale-95">
                <i className="fa-solid fa-user-pen text-lg group-hover:text-alaga-blue"></i>
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
