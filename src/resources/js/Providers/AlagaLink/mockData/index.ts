
import { MOCK_REGISTERED } from './members/registered';
import { MOCK_PENDING } from './members/pending';
import { MOCK_SUSPENDED } from './members/suspended';
import { MOCK_ADMINS } from './admins';
import { MOCK_MISSING } from './lost-found/missing';
import { MOCK_FOUND } from './lost-found/found';
import { MOCK_LIVELIHOODS as MOCK_LIVELIHOODS_ROOT } from './livelihood';

// Aggregate Members
export const MOCK_USERS = [
  ...MOCK_ADMINS,
  ...MOCK_REGISTERED,
  ...MOCK_PENDING,
  ...MOCK_SUSPENDED
];

// Aggregate Reports
export const MOCK_REPORTS = [
  ...MOCK_MISSING,
  ...MOCK_FOUND
];

// Program Exports (from programs/ subdirectory)
export * from './programs/devices';
export * from './programs/medical';
export * from './programs/livelihood';
export * from './programs/records';

// Notification & Profile Exports
export * from './notifications/updates';
export * from './notifications/history';
export * from './profile/about';
export * from './profile/credentials';

// Member Exports
export * from './members/registered';
export * from './members/pending';
export * from './members/suspended';

// Admin & Lost-Found Exports
export * from './admins';
export * from './lost-found/missing';
export * from './lost-found/found';

// Root level Livelihood export
export { MOCK_LIVELIHOODS_ROOT as MOCK_LIVELIHOODS };

// Asset exports
export * from './assets';
