
import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';
import { UserProfile, DisabilityCategory, FamilyMember } from '@/Providers/AlagaLink/types';

// Refactored Components
import MemberTable from '@/Components/AlagaLink/members/MemberTable';
import RegistrationWorkflow from '@/Components/AlagaLink/members/RegistrationWorkflow';

type MemberGroup = 'PWD' | 'Staff';
type MemberTab = 'Registered' | 'Register' | 'Pending' | 'Suspended';

const Members: React.FC = () => {
  const { 
    users, currentUser, customSections, addUser, updateUser,
    globalSearchQuery, globalSearchFilter, setGlobalSearchFilter, searchSignal, setSearchSignal
  } = useAppContext();
  
  const [activeGroup, setActiveGroup] = useState<MemberGroup>('PWD');
  const [activeTab, setActiveTab] = useState<MemberTab>('Registered');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Promotion Modal State
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [promotionReasonData, setPromotionReasonData] = useState({
    rating: 'Exceeds Expectations',
    competencies: [] as string[],
    justification: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';

  // Identification constant for primary admin protection
  const PRIMARY_ADMIN_ID = 'ADM-LT-1001';

  // Handle Universal Search Signal for Members
  useEffect(() => {
    if (searchSignal && searchSignal.page === 'members') {
      if (searchSignal.itemId) {
        const targetUser = users.find(u => u.id === searchSignal.itemId);
        if (targetUser) {
          const targetIsStaff = targetUser.role === 'Admin' || targetUser.role === 'SuperAdmin';
          if (targetIsStaff && !isSuperAdmin) {
            setSearchSignal(null);
            return;
          }
          Promise.resolve().then(() => {
            if (targetIsStaff) setActiveGroup('Staff');
            else setActiveGroup('PWD');
            if (targetUser.status === 'Active') setActiveTab('Registered');
            else if (targetUser.status === 'Pending') setActiveTab('Pending');
            else if (targetUser.status === 'Suspended') setActiveTab('Suspended');
            setSelectedUser(targetUser);
          });
        }
      } else if (searchSignal.section) {
        Promise.resolve().then(() => {
          if (searchSignal.section === 'Staff' && isSuperAdmin) setActiveGroup('Staff');
          if (searchSignal.section === 'PWD') setActiveGroup('PWD');
          // Handle specific tabs like 'Pending', 'Registered', 'Suspended'
          if (searchSignal.section && ['Registered', 'Pending', 'Suspended'].includes(searchSignal.section)) {
            setActiveTab(searchSignal.section as MemberTab);
          } else {
            setActiveTab('Registered');
          }
        });
      }
    }
  }, [searchSignal, users, isSuperAdmin, setSearchSignal]);

  useEffect(() => {
    if (globalSearchFilter !== 'All') {
      Promise.resolve().then(() => {
        if (['Registered', 'Pending', 'Suspended'].includes(globalSearchFilter)) {
           setActiveTab(globalSearchFilter as MemberTab);
        } else if (globalSearchFilter === 'Staff' && isSuperAdmin) {
           setActiveGroup('Staff');
           setActiveTab('Registered');
        }
      });
    }
  }, [globalSearchFilter, isSuperAdmin]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const name = `${u.firstName} ${u.lastName}`.toLowerCase();
      const id = u.id.toLowerCase();
      const matchesSearch = name.includes(globalSearchQuery.toLowerCase()) || id.includes(globalSearchQuery.toLowerCase());
      const matchesGroup = activeGroup === 'PWD' ? u.role === 'User' : (activeGroup === 'Staff' && isSuperAdmin ? (u.role === 'Admin' || u.role === 'SuperAdmin') : false);
      const matchesTab = activeTab === 'Registered' ? u.status === 'Active' : (activeTab === 'Pending' ? u.status === 'Pending' : (activeTab === 'Suspended' ? u.status === 'Suspended' : true));
      return matchesSearch && matchesGroup && matchesTab;
    });
  }, [users, globalSearchQuery, activeGroup, activeTab, isSuperAdmin]);

  const handleRegisterSubmit = (formData: Partial<UserProfile> & { sex?: string }) => {
    const f = formData as Partial<UserProfile> & { sex?: string };
    const photoUrl = f.photoUrl || `https://randomuser.me/api/portraits/${(f.sex === 'Female' ? 'women' : 'men')}/${Math.floor(Math.random()*99)}.jpg`;
    
    // Explicitly handle staff role creation
    const isStaffGroup = activeGroup === 'Staff';
    
    const newUser: UserProfile = {
      ...(formData as UserProfile),
      id: isStaffGroup ? `ADM-LT-${Date.now()}` : `LT-PWD-${Date.now()}`,
      status: 'Pending',
      photoUrl,
      role: isStaffGroup ? 'Admin' : 'User',
      disabilityCategory: isStaffGroup ? DisabilityCategory.None : (f.disabilityCategory as DisabilityCategory) || DisabilityCategory.None,
      history: { lostAndFound: [], programs: [] }
    };

    addUser(newUser);
    setActiveTab('Pending');
    return true;
  };

  const handleUpdateProfile = (formData: Partial<UserProfile>, family: FamilyMember[]) => {
    if (!selectedUser) return false;
    const updatedUser: UserProfile = { ...selectedUser, ...(formData as UserProfile) };
    updateUser(updatedUser);
    setIsEditing(false);
    setSelectedUser(updatedUser);
    return true;
  };

  const handleToggleStaffRole = () => {
    if (!selectedUser || !isSuperAdmin) return;
    const isCurrentlySuper = selectedUser.role === 'SuperAdmin';
    if (isCurrentlySuper && selectedUser.id === PRIMARY_ADMIN_ID) {
      alert("Security Protocol: The primary system administrator (Joe B. Kis-ing) cannot be demoted.");
      return;
    }
    if (!isCurrentlySuper) {
      setIsPromotionModalOpen(true); // Open reason pop-over for promotion
    } else {
      if (confirm(`Are you sure you want to demote ${selectedUser.firstName} to Admin?`)) {
        updateUser({ ...selectedUser, role: 'Admin' });
        setSelectedUser({ ...selectedUser, role: 'Admin' });
      }
    }
  };

  const submitPromotion = () => {
    if (!selectedUser) return;
    const updatedUser: UserProfile = {
      ...selectedUser,
      role: 'SuperAdmin'
    };
    updateUser(updatedUser);
    setSelectedUser(updatedUser);
    setIsPromotionModalOpen(false);
    alert(`${selectedUser.firstName} has been promoted to Super Admin.`);
  };

  const closeDetail = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setSearchSignal(null);
  };

  const canManageUser = (targetUser: UserProfile) => {
    if (targetUser.role === 'User') return true;
    if (targetUser.role === 'Admin') return isSuperAdmin;
    return false;
  };

  if (!isAdmin) return <div className="p-8 text-center"><i className="fa-solid fa-lock text-4xl mb-4 text-red-500"></i><h2 className="text-xl font-bold">Access Denied</h2></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      <header className="space-y-6">
        <div>
          <h2 className="text-4xl font-black flex items-center gap-3">
            <i className="fa-solid fa-users-gear text-alaga-blue"></i>
            Registry Management
          </h2>
          <p className="opacity-60 font-medium">Coordinate municipal data for {isSuperAdmin ? 'both members and administrative staff' : 'registered PWD/CWD members'}.</p>
        </div>

        {isSuperAdmin && (
          <div className="flex gap-4 p-1.5 bg-alaga-gray dark:bg-white/5 rounded-[24px] w-fit border border-gray-100 dark:border-white/10">
            {[
              { id: 'PWD', label: 'PWD/CWD Members', icon: 'fa-person-rays' },
              { id: 'Staff', label: 'Admins & Staff', icon: 'fa-shield-halved' }
            ].map(group => (
              <button
                key={group.id}
                onClick={() => { setActiveGroup(group.id as MemberGroup); setActiveTab('Registered'); }}
                className={`flex items-center gap-3 px-8 py-4 rounded-[20px] font-black text-sm transition-all ${activeGroup === group.id ? 'bg-white dark:bg-alaga-charcoal text-alaga-blue shadow-xl scale-[1.02]' : 'opacity-40 hover:opacity-100'}`}
              >
                <i className={`fa-solid ${group.icon}`}></i>
                {group.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex bg-white dark:bg-alaga-charcoal p-1 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-x-auto no-scrollbar w-fit">
          {(['Registered', 'Register', 'Pending', 'Suspended'] as MemberTab[]).map(tab => (
            <button 
              key={tab} 
              onClick={() => { setActiveTab(tab); setGlobalSearchFilter(tab); }} 
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${activeTab === tab ? 'bg-alaga-blue text-white shadow-lg' : 'opacity-60 hover:bg-alaga-blue/5'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {activeTab !== 'Register' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black opacity-80 uppercase tracking-widest text-[10px]">
                {activeGroup === 'PWD' ? 'PWD/CWD' : 'Staff'} {activeTab} List ({filteredUsers.length})
              </h3>
              <div className="h-0.5 flex-1 bg-gray-100 dark:bg-white/5 mx-6"></div>
           </div>
           <MemberTable users={filteredUsers} onManage={setSelectedUser} canManage={canManageUser} />
        </div>
      ) : (
        <div className="py-4 animate-in zoom-in-95 duration-500">
          <RegistrationWorkflow 
            key={`${activeGroup}-${activeTab}`}
            onSubmit={handleRegisterSubmit}
            onCancel={() => setActiveTab('Registered')}
            initialData={activeGroup === 'Staff' ? { role: 'Admin', registrantType: 'PDAO Staff', disabilityCategory: DisabilityCategory.None } : { role: 'User', registrantType: 'Self', disabilityCategory: DisabilityCategory.Autism }}
          />
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-alaga-charcoal rounded-[24px] max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 no-scrollbar">
            <button onClick={closeDetail} className="absolute top-6 right-6 text-gray-400 z-[210] hover:text-red-500 transition-colors"><i className="fa-solid fa-circle-xmark text-2xl"></i></button>
            {isEditing ? (
              <div className="p-8">
                <RegistrationWorkflow 
                  isEditMode={true} 
                  initialData={selectedUser} 
                  
                  onSubmit={handleUpdateProfile} 
                  onCancel={() => setIsEditing(false)} 
                />
              </div>
            ) : (
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 bg-alaga-blue/5 p-8 flex flex-col items-center">
                  {selectedUser.photoUrl ? (
                    <Image src={selectedUser.photoUrl} width={160} height={160} className="rounded-[20px] shadow-2xl mb-6 object-cover border-4 border-white" alt={`${selectedUser.firstName} ${selectedUser.lastName}`} />
                  ) : (
                    <div className="w-40 h-40 rounded-[20px] shadow-2xl mb-6 bg-gray-100 border-4 border-white" />
                  )}
                  <h2 className="text-2xl font-black text-center leading-tight mb-1">{selectedUser.firstName} {selectedUser.lastName}</h2>
                  <p className="text-[10px] font-mono opacity-40 mb-6">{selectedUser.id}</p>
                  <div className="flex flex-col items-center gap-2 mb-8">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedUser.status === 'Active' ? 'bg-alaga-teal text-white' : selectedUser.status === 'Pending' ? 'bg-alaga-gold text-alaga-navy' : 'bg-red-500 text-white'}`}>
                      {selectedUser.status}
                    </div>
                    {selectedUser.role !== 'User' && (
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${selectedUser.role === 'SuperAdmin' ? 'text-purple-600' : 'text-alaga-blue'}`}>
                        {selectedUser.role === 'SuperAdmin' ? 'Super Admin' : 'Staff Account'}
                      </span>
                    )}
                  </div>
                  <div className="w-full space-y-3">
                    {canManageUser(selectedUser) ? (
                      <>
                        <button onClick={() => setIsEditing(true)} className="w-full bg-alaga-gold text-alaga-navy py-4 rounded-2xl font-black text-xs shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                           <i className="fa-solid fa-user-pen"></i> Edit Credentials
                        </button>
                        {selectedUser.status === 'Pending' && (
                          <button onClick={() => { updateUser({...selectedUser, status: 'Active'}); closeDetail(); }} className="w-full bg-alaga-teal text-white py-4 rounded-2xl font-black text-xs shadow-xl hover:scale-[1.02] transition-all">Verify & Activate</button>
                        )}
                      </>
                    ) : (
                      <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-2xl text-center">
                        <i className="fa-solid fa-shield-halved text-alaga-blue mb-2 text-sm"></i>
                        <p className="text-[9px] font-black uppercase opacity-40">Protected Profile</p>
                        <p className="text-[10px] font-medium opacity-60">Permissions: View Only</p>
                      </div>
                    )}
                    {isSuperAdmin && (selectedUser.role === 'Admin' || selectedUser.role === 'SuperAdmin') && (
                      <button 
                        onClick={handleToggleStaffRole}
                        disabled={selectedUser.id === PRIMARY_ADMIN_ID}
                        className={`w-full py-4 rounded-2xl font-black text-xs shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mt-4 ${selectedUser.role === 'SuperAdmin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-purple-600 text-white'} ${selectedUser.id === PRIMARY_ADMIN_ID ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                      >
                        <i className={`fa-solid ${selectedUser.role === 'SuperAdmin' ? 'fa-arrow-down-long' : 'fa-arrow-up-long'}`}></i>
                        {selectedUser.role === 'SuperAdmin' ? 'Demote to Staff' : 'Promote to Super Admin'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="md:w-2/3 p-8 space-y-8">
                  {selectedUser.professionalQualifications ? (
                    <section>
                      <h4 className="text-[10px] font-black uppercase opacity-30 border-b border-gray-100 dark:border-white/5 pb-2 mb-6 tracking-widest">Professional Qualifications</h4>
                      <div className="grid grid-cols-2 gap-6 text-sm">
                          <div><p className="opacity-50 text-[10px] uppercase font-black mb-1">Education</p><p className="font-bold text-alaga-blue text-sm">{selectedUser.professionalQualifications.education}</p></div>
                          <div><p className="opacity-50 text-[10px] uppercase font-black mb-1">Eligibility</p><p className="font-bold text-sm">{selectedUser.professionalQualifications.eligibility}</p></div>
                          <div><p className="opacity-50 text-[10px] uppercase font-black mb-1">Training</p><p className="font-bold text-sm">{selectedUser.professionalQualifications.trainingHours} Hours</p></div>
                          <div><p className="opacity-50 text-[10px] uppercase font-black mb-1">Experience</p><p className="font-bold text-sm">{selectedUser.professionalQualifications.experienceYears} Years</p></div>
                          {selectedUser.professionalQualifications.licenseNumber && (
                            <div className="col-span-2"><p className="opacity-50 text-[10px] uppercase font-black mb-1">License No.</p><p className="font-mono text-sm">{selectedUser.professionalQualifications.licenseNumber}</p></div>
                          )}
                      </div>
                    </section>
                  ) : (
                    <section>
                      <h4 className="text-[10px] font-black uppercase opacity-30 border-b border-gray-100 dark:border-white/5 pb-2 mb-6 tracking-widest">Medical Registry / Context</h4>
                      <div className="grid grid-cols-2 gap-6 text-sm">
                          <div><p className="opacity-50 text-[10px] uppercase font-black mb-1">IDEA Category</p><p className="font-black text-alaga-blue text-sm truncate max-w-[180px]">{selectedUser.disabilityCategory}</p></div>
                          <div><p className="opacity-50 text-[10px] uppercase font-black mb-1">Blood Type</p><p className="font-black text-sm">{selectedUser.bloodType}</p></div>
                          <div><p className="opacity-50 text-[10px] uppercase font-black mb-1">Age</p><p className="font-bold text-sm">{selectedUser.age} Years Old</p></div>
                          <div><p className="opacity-50 text-[10px] uppercase font-black mb-1">Civil Status</p><p className="font-bold text-sm">{selectedUser.civilStatus}</p></div>
                      </div>
                    </section>
                  )}
                  <section>
                    <h4 className="text-[10px] font-black uppercase opacity-30 border-b border-gray-100 dark:border-white/5 pb-2 mb-6 tracking-widest">Contact Information</h4>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-alaga-gray dark:bg-alaga-navy/20 rounded-2xl">
                          <i className="fa-solid fa-map-location-dot text-alaga-blue text-lg"></i>
                          <div><p className="text-[9px] font-black uppercase opacity-40">Primary Address</p><p className="font-bold text-xs">{selectedUser.address}</p></div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-alaga-gray dark:bg-alaga-navy/20 rounded-2xl">
                          <i className="fa-solid fa-phone-flip text-alaga-teal text-lg"></i>
                          <div><p className="text-[9px] font-black uppercase opacity-40">Mobile Number</p><p className="font-bold text-xs">{selectedUser.contactNumber}</p></div>
                        </div>
                    </div>
                  </section>
                  {selectedUser.role === 'User' && (
                    <section>
                      <h4 className="text-[10px] font-black uppercase opacity-30 border-b border-gray-100 dark:border-white/5 pb-2 mb-6 tracking-widest">Family Composition</h4>
                      <div className="grid grid-cols-1 gap-2">
                          {selectedUser.familyComposition.length > 0 ? selectedUser.familyComposition.map(m => (
                            <div key={m.id} className="p-3 bg-alaga-gray dark:bg-alaga-navy/20 rounded-2xl flex justify-between items-center">
                              <div><p className="font-bold text-xs">{m.fullName}</p><p className="text-[9px] opacity-40 uppercase font-black">{m.relation}</p></div>
                              <span className="text-[9px] font-black opacity-40">{m.age} Yrs • {m.sex}</span>
                            </div>
                          )) : <p className="text-[10px] italic opacity-40">No family members registered.</p>}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Promotion Reason Pop-over */}
      {isPromotionModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-alaga-charcoal rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <header className="p-8 bg-purple-600 text-white relative">
              <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12">
                <i className="fa-solid fa-crown text-8xl"></i>
              </div>
              <h3 className="text-2xl font-black">Administrative Elevation</h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mt-1">Role: Super Admin Promotion</p>
            </header>
            
            <div className="p-8 space-y-8">
              <div className="flex items-center gap-4 p-4 bg-purple-600/5 border border-purple-600/10 rounded-2xl">
                {selectedUser.photoUrl ? (
                  <Image src={selectedUser.photoUrl} width={48} height={48} className="w-12 h-12 rounded-xl object-cover" alt={`${selectedUser.firstName} ${selectedUser.lastName}`} />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gray-100" />
                )}
                <div>
                   <p className="text-xs font-black">{selectedUser.firstName} {selectedUser.lastName}</p>
                   <p className="text-[9px] opacity-40 uppercase font-bold tracking-widest">Candidate for Executive Role</p>
                </div>
              </div>

              {/* Section: Assessment */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                  <i className="fa-solid fa-chart-line text-purple-600"></i> Performance Assessment
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {['Exceeds Expectations', 'Outstanding Merit', 'Senior Leadership', 'Technical Mastery'].map(rating => (
                    <button 
                      key={rating}
                      onClick={() => setPromotionReasonData({...promotionReasonData, rating})}
                      className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter border-2 transition-all ${promotionReasonData.rating === rating ? 'bg-purple-600 border-purple-600 text-white' : 'bg-gray-50 border-gray-100 dark:bg-white/5 dark:border-white/5 opacity-50'}`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Competencies */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                  <i className="fa-solid fa-shield-heart text-purple-600"></i> Verified Competencies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['Crisis Management', 'Community Outreach', 'System Integrity', 'Resource Management', 'Ethical Standards'].map(comp => {
                    const isSelected = promotionReasonData.competencies.includes(comp);
                    return (
                      <button 
                        key={comp}
                        onClick={() => {
                          const newComps = isSelected 
                            ? promotionReasonData.competencies.filter(c => c !== comp) 
                            : [...promotionReasonData.competencies, comp];
                          setPromotionReasonData({...promotionReasonData, competencies: newComps});
                        }}
                        className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${isSelected ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-100 dark:bg-white/5 opacity-40'}`}
                      >
                        {comp}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section: Justification */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Justification Narrative</h4>
                <textarea 
                  value={promotionReasonData.justification}
                  onChange={e => setPromotionReasonData({...promotionReasonData, justification: e.target.value})}
                  rows={4}
                  className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-alaga-navy/20 border-none outline-none focus:ring-2 ring-purple-600/30 font-medium text-sm leading-relaxed"
                  placeholder="Summarize the core reason for this administrative promotion..."
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={submitPromotion}
                  disabled={!promotionReasonData.justification || promotionReasonData.competencies.length === 0}
                  className="flex-1 bg-purple-600 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-purple-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                >
                  Finalize Promotion
                </button>
                <button 
                  onClick={() => setIsPromotionModalOpen(false)}
                  className="px-8 py-5 bg-gray-100 dark:bg-white/5 rounded-2xl font-black text-sm opacity-40 hover:opacity-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;

