
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';
import NotificationPopover from './notifications/NotificationPopover';
import { UserProfile } from '@/Providers/AlagaLink/types';

type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  page: string;
  section?: string;
  itemId?: string;
};

const Navbar: React.FC<{ onNavigate: (page: string) => void, currentPage: string }> = ({ onNavigate, currentPage }) => {
  const {
    currentUser,
    isDarkMode,
    toggleTheme,
    logout,
    setSearchSignal,
    notifications,
    users,
    reports,
    programRequests,
    devices,
    medicalServices,
    livelihoodPrograms,
    updates,
    globalSearchQuery,
    setGlobalSearchQuery,
  } = useAppContext();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  const navItems = useMemo(() => [
    { id: 'home', label: 'Home', icon: 'fa-house' },
    { id: 'programs', label: 'Programs', icon: 'fa-briefcase' },
    { id: 'lost-found', label: 'Lost & Found', icon: 'fa-magnifying-glass-location' },
    ...(isAdmin ? [{ id: 'members', label: 'Members', icon: 'fa-users' }] : [])
  ], [isAdmin]);

  const handleNavigate = (id: string, opts?: { force?: boolean }) => {
    // If the target is an in-page anchor, scroll smoothly instead of navigating away
    if (!opts?.force) {
      const anchorMap: Record<string, string> = {
        home: 'home',
        programs: 'programs',
        'lost-found': 'community-vigil'
      };
      const anchorId = anchorMap[id];
      if (anchorId) {
        const el = document.getElementById(anchorId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          setIsMobileMenuOpen(false);
          return;
        }
      }
    }

    onNavigate(id);
    setIsMobileMenuOpen(false);
  };

  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const universalResults = useMemo<SearchResult[]>(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResult[] = [];

    const pushUnique = (r: SearchResult) => {
      if (results.some(x => x.id === r.id)) return;
      results.push(r);
    };

    // Users (Admins only; SuperAdmin can see staff too)
    if (isAdmin) {
      const canSeeStaff = currentUser?.role === 'SuperAdmin';
      users.forEach((u: UserProfile) => {
        const hay = `${u.firstName} ${u.lastName} ${u.id} ${u.email}`.toLowerCase();
        if (!hay.includes(q)) return;

        const isStaff = u.role === 'Admin' || u.role === 'SuperAdmin';
        if (isStaff && !canSeeStaff) return;

        pushUnique({
          id: `user:${u.id}`,
          title: `${u.firstName} ${u.lastName}`,
          subtitle: `${u.id} • ${u.status}`,
          icon: 'fa-user',
          page: 'members',
          itemId: u.id,
        });
      });
    }

    // Lost & Found reports
    reports.forEach(r => {
      const hay = `${r.name} ${r.id} ${r.status} ${r.lastSeen}`.toLowerCase();
      if (!hay.includes(q)) return;
      pushUnique({
        id: `report:${r.id}`,
        title: r.name,
        subtitle: `Lost & Found • ${r.status}`,
        icon: 'fa-magnifying-glass-location',
        page: 'lost-found',
        itemId: r.id,
      });
    });

    // Program portals (static entries)
    if (q.includes('id') || q.includes('pwd') || q.includes('card') || q.includes('registry')) {
      pushUnique({
        id: 'portal:id',
        title: 'Municipal ID Registry',
        subtitle: 'Programs • ID Issuance',
        icon: 'fa-id-card',
        page: 'programs',
        section: 'ID',
      });
    }
    if (q.includes('phil') || q.includes('health') || q.includes('insurance')) {
      pushUnique({
        id: 'portal:philhealth',
        title: 'PhilHealth Assistance',
        subtitle: 'Programs • Sponsored Enrollment',
        icon: 'fa-shield-halved',
        page: 'programs',
        section: 'PhilHealth',
      });
    }

    // Programs/Services inventory
    devices.forEach(d => {
      const hay = `${d.name} ${d.id} device ${d.category}`.toLowerCase();
      if (!hay.includes(q)) return;
      pushUnique({
        id: `dev:${d.id}`,
        title: d.name,
        subtitle: 'Programs • Assistive Device',
        icon: 'fa-wheelchair',
        page: 'programs',
        section: 'Device',
        itemId: d.id,
      });
    });
    medicalServices.forEach(m => {
      const hay = `${m.name} ${m.id} medical ${m.category}`.toLowerCase();
      if (!hay.includes(q)) return;
      pushUnique({
        id: `med:${m.id}`,
        title: m.name,
        subtitle: 'Programs • Medical Service',
        icon: 'fa-kit-medical',
        page: 'programs',
        section: 'Medical',
        itemId: m.id,
      });
    });
    livelihoodPrograms.forEach(l => {
      const hay = `${l.title} ${l.id} livelihood ${l.category}`.toLowerCase();
      if (!hay.includes(q)) return;
      pushUnique({
        id: `live:${l.id}`,
        title: l.title,
        subtitle: 'Programs • Livelihood',
        icon: 'fa-briefcase',
        page: 'programs',
        section: 'Livelihood',
        itemId: l.id,
      });
    });

    return results.slice(0, 25);
  }, [globalSearchQuery, isAdmin, currentUser, users, reports, devices, medicalServices, livelihoodPrograms]);

  const handleResultClick = (res: SearchResult) => {
    if (res.section || res.itemId) {
      setSearchSignal({ page: res.page, section: res.section, itemId: res.itemId });
    }
    setGlobalSearchQuery('');
    setIsSearchOpen(false);
    if (currentPage !== res.page) {
      handleNavigate(res.page, { force: true });
    }
  };

  return (
    <nav className="sticky top-0 z-[100] bg-alaga-blue dark:bg-alaga-navy text-white shadow-[0_10px_30px_rgba(0,0,0,0.1)] px-4 py-4 flex items-center justify-between transition-all duration-500">
      <div className="flex items-center gap-2 md:gap-3 cursor-pointer shrink-0" onClick={() => handleNavigate('home')}>
        <div className="w-9 h-9 md:w-10 md:h-10 bg-white rounded-lg flex items-center justify-center shadow-lg transform active:scale-90 transition-transform inner-glow">
          <i className="fa-solid fa-hands-holding-child text-alaga-blue text-lg md:text-xl drop-shadow-md"></i>
        </div>
        <div className="hidden sm:block">
          <h1 className="font-black text-base md:text-lg leading-none text-white text-3d tracking-tight">AlagaLink</h1>
          <p className="text-[6px] md:text-[8px] text-alaga-gold font-black uppercase tracking-widest mt-0.5">La Trinidad PWD/CWD Info System</p>
        </div>
      </div>

      {/* Center: Global Search + Navigation */}
      <div className="flex-1 hidden md:flex items-center justify-center gap-4 lg:gap-8 px-6">
        {/* Global Search */}
        <div ref={searchRef} className="relative w-full max-w-xl">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-white/70 text-sm"></i>
            <input
              value={globalSearchQuery}
              onChange={(e) => {
                setGlobalSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsSearchOpen(false);
                }
                if (e.key === 'Enter') {
                  const first = universalResults[0];
                  if (first) handleResultClick(first);
                }
              }}
              placeholder="Search users, programs/services, lost & found..."
              className="w-full pl-11 pr-4 py-3 rounded-[18px] bg-white/10 hover:bg-white/15 focus:bg-white/15 outline-none border border-white/20 text-xs font-black uppercase tracking-widest placeholder:text-white/50 transition-all"
              aria-label="Global search"
            />
          </div>

          {isSearchOpen && globalSearchQuery.trim() !== '' && (
            <div
              className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-alaga-charcoal text-gray-900 dark:text-white rounded-[24px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border border-gray-100 dark:border-white/10 overflow-hidden z-[250]"
              role="listbox"
              aria-label="Search suggestions"
            >
              {universalResults.length === 0 ? (
                <div className="p-6 text-xs font-black uppercase tracking-widest opacity-40">No matches found</div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-white/5 max-h-[420px] overflow-y-auto">
                  {universalResults.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => handleResultClick(res)}
                      className="w-full text-left p-4 hover:bg-alaga-gray dark:hover:bg-alaga-navy/40 transition-all flex items-center gap-4"
                      role="option"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-alaga-blue/10 text-alaga-blue dark:text-alaga-blue flex items-center justify-center shrink-0">
                        <i className={`fa-solid ${res.icon}`}></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black uppercase tracking-wider truncate">{res.title}</div>
                        <div className="text-[10px] font-bold opacity-50 truncate">{res.subtitle}</div>
                      </div>
                      <i className="fa-solid fa-arrow-right-long text-[10px] opacity-30"></i>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation List */}
        <ul className="flex items-center space-x-1 lg:space-x-2 shrink-0">
          {navItems.map(item => {
            const navUnread = notifications.filter(n => n.link && n.link.startsWith(item.id)).length;
            return (
              <li
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`cursor-pointer p-3 lg:px-5 lg:py-3 rounded-2xl transition-all flex items-center group active:scale-90 ${
                  currentPage === item.id
                    ? 'bg-alaga-gold text-alaga-navy font-black shadow-xl inner-glow shadow-alaga-gold/30'
                    : 'hover:bg-white/10'
                }`}
                title={item.label}
              >
                <i className={`fa-solid ${item.icon} text-lg ${currentPage === item.id ? 'glow-icon-gold' : 'opacity-80'}`}></i>
                <span className="hidden lg:inline ml-3 text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                {navUnread > 0 && !['programs','lost-found','members'].includes(item.id) && (
                  navUnread > 1 ? (
                    <span className="ml-3 inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full w-6 h-6">{navUnread}</span>
                  ) : (
                    <span className="ml-3 w-3 h-3 bg-red-500 rounded-full inline-block" />
                  )
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Right: Actions and Profile */}
      <div className="flex items-center space-x-2 md:space-x-3">
          {/* Notifications - visible when logged in (including Home for authenticated users) */}
          {currentUser && (
            <div className="relative">
              <div
                className="relative cursor-pointer w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-[16px] md:rounded-[18px] bg-white/10 hover:bg-white/20 transition-all shadow-lg active:scale-90 inner-glow"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
              >
                <i className={`fa-solid fa-bell text-lg md:text-xl ${unreadNotifs > 0 ? 'animate-bounce glow-icon' : ''}`}></i>
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-[9px] w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center font-black border-2 md:border-4 border-alaga-blue dark:border-alaga-navy shadow-2xl scale-110">
                    {unreadNotifs}
                  </span>
                )}
              </div>
              <NotificationPopover isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} onNavigate={handleNavigate} />
            </div>
          )}

          {/* Profile / Auth Buttons */}
          <div className="relative hidden sm:block" ref={profileMenuRef}>
            <div
              className="flex items-center gap-3 cursor-pointer hover:bg-white/20 transition-all bg-white/10 p-1 rounded-[16px] md:rounded-[20px] border border-white/20 shadow-lg active:scale-95 inner-glow pr-2 md:pr-4"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              {currentUser ? (
                currentUser?.photoUrl ? (
                  <Image src={currentUser.photoUrl} width={36} height={36} alt="Profile" className="w-8 h-8 md:w-9 md:h-9 rounded-[12px] md:rounded-[14px] border-2 border-white/30 object-cover shadow-md" />
                ) : (
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-[12px] md:rounded-[14px] border-2 border-white/30 bg-gray-100" />
                )
              ) : (
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-[12px] md:rounded-[14px] border-2 border-white/30 shadow-md bg-white/10 flex items-center justify-center">
                  <i className="fa-solid fa-circle-user text-lg md:text-xl opacity-80"></i>
                </div>
              )}
              <i className={`fa-solid fa-chevron-down text-[8px] opacity-60 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}></i>
            </div>
            {showProfileMenu && (
              <div className="absolute right-0 mt-5 w-64 bg-white dark:bg-alaga-charcoal text-gray-800 dark:text-white rounded-[32px] shadow-[0_30px_80px_rgba(0,0,0,0.5)] py-4 overflow-hidden border border-gray-100 dark:border-white/10 animate-in fade-in slide-in-from-top-4 origin-top-right inflated-card">
                {currentUser ? (
                  <>
                    <div className="px-6 py-6 border-b border-gray-100 dark:border-white/10 text-center space-y-2">
                      <p className="font-black text-lg truncate text-3d">{currentUser?.firstName}</p>
                      <div className={`mt-3 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg inner-glow inline-block ${
                        currentUser?.role === 'SuperAdmin' ? 'bg-purple-600 text-white' :
                        currentUser?.role === 'Admin' ? 'bg-red-500 text-white' : 'bg-alaga-teal text-white'
                      }`}>
                        {currentUser?.role}
                      </div>
                    </div>
                    <div className="py-2 px-2 space-y-1">
                       {[
                        { id: 'profile', label: 'Identity Profile', icon: 'fa-id-badge', color: 'text-alaga-blue' },
                        { id: 'theme', label: isDarkMode ? 'Daylight Vision' : 'Night Owl Vision', icon: isDarkMode ? 'fa-sun' : 'fa-moon', color: 'text-alaga-gold' },
                        { id: 'about', label: 'About Systems', icon: 'fa-circle-info', color: 'text-alaga-blue' }
                       ].map(link => (
                        <button key={link.id} onClick={() => { if(link.id==='theme') toggleTheme(); else handleNavigate(link.id); setShowProfileMenu(false); }} className="w-full text-left px-5 py-3.5 text-xs font-black uppercase tracking-widest hover:bg-alaga-blue/5 rounded-2xl flex items-center transition-all group">
                          <i className={`fa-solid ${link.icon} mr-4 w-5 text-center ${link.color}`}></i>
                          <span className="opacity-70 group-hover:opacity-100">{link.label}</span>
                        </button>
                       ))}

                       <button onClick={() => {logout(); setShowProfileMenu(false);}} className="w-full text-left px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white flex items-center transition-all">
                        <i className="fa-solid fa-power-off mr-4 w-5 text-center"></i> System Logout
                       </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-6 py-6 border-b border-gray-100 dark:border-white/10 text-center space-y-2">
                      <p className="font-black text-lg text-3d">Welcome</p>
                      <p className="text-xs opacity-60 font-medium">Sign in to your account or register</p>
                    </div>
                    <div className="py-2 px-2 space-y-2">
                       <button onClick={() => {setShowProfileMenu(false); setSearchSignal({ page: 'home', section: 'login' }); handleNavigate('home');}} className="w-full text-left px-5 py-3.5 text-xs font-black uppercase tracking-widest hover:bg-alaga-blue/5 rounded-2xl flex items-center transition-all group">
                         <i className="fa-solid fa-arrow-right-to-bracket mr-4 w-5 text-center text-alaga-blue"></i>
                         <span className="opacity-70 group-hover:opacity-100">Log In</span>
                       </button>

                       <button onClick={() => {setShowProfileMenu(false); setSearchSignal({ page: 'home', section: 'signup' }); handleNavigate('home');}} className="w-full text-left px-5 py-3.5 text-xs font-black uppercase tracking-widest hover:bg-alaga-teal/5 rounded-2xl flex items-center transition-all group">
                         <i className="fa-solid fa-user-plus mr-4 w-5 text-center text-alaga-teal"></i>
                         <span className="opacity-70 group-hover:opacity-100">Sign Up</span>
                       </button>

                       <button onClick={() => {toggleTheme(); setShowProfileMenu(false);}} className="w-full text-left px-5 py-3.5 text-xs font-black uppercase tracking-widest hover:bg-alaga-gold/5 rounded-2xl flex items-center transition-all group mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                         <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'} mr-4 w-5 text-center text-alaga-gold`}></i>
                         <span className="opacity-70 group-hover:opacity-100">{isDarkMode ? 'Daylight Vision' : 'Night Owl Vision'}</span>
                       </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hamburger Mobile Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-[16px] bg-white text-alaga-blue shadow-xl inflated-card active:scale-90"
          >
            <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars-staggered'} text-lg`}></i>
          </button>
        </div>

      {/* Tactile Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl animate-in fade-in duration-300 md:hidden overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-full max-w-[320px] bg-white dark:bg-alaga-charcoal shadow-2xl flex flex-col p-8 animate-in slide-in-from-right duration-500">
             <div className="flex items-center justify-between mb-12">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-alaga-blue rounded-xl flex items-center justify-center text-white shadow-lg inner-glow">
                   <i className="fa-solid fa-hands-holding-child"></i>
                 </div>
                 <h2 className="font-black text-lg text-alaga-blue uppercase tracking-widest">AlagaLink</h2>
               </div>
               <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                 <i className="fa-solid fa-xmark"></i>
               </button>
             </div>

             <nav className="flex-1 space-y-4 overflow-y-auto no-scrollbar pb-6">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-6 p-6 rounded-[24px] transition-all inflated-card border border-transparent ${
                      currentPage === item.id
                        ? 'bg-alaga-blue text-white shadow-alaga-blue/30 translate-x-2'
                        : 'bg-gray-50 dark:bg-alaga-navy/40 hover:bg-alaga-blue/5'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${currentPage === item.id ? 'bg-white/20' : 'bg-white dark:bg-alaga-charcoal text-alaga-blue'}`}>
                      <i className={`fa-solid ${item.icon}`}></i>
                    </div>
                    <span className="font-black uppercase tracking-[0.2em] text-xs">{item.label}</span>
                  </button>
                ))}

             </nav>

             <div className="mt-auto space-y-4 pt-8 border-t border-gray-100 dark:border-white/5">
                {currentUser ? (
                  <>
                    <div className="flex items-center gap-4 p-4 bg-alaga-gray dark:bg-white/5 rounded-[24px]">
                      {currentUser?.photoUrl ? (
                        <Image src={currentUser.photoUrl} width={48} height={48} className="w-12 h-12 rounded-xl object-cover" alt={`${currentUser?.firstName} ${currentUser?.lastName}`} />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gray-100" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm truncate">{currentUser?.firstName}</p>
                        <p className="text-[8px] opacity-40 uppercase font-black tracking-widest">{currentUser?.role}</p>
                      </div>
                      <button onClick={() => {logout(); setIsMobileMenuOpen(false);}} className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                        <i className="fa-solid fa-power-off"></i>
                      </button>
                    </div>

                    <button
                      onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
                      className="w-full py-4 rounded-[20px] bg-alaga-gold/10 text-alaga-navy dark:text-alaga-gold font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3"
                    >
                      <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                      {isDarkMode ? 'Switch to Daylight' : 'Switch to Night Vision'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); setSearchSignal({ page: 'home', section: 'login' }); handleNavigate('home'); }}
                      className="w-full py-4 rounded-[20px] bg-alaga-blue/10 text-alaga-blue dark:text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3"
                    >
                      <i className="fa-solid fa-arrow-right-to-bracket"></i>
                      Log In
                    </button>

                    <button
                      onClick={() => { setIsMobileMenuOpen(false); setSearchSignal({ page: 'home', section: 'signup' }); handleNavigate('home'); }}
                      className="w-full py-4 rounded-[20px] bg-alaga-teal/10 text-alaga-teal dark:text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3"
                    >
                      <i className="fa-solid fa-user-plus"></i>
                      Sign Up
                    </button>

                    <button
                      onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}
                      className="w-full py-4 rounded-[20px] bg-alaga-gold/10 text-alaga-navy dark:text-alaga-gold font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3"
                    >
                      <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                      {isDarkMode ? 'Switch to Daylight' : 'Switch to Night Vision'}
                    </button>
                  </>
                )}
             </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
