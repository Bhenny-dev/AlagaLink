
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';
import { UserProfile } from '@/Providers/AlagaLink/types';
import { OFFICE_ID } from '@/Providers/AlagaLink/constants';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  senderName?: string;
  isDirect?: boolean;
  senderProfile?: { id: string; fullName: string; photoUrl?: string };
}

interface ChatWindowProps {
  onClose: () => void;
  targetUser?: UserProfile;
  onBackToList?: () => void;
  anchorPosition?: { x: number; y: number };
  isEmbedded?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ targetUser, anchorPosition, isEmbedded = false }) => {
  const {
    currentUser,
    setSearchSignal,
    directMessages,
    sendDirectMessage,
    users,
    reports,
    devices,
    medicalServices,
    livelihoodPrograms,
  } = useAppContext();
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  const isAiSelected = isAdmin && !targetUser;

  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoverData, setHoverData] = useState<{ title: string; image: string; x: number; y: number } | null>(null);

  const responsiveStyle = useMemo(() => {
    if (isEmbedded) return { position: 'relative' as const, width: '100%', height: '100%', borderRadius: 0 };
    if (window.innerWidth < 640) {
      return { position: 'fixed' as const, zIndex: 150, top: 0, left: 0, width: '100%', height: '100%', borderRadius: 0 };
    }
    if (!anchorPosition) return { position: 'fixed' as const, bottom: 100, right: 24, width: 384, height: 600, zIndex: 150 };

    const CHAT_WIDTH = 400;
    const VIEWPORT_W = window.innerWidth;
    const VIEWPORT_H = window.innerHeight;
    const MARGIN = 24;
    const CHAT_HEIGHT = Math.min(600, VIEWPORT_H * 0.8);

    let leftPos: number;
    const isLeftSide = anchorPosition.x < VIEWPORT_W / 2;
    if (isLeftSide) {
      leftPos = anchorPosition.x;
    } else {
      leftPos = anchorPosition.x - CHAT_WIDTH + 64;
    }

    let topPos: number;
    const isTopSide = anchorPosition.y < VIEWPORT_H / 2;
    if (isTopSide) {
      topPos = anchorPosition.y + 80;
    } else {
      topPos = anchorPosition.y - CHAT_HEIGHT - 12;
    }

    const clampedLeft = Math.max(MARGIN, Math.min(leftPos, VIEWPORT_W - CHAT_WIDTH - MARGIN));
    const clampedTop = Math.max(MARGIN, Math.min(topPos, VIEWPORT_H - CHAT_HEIGHT - MARGIN));

    return {
      position: 'fixed' as const,
      zIndex: 150,
      width: `${CHAT_WIDTH}px`,
      height: `${CHAT_HEIGHT}px`,
      left: `${clampedLeft}px`,
      top: `${clampedTop}px`,
      transformOrigin: isLeftSide ? 'left bottom' : 'right bottom',
    };
  }, [anchorPosition, isEmbedded]);

  const displayMessages = useMemo(() => {
    if (targetUser && currentUser) {
      // Determine which thread to use. For ADMIN -> PWD replies, we consolidate into OFFICE thread.
      let threadKey: string;
      let isOfficeThread = false;

      const targetIsOffice = targetUser.id === OFFICE_ID;
      const targetIsUser = targetUser?.role === 'User';

      if (targetIsOffice) {
        threadKey = [currentUser.id, OFFICE_ID].sort().join('_');
        isOfficeThread = true;
      } else if (currentUser.role !== 'User' && targetIsUser) {
        // Admin viewing a user's thread: show OFFICE <-> user thread
        threadKey = [OFFICE_ID, targetUser.id].sort().join('_');
        isOfficeThread = true;
      } else {
        threadKey = [currentUser.id, targetUser.id].sort().join('_');
      }

      const realMessages = directMessages[threadKey] || [];

      const converted: ChatMessage[] = realMessages.map(m => {
        const isFromCurrent = m.senderId === currentUser.id;

        // If this is an office thread and the viewer is a regular user, consolidate staff messages into 'PDAO Office'
        if (isOfficeThread && currentUser.role === 'User' && !isFromCurrent) {
          return {
            role: 'bot' as const,
            text: m.text,
            senderName: 'PDAO Office',
            isDirect: true
          };
        }

        // For admins viewing office threads, show actual staff profile information
        const staffUser = users.find(u => u.id === m.senderId);
        return {
          role: m.senderId === currentUser.id ? 'user' : 'bot',
          text: m.text,
          senderName: isFromCurrent ? 'You' : (staffUser ? staffUser.firstName : (m.senderId === OFFICE_ID ? 'PDAO Office' : 'Unknown')),
          isDirect: true,
          senderProfile: staffUser ? { id: staffUser.id, fullName: `${staffUser.firstName} ${staffUser.lastName}`, photoUrl: staffUser.photoUrl } : undefined
        };
      });

      return [
        {
          role: 'bot' as const,
          text: `Direct thread with ${targetUser.firstName} ${targetUser.lastName}. Messaging is encrypted and persistent within the municipal registry.`,
          isDirect: false
        },
        ...converted
      ];
    } else {
      return aiMessages;
    }
  }, [targetUser, currentUser, directMessages, aiMessages, users]);

  useEffect(() => {
    if (!targetUser) {
      if (isAdmin) {
        setAiMessages([{
          role: 'bot',
          text: 'I am the AlagaLink Bot. I have scanned the registry database and can discuss municipal program details or specific member demographics with you.'
        }]);
      } else {
        setAiMessages([{
          role: 'bot',
          text: 'Hello! I am your AlagaLink Assistant. I am here to guide you through PDAO services and municipal aid programs. How can I help you today?'
        }]);
      }
    }
  }, [targetUser, isAdmin]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [displayMessages]);

  const getMunicipalData = () => {
    const deviceIndex = devices.map(d => ({ id: d.id, name: d.name, type: 'Item', page: 'programs', section: 'Device', image: d.photoUrl }));
    const medicalIndex = medicalServices.map(m => ({ id: m.id, name: m.name, type: 'Service', page: 'programs', section: 'Medical', image: m.photoUrl }));
    const livelihoodIndex = livelihoodPrograms.map(l => ({ id: l.id, name: l.title, type: 'Program', page: 'programs', section: 'Livelihood', image: l.photoUrl }));
    const reportsIndex = reports.map(r => ({ id: r.id, name: r.name, type: 'Case', page: 'lost-found', section: '', image: r.photoUrl }));
    const pages = [
      { id: 'home', name: 'Home', type: 'Page', page: 'home', section: '', image: 'https://picsum.photos/seed/home-nav/400/300' },
      { id: 'programs', name: 'Programs', type: 'Page', page: 'programs', section: '', image: 'https://picsum.photos/seed/prog-nav/400/300' },
      { id: 'lost-found', name: 'Lost & Found', type: 'Page', page: 'lost-found', section: '', image: 'https://picsum.photos/seed/lost-nav/400/300' },
      { id: 'members', name: 'Members', type: 'Page', page: 'members', section: '', image: 'https://picsum.photos/seed/mem-nav/400/300' },
    ];
    return [...deviceIndex, ...medicalIndex, ...livelihoodIndex, ...reportsIndex, ...pages];
  };

  const municipalRegistry = getMunicipalData();

  // AI BRAIN: This function handles the generation logic
  // [MIGRATION TARGET]: Replace GoogleGenAI instance and generateContent call with Grok AI SDK
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');

    if (targetUser) {
      sendDirectMessage(targetUser.id, userMsg);
    } else {
      setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      setIsLoading(true);
      try {
        const contextSummary = municipalRegistry.map(i => `${i.name} [${i.type}:${i.id}]`).join(', ');

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMsg,
            isAdmin,
            contextSummary,
          }),
        });

        if (!response.ok) {
          throw new Error('Chat API error');
        }

        const data = await response.json();
        const responseText = data.response || 'I am sorry, I could not process that request.';
        setAiMessages(prev => [...prev, { role: 'bot', text: responseText }]);
      } catch (e) {
        console.error('Chat error:', e);
        setAiMessages(prev => [...prev, { role: 'bot', text: 'I am currently having trouble reaching the municipal guide. Please try again later.' }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTokenClick = (id: string) => {
    const item = municipalRegistry.find(i => i.id === id);
    if (item) {
      setSearchSignal({
        page: item.page,
        section: item.section || undefined,
        itemId: (item.type === 'Item' || item.type === 'Service' || item.type === 'Program' || item.type === 'Case') ? item.id : undefined
      });
    }
  };

  const renderMessage = (msg: ChatMessage, idx: number) => {
    const parts = msg.text.split(/(\[\[.*?\]\])/g);
    return (
      <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
        {msg.senderName && (
          <span className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-1 px-2">
            {msg.senderName}
          </span>
        )}

        <div className="flex items-start gap-3">
          {/* Show staff avatar for admin views when available */}
          {msg.senderProfile && currentUser?.role !== 'User' && (
            msg.senderProfile.photoUrl ? (
              <Image src={msg.senderProfile.photoUrl} width={32} height={32} title={msg.senderProfile.fullName} alt={msg.senderProfile.fullName} className="w-8 h-8 rounded-xl object-cover shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gray-100 shadow-sm" />
            )
          )}

          <div className={`max-w-[85%] px-5 py-3 rounded-[20px] text-sm font-medium leading-relaxed shadow-sm relative ${
            msg.role === 'user'
              ? 'bg-alaga-blue text-white rounded-br-none'
              : 'bg-white dark:bg-alaga-charcoal text-gray-800 dark:text-white rounded-bl-none border border-gray-100 dark:border-white/5'
          }`} title={msg.senderProfile ? (currentUser?.role !== 'User' && targetUser ? `${msg.senderProfile.fullName} • replying to ${targetUser.firstName} ${targetUser.lastName}` : msg.senderProfile.fullName) : undefined}>
            {parts.map((part, i) => {
              const match = part.match(/\[\[(.*?)\|(.*?)\|(.*?)\]\]/);
              if (match) {
                const [, name, id, type] = match;
                const registryItem = municipalRegistry.find(ri => ri.id === id);
                const chipColor = type === 'Page' ? 'bg-alaga-gold/20 text-alaga-navy dark:text-alaga-gold border-alaga-gold/30' :
                                 type === 'Item' ? 'bg-alaga-blue/10 text-alaga-blue border-alaga-blue/20' :
                                 type === 'Case' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                 'bg-alaga-teal/10 text-alaga-teal border-alaga-teal/20';

                return (
                  <span
                    key={i}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoverData({ title: name, image: registryItem?.image || '', x: rect.left, y: rect.top - 120 });
                    }}
                    onMouseLeave={() => setHoverData(null)}
                    onClick={() => handleTokenClick(id)}
                    className={`inline-block px-2 py-0.5 rounded-lg border font-black cursor-pointer transition-all hover:scale-105 mx-0.5 ${chipColor}`}
                  >
                    {name}
                  </span>
                );
              }
              return part;
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        style={responsiveStyle}
        className={`${isEmbedded ? '' : 'shadow-2xl z-[150] rounded-none sm:rounded-[32px] border border-gray-100 dark:border-white/10 overflow-hidden'} flex flex-col animate-in zoom-in-95 fade-in duration-300 h-full`}
      >
        <div className={`p-6 text-white flex items-center justify-between shrink-0 ${isEmbedded ? 'bg-white dark:bg-alaga-charcoal !text-gray-900 dark:!text-white border-b border-gray-100 dark:border-white/5' : 'bg-alaga-blue'}`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            {!isAiSelected && targetUser ? (
              targetUser.photoUrl ? (
                <Image src={targetUser.photoUrl} width={48} height={48} className="w-12 h-12 rounded-2xl object-cover shadow-lg border-2 border-white" alt={`${targetUser.firstName} ${targetUser.lastName}`} />
              ) : (
                <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center shadow-inner relative ${isEmbedded ? 'bg-alaga-blue text-white' : 'bg-white/20'}`}>
                  <i className={`fa-solid ${isAiSelected || !targetUser ? 'fa-robot' : 'fa-hands-holding-child'} text-xl`}></i>
                </div>
              )
            ) : (
              <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center shadow-inner relative ${isEmbedded ? 'bg-alaga-blue text-white' : 'bg-white/20'}`}>
                <i className={`fa-solid ${isAiSelected || !targetUser ? 'fa-robot' : 'fa-hands-holding-child'} text-xl`}></i>
              </div>
            )}

            <div className="min-w-0 text-left">
              <h3 className="font-black text-lg leading-none truncate">
                {targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : isAiSelected ? 'AlagaLink Bot' : 'AlagaLink Support'}
              </h3>
              <p className="text-[10px] opacity-70 mt-1 uppercase tracking-widest font-bold flex items-center gap-1 truncate">
                {isLoading ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin text-alaga-blue"></i>
                    Thinking...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-circle text-[6px] text-alaga-teal animate-pulse"></i>
                    {targetUser ? 'Active Messaging' : 'System Assistant'}
                  </>
                )}
              </p>
            </div>
          </div>

        </div>

        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-alaga-gray dark:bg-alaga-navy/20 no-scrollbar">
          {displayMessages.map((m, i) => renderMessage(m, i))}
          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white dark:bg-alaga-charcoal px-5 py-3 rounded-[20px] rounded-bl-none shadow-sm border border-gray-100 dark:border-white/5">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-alaga-blue rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-alaga-blue rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-alaga-blue rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white dark:bg-alaga-charcoal border-t border-gray-100 dark:border-white/10 flex items-center space-x-3 shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            type="text"
            placeholder={targetUser ? `Message ${targetUser.firstName}...` : "Type message or inquiry..."}
            className="flex-1 bg-gray-100 dark:bg-alaga-navy/30 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 ring-alaga-blue/30 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-alaga-blue text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>

      {hoverData && (
        <div
          className="fixed z-[200] w-48 bg-white dark:bg-alaga-charcoal rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden pointer-events-none animate-in fade-in zoom-in-95 duration-200"
          style={{ left: `${hoverData.x}px`, top: `${hoverData.y}px` }}
        >
            {hoverData.image ? (
              <Image src={hoverData.image} width={230} height={96} className="w-full h-24 object-cover" alt={hoverData.title} />
            ) : (
              <div className="w-full h-24 bg-gray-100" />
            )}
          <div className="p-3">
            <p className="font-black text-[10px] truncate">{hoverData.title}</p>
            <p className="text-[8px] opacity-40 uppercase tracking-widest font-bold mt-1">Click to Navigate</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWindow;
