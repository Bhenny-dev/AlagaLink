'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import {
  UserProfile,
  LostReport,
  FormSection,
  ProgramAvailment,
  DirectMessage,
  Notification,
  AssistiveDevice,
  MedicalService,
  LivelihoodProgram,
  SystemUpdate,
  AboutInfo,
} from './types';
import {
  ABOUT_INFO,
  MOCK_DEVICES,
  MOCK_LIVELIHOODS,
  MOCK_MEDICAL,
  MOCK_NOTIFICATION_HISTORY,
  MOCK_PROGRAM_RECORDS,
  MOCK_REPORTS,
  MOCK_UPDATES,
  MOCK_USERS,
} from './mockData/index';
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
  addUser: (user: UserProfile) => void;
  updateUser: (user: UserProfile) => void;
  updateProgramRequest: (updatedReq: ProgramAvailment) => void;
  addProgramRequest: (newReq: ProgramAvailment) => void;
  addCustomSection: (label: string) => void;
  removeCustomSection: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  sendDirectMessage: (toUserId: string, text: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode; initialLaravelUser?: LaravelUser; initialSeed?: AlagaLinkSeed }> = ({
  children,
  initialLaravelUser = null,
  initialSeed = null,
}) => {
  const seededUsers = (initialSeed?.users?.length ? initialSeed.users : MOCK_USERS) as UserProfile[];
  const seededReports = (initialSeed?.reports?.length ? initialSeed.reports : MOCK_REPORTS) as LostReport[];
  const seededProgramRequests = (initialSeed?.programRequests?.length ? initialSeed.programRequests : MOCK_PROGRAM_RECORDS) as ProgramAvailment[];
  const seededNotifications = (initialSeed?.notifications?.length ? initialSeed.notifications : MOCK_NOTIFICATION_HISTORY) as Notification[];
  const seededDevices = (initialSeed?.devices?.length ? initialSeed.devices : MOCK_DEVICES) as AssistiveDevice[];
  const seededMedical = (initialSeed?.medical?.length ? initialSeed.medical : MOCK_MEDICAL) as MedicalService[];
  const seededLivelihoods = (initialSeed?.livelihoods?.length ? initialSeed.livelihoods : MOCK_LIVELIHOODS) as LivelihoodProgram[];
  const seededUpdates = (initialSeed?.updates?.length ? initialSeed.updates : MOCK_UPDATES) as SystemUpdate[];
  const seededAbout = (initialSeed?.about ? initialSeed.about : ABOUT_INFO) as AboutInfo;

  const seededUser = useMemo(() => {
    if (!initialLaravelUser?.email) return null;
    const byEmail = seededUsers.find(u => u.email.toLowerCase() === initialLaravelUser.email.toLowerCase());
    if (byEmail) return byEmail;
    return seededUsers.find(u => u.role === 'User') || seededUsers[0] || null;
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
  const [customSections, setCustomSections] = useState<FormSection[]>([]);
  const [directMessages, setDirectMessages] = useState<Record<string, DirectMessage[]>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchFilter, setGlobalSearchFilter] = useState('All');
  const [searchSignal, setSearchSignal] = useState<SearchSignal | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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
    // With XSRF-TOKEN unencrypted, axios/Inertia will include X-XSRF-TOKEN automatically.
    router.post('/logout', {}, {
      preserveState: false,
      onFinish: () => {
        window.location.href = '/';
      },
    });
  };

  const addReport = (report: LostReport) => {
    setReports([report, ...reports]);
    const adminNotif: Notification = {
      id: `notif-report-${Date.now()}`,
      targetRole: 'Admin',
      title: 'New Incident Reported',
      message: `Admin, a new missing person report has been filed for ${report.name}. Immediate verification required.`,
      type: 'Urgent',
      date: new Date().toISOString(),
      isRead: false,
      link: `lost-found:report:${report.id}`
    };
    setNotifications([adminNotif, ...notifications]);
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
  };

  const updateUser = (updatedUser: UserProfile) => {
    const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(newUsers);
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  const updateProgramRequest = (updatedReq: ProgramAvailment) => {
    setProgramRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
    const userNotif: Notification = {
      id: `notif-update-${Date.now()}`,
      userId: updatedReq.userId,
      title: `Application ${updatedReq.status}`,
      message: `Your request for ${updatedReq.title} has been updated to ${updatedReq.status}.`,
      type: updatedReq.status === 'Approved' || updatedReq.status === 'Completed' ? 'Success' : updatedReq.status === 'Rejected' ? 'Urgent' : 'Info',
      date: new Date().toISOString(),
      isRead: false,
      link: `programs:requests:${updatedReq.id}`,
      programType: updatedReq.programType
    };
    setNotifications([userNotif, ...notifications]);

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
    setProgramRequests([newReq, ...programRequests]);
    const userNotif: Notification = {
      id: `notif-user-${Date.now()}`,
      userId: newReq.userId,
      title: 'Request Logged',
      message: `We have received your application for ${newReq.title}. It is now pending evaluation.`,
      type: 'Info',
      date: new Date().toISOString(),
      isRead: false,
      link: `programs:requests:${newReq.id}`,
      programType: newReq.programType
    };
    const adminNotif: Notification = {
      id: `notif-admin-${Date.now()}`,
      targetRole: 'Admin',
      title: 'New Evaluation Pending',
      message: `A new ${newReq.programType} request has been submitted and requires administrative review.`,
      type: 'Warning',
      date: new Date().toISOString(),
      isRead: false,
      link: `programs:requests:${newReq.id}`,
      programType: newReq.programType
    };
    setNotifications([userNotif, adminNotif, ...notifications]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const addCustomSection = (label: string) => {
    setCustomSections([...customSections, { id: Date.now().toString(), label }]);
  };

  const removeCustomSection = (id: string) => {
    setCustomSections(customSections.filter(s => s.id !== id));
  };

  const sendDirectMessage = (toUserId: string, text: string) => {
    if (!currentUser) return;

    // If an admin/superadmin is replying to a PWD, consolidate messages into the OFFICE thread
    let recipientForThread = toUserId;
    let meta: DirectMessage['meta'] | undefined = undefined;

    const recipientUser = users.find(u => u.id === toUserId);

    if (currentUser.role !== 'User' && recipientUser && recipientUser.role === 'User') {
      // Admin replying to a PWD: write into the OFFICE <-> PWD thread and mark meta
      recipientForThread = OFFICE_ID;
      meta = { viaOffice: true };
    }

    const threadKey = [recipientForThread, currentUser.id].sort().join('_');

    const newMessage: DirectMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      text,
      timestamp: new Date().toISOString(),
      meta
    };

    setDirectMessages(prev => ({
      ...prev,
      [threadKey]: [...(prev[threadKey] || []), newMessage]
    }));
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
      directMessages, isDarkMode, globalSearchQuery, globalSearchFilter, searchSignal,
      setGlobalSearchQuery, setGlobalSearchFilter, setSearchSignal, toggleTheme,
      login, loginWithPassword, loginById, logout, addReport, addUser, updateUser, updateProgramRequest, addProgramRequest,
      addCustomSection, removeCustomSection, markNotificationRead, clearAllNotifications,
      sendDirectMessage
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
