
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

const ChatWindow: React.FC<ChatWindowProps> = ({
  onClose,
  onBackToList,
  targetUser,
  anchorPosition,
  isEmbedded = false,
}) => {
  const {
    currentUser,
    directMessages,
    sendDirectMessage,
    loadDirectThread,
    markDirectThreadRead,
    users,
  } = useAppContext();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastIncomingIdRef = useRef<string | null>(null);

  const threadInfo = useMemo(() => {
    if (!targetUser || !currentUser) return null;

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

    return { threadKey, isOfficeThread };
  }, [targetUser, currentUser]);

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
    if (!targetUser || !currentUser || !threadInfo) {
      return [];
    }

    const realMessages = directMessages[threadInfo.threadKey] || [];

    const converted: ChatMessage[] = realMessages.map(m => {
      const isFromCurrent = m.senderId === currentUser.id;

      // If this is an office thread and the viewer is a regular user, consolidate staff messages into 'PDAO Office'
      if (threadInfo.isOfficeThread && currentUser.role === 'User' && !isFromCurrent) {
        return {
          role: 'bot' as const,
          text: m.text,
          senderName: 'PDAO Office',
          isDirect: true,
        };
      }

      // For admins viewing office threads, show actual staff profile information
      const staffUser = users.find(u => u.id === m.senderId);
      return {
        role: m.senderId === currentUser.id ? 'user' : 'bot',
        text: m.text,
        senderName: isFromCurrent ? 'You' : (staffUser ? staffUser.firstName : (m.senderId === OFFICE_ID ? 'PDAO Office' : 'Unknown')),
        isDirect: true,
        senderProfile: staffUser ? { id: staffUser.id, fullName: `${staffUser.firstName} ${staffUser.lastName}`, photoUrl: staffUser.photoUrl } : undefined,
      };
    });

    return converted;
  }, [targetUser, currentUser, directMessages, users, threadInfo]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [displayMessages]);

  useEffect(() => {
    if (!targetUser || !currentUser) return;

    // Clear unread state as soon as the thread is opened.
    markDirectThreadRead(targetUser.id);
  }, [targetUser?.id, currentUser?.id, markDirectThreadRead]);

  useEffect(() => {
    if (!targetUser || !currentUser || !threadInfo) return;

    // If a new incoming message arrives while this thread is open, mark it read.
    const msgs = directMessages[threadInfo.threadKey] || [];
    const last = msgs.length ? msgs[msgs.length - 1] : null;
    if (!last) return;

    if (last.senderId === currentUser.id) return;
    if (lastIncomingIdRef.current === last.id) return;

    lastIncomingIdRef.current = last.id;
    markDirectThreadRead(targetUser.id);
  }, [directMessages, threadInfo, targetUser, currentUser, markDirectThreadRead]);

  useEffect(() => {
    if (!targetUser || !currentUser || !threadInfo) return;

    let isCancelled = false;
    let intervalId: number | undefined;

    const poll = async () => {
      if (isCancelled) return;

      const existing = directMessages[threadInfo.threadKey] || [];
      const lastTimestamp = existing.length ? existing[existing.length - 1].timestamp : undefined;

      await loadDirectThread(targetUser.id, lastTimestamp);
    };

    poll();
    intervalId = window.setInterval(poll, 2500);

    return () => {
      isCancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [targetUser, currentUser, loadDirectThread, directMessages, threadInfo]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');

    if (!targetUser) return;
    sendDirectMessage(targetUser.id, userMsg);
  };

  const renderMessage = (msg: ChatMessage, idx: number) => {
    const isMine = msg.role === 'user';

    const renderAvatar = () => {
      if (isMine) {
        return currentUser?.photoUrl ? (
          <Image
            src={currentUser.photoUrl}
            width={32}
            height={32}
            title="You"
            alt="You"
            className="w-8 h-8 rounded-xl object-cover shadow-sm"
          />
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/10 shadow-sm" />
        );
      }

      const avatarUrl = msg.senderProfile?.photoUrl || targetUser?.photoUrl;
      const avatarAlt = msg.senderProfile?.fullName || (targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : msg.senderName || 'Sender');

      if (avatarUrl) {
        return (
          <Image
            src={avatarUrl}
            width={32}
            height={32}
            title={avatarAlt}
            alt={avatarAlt}
            className="w-8 h-8 rounded-xl object-cover shadow-sm"
          />
        );
      }

      // Fallback (e.g., consolidated "PDAO Office" thread)
      return (
        <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/10 shadow-sm flex items-center justify-center">
          <i className="fa-solid fa-message text-[12px] opacity-60"></i>
        </div>
      );
    };

    return (
      <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
        {msg.senderName && (
          <span className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-1 px-2">
            {msg.senderName}
          </span>
        )}

        <div className={`flex items-end gap-3 max-w-full ${isMine ? 'flex-row-reverse' : ''}`}>
          {renderAvatar()}

          <div className={`max-w-[85%] min-w-0 px-5 py-3 rounded-[20px] text-sm font-medium leading-relaxed shadow-sm relative whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${
            msg.role === 'user'
              ? 'bg-alaga-blue text-white rounded-br-none'
              : 'bg-white dark:bg-alaga-charcoal text-gray-800 dark:text-white rounded-bl-none border border-gray-100 dark:border-white/5'
          }`} title={msg.senderProfile ? (currentUser?.role !== 'User' && targetUser ? `${msg.senderProfile.fullName} • replying to ${targetUser.firstName} ${targetUser.lastName}` : msg.senderProfile.fullName) : undefined}>
            {msg.text}
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
            {targetUser?.photoUrl ? (
              <Image src={targetUser.photoUrl} width={48} height={48} className="w-12 h-12 rounded-2xl object-cover shadow-lg border-2 border-white" alt={`${targetUser.firstName} ${targetUser.lastName}`} />
            ) : (
              <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center shadow-inner relative ${isEmbedded ? 'bg-alaga-blue text-white' : 'bg-white/20'}`}>
                <i className="fa-solid fa-message text-xl"></i>
              </div>
            )}

            <div className="min-w-0 text-left">
              <h3 className="font-black text-lg leading-none truncate">
                {targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'Messaging'}
              </h3>
              <p className="text-[10px] opacity-70 mt-1 uppercase tracking-widest font-bold flex items-center gap-1 truncate">
                <i className="fa-solid fa-circle text-[6px] text-alaga-teal animate-pulse"></i>
                Active Messaging
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => (onBackToList ? onBackToList() : onClose())}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isEmbedded ? 'bg-gray-100 dark:bg-alaga-navy/30 hover:bg-gray-200 dark:hover:bg-alaga-navy/40 text-gray-800 dark:text-white' : 'bg-white/15 hover:bg-white/25 text-white'}`}
              aria-label="Back"
              title="Back"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isEmbedded ? 'bg-gray-100 dark:bg-alaga-navy/30 hover:bg-gray-200 dark:hover:bg-alaga-navy/40 text-gray-800 dark:text-white' : 'bg-white/15 hover:bg-white/25 text-white'}`}
              aria-label="Close"
              title="Close"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

        </div>

        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-alaga-gray dark:bg-alaga-navy/20 no-scrollbar">
          {displayMessages.map((m, i) => renderMessage(m, i))}
        </div>

        <div className="p-6 bg-white dark:bg-alaga-charcoal border-t border-gray-100 dark:border-white/10 flex items-center space-x-3 shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            type="text"
            placeholder={targetUser ? `Message ${targetUser.firstName}...` : 'Select a thread to message'}
            className="flex-1 bg-gray-100 dark:bg-alaga-navy/30 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 ring-alaga-blue/30 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !targetUser}
            className="bg-alaga-blue text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatWindow;
