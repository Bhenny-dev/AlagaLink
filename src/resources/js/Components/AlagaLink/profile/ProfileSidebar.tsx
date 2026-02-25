
import React from 'react';
import { UserProfile } from '@/Providers/AlagaLink/types';

interface ProfileSidebarProps {
  user: UserProfile;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ user }) => {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-alaga-charcoal rounded-[20px] p-8 shadow-sm border border-gray-100 dark:border-white/5">
        <h3 className="font-black text-lg mb-6 flex items-center">
          <i className="fa-solid fa-address-card mr-3 text-alaga-teal"></i>
          Credentials & Meta
        </h3>
        <div className="space-y-5 text-sm">
          {[
            { label: 'Disability', value: user.disabilityCategory, color: 'text-alaga-blue' },
            { label: 'Age', value: `${user.age} Years Old` },
            { label: 'Sex', value: user.sex },
            { label: 'Blood Type', value: user.bloodType },
            { label: 'Contact', value: user.contactNumber },
            { label: 'Address', value: user.address, full: true }
          ].map((item, i) => (
            <div key={i} className={`flex flex-col gap-1 pb-4 ${i !== 5 ? 'border-b border-gray-100 dark:border-white/5' : ''}`}>
              <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">{item.label}</span>
              <span className={`font-bold ${item.color || ''} ${item.full ? 'text-xs' : ''}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-alaga-gold/10 p-8 rounded-[20px] border border-alaga-gold/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <i className="fa-solid fa-phone-volume text-4xl"></i>
        </div>
        <h3 className="font-black text-alaga-navy dark:text-alaga-gold mb-4 uppercase tracking-tighter">Emergency Contact</h3>
        <p className="text-xl font-black mb-1">{user.emergencyContact.name}</p>
        <p className="text-xs font-bold opacity-60 mb-4">{user.emergencyContact.relation}</p>
        <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 p-3 rounded-2xl w-fit">
          <i className="fa-solid fa-phone text-alaga-blue"></i>
          <p className="text-lg font-black text-alaga-blue">{user.emergencyContact.contact}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
