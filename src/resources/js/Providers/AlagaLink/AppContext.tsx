'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import {
  UserProfile,
  DisabilityCategory,
  LostReport,
  FormSection,
  ProgramAvailment,
  DirectMessage,
  DirectUnreadSummary,
  Notification,
  AssistiveDevice,
  MedicalService,
  LivelihoodProgram,
  SystemUpdate,
  AboutInfo,
} from './types';
import { OFFICE_ID } from './constants';

type LaravelUser = {
  id: number;
  name: string;
  email: string;
} | null;

export interface SearchSignal {
  page: string;
  section?: string;
  itemId?: string;
}

type AlagaLinkSeed = {
  users: UserProfile[];
  reports: LostReport[];
  programRequests: ProgramAvailment[];
  notifications: Notification[];
  devices: AssistiveDevice[];
  medical: MedicalService[];
  livelihoods: LivelihoodProgram[];
  updates: SystemUpdate[];
  about: AboutInfo | null;
  customSections?: FormSection[];
} | null;

interface AppContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  reports: LostReport[];
  programRequests: ProgramAvailment[];
  notifications: Notification[];
  devices: AssistiveDevice[];
  medicalServices: MedicalService[];
  livelihoodPrograms: LivelihoodProgram[];
  updates: SystemUpdate[];
  about: AboutInfo | null;
  customSections: FormSection[];
  directMessages: Record<string, DirectMessage[]>;
  directUnreadTotal: number;
  directUnreadByPeer: Record<string, number>;
  directLastMessageAtByPeer: Record<string, string | null>;
  isDarkMode: boolean;
  globalSearchQuery: string;
  globalSearchFilter: string;
  searchSignal: SearchSignal | null;
  setGlobalSearchQuery: (query: string) => void;
  setGlobalSearchFilter: (filter: string) => void;
  setSearchSignal: (signal: SearchSignal | null) => void;
  toggleTheme: () => void;
  login: (email: string) => void;
  loginWithPassword: (emailOrUsername: string, password: string) => boolean;
  loginById: (id: string) => void;
  logout: () => void;
  addReport: (report: LostReport) => void;
  updateReport: (report: LostReport) => void;
  addUser: (user: UserProfile) => void;
  updateUser: (user: UserProfile) => void;
  updateProgramRequest: (updatedReq: ProgramAvailment) => void;
  addProgramRequest: (newReq: ProgramAvailment) => void;
  reportMissingProgramRequest: (requestId: string) => void;
  addCustomSection: (label: string) => void;
  removeCustomSection: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  sendDirectMessage: (toUserId: string, text: string) => void;
  loadDirectThread: (peerId: string, afterTimestamp?: string) => Promise<void>;
  markDirectThreadRead: (peerId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode; initialLaravelUser?: LaravelUser; initialSeed?: AlagaLinkSeed }> = ({
  children,
  initialLaravelUser = null,
  initialSeed = null,
}) => {
  const seededUsers = ((initialSeed?.users ?? []) as UserProfile[]);
  const seededReports = ((initialSeed?.reports ?? []) as LostReport[]);
  const seededProgramRequests = ((initialSeed?.programRequests ?? []) as ProgramAvailment[]);
  const seededNotifications = ((initialSeed?.notifications ?? []) as Notification[]);
  const seededDevices = ((initialSeed?.devices ?? []) as AssistiveDevice[]);
  const seededMedical = ((initialSeed?.medical ?? []) as MedicalService[]);
  const seededLivelihoods = ((initialSeed?.livelihoods ?? []) as LivelihoodProgram[]);
  const seededUpdates = ((initialSeed?.updates ?? []) as SystemUpdate[]);
  const seededAbout = (initialSeed?.about ?? null) as AboutInfo | null;
  const seededCustomSections = ((initialSeed?.customSections ?? []) as FormSection[]);

  const seededUser = useMemo(() => {
    if (!initialLaravelUser?.email) return null;
    const byEmail = seededUsers.find(u => u.email.toLowerCase() === initialLaravelUser.email.toLowerCase());
    if (byEmail) return byEmail;

    const [firstName, ...rest] = (initialLaravelUser.name || '').trim().split(/\s+/).filter(Boolean);
    const lastName = rest.join(' ');

    return {
      id: `laravel-${initialLaravelUser.id}`,
      email: initialLaravelUser.email,
      role: 'User',
      firstName: firstName || initialLaravelUser.name || 'User',
      lastName: lastName || '',
      address: '',
      birthDate: '',
      provincialAddress: '',
      civilStatus: '',
      occupation: '',
      sex: 'Other',
      bloodType: '',
      age: 0,
      contactNumber: '',
      disabilityCategory: DisabilityCategory.None,
      familyComposition: [],
      emergencyContact: {
        name: '',
        relation: '',
        contact: '',
      },
      registrantType: 'Self',
      status: 'Pending',
      photoUrl: '',
      customData: {},
      history: {
        lostAndFound: [],
        programs: [],
      },
    } as UserProfile;
  }, [initialLaravelUser, seededUsers]);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(seededUser);
  const [users, setUsers] = useState<UserProfile[]>(seededUsers);
  const [reports, setReports] = useState<LostReport[]>(seededReports);
  const [programRequests, setProgramRequests] = useState<ProgramAvailment[]>(seededProgramRequests);
  const [notifications, setNotifications] = useState<Notification[]>(seededNotifications);
  const [devices] = useState<AssistiveDevice[]>(seededDevices);
  const [medicalServices] = useState<MedicalService[]>(seededMedical);
  const [livelihoodPrograms] = useState<LivelihoodProgram[]>(seededLivelihoods);
  const [updates] = useState<SystemUpdate[]>(seededUpdates);
  const [about] = useState<AboutInfo | null>(seededAbout ?? null);
  const [customSections, setCustomSections] = useState<FormSection[]>(seededCustomSections);
  const [directMessages, setDirectMessages] = useState<Record<string, DirectMessage[]>>({});
  const [directUnreadTotal, setDirectUnreadTotal] = useState(0);
  const [directUnreadByPeer, setDirectUnreadByPeer] = useState<Record<string, number>>({});
  const [directLastMessageAtByPeer, setDirectLastMessageAtByPeer] = useState<Record<string, string | null>>({});
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return window.localStorage.getItem('alagalink:darkMode') === '1';
    } catch {
      return false;
    }
  });

  const recordsEqual = (a: Record<string, unknown>, b: Record<string, unknown>) => {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const k of aKeys) {
      if (a[k] !== b[k]) return false;
    }
    return true;
  };

  // Keep server-seeded data in sync across Inertia navigations.
  useEffect(() => {
    setNotifications(seededNotifications);
  }, [seededNotifications]);

  useEffect(() => {
    setCustomSections(seededCustomSections);
  }, [seededCustomSections]);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchFilter, setGlobalSearchFilter] = useState('All');
  const [searchSignal, setSearchSignal] = useState<SearchSignal | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    try {
      window.localStorage.setItem('alagalink:darkMode', isDarkMode ? '1' : '0');
    } catch {
      // ignore storage errors
    }
  }, [isDarkMode]);

  useEffect(() => {
    setCurrentUser(seededUser);
  }, [seededUser]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const login = (email: string) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) setCurrentUser(user);
  };

  const loginWithPassword = (emailOrUsername: string, password: string): boolean => {
    const user = users.find(u =>
      (u.email.toLowerCase() === emailOrUsername.toLowerCase() ||
       u.id.toLowerCase() === emailOrUsername.toLowerCase()) &&
      u.password === password
    );
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const loginById = (id: string) => {
    const user = users.find(u => u.id === id);
    if (user) setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
    setSearchSignal(null);

    // Same-origin, server-backed logout.
    // Use fetch(keepalive) so the POST has a chance to complete even if we navigate away.
    const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    const body = new URLSearchParams();
    if (csrfToken) body.set('_token', csrfToken);

    const redirectHome = () => {
      window.location.href = '/';
    };

    // Always attempt to logout server-side; if it fails, still redirect.
    fetch('/logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: body.toString(),
      keepalive: true,
    })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        redirectHome();
      });
  };

  const addReport = (report: LostReport) => {
    setReports(prev => [report, ...prev]);

    axios.post('/api/alagalink/reports', report)
      .then((response) => {
        const saved = response?.data?.report as LostReport | undefined;
        if (!saved?.id) return;
        setReports(prev => prev.map(r => (r.id === report.id ? saved : r)));

        const createdNotifs = response?.data?.notifications as Notification[] | undefined;
        if (Array.isArray(createdNotifs) && createdNotifs.length > 0) {
          setNotifications(prev => [...createdNotifs, ...prev]);
        }
      })
      .catch((e) => {
        console.error('Failed to persist lost report:', e);
      });
  };

  const updateReport = (updatedReport: LostReport) => {
    setReports(prev => prev.map(r => (r.id === updatedReport.id ? updatedReport : r)));

    axios.patch('/api/alagalink/reports/' + encodeURIComponent(updatedReport.id), updatedReport)
      .then((response) => {
        const saved = response?.data?.report as LostReport | undefined;
        if (!saved?.id) return;
        setReports(prev => prev.map(r => (r.id === saved.id ? saved : r)));
      })
      .catch((e) => {
        console.error('Failed to persist lost report update:', e);
      });
  };

  const addUser = (user: UserProfile) => {
    setUsers([user, ...users]);
    if (user.role === 'Admin') {
      const saNotif: Notification = {
        id: `notif-staff-${Date.now()}`,
        targetRole: 'SuperAdmin',
        title: 'Staff Onboarding',
        message: `New administrative account created for ${user.firstName} ${user.lastName}.`,
        type: 'Info',
        date: new Date().toISOString(),
        isRead: false,
        link: `members:user:${user.id}`
      };
      setNotifications([saNotif, ...notifications]);
    }

    // Persist to server (DB-backed) when available.
    axios.post('/api/alagalink/users', user)
      .then((response) => {
        const saved = response?.data?.user as UserProfile | undefined;
        if (!saved?.id) return;
        setUsers(prev => {
          const replaced = prev.map(u => (u.id === user.id ? saved : u));
          const alreadyThere = replaced.some(u => u.id === saved.id);
          return alreadyThere ? replaced : [saved, ...replaced];
        });
      })
      .catch((e) => {
        console.error('Failed to persist created user:', e);
      });
  };

  const updateUser = (updatedUser: UserProfile) => {
    const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(newUsers);
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }

    axios.patch('/api/alagalink/users/' + encodeURIComponent(updatedUser.id), updatedUser)
      .then((response) => {
        const saved = response?.data?.user as UserProfile | undefined;
        if (!saved?.id) return;

        setUsers(prev => prev.map(u => u.id === saved.id ? saved : u));
        if (currentUser?.id === saved.id) {
          setCurrentUser(saved);
        }

        const createdNotifs = response?.data?.notifications as Notification[] | undefined;
        if (Array.isArray(createdNotifs) && createdNotifs.length > 0) {
          setNotifications(prev => {
            const seen = new Set(prev.map(n => n.id));
            const toAdd = createdNotifs.filter(n => n?.id && !seen.has(n.id));
            return toAdd.length ? [...toAdd, ...prev] : prev;
          });
        }
      })
      .catch((e) => {
        console.error('Failed to persist updated user:', e);
      });
  };

  const updateProgramRequest = (updatedReq: ProgramAvailment) => {
    setProgramRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));

    axios.patch('/api/alagalink/program-availments/' + encodeURIComponent(updatedReq.id), updatedReq)
      .then((response) => {
        const saved = response?.data?.request as ProgramAvailment | undefined;
        if (!saved?.id) return;
        setProgramRequests(prev => prev.map(r => r.id === saved.id ? saved : r));
      })
      .catch((e) => {
        console.error('Failed to persist updated program request:', e);
      });

    if (currentUser && updatedReq.userId === currentUser.id) {
       const updatedHistory = currentUser.history.programs.map(p => p.id === updatedReq.id ? updatedReq : p);
       if (!currentUser.history.programs.find(p => p.id === updatedReq.id)) {
          updatedHistory.push(updatedReq);
       }
       updateUser({
         ...currentUser,
         history: {
           ...currentUser.history,
           programs: updatedHistory
         }
       });
    }
  };

  const addProgramRequest = (newReq: ProgramAvailment) => {
    setProgramRequests(prev => [newReq, ...prev]);

    axios.post('/api/alagalink/program-availments', newReq)
      .then((response) => {
        const saved = response?.data?.request as ProgramAvailment | undefined;
        if (!saved?.id) return;
        setProgramRequests(prev => prev.map(r => r.id === newReq.id ? saved : r));

        const createdNotifs = response?.data?.notifications as Notification[] | undefined;
        if (Array.isArray(createdNotifs) && createdNotifs.length > 0) {
          setNotifications(prev => [...createdNotifs, ...prev]);
        }
      })
      .catch((e) => {
        console.error('Failed to persist created program request:', e);
      });
  };

  const reportMissingProgramRequest = (requestId: string) => {
    if (!currentUser) return;

    const existing = programRequests.find(r => r.id === requestId);
    if (!existing) return;
    if (existing.programType !== 'ID') return;
    if (existing.userId !== currentUser.id) return;
    if (existing.status !== 'Claimed') return;
    if (existing.missingReportedAt) return;

    const optimistic: ProgramAvailment = {
      ...existing,
      missingReportedAt: new Date().toISOString(),
    };

    setProgramRequests(prev => prev.map(r => (r.id === requestId ? optimistic : r)));

    setCurrentUser(prev => {
      if (!prev) return prev;
      if (prev.id !== existing.userId) return prev;

      const prevPrograms = Array.isArray(prev.history?.programs) ? prev.history.programs : [];
      const nextPrograms = prevPrograms.some(p => p.id === requestId)
        ? prevPrograms.map(p => (p.id === requestId ? optimistic : p))
        : [...prevPrograms, optimistic];

      return {
        ...prev,
        history: {
          ...prev.history,
          programs: nextPrograms,
        },
      };
    });

    axios.post('/api/alagalink/program-availments/' + encodeURIComponent(requestId) + '/report-missing', {})
      .then((response) => {
        const saved = response?.data?.request as ProgramAvailment | undefined;
        if (saved?.id) {
          setProgramRequests(prev => prev.map(r => (r.id === saved.id ? saved : r)));

          setCurrentUser(prev => {
            if (!prev) return prev;
            if (prev.id !== saved.userId) return prev;
            const prevPrograms = Array.isArray(prev.history?.programs) ? prev.history.programs : [];
            const nextPrograms = prevPrograms.some(p => p.id === saved.id)
              ? prevPrograms.map(p => (p.id === saved.id ? saved : p))
              : [...prevPrograms, saved];
            return {
              ...prev,
              history: {
                ...prev.history,
                programs: nextPrograms,
              },
            };
          });
        }

        const createdNotifs = response?.data?.notifications as Notification[] | undefined;
        if (Array.isArray(createdNotifs) && createdNotifs.length > 0) {
          setNotifications(prev => [...createdNotifs, ...prev]);
        }
      })
      .catch((e) => {
        console.error('Failed to report missing card:', e);
        // Do not rollback optimistic update; user can refresh or retry.
      });
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));

    axios.patch('/api/alagalink/notifications/' + encodeURIComponent(id), {})
      .catch((e) => {
        console.error('Failed to persist notification read state:', e);
      });
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    axios.post('/api/alagalink/notifications/clear', {})
      .catch((e) => {
        console.error('Failed to persist notification clear:', e);
      });
  };

  const addCustomSection = (label: string) => {
    const next = [...customSections, { id: Date.now().toString(), label }];
    setCustomSections(next);

    axios.put('/api/alagalink/custom-sections', { customSections: next })
      .then((response) => {
        const saved = response?.data?.customSections as FormSection[] | undefined;
        if (Array.isArray(saved)) setCustomSections(saved);
      })
      .catch((e) => {
        console.error('Failed to persist custom sections:', e);
      });
  };

  const removeCustomSection = (id: string) => {
    const next = customSections.filter(s => s.id !== id);
    setCustomSections(next);

    axios.put('/api/alagalink/custom-sections', { customSections: next })
      .then((response) => {
        const saved = response?.data?.customSections as FormSection[] | undefined;
        if (Array.isArray(saved)) setCustomSections(saved);
      })
      .catch((e) => {
        console.error('Failed to persist custom sections:', e);
      });
  };

  const threadKeyFor = (peerId: string): { threadKey: string; meta?: DirectMessage['meta'] } | null => {
    if (!currentUser) return null;

    if (peerId === OFFICE_ID) {
      return { threadKey: [currentUser.id, OFFICE_ID].sort().join('_') };
    }

    const recipientUser = users.find(u => u.id === peerId);

    // Staff replying to a member: consolidate into OFFICE <-> member thread.
    if (currentUser.role !== 'User' && recipientUser?.role === 'User') {
      return {
        threadKey: [OFFICE_ID, peerId].sort().join('_'),
        meta: { viaOffice: true },
      };
    }

    return { threadKey: [currentUser.id, peerId].sort().join('_') };
  };

  const refreshDirectUnreadSummary = useCallback(async () => {
    if (!currentUser) return;

    try {
      const response = await axios.get('/api/direct-messages/unread-summary');
      const data = (response?.data ?? null) as DirectUnreadSummary | null;
      if (!data || typeof data.totalUnread !== 'number' || !Array.isArray(data.peers)) return;

      const nextByPeer: Record<string, number> = {};
      const nextLastByPeer: Record<string, string | null> = {};

      for (const p of data.peers) {
        if (!p || typeof p.peerId !== 'string') continue;
        nextByPeer[p.peerId] = typeof p.unreadCount === 'number' ? p.unreadCount : 0;
        nextLastByPeer[p.peerId] = (typeof p.lastMessageAt === 'string' || p.lastMessageAt === null)
          ? (p.lastMessageAt ?? null)
          : null;
      }

      setDirectUnreadTotal(prev => (prev === data.totalUnread ? prev : data.totalUnread));
      setDirectUnreadByPeer(prev => (recordsEqual(prev, nextByPeer) ? prev : nextByPeer));
      setDirectLastMessageAtByPeer(prev => (recordsEqual(prev, nextLastByPeer) ? prev : nextLastByPeer));
    } catch (e) {
      console.error('Failed to load direct unread summary:', e);
    }
  }, [currentUser]);

  const markDirectThreadRead = useCallback(async (peerId: string) => {
    if (!currentUser) return;
    if (!peerId || typeof peerId !== 'string') return;

    const prevCount = directUnreadByPeer[peerId] || 0;

    if (prevCount > 0) {
      // Optimistically clear the peer badge immediately.
      setDirectUnreadByPeer(prev => ({ ...prev, [peerId]: 0 }));
      setDirectUnreadTotal(prev => Math.max(0, prev - prevCount));
    }

    try {
      await axios.post('/api/direct-messages/thread/' + encodeURIComponent(peerId) + '/mark-read', {});
    } catch (e) {
      console.error('Failed to mark direct thread read:', e);
    } finally {
      // Reconcile with the server in case multiple peers changed.
      refreshDirectUnreadSummary();
    }
  }, [currentUser, directUnreadByPeer, refreshDirectUnreadSummary]);

  useEffect(() => {
    if (!currentUser) {
      setDirectUnreadTotal(0);
      setDirectUnreadByPeer({});
      setDirectLastMessageAtByPeer({});
      return;
    }

    let cancelled = false;
    let intervalId: number | undefined;

    const poll = async () => {
      if (cancelled) return;
      await refreshDirectUnreadSummary();
    };

    poll();
    intervalId = window.setInterval(poll, 3000);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [currentUser?.id, refreshDirectUnreadSummary]);

  const loadDirectThread = async (peerId: string, afterTimestamp?: string) => {
    if (!currentUser) return;
    const computed = threadKeyFor(peerId);
    if (!computed) return;

    try {
      const response = await axios.get('/api/direct-messages/thread/' + encodeURIComponent(peerId), {
        params: afterTimestamp ? { after: afterTimestamp } : undefined,
      });

      const { threadKey, messages } = response.data || {};
      if (!threadKey || !Array.isArray(messages)) return;

      setDirectMessages(prev => {
        const existing = prev[threadKey] || [];
        if (!afterTimestamp) {
          return { ...prev, [threadKey]: messages };
        }

        const existingIds = new Set(existing.map(m => m.id));
        const merged = [...existing, ...messages.filter((m: DirectMessage) => !existingIds.has(m.id))];
        return { ...prev, [threadKey]: merged };
      });
    } catch (e) {
      // Silent fail; chat UI should remain usable offline.
      console.error('Failed to load direct thread:', e);
    }
  };

  const sendDirectMessage = (toUserId: string, text: string) => {
    if (!currentUser) return;

    const computed = threadKeyFor(toUserId);
    if (!computed) return;

    const threadKey = computed.threadKey;
    const optimisticId = `tmp-${Date.now()}`;
    const optimistic: DirectMessage = {
      id: optimisticId,
      senderId: currentUser.id,
      text,
      timestamp: new Date().toISOString(),
      meta: computed.meta,
    };

    setDirectMessages(prev => ({
      ...prev,
      [threadKey]: [...(prev[threadKey] || []), optimistic],
    }));

    axios.post('/api/direct-messages', {
      toUserId,
      text,
      meta: computed.meta,
    }).then((response) => {
      const serverThreadKey = response?.data?.threadKey || threadKey;
      const serverMessage = response?.data?.message;
      if (!serverMessage?.id) return;

      setDirectMessages(prev => {
        const existing = prev[serverThreadKey] || [];
        const replaced = existing.map(m => (m.id === optimisticId ? serverMessage : m));
        const alreadyThere = replaced.some(m => m.id === serverMessage.id);
        const finalList = alreadyThere ? replaced : [...replaced, serverMessage];
        return { ...prev, [serverThreadKey]: finalList };
      });
    }).catch((e) => {
      console.error('Failed to send direct message:', e);
      // Keep optimistic message; user can retry by sending again.
    });
  };

  const userNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter(n => {
      if (n.userId === currentUser.id) return true;
      if (n.targetRole === 'SuperAdmin' && currentUser.role === 'SuperAdmin') return true;
      if (n.targetRole === 'Admin' && (currentUser.role === 'Admin' || currentUser.role === 'SuperAdmin')) return true;
      if (n.targetRole === 'User' && currentUser.role === 'User') return true;
      return false;
    });
  }, [notifications, currentUser]);

  return (
    <AppContext.Provider value={{
      currentUser, users, reports, programRequests, notifications: userNotifications,
      devices, medicalServices, livelihoodPrograms, updates, about,
      customSections,
      directMessages,
      directUnreadTotal, directUnreadByPeer, directLastMessageAtByPeer,
      isDarkMode, globalSearchQuery, globalSearchFilter, searchSignal,
      setGlobalSearchQuery, setGlobalSearchFilter, setSearchSignal, toggleTheme,
      login, loginWithPassword, loginById, logout, addReport, updateReport, addUser, updateUser, updateProgramRequest, addProgramRequest,
      reportMissingProgramRequest,
      addCustomSection, removeCustomSection, markNotificationRead, clearAllNotifications,
      sendDirectMessage,
      loadDirectThread,
      markDirectThreadRead
    }}>
      {children}
    </AppContext.Provider>
  );
};


export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
