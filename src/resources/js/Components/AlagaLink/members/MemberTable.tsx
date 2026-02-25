
import React from 'react';
import Image from 'next/image';
import { UserProfile } from '@/Providers/AlagaLink/types';

interface MemberTableProps {
  users: UserProfile[];
  onManage: (user: UserProfile) => void;
  canManage?: (user: UserProfile) => boolean;
}

const MemberTable: React.FC<MemberTableProps> = ({ users, onManage, canManage }) => {
  return (
    <div className="bg-white dark:bg-alaga-charcoal rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/5">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-alaga-blue/5 text-alaga-blue uppercase font-bold text-[10px] tracking-wider">
            <tr>
              <th className="px-6 py-4">Profile</th>
              <th className="px-6 py-4">Classification / Role</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {users.length > 0 ? users.map(user => {
              const manageable = canManage ? canManage(user) : true;
              
              return (
                <tr key={user.id} className="hover:bg-alaga-gray dark:hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 flex items-center space-x-3">
                    {user.photoUrl ? (
                      <Image src={user.photoUrl} width={40} height={40} className="w-10 h-10 rounded-full border border-gray-100 dark:border-white/10 object-cover" alt={`${user.firstName} ${user.lastName}`} />
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-gray-100 dark:border-white/10 bg-gray-100" />
                    )}
                    <div>
                      <p className="font-bold">{user.firstName} {user.lastName}</p>
                      <p className="text-[10px] opacity-40 font-mono uppercase">{user.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`w-fit px-2 py-1 rounded text-[10px] font-bold ${
                        user.role === 'SuperAdmin' ? 'bg-alaga-navy text-alaga-gold' :
                        user.role === 'Admin' ? 'bg-red-500 text-white' :
                        'bg-alaga-teal/10 text-alaga-teal'
                      }`}>
                        {user.role === 'User' ? user.disabilityCategory : user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 opacity-70 font-bold truncate max-w-[200px]">{user.address}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => onManage(user)} 
                      className={`px-4 py-2 rounded-lg text-xs font-black transition-all shadow-sm ${
                        manageable 
                          ? 'bg-alaga-blue text-white hover:scale-105 active:scale-95' 
                          : 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-pointer hover:bg-alaga-blue/10 hover:text-alaga-blue'
                      }`}
                    >
                      {manageable ? 'Manage' : 'View Only'}
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={4} className="px-6 py-12 text-center opacity-40 italic">No records found matching criteria.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberTable;
