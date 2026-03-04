
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';
import { ProgramAvailment, LivelihoodProgram, AssistiveDevice, MedicalService, UserProfile, DisabilityCategory } from '@/Providers/AlagaLink/types';
import axios from 'axios';

// Refactored Components
import AdminEvaluationOverlay from '@/Components/AlagaLink/programs/AdminEvaluationOverlay';
import PhilHealthPortal from '@/Components/AlagaLink/programs/PhilHealthPortal';
import InventoryPortal from '@/Components/AlagaLink/programs/InventoryPortal';
import FallbackImage from '@/Components/AlagaLink/shared/FallbackImage';
import RegistrationWorkflow from '@/Components/AlagaLink/members/RegistrationWorkflow';
import DigitalIdCard from '@/Components/AlagaLink/profile/DigitalIdCard';

type ProgramModalType = 'none' | 'ID' | 'Device' | 'Medical' | 'PhilHealth' | 'Livelihood';

const Programs: React.FC = () => {
  const {
    currentUser,
    users,
    addUser,
    devices: seededDevices,
    medicalServices: seededMedicalServices,
    livelihoodPrograms: seededLivelihoodPrograms,
    searchSignal,
    setSearchSignal,
    programRequests,
    addProgramRequest,
    updateProgramRequest,
    reportMissingProgramRequest,
    notifications
  } = useAppContext();

  const [activeModal, setActiveModal] = useState<ProgramModalType>('none');

  // Catalogs with persistence during session
  const [medicalServices, setMedicalServices] = useState<MedicalService[]>(seededMedicalServices);
  const [livelihoodPrograms, setLivelihoodPrograms] = useState<LivelihoodProgram[]>(seededLivelihoodPrograms);
  const [devices, setDevices] = useState<AssistiveDevice[]>(seededDevices);

  // Portal Specific State
  const [idSearchQuery, setIdSearchQuery] = useState('');
  const [isRegisteringNew, setIsRegisteringNew] = useState(false);
  const [backlogFilter, setBacklogFilter] = useState('All');

  const idCounterRef = React.useRef(0);

  // User Application Workflow State
  const [applicationStep, setApplicationStep] = useState<'Selection' | 'Filling' | 'Success'>('Selection');
  const [applyingForItem, setApplyingForItem] = useState<{ type: string; item: Partial<AssistiveDevice & MedicalService & LivelihoodProgram> } | null>(null);
  const [requestRemarks, setRequestRemarks] = useState('');

  // Modal Specific State
  const [selectedRequest, setSelectedRequest] = useState<ProgramAvailment | null>(null);

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  // Deep Link Logic from Universal Search
  useEffect(() => {
    if (searchSignal && searchSignal.page === 'programs') {
      if (searchSignal.section) {
        // If a specific request id is referenced, open the admin evaluation overlay for that request
        if (searchSignal.section === 'requests' && searchSignal.itemId) {
          const req = programRequests.find(r => r.id === searchSignal.itemId);
          if (req) {
            Promise.resolve().then(() => {
              if (isAdmin) {
                setSelectedRequest(req);
                setActiveModal('none');
              } else {
                // Non-admin users should never see the admin evaluation overlay.
                setSelectedRequest(null);
                setActiveModal(req.programType as ProgramModalType);
              }
            });
          }
        } else {
          Promise.resolve().then(() => setActiveModal(searchSignal.section as ProgramModalType));
        }
      }
      // Clear the signal after handling
      setSearchSignal(null);
    }
  }, [searchSignal, programRequests, setSearchSignal, isAdmin]);

  const idSearchResults = useMemo(() => {
    if (!idSearchQuery) return [];
    return users.filter(u =>
      u.firstName.toLowerCase().includes(idSearchQuery.toLowerCase()) ||
      u.lastName.toLowerCase().includes(idSearchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(idSearchQuery.toLowerCase())
    );
  }, [idSearchQuery, users]);

  const userIDRequest = useMemo(() => {
    return programRequests.find(r => r.userId === currentUser?.id && r.programType === 'ID');
  }, [programRequests, currentUser]);

  const userPendingRequests = useMemo(() => {
    return programRequests.filter(r => r.userId === currentUser?.id && r.status === 'Pending');
  }, [programRequests, currentUser]);

  const closeModal = () => {
    setActiveModal('none');
    setSelectedRequest(null);
    setApplyingForItem(null);
    setRequestRemarks('');
    setIsRegisteringNew(false);
    setIdSearchQuery('');
    setSearchSignal(null);
    setApplicationStep('Selection');
    setBacklogFilter('All');
  };

  const handleApply = (type: string, title: string, itemId?: string, userIdOverride?: string, extraData?: Partial<ProgramAvailment>) => {
    if (!isAdmin && currentUser?.status !== 'Active') {
      window.alert('Your account is pending approval. You cannot avail programs and services until an admin approves your registration.');
      return;
    }

    const targetUserId = userIdOverride || currentUser?.id || 'anonymous';

    // Check if item still has stock
    if (type === 'Device' && itemId) {
      const item = devices.find(d => d.id === itemId);
      if (item && item.stockCount <= 0) {
        alert("This item is currently out of stock in the municipal inventory.");
        return;
      }
    }

    const existingCount = programRequests.filter(r => r.userId === targetUserId && r.programType === type).length;

    const limits: Record<string, number> = {
      'ID': 1,
      'PhilHealth': 1,
      'Device': 5,
      'Medical': 5
    };

    if (limits[type] !== undefined && existingCount >= limits[type] && !userIdOverride) {
      alert(`⚠️ Request Limit Reached!\n\nMunicipal policy limits ${type} applications to a maximum of ${limits[type]} per member.`);
      return;
    }

    const reqId = `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const newReq: ProgramAvailment = {
      id: reqId,
      userId: targetUserId,
      programType: type as ProgramAvailment['programType'],
      title: title,
      status: 'Pending',
      dateApplied: new Date().toISOString().split('T')[0],
      requestedItemId: itemId,
      details: requestRemarks,
      philhealthConsent: type === 'PhilHealth',
      ...extraData
    };

    addProgramRequest(newReq);

    if (!isAdmin) {
      setApplicationStep('Success');
      setTimeout(() => {
        closeModal();
      }, 2000);
    } else {
      setIsRegisteringNew(false);
      setIdSearchQuery('');
    }
  };

  const toggleInventoryVisibility = (itemType: 'Device' | 'Medical' | 'Livelihood', id: string) => {
    if (itemType === 'Device') {
      setDevices(prev => prev.map(d => d.id === id ? { ...d, isVisible: !d.isVisible } : d));
      const next = devices.find(d => d.id === id);
      axios.patch('/api/alagalink/programs/' + encodeURIComponent(id), { isVisible: !(next?.isVisible ?? true) })
        .catch((e) => console.error('Failed to persist visibility toggle:', e));
      return;
    }

    if (itemType === 'Medical') {
      setMedicalServices(prev => prev.map(m => m.id === id ? { ...m, isVisible: !m.isVisible } : m));
      const next = medicalServices.find(m => m.id === id);
      axios.patch('/api/alagalink/programs/' + encodeURIComponent(id), { isVisible: !(next?.isVisible ?? true) })
        .catch((e) => console.error('Failed to persist visibility toggle:', e));
      return;
    }

    setLivelihoodPrograms(prev => prev.map(l => l.id === id ? { ...l, isVisible: !l.isVisible } : l));
    const next = livelihoodPrograms.find(l => l.id === id);
    axios.patch('/api/alagalink/programs/' + encodeURIComponent(id), { isVisible: !(next?.isVisible ?? true) })
      .catch((e) => console.error('Failed to persist visibility toggle:', e));
  };

  const removeInventoryItem = (itemType: 'Device' | 'Medical' | 'Livelihood', id: string) => {
    if (itemType === 'Device') setDevices(prev => prev.filter(d => d.id !== id));
    if (itemType === 'Medical') setMedicalServices(prev => prev.filter(m => m.id !== id));
    if (itemType === 'Livelihood') setLivelihoodPrograms(prev => prev.filter(l => l.id !== id));

    axios.delete('/api/alagalink/programs/' + encodeURIComponent(id))
      .catch((e) => console.error('Failed to persist inventory delete:', e));
  };

  const handleRegisterNewMember = (formData: Partial<UserProfile>) => {
    const f = formData as Partial<UserProfile>;
    const photoSeed = ++idCounterRef.current % 100;
    const photoUrl = f.photoUrl || `https://randomuser.me/api/portraits/${(f.sex === 'Female' ? 'women' : 'men')}/${photoSeed}.jpg`;
    const newUserId = `LT-${++idCounterRef.current}`;
    const newUser: UserProfile = {
      ...(formData as UserProfile),
      id: newUserId,
      status: 'Pending',
      photoUrl,
      role: 'User',
      history: { lostAndFound: [], programs: [] }
    };
    addUser(newUser);
    handleApply('ID', 'New PWD ID Issuance', undefined, newUser.id);
    return true;
  };

  // Inventory Update Handlers
  const handleUpdateInventory = (itemType: string, itemData: Partial<AssistiveDevice | MedicalService | LivelihoodProgram>) => {
    const isNew = !itemData.id;
    const generatedId = `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const finalData = { ...(itemData as Partial<AssistiveDevice | MedicalService | LivelihoodProgram>), id: isNew ? generatedId : itemData.id } as Partial<AssistiveDevice | MedicalService | LivelihoodProgram>;

    if (itemType === 'Device') {
      setDevices(prev => isNew ? [finalData as AssistiveDevice, ...prev] : prev.map(d => d.id === finalData.id ? finalData as AssistiveDevice : d));
    } else if (itemType === 'Medical') {
      setMedicalServices(prev => isNew ? [finalData as MedicalService, ...prev] : prev.map(m => m.id === finalData.id ? finalData as MedicalService : m));
    } else if (itemType === 'Livelihood') {
      setLivelihoodPrograms(prev => isNew ? [finalData as LivelihoodProgram, ...prev] : prev.map(l => l.id === finalData.id ? finalData as LivelihoodProgram : l));
    }

    // Persist to server so it remains after refresh.
    const title = (finalData as any).name || (finalData as any).title || '';
    const isVisible = (finalData as any).isVisible;
    const stockCount = (finalData as any).stockCount;

    axios.post('/api/alagalink/programs', {
      id: finalData.id,
      type: itemType,
      title,
      isVisible,
      stockCount,
      data: finalData,
    }).then((response) => {
      const saved = response?.data?.program;
      if (!saved?.id) return;

      if (itemType === 'Device') {
        setDevices(prev => prev.map(d => d.id === saved.id ? saved : d));
      } else if (itemType === 'Medical') {
        setMedicalServices(prev => prev.map(m => m.id === saved.id ? saved : m));
      } else if (itemType === 'Livelihood') {
        setLivelihoodPrograms(prev => prev.map(l => l.id === saved.id ? saved : l));
      }
    }).catch((e) => {
      console.error('Failed to persist inventory item:', e);
    });
  };

  const renderApplicationForm = () => {
    if (applicationStep === 'Success') {
      return (
        <div className="max-w-2xl mx-auto py-20 text-center space-y-8 animate-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-alaga-teal rounded-full flex items-center justify-center mx-auto text-white shadow-2xl shadow-alaga-teal/40 animate-bounce">
              <i className="fa-solid fa-check text-4xl"></i>
           </div>
           <div className="space-y-2">
              <h3 className="text-4xl font-black text-3d">Application Received</h3>
              <p className="opacity-60 text-lg font-medium">Your request has been logged in the Municipal Registry.</p>
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Forwarding to PDAO Evaluation Desk...</p>
        </div>
      );
    }

    if (!applyingForItem) return null;
    const { item, type } = applyingForItem;

    return (
      <div className="max-w-3xl mx-auto space-y-10 py-6 animate-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white dark:bg-alaga-charcoal p-12 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] relative overflow-hidden inflated-card">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-10 border-b border-gray-100 dark:border-white/5 pb-8">
             <div className="w-28 h-28 bg-alaga-blue/5 rounded-[32px] overflow-hidden shadow-xl border-4 border-white dark:border-white/10 shrink-0">
               <FallbackImage src={item.photoUrl} className="w-full h-full object-cover" alt={item.photoAlt || item.name || item.title} fallbackType={(item as any).section || 'Generic'} />
             </div>
             <div className="text-center md:text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-alaga-blue mb-1">Municipal Benefit Entry</p>
                <h4 className="text-4xl font-black text-3d tracking-tight">{item.name || item.title || type}</h4>
                <p className="text-sm opacity-50 font-medium mt-1">Formal request for aid/program enrollment.</p>
             </div>
          </div>

          <div className="space-y-8">
            <div className="p-8 bg-alaga-gray dark:bg-alaga-navy/40 rounded-[32px] border border-gray-100 dark:border-white/5 space-y-6 shadow-inner">
               <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                 <i className="fa-solid fa-id-badge text-alaga-blue"></i>
                 Applicant Profile Verification
               </h5>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="opacity-40 text-[9px] uppercase font-black tracking-widest">Full Legal Name</p>
                    <p className="font-black text-lg">{currentUser?.firstName} {currentUser?.lastName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="opacity-40 text-[9px] uppercase font-black tracking-widest">Registry Category</p>
                    <p className="font-black text-lg text-alaga-blue">{currentUser?.disabilityCategory}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="opacity-40 text-[9px] uppercase font-black tracking-widest">Municipal ID No.</p>
                    <p className="font-mono text-sm opacity-60">{currentUser?.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="opacity-40 text-[9px] uppercase font-black tracking-widest">Resident Address</p>
                    <p className="font-bold text-sm truncate">{currentUser?.address}</p>
                  </div>
               </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase opacity-40 tracking-widest px-4">Statement of Purpose / Remarks</label>
              <textarea
                rows={4}
                value={requestRemarks}
                onChange={e => setRequestRemarks(e.target.value)}
                placeholder="Briefly describe why you are requesting this service or item (e.g., 'Required for school mobility' or 'Doctor advised maintenance')..."
                className="w-full p-8 rounded-[32px] bg-alaga-gray dark:bg-alaga-navy/20 border-2 border-transparent outline-none focus:border-alaga-blue/30 focus:bg-white dark:focus:bg-alaga-navy/40 font-medium leading-relaxed transition-all shadow-inner"
              ></textarea>
            </div>

            <div className="p-6 bg-alaga-teal/5 border border-alaga-teal/10 rounded-[24px] text-xs font-medium leading-relaxed italic opacity-80 flex gap-4">
              <i className="fa-solid fa-shield-halved text-alaga-teal mt-1"></i>
              <span>I hereby authorize the PDAO and MSWDO to verify my eligibility based on my current registry profile. I understand this application is subject to administrative review.</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => handleApply(type, item.name || item.title || type, item.id)}
                className="flex-1 bg-alaga-blue text-white py-6 rounded-[28px] font-black text-xl shadow-2xl shadow-alaga-blue/30 hover:scale-[1.02] active:scale-95 transition-all inner-glow flex items-center justify-center gap-3"
              >
                <i className="fa-solid fa-paper-plane text-sm"></i>
                Submit to Registry
              </button>
              <button
                onClick={() => setApplyingForItem(null)}
                className="px-10 py-6 bg-alaga-gray dark:bg-white/5 rounded-[28px] font-black text-sm opacity-40 hover:opacity-100 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderIDPortal = () => {
    if (isAdmin) {
      if (isRegisteringNew) {
        return (
          <RegistrationWorkflow
            customSections={customSections}
            onSubmit={handleRegisterNewMember}
            onCancel={() => setIsRegisteringNew(false)}
            initialData={{
              role: 'User',
              registrantType: 'Self',
              disabilityCategory: DisabilityCategory.Autism
            }}
          />
        );
      }

      const filteredBacklog = programRequests.filter(r =>
        r.programType === 'ID' && (backlogFilter === 'All' || r.status === backlogFilter)
      );

      return (
        <div className="space-y-10 max-w-4xl mx-auto py-6 animate-in fade-in duration-500">
          <div className="inflated-card bg-alaga-blue/5 p-12 rounded-[40px] border border-alaga-blue/10 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12">
               <i className="fa-solid fa-id-card text-9xl"></i>
            </div>
            <div className="w-40 h-40 bg-alaga-blue text-white rounded-[32px] flex items-center justify-center shadow-2xl inner-glow shrink-0 group hover:rotate-3 transition-transform">
              <i className="fa-solid fa-id-card text-6xl glow-icon"></i>
            </div>
            <div className="relative z-10 text-center md:text-left">
              <h4 className="text-4xl font-black mb-3 text-3d">PWD ID Registry & Issuance {(() => { const c = notifications.filter(n => n.link && n.link.startsWith('programs') && n.programType === 'ID' && !n.isRead).length; if (c === 0) return null; if (c === 1) return <span className="inline-block ml-3 w-2 h-2 bg-red-500 rounded-full align-middle" />; return <span className="inline-flex ml-3 items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full w-6 h-6">{c}</span>; })()}</h4>
              <p className="opacity-70 leading-relaxed font-medium text-lg">Verify existing members or register new applicants for the official municipal PWD identification card.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative group inflated-card">
              <i className="fa-solid fa-magnifying-glass absolute left-8 top-1/2 -translate-y-1/2 opacity-30 text-xl group-focus-within:text-alaga-blue transition-colors"></i>
              <input
                type="text"
                placeholder="Search by Name or PWD ID Number..."
                value={idSearchQuery}
                onChange={e => setIdSearchQuery(e.target.value)}
                className="w-full pl-16 pr-8 py-8 bg-white dark:bg-alaga-navy/20 border-2 border-transparent rounded-[32px] font-black text-lg outline-none focus:border-alaga-blue transition-all shadow-xl"
              />
            </div>

            {idSearchQuery && (
              <div className="bg-white dark:bg-alaga-charcoal rounded-[24px] p-4 shadow-xl border border-gray-100 dark:border-white/10 animate-in slide-in-from-top-3 duration-200">
                <h5 className="px-5 py-3 text-[10px] font-black uppercase opacity-40 tracking-[0.2em] border-b border-gray-100 dark:border-white/5 mb-3">Registry Matches</h5>
                {idSearchResults.length > 0 ? (
                  <div className="space-y-3">
                    {idSearchResults.map(u => (
                      <div key={u.id} className="flex items-center justify-between p-4 hover:bg-alaga-blue/5 rounded-2xl transition-colors duration-150 group border border-transparent hover:border-alaga-blue/10">
                        <div className="flex items-center gap-4">
                          {u.photoUrl ? (
                            <Image src={u.photoUrl} width={48} height={48} className="w-12 h-12 rounded-xl object-cover shadow-md" alt={`${u.firstName} ${u.lastName}`} />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gray-100" />
                          )}
                          <div>
                            <p className="font-black text-base leading-tight">{u.firstName} {u.lastName}</p>
                            <p className="text-[10px] opacity-40 font-mono tracking-tighter uppercase">{u.id} • {u.address}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleApply('ID', 'ID Issuance Request', undefined, u.id)}
                          className="bg-alaga-blue text-white px-5 py-2 rounded-xl text-[11px] font-black shadow-md shadow-alaga-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                        >
                          Process ID
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center space-y-8">
                     <div className="opacity-30 font-black text-xl tracking-widest uppercase">No Match Found</div>
                     <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button onClick={() => setShowBrowseRegistry(true)} className="px-10 py-4 bg-alaga-gray dark:bg-white/5 rounded-3xl text-sm font-black hover:bg-alaga-blue hover:text-white transition-all shadow-lg inflated-card">
                          Browse Master Registry
                        </button>
                        <button onClick={() => setIsRegisteringNew(true)} className="px-10 py-4 bg-alaga-blue text-white rounded-3xl text-sm font-black shadow-2xl shadow-alaga-blue/30 hover:scale-105 transition-all inflated-card">
                          Add New Applicant
                        </button>
                     </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
               <div>
                  <h5 className="font-black text-[10px] uppercase tracking-[0.3em] opacity-30 flex items-center mb-4">
                    <i className="fa-solid fa-history mr-3 text-alaga-blue"></i>
                    Application Backlog
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Pending', 'Approved', 'Ready for Claiming', 'Claimed', 'Rejected'].map(status => (
                      <button
                        key={status}
                        onClick={() => setBacklogFilter(status)}
                        className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all inflated-card ${
                          backlogFilter === status
                            ? 'bg-alaga-blue text-white shadow-lg shadow-alaga-blue/20 scale-105'
                            : 'bg-white dark:bg-alaga-navy/40 opacity-40 hover:opacity-100'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="text-[10px] font-black opacity-30 uppercase tracking-widest">
                  Showing {filteredBacklog.length} entries
               </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredBacklog.length > 0 ? filteredBacklog.map(req => {
                    const user = users.find(u => u.id === req.userId);
                    return (
                        <div
                            key={req.id}
                            onClick={() => setSelectedRequest(req)}
                            className="p-5 bg-white dark:bg-alaga-navy/20 rounded-[24px] border border-gray-100 dark:border-white/5 flex items-center justify-between cursor-pointer inflated-card border-transparent hover:border-alaga-blue/30 transition-colors duration-150"
                        >
                            <div className="flex items-center gap-4">
                                {user?.photoUrl ? (
                                  <Image src={user.photoUrl} width={48} height={48} className="w-12 h-12 rounded-xl object-cover shadow-md" alt={`${user?.firstName} ${user?.lastName}`} />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-gray-100" />
                                )}
                                <div>
                                    <p className="font-black text-base leading-tight">{user?.firstName} {user?.lastName}</p>
                                    <p className="text-[10px] opacity-40 uppercase font-black tracking-[0.2em]">{req.dateApplied} • {req.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-5">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md inner-glow ${
                                  req.status === 'Completed' || req.status === 'Approved' || req.status === 'Claimed' ? 'bg-alaga-teal text-white' :
                                    req.status === 'Pending' ? 'bg-alaga-gold text-alaga-navy' :
                                    req.status === 'Rejected' ? 'bg-red-500 text-white' :
                                    req.status === 'Ready for Claiming' ? 'bg-purple-500 text-white animate-pulse' :
                                    'bg-alaga-blue text-white'
                                }`}>
                                {req.status}
                                </span>
                                {(() => {
                                  const reqUnread = notifications.filter(n => n.link && n.link.endsWith(req.id) && !n.isRead).length;
                                  if (reqUnread === 0) return null;
                                  if (reqUnread === 1) return <span className="w-3 h-3 bg-red-500 rounded-full shadow-md" />;
                                  return <span className="inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full w-6 h-6">{reqUnread}</span>;
                                })()}
                                <i className="fa-solid fa-chevron-right opacity-30"></i>
                            </div>
                        </div>
                    );
                }) : (
                  <div className="py-24 text-center space-y-6 bg-alaga-gray dark:bg-white/5 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-white/5">
                     <i className="fa-solid fa-inbox text-5xl opacity-10"></i>
                     <p className="text-xl font-black opacity-30 uppercase tracking-[0.2em]">No {backlogFilter !== 'All' ? backlogFilter : ''} Applications Found</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="max-w-4xl mx-auto py-6 animate-in fade-in duration-500">
          {userIDRequest ? (
            <div className="bg-white dark:bg-alaga-charcoal p-12 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-2xl text-center space-y-8 inflated-card">
              <div className="w-24 h-24 bg-alaga-blue/10 text-alaga-blue rounded-[32px] flex items-center justify-center mx-auto text-5xl shadow-inner inner-glow">
                <i className="fa-solid fa-id-card glow-icon"></i>
              </div>
              <h3 className="text-4xl font-black text-3d">Application: {userIDRequest.status}</h3>
              <p className="opacity-60 text-lg font-medium">Your request for a PWD ID was submitted on {userIDRequest.dateApplied}.</p>
              {userIDRequest.status === 'Ready for Claiming' && (
                <>
                  <div className="p-8 bg-alaga-teal/10 text-alaga-teal rounded-[32px] font-black text-xl inflated-card border border-alaga-teal/20 animate-bounce">
                    <i className="fa-solid fa-location-dot mr-3"></i>
                    Claim at {userIDRequest.issuanceLocation || 'PDAO Office, Km. 5'}
                  </div>

                  {currentUser?.idMetadata && (
                    <div className="pt-4">
                      <div className="max-w-2xl mx-auto space-y-6">
                        <div className="text-center space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Claim Reference</p>
                          <p className="text-sm opacity-60 font-medium">Present this digital ID when claiming your physical card copy.</p>
                        </div>
                        <DigitalIdCard user={currentUser} />
                      </div>
                    </div>
                  )}
                </>
              )}
              {userIDRequest.status === 'Claimed' && (
                <>
                  <div className="p-8 bg-alaga-teal/10 text-alaga-teal rounded-[32px] font-black text-xl inflated-card border border-alaga-teal/20">
                    <i className="fa-solid fa-circle-check mr-3"></i>
                    Physical ID Claimed
                  </div>
                  <div className="max-w-2xl mx-auto p-6 bg-alaga-gray dark:bg-white/5 rounded-[32px] border border-gray-100 dark:border-white/10 text-left space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Claim Details</p>
                    <p className="text-sm font-bold opacity-80">Location: <span className="font-black text-alaga-blue">{userIDRequest.claimedLocation || userIDRequest.issuanceLocation || 'PDAO Office, Km. 5'}</span></p>
                    {userIDRequest.claimedAt && (
                      <p className="text-xs opacity-60 font-medium">Claimed on {new Date(userIDRequest.claimedAt).toLocaleString()}</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        const ok = window.confirm('Report your physical ID card as missing? Staff validation will be required before replacement issuance.');
                        if (!ok) return;
                        reportMissingProgramRequest(userIDRequest.id);
                      }}
                      disabled={!!userIDRequest.missingReportedAt}
                      className={`px-10 py-4 rounded-[24px] font-black text-sm shadow-2xl transition-all ${
                        userIDRequest.missingReportedAt
                          ? 'bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-white/40 cursor-not-allowed'
                          : 'bg-red-500 text-white hover:scale-105 active:scale-95'
                      }`}
                    >
                      <i className="fa-solid fa-triangle-exclamation mr-3"></i>
                      {userIDRequest.missingReportedAt ? 'Missing Card Reported' : 'Report Missing Card'}
                    </button>
                    {userIDRequest.missingReportedAt && (
                      <p className="mt-3 text-xs opacity-60 font-medium">Reported on {new Date(userIDRequest.missingReportedAt).toLocaleString()}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-alaga-charcoal p-16 rounded-[48px] border border-gray-100 dark:border-white/5 shadow-2xl text-center space-y-10 inflated-card">
               <div className="w-32 h-32 bg-alaga-blue/5 text-alaga-blue rounded-[40px] flex items-center justify-center mx-auto shadow-inner inner-glow">
                  <i className="fa-solid fa-id-card text-7xl glow-icon"></i>
               </div>
               <div>
                  <h3 className="text-5xl font-black text-3d-heavy tracking-tighter">PWD ID Issuance</h3>
                  <p className="opacity-60 mt-4 max-w-md mx-auto text-lg font-medium leading-relaxed">The official Municipal PWD Identification Card is your key to accessing national and local benefits.</p>
               </div>
               <button
                 onClick={() => setApplyingForItem({ type: 'ID', item: { name: 'New PWD ID Issuance', photoUrl: 'https://picsum.photos/seed/id-card-demo/400/400' } })}
                 className="bg-alaga-blue text-white px-16 py-6 rounded-[32px] font-black text-xl shadow-2xl shadow-alaga-blue/30 hover:scale-105 active:scale-95 transition-all inner-glow"
               >
                 Enroll for New Registry ID
               </button>
            </div>
          )}
        </div>
      );
    }
  };

  const renderContent = () => {
    // If user is not logged in, show login/register prompts for all services
    if (!currentUser) {
      return (
        <div className="space-y-16">
          {/* Featured Core Service: ID Issuance */}
          <section className="animate-in slide-in-from-top-4 duration-700">
            <div
              className="bg-white dark:bg-alaga-charcoal p-12 rounded-[48px] border-4 border-transparent border-alaga-blue transition-all cursor-default group shadow-2xl flex flex-col md:flex-row items-center gap-12 overflow-hidden relative inflated-card"
            >
              <div className="absolute -right-20 -bottom-20 opacity-5 rotate-12">
                <i className="fa-solid fa-id-card text-[300px]"></i>
              </div>
              <div className="w-32 h-32 bg-alaga-blue rounded-[32px] flex items-center justify-center text-white shrink-0 shadow-2xl shadow-alaga-blue/40 relative z-10 inner-glow">
                <i className="fa-solid fa-id-card text-6xl glow-icon"></i>
              </div>
              <div className="flex-1 text-center md:text-left relative z-10">
                <h4 className="text-4xl font-black mb-4 text-3d-heavy tracking-tighter">Municipal ID Registry</h4>
                <p className="opacity-60 text-xl font-medium leading-relaxed max-w-2xl">
                  The primary Municipal Identification Card. Required for accessing all national benefits and local PDAO support programs.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-4">
                   <div className="px-6 py-4 bg-alaga-blue/10 border border-alaga-blue/30 rounded-[24px]">
                     <p className="text-sm font-black text-alaga-blue"><i className="fa-solid fa-lock mr-2"></i> Login Required</p>
                   </div>
                   <p className="text-xs opacity-40 font-medium">Sign in or register to proceed with ID registration</p>
                </div>
              </div>
            </div>
          </section>

          {/* Support Services */}
          <section className="animate-in fade-in duration-1000 delay-300">
            <div className="flex items-center gap-6 mb-12">
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 text-3d">Municipal Support Services</h3>
               <div className="h-[1px] flex-1 bg-gradient-to-r from-gray-100 via-gray-200 to-transparent dark:from-white/5 dark:via-white/10 dark:to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { id: 'PhilHealth', title: 'PhilHealth', icon: 'fa-shield-halved', color: 'bg-alaga-teal', desc: 'Sponsored enrollment for CWD/PWD families.' },
                { id: 'Device', title: 'Assistive Devices', icon: 'fa-wheelchair', color: 'bg-alaga-blue', desc: 'Mobility, hearing, and specialized aids.' },
                { id: 'Medical', title: 'Medical Aid', icon: 'fa-kit-medical', color: 'bg-red-500', desc: 'Maintenance subsidies and lab assistance.' },
                { id: 'Livelihood', title: 'Livelihood', icon: 'fa-briefcase', color: 'bg-alaga-gold', desc: 'Professional workshops and training.' }
              ].map(p => (
                <div
                  key={p.id}
                  className="inflated-card bg-white dark:bg-alaga-charcoal p-8 rounded-[40px] border border-gray-100 dark:border-white/5 cursor-default group flex flex-col h-full relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-[1] rounded-[40px]"></div>
                  <div className="relative z-[2]">
                    <div className={`${p.color} w-16 h-16 rounded-[24px] flex items-center justify-center text-white mb-6 opacity-60 shadow-2xl inner-glow`}>
                      <i className={`fa-solid ${p.icon} text-2xl glow-icon`}></i>
                    </div>
                    <h4 className="text-2xl font-black mb-2 text-3d tracking-tight">{p.title}</h4>
                    <p className="opacity-50 text-sm font-medium leading-relaxed flex-1 mb-6">{p.desc}</p>
                    <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                      <div className="bg-alaga-blue/10 border border-alaga-blue/30 rounded-[20px] px-6 py-3 text-center">
                        <p className="text-xs font-black text-alaga-blue"><i className="fa-solid fa-lock mr-2"></i> Login Required</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Login/Register CTA */}
          <section className="text-center py-16">
            <div className="bg-gradient-to-r from-alaga-blue via-alaga-teal to-alaga-gold p-12 rounded-[48px] shadow-2xl">
              <h3 className="text-3xl font-black text-white mb-4">Ready to Access Services?</h3>
              <p className="text-white/80 text-lg font-medium mb-8">Create your account or sign in to explore all available benefits and programs.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={closeModal}
                  className="px-10 py-4 bg-white text-alaga-blue rounded-[24px] font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                  <i className="fa-solid fa-user-plus mr-2"></i> Sign Up Now
                </button>
                <button
                  onClick={closeModal}
                  className="px-10 py-4 bg-white/20 text-white border-2 border-white rounded-[24px] font-black uppercase tracking-widest hover:bg-white/30 transition-all active:scale-95"
                >
                  <i className="fa-solid fa-arrow-right-to-bracket mr-2"></i> Log In
                </button>
              </div>
            </div>
          </section>
        </div>
      );
    }

    switch (activeModal) {
      case 'ID': return renderIDPortal();
      case 'PhilHealth': return <PhilHealthPortal isAdmin={isAdmin} requests={programRequests} users={users} onApply={(t, title) => setApplyingForItem({ type: t, item: { title, photoUrl: 'https://picsum.photos/seed/ph-logo/400/400' } })} onSelectRequest={setSelectedRequest} />;
      case 'Device': return <InventoryPortal type="Device" isAdmin={isAdmin} requests={programRequests} items={devices} users={users} onApply={(t, title, id) => setApplyingForItem({ type: t, item: devices.find(d => d.id === id) })} onSelectRequest={setSelectedRequest} onEditItem={(item) => handleUpdateInventory('Device', item)} onToggleVisibility={(id) => toggleInventoryVisibility('Device', id)} onRemoveItem={(id) => removeInventoryItem('Device', id)} />;
      case 'Medical': return <InventoryPortal type="Medical" isAdmin={isAdmin} requests={programRequests} items={medicalServices} users={users} onApply={(t, title, id) => setApplyingForItem({ type: t, item: medicalServices.find(m => m.id === id) })} onSelectRequest={setSelectedRequest} onEditItem={(item) => handleUpdateInventory('Medical', item)} onToggleVisibility={(id) => toggleInventoryVisibility('Medical', id)} onRemoveItem={(id) => removeInventoryItem('Medical', id)} />;
      case 'Livelihood': return <InventoryPortal type="Livelihood" isAdmin={isAdmin} requests={programRequests} items={livelihoodPrograms} users={users} onApply={(t, title, id) => setApplyingForItem({ type: t, item: livelihoodPrograms.find(l => l.id === id) })} onSelectRequest={setSelectedRequest} onEditItem={(item) => handleUpdateInventory('Livelihood', item)} onToggleVisibility={(id) => toggleInventoryVisibility('Livelihood', id)} onRemoveItem={(id) => removeInventoryItem('Livelihood', id)} />;
      default: return (
        <div className="space-y-16">
          {/* My Tracking Board */}
          {!isAdmin && userPendingRequests.length > 0 && (
            <section className="animate-in slide-in-from-bottom-4 duration-700">
               <div className="flex items-center gap-4 mb-8 px-4">
                  <div className="w-8 h-8 bg-alaga-gold rounded-xl flex items-center justify-center text-alaga-navy shadow-lg">
                    <i className="fa-solid fa-clock-rotate-left text-xs"></i>
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] opacity-30">Active Registry Tracks</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userPendingRequests.map(req => (
                    <div key={req.id} className="inflated-card bg-white dark:bg-alaga-charcoal p-8 rounded-[40px] border border-gray-100 dark:border-white/5 relative overflow-hidden group">
                       <div className="absolute -right-4 -top-4 w-24 h-24 bg-alaga-gold/10 rounded-full blur-3xl group-hover:opacity-100 transition-opacity opacity-0"></div>
                       <div className="flex items-center justify-between mb-4">
                          <span className="px-4 py-1 bg-alaga-gold/20 text-alaga-navy dark:text-alaga-gold rounded-full text-[9px] font-black uppercase tracking-widest border border-alaga-gold/20">Pending Evaluation</span>
                          <span className="text-[9px] font-bold opacity-30 uppercase">{req.dateApplied}</span>
                       </div>
                       <h4 className="text-xl font-black text-3d mb-2">{req.title}</h4>
                       <p className="text-xs opacity-50 font-medium leading-relaxed mb-6">Your application is currently being reviewed by the PDAO/MSWDO admin team for eligibility verification.</p>
                       <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-white/5">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-alaga-gold rounded-full animate-ping"></div>
                             <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Tracking active</span>
                          </div>
                          <button className="text-[9px] font-black uppercase tracking-widest text-alaga-blue hover:underline">View Receipt</button>
                       </div>
                    </div>
                  ))}
               </div>
            </section>
          )}

          {/* Featured Core Service: ID Issuance */}
          <section className="animate-in slide-in-from-top-4 duration-700">
            <div
              onClick={() => setActiveModal('ID')}
              className="bg-white dark:bg-alaga-charcoal p-12 rounded-[48px] border-4 border-transparent hover:border-alaga-blue transition-all cursor-pointer group shadow-2xl flex flex-col md:flex-row items-center gap-12 overflow-hidden relative inflated-card"
            >
              <div className="absolute -right-20 -bottom-20 opacity-5 rotate-12 group-hover:scale-125 group-hover:rotate-0 transition-all duration-1000">
                <i className="fa-solid fa-id-card text-[300px]"></i>
              </div>
              <div className="w-32 h-32 bg-alaga-blue rounded-[32px] flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform shadow-2xl shadow-alaga-blue/40 relative z-10 inner-glow">
                <i className="fa-solid fa-id-card text-6xl glow-icon"></i>
              </div>
              <div className="flex-1 text-center md:text-left relative z-10">
                <h4 className="text-4xl font-black mb-4 text-3d-heavy tracking-tighter">Municipal ID Registry</h4>
                <p className="opacity-60 text-xl font-medium leading-relaxed max-w-2xl">
                  The primary Municipal Identification Card. Required for accessing all national benefits and local PDAO support programs.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-4">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white bg-alaga-blue px-6 py-2.5 rounded-full shadow-lg inner-glow">Mandatory Core Port</span>
                   <span className="text-xs font-black opacity-30 tracking-widest uppercase">Verified Account Required</span>
                </div>
              </div>
              <div className="shrink-0 relative z-10 hidden lg:block">
                <div className="w-20 h-20 rounded-[24px] bg-alaga-gray dark:bg-white/5 flex items-center justify-center group-hover:bg-alaga-blue group-hover:text-white transition-all shadow-inner">
                  <i className="fa-solid fa-arrow-right text-2xl group-hover:translate-x-2 transition-transform"></i>
                </div>
              </div>
            </div>
          </section>

          {/* Support Services */}
          <section className="animate-in fade-in duration-1000 delay-300">
            <div className="flex items-center gap-6 mb-12">
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 text-3d">Municipal Support Services</h3>
               <div className="h-[1px] flex-1 bg-gradient-to-r from-gray-100 via-gray-200 to-transparent dark:from-white/5 dark:via-white/10 dark:to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { id: 'PhilHealth', title: 'PhilHealth', icon: 'fa-shield-halved', color: 'bg-alaga-teal', desc: 'Sponsored enrollment for CWD/PWD families.' },
                { id: 'Device', title: 'Assistive Devices', icon: 'fa-wheelchair', color: 'bg-alaga-blue', desc: 'Mobility, hearing, and specialized aids.' },
                { id: 'Medical', title: 'Medical Aid', icon: 'fa-kit-medical', color: 'bg-red-500', desc: 'Maintenance subsidies and lab assistance.' },
                { id: 'Livelihood', title: 'Livelihood', icon: 'fa-briefcase', color: 'bg-alaga-gold', desc: 'Professional workshops and training.' }
              ].map(p => (
                <div
                  key={p.id}
                  onClick={() => setActiveModal(p.id as ProgramModalType)}
                  className="inflated-card bg-white dark:bg-alaga-charcoal p-8 rounded-[40px] border border-gray-100 dark:border-white/5 cursor-pointer group flex flex-col h-full hover:shadow-2xl hover:border-alaga-blue transition-all active:scale-95"
                >
                  <div className={`${p.color} w-16 h-16 rounded-[24px] flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-2xl inner-glow`}>
                    <i className={`fa-solid ${p.icon} text-2xl glow-icon`}></i>
                  </div>
                  <h4 className="text-2xl font-black mb-2 text-3d tracking-tight">{p.title}</h4>
                  <p className="opacity-50 text-sm font-medium leading-relaxed flex-1">{p.desc}</p>
                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between group-hover:opacity-100 opacity-0 transition-opacity group-hover:translate-y-0 translate-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-alaga-blue">View Services</span>
                    <i className="fa-solid fa-arrow-right text-[10px] text-alaga-blue group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      );
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-16 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h2 className="text-5xl font-black flex items-center gap-6 text-3d-heavy tracking-tighter">
             <i className="fa-solid fa-briefcase text-alaga-blue drop-shadow-xl animate-float"></i>
             Service Portals
             {(() => {
               const progUnread = notifications.filter(n => n.link && n.link.startsWith('programs') && !n.isRead).length;
               if (progUnread === 0) return null;
               if (progUnread === 1) return <span className="inline-block ml-4 w-2 h-2 bg-red-500 rounded-full align-middle" />;
               return <span className="inline-flex ml-4 items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full w-6 h-6">{progUnread}</span>;
             })()}
          </h2>
          <p className="opacity-40 font-black uppercase tracking-[0.3em] text-xs">Municipal Benefit & Aid Ecosystem</p>
        </div>
        {activeModal !== 'none' && (
          <button onClick={closeModal} className="flex items-center gap-3 px-8 py-4 bg-alaga-gray dark:bg-white/5 rounded-3xl font-black text-sm hover:bg-alaga-blue hover:text-white transition-all shadow-lg inflated-card active:scale-90">
             <i className="fa-solid fa-arrow-left"></i>
             <span>Back to Dashboard</span>
          </button>
        )}
      </header>

      <main className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {applyingForItem ? renderApplicationForm() : renderContent()}
      </main>

      {/* Admin Evaluation Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-0 md:p-10 bg-black/80 backdrop-blur-md alagalink-overlay-scroll alagalink-topbar-safe">
           <div className="bg-white dark:bg-alaga-charcoal w-full h-full md:rounded-[48px] overflow-hidden relative shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/10">
              <button onClick={closeModal} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-20 shadow-xl border border-white/10">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
              <AdminEvaluationOverlay
                req={selectedRequest}
                user={users.find(u => u.id === selectedRequest.userId)}
                onClose={closeModal}
                onApprove={(id, status, nav) => {
                  updateProgramRequest({...selectedRequest, status, adminNarrative: nav});
                  closeModal();
                }}
                onReject={(id, status) => {
                  updateProgramRequest({...selectedRequest, status});
                  closeModal();
                }}
                onUpdate={(id, patch) => {
                  updateProgramRequest({ ...selectedRequest, ...patch });
                  closeModal();
                }}
              />
           </div>
        </div>
      )}
    </div>
  );
};

export default Programs;




