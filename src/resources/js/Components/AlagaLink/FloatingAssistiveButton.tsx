
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import ChatWindow from './ChatWindow';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';
import { UserProfile } from '@/Providers/AlagaLink/types';
import { OFFICE_ID } from '@/Providers/AlagaLink/constants';

const FloatingAssistiveButton: React.FC = () => {
  const { currentUser, users, directMessages } = useAppContext();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdminHub, setShowAdminHub] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<UserProfile | null>(null);
  // For non-admin users, track which thread they selected in their compact popover
  const [selectedThread, setSelectedThread] = useState<'AI' | 'Office' | null>(null);

  // Initialize position on mount (defer setState to avoid calling setState synchronously within effect)
  useEffect(() => {
    Promise.resolve().then(() => setPosition({ x: window.innerWidth - 90, y: window.innerHeight - 150 }));
  }, []);

  // Track if a drag actually happened to prevent accidental clicks
  const dragOccurred = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  // Set AI (AlagaLink Bot) as selected by default for Admin Hub
  const [isAiSelected, setIsAiSelected] = useState(true);

  const [hubSearch, setHubSearch] = useState('');
  const [hubTab, setHubTab] = useState<'PWD' | 'Staff'>('PWD');

  const buttonRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';
  const EDGE_MARGIN = 24;
  const BUTTON_SIZE = 64;

  // Handle Window Resizing - keeps button in frame
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const x = prev.x > window.innerWidth / 2 ? window.innerWidth - 80 - EDGE_MARGIN : EDGE_MARGIN;
        const y = Math.min(prev.y, window.innerHeight - 100);
        return { x, y };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOccurred.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
    // Prevent default to stop text selection while dragging
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      // Calculate distance from start to determine if it's a drag or a click
      const dist = Math.sqrt(Math.pow(e.clientX - startPos.current.x, 2) + Math.pow(e.clientY - startPos.current.y, 2));
      if (dist > 5) dragOccurred.current = true;

      // CLAMPING: Prevent dragging outside viewing perspective
      const newX = Math.max(0, Math.min(e.clientX - BUTTON_SIZE/2, window.innerWidth - BUTTON_SIZE));
      const newY = Math.max(0, Math.min(e.clientY - BUTTON_SIZE/2, window.innerHeight - BUTTON_SIZE));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);

      // MAGNETIC SNAPPING: Find nearest side (Left or Right)
      setPosition(current => {
        const snapX = current.x < window.innerWidth / 2 ? EDGE_MARGIN : window.innerWidth - BUTTON_SIZE - EDGE_MARGIN;
        // Keep Y within safe vertical bounds
        const snapY = Math.max(EDGE_MARGIN, Math.min(current.y, window.innerHeight - BUTTON_SIZE - EDGE_MARGIN));
        return { x: snapX, y: snapY };
      });
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const toggleAction = () => {
    // If the mouse up followed a drag, don't open the chat
    if (dragOccurred.current) return;

    if (isAdmin) {
      // Toggle admin hub: open (and reset selection) or close if already open
      if (!showAdminHub) {
        setIsAiSelected(true);
        setActiveChatUser(null);
        setShowAdminHub(true);
      } else {
        setShowAdminHub(false);
      }
    } else {
      setIsOpen(prev => {
        const next = !prev;
        if (!next) {
          setSelectedThread(null);
        } else {
          // default to AI thread when opening the popover
          setSelectedThread('AI');
        }
        return next;
      });
    }
  };

  const selectUser = (user: UserProfile) => {
    setActiveChatUser(user);
    setIsAiSelected(false);
  };

  const selectAi = () => {
    setIsAiSelected(true);
    setActiveChatUser(null);
  };

  const filteredUsers = users.filter(u => {
    const matchesTab = hubTab === 'Staff' ? (u.role === 'Admin' || u.role === 'SuperAdmin') : u.role === 'User';
    const isSelf = u.id === currentUser?.id;
    const matchesSearch = `${u.firstName} ${u.lastName}`.toLowerCase().includes(hubSearch.toLowerCase()) ||
                          u.id.toLowerCase().includes(hubSearch.toLowerCase());
    return matchesTab && !isSelf && matchesSearch;
  });

  return (
    <>
      {/* THE FLOATING BUTTON */}
      <div
        ref={buttonRef}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className={`fixed ${isOpen || showAdminHub ? 'z-[210]' : 'z-[160]'} select-none transition-transform duration-300 ${isDragging ? 'scale-110 cursor-grabbing' : 'cursor-grab'}`}
      >
        <div className="relative group">
          {!isOpen && !showAdminHub && !isDragging && (
            <div className="absolute inset-[-10px] bg-alaga-blue/30 rounded-full blur-2xl animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"></div>
          )}

          {!isOpen && !showAdminHub && !isDragging && (
            <span className={`absolute ${position.x > 0 && position.x < 500 ? 'left-20' : 'right-20'} top-1/2 -translate-y-1/2 bg-alaga-navy dark:bg-white text-white dark:text-alaga-navy text-[10px] px-4 py-2 rounded-xl font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl pointer-events-none border border-white/10`}>
              {isAdmin ? 'System Inbox' : 'Chat AlagaLink'}
            </span>
          )}

          <div
            onMouseDown={handleMouseDown}
            onClick={toggleAction}
            title={isOpen || showAdminHub ? 'Close chat' : (isAdmin ? 'Open inbox' : 'Open chat')}
            aria-pressed={isOpen || showAdminHub}
            aria-label={isOpen || showAdminHub ? 'Close chat' : (isAdmin ? 'Open inbox' : 'Open chat')}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-500 shadow-[0_10px_40px_rgba(37,70,240,0.5)] border-4 border-white/30 relative overflow-hidden active:scale-90
              ${(isOpen || showAdminHub)
                ? 'bg-red-500 shadow-red-500/50 scale-90'
                : 'bg-alaga-blue hover:scale-105 hover:rotate-6'
              }
            `}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/20 pointer-events-none"></div>
            <i className={`fa-solid ${(isOpen || showAdminHub) ? 'fa-xmark' : isAdmin ? 'fa-envelopes-bulk' : 'fa-comment-dots'} text-2xl relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]`}></i>
          </div>
        </div>
      </div>

      {/* BIG CENTERED ADMIN HUB */}
      {showAdminHub && isAdmin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-alaga-navy/60 backdrop-blur-md animate-in fade-in duration-300">

          <div
            className="w-full max-w-6xl h-[85vh] bg-white dark:bg-alaga-charcoal shadow-[0_40px_100px_rgba(0,0,0,0.5)] rounded-[40px] flex flex-row border border-white/10 overflow-hidden animate-in zoom-in-95 duration-500 relative"
          >
            <aside className="w-80 md:w-96 border-r border-gray-100 dark:border-white/5 flex flex-col bg-gray-50/30 dark:bg-black/10">
              <header className="p-6 bg-alaga-blue text-white shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-xl tracking-tighter">Inbox Hub</h3>
                </div>
              {/* Active responder indicator for office threads (admins/superadmins only) */}
              {activeChatUser && (
                <div className="mt-3 flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-xl overflow-hidden">
                    {/* profile of last staff who replied (rendered below via computed variable) */}
                    {(() => {
                      const threadKey = [OFFICE_ID, activeChatUser.id].sort().join('_');
                      const msgs = directMessages[threadKey] || [];
                      const lastStaff = msgs.slice().reverse().find(m => {
                        const u = users.find(us => us.id === m.senderId);
                        return u && (u.role === 'Admin' || u.role === 'SuperAdmin');
                      });
                      if (lastStaff) {
                        const staff = users.find(us => us.id === lastStaff.senderId);
                        return (
                          <div className="flex items-center gap-2">
                            {staff?.photoUrl ? (
                              <Image src={staff.photoUrl} width={32} height={32} className="w-8 h-8 rounded-xl object-cover shadow-sm" alt={staff?.firstName} />
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-gray-100" />
                            )}
                            <div className="text-xs font-black uppercase">Handled by <span className="ml-1 text-alaga-blue">{staff?.firstName}</span></div>
                          </div>
                        );
                      }
                      return <div className="text-xs opacity-60">No active responder</div>;
                    })()}
                  </div>
                </div>
              )}
                <div className="mt-4 flex bg-white/10 p-1 rounded-xl">
                  <button onClick={() => setHubTab('PWD')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${hubTab === 'PWD' ? 'bg-white text-alaga-blue shadow-lg' : 'opacity-60'}`}>Members</button>
                  {isSuperAdmin && <button onClick={() => setHubTab('Staff')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${hubTab === 'Staff' ? 'bg-white text-alaga-blue shadow-lg' : 'opacity-60'}`}>Staff</button>}
                </div>
              </header>

              <div className="p-4 shrink-0">
                <button
                  onClick={selectAi}
                  className={`w-full p-5 rounded-[24px] flex items-center gap-4 transition-all relative overflow-hidden group shadow-sm
                    ${isAiSelected ? 'bg-alaga-blue text-white shadow-xl scale-[1.02]' : 'bg-white dark:bg-alaga-charcoal hover:bg-alaga-blue/5 border border-gray-100 dark:border-white/5'}
                  `}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${isAiSelected ? 'bg-white/20' : 'bg-alaga-blue text-white'}`}>
                    <i className="fa-solid fa-robot text-xl"></i>
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-black text-sm ${isAiSelected ? 'text-white' : 'text-alaga-blue'}`}>AlagaLink Bot</p>
                    <p className={`text-[9px] uppercase font-bold tracking-widest ${isAiSelected ? 'text-white/60' : 'opacity-40'}`}>System Specialist</p>
                  </div>
                  {isAiSelected && <div className="absolute right-4 w-2 h-2 bg-alaga-gold rounded-full animate-pulse"></div>}
                </button>
              </div>

              <div className="px-4 pb-4 shrink-0">
                <div className="relative">
                  <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[10px] opacity-30"></i>
                  <input
                    type="text"
                    placeholder="Quick search thread..."
                    className="w-full bg-white dark:bg-alaga-navy/40 pl-10 pr-4 py-3 rounded-2xl text-xs font-bold outline-none border border-gray-100 dark:border-white/5 focus:ring-2 ring-alaga-blue/20"
                    value={hubSearch}
                    onChange={e => setHubSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 px-4 pb-4 overflow-hidden flex flex-col">
                <div className="flex-1 bg-white dark:bg-alaga-navy/20 rounded-[32px] border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col shadow-inner">
                  <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                    {filteredUsers.length > 0 ? filteredUsers.map((u) => {
                      const isSelected = activeChatUser?.id === u.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => selectUser(u)}
                          className={`w-full px-6 py-4 flex items-center gap-4 transition-all relative border-b border-gray-50 dark:border-white/5 last:border-none
                            ${isSelected
                              ? 'bg-alaga-blue text-white shadow-lg z-10'
                              : 'hover:bg-alaga-blue/5 dark:hover:bg-alaga-blue/10 text-gray-900 dark:text-white'
                            }
                          `}
                        >
                          <div className="relative shrink-0">
                              {u.photoUrl ? (
                                <Image src={u.photoUrl} width={40} height={40} className={`w-10 h-10 rounded-xl object-cover shadow-sm border-2 ${isSelected ? 'border-white/30' : 'border-white dark:border-white/10'}`} alt={`${u.firstName} ${u.lastName}`} />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-gray-100" />
                              )}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className={`font-black text-xs truncate ${isSelected ? 'text-white' : ''}`}>{u.firstName} {u.lastName}</p>
                            <p className={`text-[8px] uppercase font-black tracking-tighter truncate ${isSelected ? 'text-white/60' : 'opacity-40'}`}>
                              {u.disabilityCategory?.split(' ')[0] || u.role} • {u.address.split(',')[0]}
                            </p>
                          </div>
                          {isSelected && <i className="fa-solid fa-chevron-right text-[10px] opacity-40"></i>}
                        </button>
                      );
                    }) : (
                      <div className="py-20 text-center opacity-20">
                         <i className="fa-solid fa-users-slash text-2xl mb-2"></i>
                         <p className="text-[10px] font-black uppercase tracking-widest px-8">No matching threads found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </aside>

            <main className="flex-1 flex flex-col bg-white dark:bg-alaga-charcoal relative">
              {(activeChatUser || isAiSelected) ? (
                <div className="h-full flex flex-col animate-in fade-in duration-300">
                  <ChatWindow
                    onClose={() => setShowAdminHub(false)}
                    targetUser={activeChatUser || undefined}
                    isEmbedded={true}
                    anchorPosition={position}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-20">
                  <div className="w-32 h-32 bg-alaga-blue/5 rounded-full flex items-center justify-center mb-8">
                    <i className="fa-solid fa-comments-medical text-6xl"></i>
                  </div>
                  <h4 className="text-2xl font-black uppercase tracking-[0.2em]">Select a Thread</h4>
                  <p className="max-w-xs mx-auto mt-4 font-bold">Pick a member or use the AlagaLink Bot to begin registry interactions.</p>
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      {/* REGULAR USER CHAT POP-OVER */}
      {isOpen && !isAdmin && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-6">
          <div role="dialog" aria-modal="true" className="w-full max-w-4xl h-[75vh] bg-white dark:bg-alaga-charcoal rounded-[24px] shadow-2xl overflow-hidden flex">
            {/* LEFT: Contacts */}
            <aside className="w-72 border-r border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/10 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-black">Contacts</h4>
                {/* Note: closing handled by floating button */}
                <span className="text-xs opacity-50">Tap the floating button to close</span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setSelectedThread('AI')}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${selectedThread === 'AI' ? 'bg-alaga-blue text-white' : 'hover:bg-white/50'}`}>
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-alaga-blue">
                    <i className="fa-solid fa-robot"></i>
                  </div>
                  <div>
                    <p className="font-black">AlagaLink Bot</p>
                    <p className="text-xs opacity-60">Automated assistant</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedThread('Office')}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${selectedThread === 'Office' ? 'bg-alaga-teal text-white' : 'hover:bg-white/50'}`}>
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-alaga-teal">
                    <i className="fa-solid fa-building"></i>
                  </div>
                  <div>
                    <p className="font-black">PDAO Office</p>
                    <p className="text-xs opacity-60">Consolidated staff replies</p>
                  </div>
                </button>
              </div>

              <div className="mt-auto text-xs opacity-60">Office replies are consolidated and shown as &quot;PDAO Office&quot; to members.</div>
            </aside>

            {/* RIGHT: Messaging area */}
            <main className="flex-1 p-4">
              {selectedThread === 'AI' && (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-hidden rounded-lg border border-gray-100 dark:border-white/5">
                    <ChatWindow onClose={() => { setIsOpen(false); setSelectedThread(null); }} isEmbedded={true} anchorPosition={position} />
                  </div>
                </div>
              )}

              {selectedThread === 'Office' && (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-hidden rounded-lg border border-gray-100 dark:border-white/5">
                    <ChatWindow onClose={() => { setIsOpen(false); setSelectedThread(null); }} targetUser={{ id: OFFICE_ID, firstName: 'PDAO Office', lastName: '', role: 'User' } as UserProfile} isEmbedded={true} anchorPosition={position} />
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAssistiveButton;
