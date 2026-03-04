import { LostReport, Notification, ProgramAvailment, UserProfile } from '@/Providers/AlagaLink/types';

type ParsedLink = {
  page: string;
  section?: string;
  itemId?: string;
};

export const parseNotificationLink = (link?: string | null): ParsedLink | null => {
  if (!link) return null;

  const parts = link.split(':');
  const page = (parts[0] || '').trim();
  if (!page) return null;

  const section = (parts[1] || '').trim() || undefined;
  const itemId = (parts[2] || '').trim() || undefined;

  return { page, section, itemId };
};

const getUserDisplayName = (user?: UserProfile | null) => {
  if (!user) return null;
  const full = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return full || user.id;
};

export const getNotificationPresentation = (args: {
  notif: Notification;
  users: UserProfile[];
  programRequests: ProgramAvailment[];
  reports: LostReport[];
}) => {
  const { notif, users, programRequests, reports } = args;

  const parsed = parseNotificationLink(notif.link);
  if (!parsed) {
    return {
      title: notif.title,
      message: notif.message,
      meta: null as string | null,
      destination: null as string | null,
    };
  }

  if (parsed.page === 'programs' && parsed.section === 'requests' && parsed.itemId) {
    const req = programRequests.find(r => r.id === parsed.itemId);
    if (req) {
      const subjectUser = users.find(u => u.id === req.userId);
      const subjectName = getUserDisplayName(subjectUser);

      const title = `${req.programType} Request`;
      const messageParts = [req.title, req.status].filter(Boolean);
      const message = messageParts.join(' — ');

      const metaParts = [
        subjectName ? `Applicant: ${subjectName}` : null,
        req.id ? `Ref: ${req.id}` : null,
      ].filter(Boolean);

      return {
        title,
        message,
        meta: metaParts.length ? metaParts.join(' • ') : null,
        destination: 'Programs / Requests',
      };
    }

    return {
      title: notif.programType ? `${notif.programType} Request` : notif.title,
      message: notif.message,
      meta: parsed.itemId ? `Ref: ${parsed.itemId}` : null,
      destination: 'Programs / Requests',
    };
  }

  if (parsed.page === 'lost-found' && parsed.itemId) {
    const report = reports.find(r => r.id === parsed.itemId);
    if (report) {
      const title = `Lost & Found — ${report.status}`;
      const message = report.name ? report.name : notif.message;
      const metaParts = [
        report.lastSeen ? `Last seen: ${report.lastSeen}` : null,
        report.id ? `Ref: ${report.id}` : null,
      ].filter(Boolean);

      return {
        title,
        message,
        meta: metaParts.length ? metaParts.join(' • ') : null,
        destination: 'Lost & Found / Report',
      };
    }

    return {
      title: notif.title,
      message: notif.message,
      meta: parsed.itemId ? `Ref: ${parsed.itemId}` : null,
      destination: 'Lost & Found',
    };
  }

  // Generic fallback for any other structured pages.
  const destination = parsed.section ? `${parsed.page} / ${parsed.section}` : parsed.page;
  return {
    title: notif.title,
    message: notif.message,
    meta: parsed.itemId ? `Ref: ${parsed.itemId}` : null,
    destination,
  };
};
