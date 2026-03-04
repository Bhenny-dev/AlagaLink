
import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';
import { ProgramAvailment, UserProfile, LivelihoodProgram, MedicalService, AssistiveDevice } from '@/Providers/AlagaLink/types';
import ImageInput from '../shared/ImageInput';
import FallbackImage from '../shared/FallbackImage';
import type { Notification } from '@/Providers/AlagaLink/types';

type ServiceItem = {
  id: string;
  name?: string;
  title?: string;
  overview?: string;
  organizers?: string;
  benefits?: string;
  description?: string;
  eligibility?: string;
  schedule?: string;
  modeOfReceiving?: string;
  category?: string;
  stockCount?: number;
  photoUrl?: string;
  photoAlt?: string;
  isVisible?: boolean;
  venue?: string;
  skillSet?: string[];
};

interface InventoryPortalProps {
  type: 'Device' | 'Medical' | 'Livelihood';
  isAdmin: boolean;
  requests: ProgramAvailment[];
  items: ServiceItem[];
  users: UserProfile[];
  onApply: (type: string, title: string, itemId: string) => void;
  onSelectRequest: (req: ProgramAvailment) => void;
  onEditItem: (item: ServiceItem) => void;
  onToggleVisibility: (id: string) => void;
  onRemoveItem: (id: string) => void;
}

