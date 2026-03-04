
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import ChatWindow from './ChatWindow';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';
import { UserProfile } from '@/Providers/AlagaLink/types';
import { OFFICE_ID } from '@/Providers/AlagaLink/constants';

const FloatingAssistiveButton: React.FC = () => {
  const {
    currentUser,
    users,
    directMessages,
    directUnreadTotal,
    directUnreadByPeer,
    directLastMessageAtByPeer,
  } = useAppContext();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdminHub, setShowAdminHub] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<UserProfile | null>(null);

  // Initialize position on mount (defer setState to avoid calling setState synchronously within effect)
  useEffect(() => {
    Promise.resolve().then(() => setPosition({ x: window.innerWidth - 90, y: window.innerHeight - 150 }));
  }, []);

  // Track if a drag actually happened to prevent accidental clicks
  const dragOccurred = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

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

  // ESC to close any open chat modal.
  useEffect(() => {
    if (!isOpen && !showAdminHub) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setIsOpen(false);
      setShowAdminHub(false);
      setActiveChatUser(null);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, showAdminHub]);

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
        setActiveChatUser(null);
        setShowAdminHub(true);
      } else {
        setShowAdminHub(false);
      }
    } else {
      setIsOpen(prev => {
        const next = !prev;
        // For PWD/member users, always jump straight into the PDAO Office thread.
        if (next) {
          setActiveChatUser({ id: OFFICE_ID, firstName: 'PDAO Office', lastName: '', role: 'User' } as UserProfile);
        } else {
          setActiveChatUser(null);
        }
        return next;
      });
    }
  };

  const selectUser = (user: UserProfile) => {
    setActiveChatUser(user);
  };

  const filteredUsers = users.filter(u => {
    const matchesTab = hubTab === 'Staff' ? (u.role === 'Admin' || u.role === 'SuperAdmin') : u.role === 'User';
    const isSelf = u.id === currentUser?.id;
    const matchesSearch = `${u.firstName} ${u.lastName}`.toLowerCase().includes(hubSearch.toLowerCase()) ||
                          u.id.toLowerCase().includes(hubSearch.toLowerCase());
    return matchesTab && !isSelf && matchesSearch;
  });

  const sortedUsers = useMemo(() => {
    const parseTs = (ts?: string | null) => {
      if (!ts) return 0;
      const v = Date.parse(ts);
      return Number.isFinite(v) ? v : 0;
    };

    return [...filteredUsers].sort((a, b) => {
      const aUnread = directUnreadByPeer[a.id] || 0;
      const bUnread = directUnreadByPeer[b.id] || 0;

      if ((aUnread > 0) !== (bUnread > 0)) return aUnread > 0 ? -1 : 1;
      if (aUnread !== bUnread) return bUnread - aUnread;

      const aLast = parseTs(directLastMessageAtByPeer[a.id]);
      const bLast = parseTs(directLastMessageAtByPeer[b.id]);
      if (aLast !== bLast) return bLast - aLast;

      const aName = `${a.firstName} ${a.lastName}`.toLowerCase();
      const bName = `${b.firstName} ${b.lastName}`.toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [filteredUsers, directUnreadByPeer, directLastMessageAtByPeer]);

  const hubUnreadCounts = useMemo(() => {
    let members = 0;
    let staff = 0;

    for (const [peerId, count] of Object.entries(directUnreadByPeer)) {
      if (!count || count <= 0) continue;
      if (peerId === OFFICE_ID) continue;

      const u = users.find(x => x.id === peerId);
      if (!u) continue;
      if (u.id === currentUser?.id) continue;

      if (u.role === 'User') members += count;
      else staff += count;
    }

    return { members, staff };
  }, [directUnreadByPeer, users, currentUser?.id]);

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

          {/* Unread badge must live outside the overflow-hidden button so it won't clip */}
          {directUnreadTotal > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white/70 pointer-events-none">
              {directUnreadTotal > 99 ? '99+' : directUnreadTotal}
            </span>
          )}
        </div>
      </div>

      {/* BIG CENTERED ADMIN HUB */}
      {showAdminHub && isAdmin && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-alaga-navy/60 backdrop-blur-md animate-in fade-in duration-300 alagalink-overlay-scroll alagalink-topbar-safe"
          role="dialog"
          aria-modal="true"
          onClick={() => { setShowAdminHub(false); setActiveChatUser(null); }}
        >

          <div
            className="w-full max-w-6xl h-[85vh] bg-white dark:bg-alaga-charcoal shadow-[0_40px_100px_rgba(0,0,0,0.5)] rounded-[40px] flex flex-row border border-white/10 overflow-hidden animate-in zoom-in-95 duration-500 relative"
            onClick={(e) => e.stopPropagation()}
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
                  <button onClick={() => setHubTab('PWD')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all relative ${hubTab === 'PWD' ? 'bg-white text-alaga-blue shadow-lg' : 'opacity-60'}`}>
                    Members
                    {hubUnreadCounts.members > 0 && (
                      <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black flex items-center justify-center ${hubTab === 'PWD' ? 'bg-red-500 text-white' : 'bg-red-500 text-white'}`}>
                        {hubUnreadCounts.members > 99 ? '99+' : hubUnreadCounts.members}
                      </span>
                    )}
                  </button>
                  <button onClick={() => setHubTab('Staff')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all relative ${hubTab === 'Staff' ? 'bg-white text-alaga-blue shadow-lg' : 'opacity-60'}`}>
                    Staff
                    {hubUnreadCounts.staff > 0 && (
                      <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black flex items-center justify-center ${hubTab === 'Staff' ? 'bg-red-500 text-white' : 'bg-red-500 text-white'}`}>
                        {hubUnreadCounts.staff > 99 ? '99+' : hubUnreadCounts.staff}
                      </span>
                    )}
                  </button>
                </div>
              </header>

              <div className="p-4 shrink-0">
                <div className="w-full p-5 rounded-[24px] flex items-center gap-4 bg-white dark:bg-alaga-charcoal border border-gray-100 dark:border-white/5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner bg-alaga-blue text-white">
                    <i className="fa-solid fa-message text-xl"></i>
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-black text-sm text-alaga-blue dark:text-white">Messaging</p>
                    <p className="text-[9px] uppercase font-bold tracking-widest opacity-40">Select a thread to reply</p>
                  </div>
                </div>
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
                    {sortedUsers.length > 0 ? sortedUsers.map((u) => {
                      const isSelected = activeChatUser?.id === u.id;
                      const unreadCount = directUnreadByPeer[u.id] || 0;
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

                              {unreadCount > 0 && (
                                <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 ${isSelected ? 'border-white/70' : 'border-white dark:border-alaga-charcoal'}`}></span>
                              )}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className={`font-black text-xs truncate ${isSelected ? 'text-white' : ''}`}>{u.firstName} {u.lastName}</p>
                            <p className={`text-[8px] uppercase font-black tracking-tighter truncate ${isSelected ? 'text-white/60' : 'opacity-40'}`}>
                              {u.disabilityCategory?.split(' ')[0] || u.role} • {u.address.split(',')[0]}
                            </p>

                            {unreadCount > 0 && (
                              <p className={`mt-1 text-[9px] font-black ${isSelected ? 'text-white/90' : 'text-red-500'} truncate`}>
                                {unreadCount} new message{unreadCount === 1 ? '' : 's'}
                              </p>
                            )}
                          </div>

                          {unreadCount > 0 && (
                            <div className={`shrink-0 px-2 py-1 rounded-full text-[9px] font-black ${isSelected ? 'bg-white/15 text-white' : 'bg-red-500 text-white'}`}>
                              {unreadCount}
                            </div>
                          )}
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
              {activeChatUser ? (
                <div className="h-full flex flex-col animate-in fade-in duration-300">
                  <ChatWindow
                    onClose={() => { setShowAdminHub(false); setActiveChatUser(null); }}
                    onBackToList={() => setActiveChatUser(null)}
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
                  <p className="max-w-xs mx-auto mt-4 font-bold">Pick a member or staff thread to begin messaging.</p>
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      {/* REGULAR USER CHAT POP-OVER */}
      {isOpen && !isAdmin && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center p-6 bg-alaga-navy/40 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={() => { setIsOpen(false); setActiveChatUser(null); }}
        >
          <div
            className="w-full max-w-4xl h-[75vh] bg-white dark:bg-alaga-charcoal rounded-[24px] shadow-2xl overflow-hidden flex animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <main className="flex-1 p-4">
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-hidden rounded-lg border border-gray-100 dark:border-white/5">
                  <ChatWindow
                    onClose={() => { setIsOpen(false); setActiveChatUser(null); }}
                    targetUser={(activeChatUser ?? { id: OFFICE_ID, firstName: 'PDAO Office', lastName: '', role: 'User' } as UserProfile)}
                    isEmbedded={true}
                    anchorPosition={position}
                  />
                </div>
              </div>
            </main>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAssistiveButton;
