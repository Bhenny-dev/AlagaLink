
'use client';
import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';
import { UserProfile, LostReport } from '@/Providers/AlagaLink/types';
import ImageInput from '../shared/ImageInput';

interface ReportMissingWizardProps {
  onClose: () => void;
  onNavigate: (page: string) => void;
  onSubmit: (report: LostReport) => void;
}

const ReportMissingWizard: React.FC<ReportMissingWizardProps> = ({ onClose, onNavigate, onSubmit }) => {
  const { users, currentUser } = useAppContext();
  const [stage, setStage] = useState<'Search' | 'Details'>('Search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  const [formData, setFormData] = useState({
    lastSeen: '',
    clothes: '',
    bodyType: '',
    height: '',
    description: '',
    photoUrl: ''
  });

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return users.filter(u => 
      u.role !== 'Admin' && 
      (`${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
       u.id.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, users]);

  const handleUserSelect = (user: UserProfile) => {
    setSelectedUser(user);
    setFormData(prev => ({ ...prev, photoUrl: user.photoUrl }));
    setStage('Details');
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const newReport: LostReport = {
      id: `R-${Date.now()}`,
      userId: selectedUser.id,
      name: `${selectedUser.firstName} ${selectedUser.lastName}`,
      reporterId: currentUser?.id || 'ANONYMOUS',
      timeMissing: new Date().toISOString(),
      lastSeen: formData.lastSeen,
      description: formData.description,
      clothes: formData.clothes,
      height: formData.height,
      bodyType: formData.bodyType,
      dissemination: {
        radio: false,
        socialMedia: true,
        context: 'Initial system report filed.'
      },
      status: 'Missing',
      isPosted: false,
      photoUrl: formData.photoUrl || selectedUser.photoUrl
    };

    onSubmit(newReport);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-alaga-charcoal w-full h-full md:max-w-2xl md:h-[85vh] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
        
        <header className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-red-500 text-white shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <i className={`fa-solid ${stage === 'Search' ? 'fa-magnifying-glass' : 'fa-clipboard-list'} text-lg`}></i>
             </div>
             <div>
                <h3 className="text-xl font-black">{stage === 'Search' ? 'Verify Identity' : 'Incident Specifics'}</h3>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Official Missing Report</p>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
          {stage === 'Search' ? (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="text-center max-w-md mx-auto space-y-3">
                 <h4 className="text-xl font-black">Find Registered Member</h4>
                 <p className="text-sm opacity-60 leading-relaxed font-medium">Link this report to an existing registry profile.</p>
              </div>

              <div className="relative group max-w-xl mx-auto">
                <i className="fa-solid fa-search absolute left-5 top-1/2 -translate-y-1/2 opacity-30 text-lg group-focus-within:text-red-500 transition-colors"></i>
                <input 
                  autoFocus
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Name or LT-PWD Number..." 
                  className="w-full pl-14 pr-6 py-4 bg-alaga-gray dark:bg-alaga-navy/20 border-2 border-transparent rounded-[20px] font-bold text-base outline-none focus:bg-white dark:focus:bg-alaga-navy/40 focus:border-red-500 transition-all shadow-sm"
                />
              </div>

              <div className="max-w-xl mx-auto">
                {searchQuery && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    {searchResults.length > 0 ? (
                      <>
                        <p className="text-[10px] font-black uppercase opacity-40 tracking-widest px-2">Matches ({searchResults.length})</p>
                        {searchResults.map(u => (
                          <div 
                            key={u.id} 
                            onClick={() => handleUserSelect(u)}
                            className="p-4 bg-white dark:bg-alaga-navy/20 rounded-[20px] border border-gray-100 dark:border-white/5 flex items-center justify-between cursor-pointer hover:border-red-500 hover:shadow-xl transition-all group"
                          >
                            <div className="flex items-center gap-4">
                               {u.photoUrl ? (
                                 <Image src={u.photoUrl} width={48} height={48} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm" alt={`${u.firstName} ${u.lastName}`} />
                               ) : (
                                 <div className="w-12 h-12 rounded-2xl bg-gray-100 border-2 border-white shadow-sm" />
                               )}
                               <div>
                                  <p className="font-black text-sm">{u.firstName} {u.lastName}</p>
                                  <p className="text-[9px] font-mono opacity-40 uppercase">{u.id}</p>
                               </div>
                            </div>
                            <i className="fa-solid fa-chevron-right text-red-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"></i>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="py-8 bg-red-50 dark:bg-red-500/5 rounded-[24px] border-2 border-dashed border-red-100 dark:border-red-500/10 text-center space-y-4">
                        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl"><i className="fa-solid fa-user-slash"></i></div>
                        <div className="max-w-xs mx-auto px-4"><h5 className="font-black text-lg">Member Not Found</h5><p className="text-xs opacity-60 leading-relaxed mt-1">Person not in AlagaLink registry.</p></div>
                        <button onClick={() => { onNavigate('members'); onClose(); }} className="bg-red-500 text-white px-8 py-3 rounded-2xl font-black text-xs shadow-xl hover:scale-105 transition-all">Register New Member</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleFinalSubmit} className="space-y-10 animate-in slide-in-from-right-4 duration-500 pb-10">
               <div className="flex flex-col md:flex-row gap-6 items-center bg-alaga-blue/5 p-6 rounded-[24px] border border-alaga-blue/10">
                  {selectedUser?.photoUrl ? (
                    <Image src={selectedUser.photoUrl} width={96} height={96} className="w-24 h-24 rounded-[20px] object-cover shadow-2xl border-4 border-white shrink-0" alt={`${selectedUser?.firstName} ${selectedUser?.lastName}`} />
                  ) : (
                    <div className="w-24 h-24 rounded-[20px] bg-gray-100 shadow-2xl border-4 border-white shrink-0" />
                  )}
                  <div>
                    <h4 className="text-2xl font-black text-alaga-blue">{selectedUser?.firstName} {selectedUser?.lastName}</h4>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-2">Registry ID: {selectedUser?.id}</p>
                    <button type="button" onClick={() => setStage('Search')} className="text-[10px] font-black underline opacity-60 hover:opacity-100 transition-opacity">Change Selected Member</button>
                  </div>
               </div>

               <ImageInput 
                 value={formData.photoUrl} 
                 onChange={val => setFormData({...formData, photoUrl: val})} 
                 label="Current Incident Photo (Overrides Profile)"
                 aspect="square"
               />

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Last Seen At</label><input required value={formData.lastSeen} onChange={e => setFormData({...formData, lastSeen: e.target.value})} className="w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/20 border-none outline-none focus:ring-2 ring-red-500/30 font-bold text-sm" placeholder="e.g. Km. 5 Market" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Approx. Height</label><input required value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/20 border-none outline-none focus:ring-2 ring-red-500/30 font-bold text-sm" placeholder="e.g. 5 feet 4 inches" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Clothing Colors</label><input required value={formData.clothes} onChange={e => setFormData({...formData, clothes: e.target.value})} className="w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/20 border-none outline-none focus:ring-2 ring-red-500/30 font-bold text-sm" placeholder="e.g. Blue jacket, jeans" /></div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Body Build</label>
                    <select required value={formData.bodyType} onChange={e => setFormData({...formData, bodyType: e.target.value})} className="w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/20 border-none outline-none focus:ring-2 ring-red-500/30 font-bold text-sm appearance-none">
                      <option value="">Select Build</option><option value="Slim">Slim</option><option value="Average">Average</option><option value="Chubby">Chubby</option><option value="Athletic">Athletic</option><option value="Large Build">Large Build</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Behavioral Context</label><textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/20 border-none outline-none focus:ring-2 ring-red-500/30 font-medium leading-relaxed text-sm" placeholder="Habits or specific behaviors..."></textarea></div>
               </div>

               <div className="bg-red-500 text-white p-8 rounded-[24px] shadow-2xl flex items-center justify-between gap-6 relative overflow-hidden">
                  <div className="relative z-10 flex-1"><h5 className="text-xl font-black mb-1">Confirm Report</h5><p className="text-[10px] opacity-80 leading-relaxed font-medium">Alert will be visible municipal-wide.</p></div>
                  <button type="submit" className="relative z-10 bg-white text-red-500 px-8 py-4 rounded-[20px] font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all">Submit Report</button>
               </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportMissingWizard;
