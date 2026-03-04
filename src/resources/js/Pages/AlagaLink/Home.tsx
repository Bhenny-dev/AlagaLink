
import React, { useState, useMemo, useEffect } from 'react';

type UpdateItem = {
  id: string;
  title: string;
  date?: string;
  timestamp?: number;
  summary?: string;
  detail?: string;
  photoUrl?: string;
  type?: string;
  category?: string;
};

type DynamicUpdate = {
  id: string;
  title: string;
  date: string;
  timestamp: number;
  summary: string;
  detail?: string;
  link?: string;
  itemId?: string;
  photoUrl?: string;
  type?: string;
  category?: string;
  section?: string;
};
import { useAppContext } from '@/Providers/AlagaLink/AppContext';

import HomeHero from '@/Components/AlagaLink/home/HomeHero';
import HomeStats from '@/Components/AlagaLink/home/HomeStats';
import HomeNews from '@/Components/AlagaLink/home/HomeNews';
import UpdateModal from '@/Components/AlagaLink/home/UpdateModal';
import DigitalIdCard from '@/Components/AlagaLink/profile/DigitalIdCard';
import LandingPage from '@/Components/AlagaLink/home/LandingPageRestored';

const Home: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const {
    users,
    reports,
    devices,
    medicalServices,
    livelihoodPrograms,
    updates,
    globalSearchQuery,
    searchSignal,
    setSearchSignal,
    currentUser,
    programRequests,
  } = useAppContext();
  const [selectedUpdate, setSelectedUpdate] = useState<DynamicUpdate | null>(null);
  const [showPendingOptions, setShowPendingOptions] = useState(false);
  const [showRegisteredOptions, setShowRegisteredOptions] = useState(false);

  // Roles verification
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';
  // Digital Card appears only after admin approval.
  const hasDigitalId = !isAdmin && currentUser?.status === 'Active' && !!currentUser?.idMetadata;

  // Generate dynamic updates from system state (Aggregated Feed - NO LIMITS)
  const [dynamicUpdates, setDynamicUpdates] = useState<DynamicUpdate[]>([]);

  useEffect(() => {
    const items: DynamicUpdate[] = [];

    // 1. Add ALL Reports
    reports.forEach(r => {
      const isFound = r.status === 'Found';
      items.push({
        id: `rep-${r.id}`,
        title: isFound ? `RESOLUTION: ${r.name} Found Safe` : `URGENT: Search for ${r.name}`,
        date: isFound ? new Date(r.timeMissing).toLocaleDateString() : "ACTIVE CASE",
        timestamp: new Date(r.timeMissing).getTime(),
        summary: isFound
          ? `The community alert for ${r.name} has been successfully resolved.`
          : `Vigilance requested near ${r.lastSeen}. Physical: ${r.height}, ${r.bodyType}.`,
        detail: isFound
          ? (r.foundNarrative?.what || "Reunited with family.")
          : `Wearing ${r.clothes}. ${r.description}`,
        link: 'lost-found',
        itemId: r.id,
        photoUrl: r.photoUrl,
        type: isFound ? 'Alert' : 'Urgent',
        category: 'Lost & Found'
      });
    });

    // 2. Add ALL Livelihood Programs
    livelihoodPrograms.forEach(l => {
      items.push({
        id: `live-${l.id}`,
        title: `WORKSHOP: ${l.title}`,
        date: "Program Enrollment",
        timestamp: Date.now() - 86400000,
        summary: l.overview,
        detail: `Venue: ${l.venue}. Benefits: ${l.benefits}.`,
        link: 'programs',
        section: 'Livelihood',
        itemId: l.id,
        photoUrl: l.photoUrl,
        type: 'Program',
        category: 'Livelihood'
      });
    });

    // 3. Add ALL Medical Services
    medicalServices.forEach(m => {
      items.push({
        id: `med-${m.id}`,
        title: `HEALTH: ${m.name}`,
        date: "Medical Service",
        timestamp: Date.now() - 172800000,
        summary: m.overview,
        detail: m.assistanceDetail,
        link: 'programs',
        section: 'Medical',
        itemId: m.id,
        photoUrl: m.photoUrl,
        type: 'Service',
        category: 'Medical'
      });
    });

    // 4. Add ALL Assistive Devices (as Inventory Updates)
    devices.forEach(d => {
      items.push({
        id: `dev-${d.id}`,
        title: `INVENTORY: ${d.name} Stocks`,
        date: "Stock Arrival",
        timestamp: Date.now() - 259200000,
        summary: `New batch of ${d.name} available for eligible residents.`,
        detail: d.overview,
        link: 'programs',
        section: 'Device',
        itemId: d.id,
        photoUrl: d.photoUrl,
        type: 'Supply',
        category: 'Assistive Devices'
      });
    });

    // 5. Registry Milestones (Admin/SuperAdmin only - all active)
    if (isAdmin) {
       users.filter(u => u.status === 'Active').forEach(u => {
          items.push({
             id: `reg-${u.id}`,
             title: `REGISTRY: Member Verified`,
             date: "Archive Entry",
             timestamp: Date.now() - (Math.random() * 500000000),
             summary: `${u.firstName} ${u.lastName} finalized in ${u.disabilityCategory} registry.`,
             detail: `Full verification complete for resident of ${u.address}.`,
             link: 'members',
             itemId: u.id,
             photoUrl: u.photoUrl,
             type: 'Registry',
             category: 'Administrative'
          });
       });
    }

    // 6. Mock News Updates
    updates.forEach(upd => items.push({
      ...upd,
      id: String(upd.id),
      photoUrl: `https://picsum.photos/seed/upd-${upd.id}/800/400`,
      type: 'News',
      category: 'Municipal',
      timestamp: Date.now() - (upd.id * 100000000)
    }));

      // FINAL SORT: Most recent first across all categories
    const sorted = items.sort((a, b) => b.timestamp - a.timestamp);
    // Defer state update to avoid synchronous setState in effect
    Promise.resolve().then(() => setDynamicUpdates(sorted));
  }, [reports, users, devices, medicalServices, livelihoodPrograms, updates, isAdmin]);

  // Search Signal Hook
  useEffect(() => {
    if (searchSignal && searchSignal.page === 'home' && searchSignal.itemId) {
      const itemId = searchSignal.itemId;
      const targetUpdate = dynamicUpdates.find(u => u.itemId === itemId || u.id.toString() === itemId.replace('news-', ''));
      if (targetUpdate) Promise.resolve().then(() => setSelectedUpdate(targetUpdate));
    }
  }, [searchSignal, dynamicUpdates]);

  const isSearching = globalSearchQuery.length > 0;
  const filteredUpdates = useMemo(() => {
    return dynamicUpdates.filter(update =>
      update.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
      update.summary.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
      (update.category || '').toLowerCase().includes(globalSearchQuery.toLowerCase())
    );
  }, [globalSearchQuery, dynamicUpdates]);

  // Accuracy Statistics (Active Only)
  const activeUsersCount = users.filter(u => u.status === 'Active').length;
  const pendingRegistrationsCount = users.filter(u => u.status === 'Pending').length;
  const totalOffers = devices.length + medicalServices.length + livelihoodPrograms.length + 1;

  const stats = useMemo(() => {
    if (isAdmin) {
      return [
        { label: 'Registered Users', value: activeUsersCount, icon: 'fa-users', color: 'bg-alaga-blue', link: 'registered-choice' },
        { label: 'Active Missing Reports', value: reports.filter(r => r.status === 'Missing').length, icon: 'fa-person-circle-question', color: 'bg-red-500', link: 'lost-found' },
        { label: 'Pending Registrations', value: pendingRegistrationsCount, icon: 'fa-id-card', color: 'bg-alaga-gold', link: 'pending-choice' },
        { label: 'Programs & Services', value: totalOffers, sublabel: 'Available Offers', icon: 'fa-hand-holding-hand', color: 'bg-alaga-teal', link: 'programs' },
      ];
    } else {
      const userProgramsCount = currentUser?.history.programs.length || 0;
      const pendingIDRequest = programRequests.find(r => r.userId === currentUser?.id && r.programType === 'ID' && r.status === 'Pending');
      return [
        { label: 'My Alaga Profile', value: userProgramsCount, sublabel: 'Service History', icon: 'fa-user-check', color: 'bg-alaga-blue', link: 'profile' },
        { label: 'Active Community Alerts', value: reports.filter(r => r.status === 'Missing').length, icon: 'fa-person-circle-question', color: 'bg-red-500', link: 'lost-found' },
        { label: 'My ID Application', value: pendingIDRequest ? 1 : 0, sublabel: pendingIDRequest ? 'Status: Pending' : 'No Request', icon: 'fa-id-card', color: 'bg-alaga-gold', link: 'programs' },
        { label: 'Municipal Aid Portals', value: totalOffers, sublabel: 'Discover Help', icon: 'fa-hand-holding-hand', color: 'bg-alaga-teal', link: 'programs' },
      ];
    }
  }, [isAdmin, reports, activeUsersCount, pendingRegistrationsCount, totalOffers, currentUser, programRequests]);

  const handleStatNavigate = (link: string) => {
    if (link === 'pending-choice') setShowPendingOptions(true);
    else if (link === 'registered-choice') {
      if (isSuperAdmin) setShowRegisteredOptions(true);
      else {
        setSearchSignal({ page: 'members', section: 'PWD' });
        onNavigate('members');
      }
    } else onNavigate(link);
  };

  const handleRegisteredChoice = (section: string) => {
    setSearchSignal({ page: 'members', section });
    onNavigate('members');
    setShowRegisteredOptions(false);
  };

  const handlePendingChoice = (section: string) => {
    if (section === 'ID') {
      setSearchSignal({ page: 'programs', section: 'ID' });
      onNavigate('programs');
    } else {
      setSearchSignal({ page: 'members', section: 'Pending' });
      onNavigate('members');
    }
    setShowPendingOptions(false);
  };

  if (!currentUser) {
    return <LandingPage allowAdminRegistration={false} />;
  }

  const handleUpdateClick = (update: UpdateItem) => {
    setSelectedUpdate(update as any);
  };

  const handleNewsSelect = (update: UpdateItem) => {
    setSelectedUpdate(update as any);
  };

  return (
    <div className="p-4 md:p-8 space-y-10 md:space-y-16 max-w-7xl mx-auto animate-in fade-in duration-700 pb-32">

      {/* 1. Hero Highlights */}
      {!isSearching && <HomeHero updates={dynamicUpdates.slice(0, 5)} onClick={handleUpdateClick} />}

      {/* 2. Quick Dashboard Stats */}
      {!isSearching && <HomeStats stats={stats} onNavigate={handleStatNavigate} />}

      {/* 3. Personal Digital ID Card Section (Fluid Radii) */}
      {!isSearching && hasDigitalId && currentUser && (
        <section className="animate-in slide-in-from-bottom-6 duration-1000">
           <div className="flex flex-col lg:flex-row items-center gap-12 bg-white dark:bg-alaga-charcoal p-6 md:p-12 rounded-[24px] md:rounded-[48px] border border-gray-100 dark:border-white/5 shadow-2xl relative transform-gpu transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:scale-[1.01]">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-alaga-blue/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="flex-1 space-y-6 relative z-10 text-center lg:text-left">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-alaga-blue/10 text-alaga-blue rounded-full">
                  <i className="fa-solid fa-id-card-clip text-sm"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">Physical Card Visualization</span>
                </div>
                <h3 className="text-3xl md:text-5xl font-black text-3d-heavy tracking-tighter leading-none">The Official ePWD ID</h3>
                <p className="opacity-60 text-base md:text-lg font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                 Your high-integrity community identity. Use the front for visual identification and the back for scannable verification.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <div className="flex items-center gap-2 px-5 py-2.5 bg-alaga-teal/10 text-alaga-teal rounded-xl border border-alaga-teal/20 text-[10px] font-black uppercase tracking-widest">
                 <i className="fa-solid fa-shield-check animate-pulse"></i>
                 Verified Record
                </div>
              </div>
            </div>

              <div className="shrink-0 relative z-10 w-full lg:w-auto">
              <DigitalIdCard user={currentUser} />
            </div>
          </div>
        </section>
      )}

      {/* 4. The Municipal Gazette */}
      <section className="space-y-8 md:space-y-12">
        {isSearching && (
          <div className="p-6 md:p-10 bg-white dark:bg-alaga-charcoal border border-gray-100 dark:border-white/5 rounded-[24px] md:rounded-[40px] shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4">
            <div>
              <h3 className="text-2xl md:text-4xl font-black text-3d-heavy">Search Archives</h3>
              <p className="opacity-40 font-bold uppercase tracking-widest text-[10px] mt-2">
                Filtering {filteredUpdates.length} records for &quot;{globalSearchQuery}&quot;
              </p>
            </div>
            <button onClick={() => setSearchSignal(null)} className="text-alaga-blue font-black uppercase text-[10px] md:text-xs hover:underline">Clear Search</button>
          </div>
        )}

        <HomeNews
          updates={filteredUpdates}
          onSelect={handleNewsSelect}
          isAdmin={isAdmin}
        />
      </section>

      {/* Overlays (Adjusted Radii) */}
      {showRegisteredOptions && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 alagalink-overlay-scroll alagalink-topbar-safe">
          <div className="bg-white dark:bg-alaga-charcoal p-8 rounded-[32px] shadow-2xl w-full max-w-sm relative animate-in zoom-in-95">
            <button onClick={() => setShowRegisteredOptions(false)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-xmark"></i></button>
            <div className="text-center mb-10"><div className="w-16 h-16 bg-alaga-blue/10 text-alaga-blue rounded-2xl flex items-center justify-center mx-auto mb-4"><i className="fa-solid fa-users text-2xl"></i></div><h3 className="text-2xl font-black">Target Registry</h3><p className="text-xs opacity-50">Select category to manage:</p></div>
            <div className="space-y-4">
              <button onClick={() => handleRegisteredChoice('Staff')} className="w-full flex items-center gap-4 p-5 bg-alaga-blue/5 hover:bg-alaga-blue hover:text-white rounded-[24px] border border-alaga-blue/10 transition-all group"><i className="fa-solid fa-shield-halved"></i> <span className="font-bold text-sm">Administrative Team</span></button>
              <button onClick={() => handleRegisteredChoice('PWD')} className="w-full flex items-center gap-4 p-5 bg-alaga-teal/5 hover:bg-alaga-teal hover:text-white rounded-[24px] border border-alaga-teal/10 transition-all group"><i className="fa-solid fa-person-rays"></i> <span className="font-bold text-sm">Community Members</span></button>
            </div>
          </div>
        </div>
      )}

      {showPendingOptions && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 alagalink-overlay-scroll alagalink-topbar-safe">
          <div className="bg-white dark:bg-alaga-charcoal p-8 rounded-[32px] shadow-2xl w-full max-w-sm relative animate-in zoom-in-95">
            <button onClick={() => setShowPendingOptions(false)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-xmark"></i></button>
            <div className="text-center mb-10"><div className="w-16 h-16 bg-alaga-gold/10 text-alaga-gold rounded-2xl flex items-center justify-center mx-auto mb-4"><i className="fa-solid fa-id-card text-2xl"></i></div><h3 className="text-2xl font-black">Pending Desk</h3><p className="text-xs opacity-50">Select evaluation queue:</p></div>
            <div className="space-y-4">
              <button onClick={() => handlePendingChoice('Registry')} className="w-full flex items-center gap-4 p-5 bg-alaga-teal/5 hover:bg-alaga-teal hover:text-white rounded-[24px] border border-alaga-teal/10 transition-all group"><i className="fa-solid fa-user-plus"></i> <span className="font-bold text-sm">New Profile Registry</span></button>
              <button onClick={() => handlePendingChoice('ID')} className="w-full flex items-center gap-4 p-5 bg-alaga-blue/5 hover:bg-alaga-blue hover:text-white rounded-[24px] border border-alaga-blue/10 transition-all group"><i className="fa-solid fa-id-badge"></i> <span className="font-bold text-sm">ID Issuance Workflow</span></button>
            </div>
          </div>
        </div>
      )}

      <UpdateModal
        update={selectedUpdate}
        onClose={() => { setSelectedUpdate(null); setSearchSignal(null); }}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default Home;
