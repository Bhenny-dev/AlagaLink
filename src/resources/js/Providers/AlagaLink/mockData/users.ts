import { UserProfile } from '../types';
import { MOCK_REGISTERED } from './members/registered';

// We now import from the source of truth to ensure consistency
export const MOCK_USERS: UserProfile[] = MOCK_REGISTERED;