const InventoryPortal: React.FC<InventoryPortalProps> = ({
  type, isAdmin, requests, items, users, onApply, onSelectRequest, onEditItem, onToggleVisibility, onRemoveItem
}) => {
  const { updateProgramRequest, notifications } = useAppContext();
  const [activeTab, setActiveTab] = useState<'requests' | 'inventory'>('requests');
  const [selectedLivelihood, setSelectedLivelihood] = useState<LivelihoodProgram | null>(null);
  const [selectedMedical, setSelectedMedical] = useState<MedicalService | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<AssistiveDevice | null>(null);

  // Editor State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingItemData, setEditingItemData] = useState<ServiceItem | null>(null);

  const getColors = () => {
    if (type === 'Device') return { primary: 'alaga-blue', icon: 'fa-wheelchair', bg: 'bg-alaga-blue/10', text: 'text-alaga-blue' };
    if (type === 'Medical') return { primary: 'red-500', icon: 'fa-kit-medical', bg: 'bg-red-500/10', text: 'text-red-500' };
    return { primary: 'alaga-gold', icon: 'fa-briefcase', bg: 'bg-alaga-gold/10', text: 'text-alaga-gold' };
  };

  // Log items for debugging
  useEffect(() => {
    console.log(`[${type}] Current items:`, items);
  }, [items, type]);

  const c = getColors();

  const inventoryTabLabel = type === 'Livelihood'
    ? 'Trainings & Workshop Management'
    : type === 'Medical'
      ? 'Medical Services Management'
      : 'Stock Management';

  const filteredRequests = useMemo(() => {
    const base = requests.filter(r => r.programType === type);
    return base.filter(r => r.status === 'Pending');
  }, [requests, type]);

  const handleCancelParticipation = (req: ProgramAvailment) => {
    if (confirm(`Are you sure you want to remove ${users.find(u => u.id === req.userId)?.firstName} from this program? Their request will return to "Pending" status.`)) {
      updateProgramRequest({ ...req, status: 'Pending' });
    }
  };

  const openEditor = (item: ServiceItem | null = null) => {
    setEditingItemData(item || {
      id: `temp-${Date.now()}`,
      name: '', title: '', overview: '', category: '', photoUrl: '', stockCount: 0, isVisible: true, organizers: '', schedule: '', benefits: '', venue: ''
    });
    setIsAddingNew(true);
  };

  const handleSaveItem = () => {
    if (!editingItemData || (!editingItemData.title && !editingItemData.name)) {
      alert('Please enter a title/name for this item');
      return;
    }
    console.log('Saving item data:', editingItemData);
    onEditItem(editingItemData);
    setIsAddingNew(false);
    setEditingItemData(null);
  };

  if (isAdmin) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex border-b border-gray-100 dark:border-white/5">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-8 py-4 font-black text-sm transition-all relative ${activeTab === 'requests' ? 'text-alaga-blue' : 'opacity-40 hover:opacity-100'}`}
          >
            Applicant Registry ({filteredRequests.length})
            {activeTab === 'requests' && <div className="absolute bottom-0 left-0 w-full h-1 bg-alaga-blue rounded-t-full"></div>}
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-8 py-4 font-black text-sm transition-all relative ${activeTab === 'inventory' ? 'text-alaga-blue' : 'opacity-40 hover:opacity-100'}`}
          >
            {inventoryTabLabel} ({items.length})
            {activeTab === 'inventory' && <div className="absolute bottom-0 left-0 w-full h-1 bg-alaga-blue rounded-t-full"></div>}
          </button>
        </div>

        {activeTab === 'requests' ? (
          <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-300">
            {filteredRequests.length > 0 ? filteredRequests.map(req => {
                const user = users.find(u => u.id === req.userId);
                const reqUnread = notifications.filter(n => n.link && n.link.endsWith(req.id) && !n.isRead).length;
                return (
                    <div key={req.id} onClick={() => onSelectRequest(req)} className="p-6 bg-white dark:bg-alaga-navy/20 rounded-[16px] border border-gray-100 dark:border-white/5 flex justify-between items-center cursor-pointer hover:border-alaga-blue transition-all group">
                        <div className="flex items-center gap-4">
                      <FallbackImage src={user?.photoUrl} className="w-12 h-12 rounded-xl object-cover" alt={`${user?.firstName} ${user?.lastName}`} fallbackType="Generic" />
                            <div>
                                <p className="font-bold">{user?.firstName} {user?.lastName}</p>
                                <p className="text-[10px] opacity-40 uppercase tracking-widest font-black">{req.title} • {req.dateApplied}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-alaga-gold text-alaga-navy shadow-sm`}>Pending Review</span>
                          {reqUnread > 0 && (reqUnread === 1 ? <span className="w-3 h-3 bg-red-500 rounded-full" /> : <span className="inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full w-6 h-6">{reqUnread}</span>)}
                          <i className="fa-solid fa-chevron-right opacity-0 group-hover:opacity-100 transition-all"></i>
                        </div>
                    </div>
                );
            }) : (<div className="py-20 text-center opacity-30 italic">No pending {type} applicants to manage.</div>)}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex justify-between items-center"><h4 className="text-sm font-black uppercase opacity-40">Active {type === 'Device' ? 'Stock Management' : 'Service Offerings'}</h4><button onClick={() => openEditor()} className={`bg-alaga-blue text-white px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-alaga-blue/20`}>+ New {type === 'Device' ? 'Stock Entry' : 'Service Event'}</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {items.map(item => {
                const approvedParticipants = requests.filter(r => r.programType === type && r.requestedItemId === item.id && (r.status === 'Approved' || r.status === 'Completed'));
                return (
                  <div key={item.id} onClick={() => { if (type === 'Livelihood') setSelectedLivelihood(item as LivelihoodProgram); if (type === 'Medical') setSelectedMedical(item as MedicalService); if (type === 'Device') setSelectedDevice(item as AssistiveDevice); }} className={`bg-white dark:bg-alaga-navy/20 rounded-[16px] overflow-hidden border transition-all cursor-pointer hover:shadow-xl ${!item.isVisible ? 'opacity-50 grayscale' : 'border-gray-100 dark:border-white/5 hover:border-alaga-blue'}`}>
                    <div className="flex flex-col">
                      <div className="h-40 w-full bg-alaga-gray dark:bg-black/40 relative group overflow-hidden">
                        <FallbackImage src={item.photoUrl} className="absolute inset-0 w-full h-full object-cover blur-lg opacity-30 scale-125" alt={item.photoAlt || item.name || item.title} fallbackType={type} />
                        <FallbackImage src={item.photoUrl} className="relative w-full h-full object-cover group-hover:scale-95 transition-transform duration-500" alt={item.photoAlt || item.name || item.title} fallbackType={type} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity z-10">
                          <button onClick={(e) => { e.stopPropagation(); openEditor(item); }} className="w-8 h-8 bg-white rounded-full text-alaga-navy flex items-center justify-center transition-transform hover:scale-110"><i className="fa-solid fa-pen text-[10px]"></i></button>
                          <button onClick={(e) => { e.stopPropagation(); onToggleVisibility(item.id); }} className="w-8 h-8 bg-white rounded-full text-alaga-navy flex items-center justify-center transition-transform hover:scale-110"><i className={`fa-solid ${item.isVisible ? 'fa-eye-slash' : 'fa-eye'} text-[10px]`}></i></button>
                          <button onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }} className="w-8 h-8 bg-red-500 rounded-full text-white flex items-center justify-center transition-transform hover:scale-110"><i className="fa-solid fa-trash text-[10px]"></i></button>
                        </div>
                      </div>
                      <div className="flex-1 p-4 flex flex-col min-w-0"><div className="flex justify-between items-start mb-0.5 gap-2"><h5 className="font-bold text-xs truncate">{item.name || item.title}</h5><span className={`text-[7px] font-black uppercase shrink-0 ${c.text} ${c.bg} px-2 py-0.5 rounded`}>{item.category}</span></div><p className="text-[9px] font-bold opacity-40 mb-2 truncate">{item.stockCount !== undefined ? `${item.stockCount} Units Available` : item.schedule}</p><div className="mt-auto pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between"><div className="flex -space-x-1.5 overflow-hidden">{approvedParticipants.slice(0, 3).map(p => { const u = users.find(user => user.id === p.userId); return (u?.photoUrl ? (<Image key={p.id} src={u.photoUrl} width={20} height={20} className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-alaga-charcoal object-cover" alt={`${u.firstName} ${u.lastName}`} />) : (<div key={p.id} className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-alaga-charcoal bg-gray-100" />)); })}{approvedParticipants.length > 3 && (<div className="flex items-center justify-center h-5 w-5 rounded-full bg-alaga-gray dark:bg-white/10 text-[7px] font-bold ring-2 ring-white dark:ring-alaga-charcoal">+{approvedParticipants.length - 3}</div>)}</div><span className="text-[8px] font-black opacity-30 uppercase">Manage</span></div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Local Assets & Record Editor */}
        {isAddingNew && editingItemData && (
           <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 alagalink-overlay-scroll alagalink-topbar-safe">
             <div className="bg-white dark:bg-alaga-charcoal w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 no-scrollbar">
                <div className="flex items-center justify-between">
                   <h3 className="text-2xl font-black">{editingItemData.id ? 'Modify Record' : 'New System Entry'}</h3>
                   <button onClick={() => setIsAddingNew(false)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-xmark"></i></button>
                </div>

                <ImageInput
                  value={editingItemData.photoUrl || ''}
                  onChange={val => setEditingItemData({...editingItemData, photoUrl: val})}
                  label="Local Registry Asset"
                  aspect="video"
                />

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2 col-span-2">
                      <label className="text-[10px] font-black uppercase opacity-40">Display Title / Name</label>
                      <input value={editingItemData.name || editingItemData.title} onChange={e => setEditingItemData({...editingItemData, [type === 'Device' ? 'name' : 'title']: e.target.value})} className="w-full p-4 rounded-xl bg-alaga-gray dark:bg-alaga-navy/20 border-none outline-none focus:ring-2 ring-alaga-blue/30 font-bold" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase opacity-40">Classification Category</label>
                      <input value={editingItemData.category} onChange={e => setEditingItemData({...editingItemData, category: e.target.value})} className="w-full p-4 rounded-xl bg-alaga-gray dark:bg-alaga-navy/20 border-none outline-none focus:ring-2 ring-alaga-blue/30 font-bold" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase opacity-40">{type === 'Device' ? 'Stock Quantity' : 'Schedule Detail'}</label>
                      <input value={type === 'Device' ? editingItemData.stockCount : editingItemData.schedule} onChange={e => setEditingItemData({...editingItemData, [type === 'Device' ? 'stockCount' : 'schedule']: e.target.value})} className="w-full p-4 rounded-xl bg-alaga-gray dark:bg-alaga-navy/20 border-none outline-none focus:ring-2 ring-alaga-blue/30 font-bold" />
                   </div>
                   <div className="space-y-2 col-span-2">
                      <label className="text-[10px] font-black uppercase opacity-40">System Overview / Narrative</label>
                      <textarea rows={3} value={editingItemData.overview} onChange={e => setEditingItemData({...editingItemData, overview: e.target.value})} className="w-full p-4 rounded-xl bg-alaga-gray dark:bg-alaga-navy/20 border-none outline-none focus:ring-2 ring-alaga-blue/30 font-medium text-sm" />
                   </div>
                </div>

                <div className="flex gap-4 pt-6">
                   <button onClick={handleSaveItem} className="flex-1 bg-alaga-blue text-white py-5 rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Synchronize Registry</button>
                   <button onClick={() => setIsAddingNew(false)} className="px-10 py-5 bg-gray-100 dark:bg-white/5 rounded-2xl font-black text-sm opacity-40 hover:opacity-100 transition-all">Cancel</button>
                </div>
             </div>
          </div>
        )}

        {(selectedLivelihood || selectedMedical || selectedDevice) && (
          <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 alagalink-overlay-scroll alagalink-topbar-safe">
            <div className="bg-white dark:bg-alaga-charcoal w-full max-w-4xl h-[90vh] rounded-[24px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
              {(() => {
                const item = selectedLivelihood || selectedMedical || selectedDevice;
                if (!item) return null;
                const title = (item as any).title || (item as any).name;
                const overview = (item as any).overview || (item as any).description;
                const skillLabel = type === 'Medical' ? 'Requirements & Focus' : type === 'Device' ? 'Eligibility & Requirements' : 'Skill Set Gained';
                return (
                  <>
                    <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between shrink-0">
                      <div><h3 className="text-3xl font-black">{title}</h3><p className="text-xs opacity-40 font-black uppercase tracking-widest">{type} Management Console</p></div>
                      <div className="flex items-center gap-3"><button onClick={() => openEditor(item)} className="w-10 h-10 flex items-center justify-center rounded-full bg-alaga-blue text-white shadow-lg hover:scale-105 transition-all"><i className="fa-solid fa-pen-to-square"></i></button><button onClick={() => { setSelectedLivelihood(null); setSelectedMedical(null); setSelectedDevice(null); }} className="w-10 h-10 rounded-full bg-alaga-gray dark:bg-white/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-xmark"></i></button></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="md:col-span-1 space-y-6">
                          <div className="w-full aspect-square bg-alaga-gray dark:bg-black/40 rounded-[20px] shadow-2xl overflow-hidden relative">
                            <FallbackImage src={item.photoUrl} className="absolute inset-0 w-full h-full object-cover blur-xl opacity-20 scale-125" alt={(item as any).photoAlt || (item as any).name || (item as any).title} fallbackType={type} />
                            <FallbackImage src={item.photoUrl} className="relative w-full h-full object-contain p-6" alt={(item as any).photoAlt || (item as any).name || (item as any).title} fallbackType={type} />
                          </div>
                          <div className="p-6 bg-alaga-gray dark:bg-alaga-navy/20 rounded-[20px] space-y-4 border border-gray-100 dark:border-white/5">
                            <div><p className="text-[9px] font-black uppercase opacity-40 mb-1 tracking-widest">Schedule</p><p className="font-bold text-sm">{(item as any).schedule}</p></div>
                            <div><p className="text-[9px] font-black uppercase opacity-40 mb-1 tracking-widest">Location / Venue</p><p className="font-bold text-sm">{(item as any).venue || 'Municipal Office'}</p></div>
                            <div><p className="text-[9px] font-black uppercase opacity-40 mb-1 tracking-widest">Sponsoring Organizers</p><p className="font-bold text-sm leading-tight">{(item as any).organizers}</p></div>
                            {(item as any).stockCount !== undefined && (
                              <div>
                                <p className="text-[9px] font-black uppercase opacity-40 mb-1 tracking-widest">Inventory Status</p>
                                <p className={`font-black text-sm ${ (item as any).stockCount > 0 ? 'text-alaga-teal' : 'text-red-500'}`}>{(item as any).stockCount} Units Left</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-8"><section><h5 className="text-xs font-black uppercase tracking-widest text-alaga-blue mb-3">Item Overview</h5><p className="text-base leading-relaxed opacity-70">{overview}</p></section><div className="grid grid-cols-2 gap-8"><section><h5 className="text-xs font-black uppercase tracking-widest text-alaga-teal mb-3">{skillLabel}</h5><ul className="space-y-2">{(((item as any).skillSet || [(item as any).eligibility] || []) as string[]).map((s: string) => (<li key={s} className="text-sm font-bold flex items-center gap-2"><i className="fa-solid fa-check-circle text-alaga-teal opacity-50"></i> {s}</li>))}</ul></section><section><h5 className="text-xs font-black uppercase tracking-widest text-alaga-gold mb-3">Service Benefits</h5><p className="text-sm font-medium leading-relaxed opacity-80 italic">&quot;{(item as any).benefits}&quot;</p> </section></div><section className="pt-8 border-t border-gray-100 dark:border-white/5"><h5 className="text-xs font-black uppercase tracking-widest text-alaga-blue mb-6 flex items-center justify-between"><span>Approved Recipients / Members</span><span className="text-[10px] bg-alaga-blue text-white px-3 py-1 rounded-full">{requests.filter(r => r.requestedItemId === item.id && (r.status === 'Approved' || r.status === 'Completed')).length} Members</span></h5><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{requests.filter(r => r.requestedItemId === item.id && (r.status === 'Approved' || r.status === 'Completed')).map(req => { const u = users.find(user => user.id === req.userId); return (<div key={req.id} className="p-4 bg-white dark:bg-alaga-navy/20 border border-gray-100 dark:border-white/5 rounded-2xl flex items-center gap-4 group/p">{u?.photoUrl ? (<Image src={u.photoUrl} width={40} height={40} alt={`${u.firstName} ${u.lastName}`} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />) : (<div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white shadow-sm" />)}<div className="flex-1 min-w-0"><p className="text-sm font-black truncate">{u?.firstName} {u?.lastName}</p><p className="text-[9px] font-mono opacity-40 uppercase">{u?.id}</p></div><button onClick={() => handleCancelParticipation(req)} className="w-8 h-8 rounded-lg bg-red-500/5 text-red-500 opacity-0 group-hover/p:opacity-100 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center" title="Remove Recipient"><i className="fa-solid fa-user-minus text-xs"></i></button></div>); })}{requests.filter(r => r.requestedItemId === item.id && (r.status === 'Approved' || r.status === 'Completed')).length === 0 && (<div className="col-span-2 py-12 text-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[20px] opacity-30 flex flex-col items-center"><i className="fa-solid fa-users-slash text-3xl mb-3"></i><p className="font-bold text-sm italic">No approved recipients listed yet.</p></div>)}</div></section></div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in zoom-in-95 duration-500">
      {items.filter(i => i.isVisible).map(item => (
        <InventoryCard key={item.id} item={item} type={type} onApply={onApply} requests={requests} notifications={notifications} />
      ))}
    </div>
  );
};

interface InventoryCardProps {
  item: ServiceItem;
  type: 'Device' | 'Medical' | 'Livelihood';
  onApply: (type: string, title: string, itemId: string) => void;
  requests: ProgramAvailment[];
  notifications: Notification[];
}

const InventoryCard: React.FC<InventoryCardProps> = ({ item, type, onApply, requests, notifications }) => {
  const [imageError] = useState(false);
  const unreadRequestsForItem = requests.filter(r => r.programType === type && r.requestedItemId === item.id && notifications.some(n => n.link && n.link.endsWith(r.id) && !n.isRead)).length;

  return (
    <div className="bg-white dark:bg-alaga-charcoal rounded-[24px] overflow-hidden border border-gray-100 dark:border-white/5 group hover:border-alaga-blue transition-all flex flex-col shadow-sm">
      <div className="h-48 bg-alaga-gray dark:bg-black/20 overflow-hidden relative">
        {imageError || !item.photoUrl ? (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-alaga-navy/40 dark:to-black/40">
            <i className="fa-solid fa-image text-3xl opacity-30 mb-2"></i>
            <p className="text-[9px] font-bold opacity-30 text-center px-2">Image Not Available</p>
          </div>
        ) : (
          <>
            <Image src={item.photoUrl || ''} width={640} height={192} className="absolute inset-0 w-full h-full object-cover blur-lg opacity-30 scale-110" alt="" />
            <Image src={item.photoUrl || ''} width={640} height={192} className="relative w-full h-full object-cover group-hover:scale-105 transition-all duration-700 will-change-transform" alt={(item as any).name || (item as any).title || ''} />
          </>
        )}
        <div className="absolute top-4 left-4 bg-alaga-navy/60 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest z-10">{(item as any).category}</div>
        {unreadRequestsForItem > 0 && (unreadRequestsForItem === 1 ? <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full" /> : <div className="absolute top-4 right-4 inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full w-6 h-6">{unreadRequestsForItem}</div>)}
        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.05)] pointer-events-none"></div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h4 className="text-lg font-black mb-1.5 truncate">{item.name || item.title}</h4>
        <p className="text-[11px] opacity-60 mb-5 line-clamp-2 leading-relaxed flex-1 font-medium">{item.overview || item.description}</p>
        <div className="mb-5 space-y-1.5">
          <div className="flex items-center gap-2 text-[9px] font-bold opacity-50"><i className="fa-solid fa-calendar text-alaga-blue"></i> {(item as any).schedule || 'TBD'}</div>
          <div className="flex items-center gap-2 text-[9px] font-bold opacity-50"><i className="fa-solid fa-location-dot text-alaga-blue"></i> {(item as any).venue || 'Municipal Office'}</div>
        </div>
        <button
          onClick={() => onApply(type, ((item as any).name || (item as any).title || ''), item.id)}
          className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all ${(item as any).stockCount === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : `bg-alaga-blue text-white shadow-xl hover:scale-[1.02]`}`}
        >
          {(item as any).stockCount === 0 ? 'Out of Stock' : `Request ${type === 'Device' ? 'Aid' : 'Program'}`}
        </button>
      </div>
    </div>
  );
};



export default InventoryPortal;
