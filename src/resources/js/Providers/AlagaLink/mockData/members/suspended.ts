
import { UserProfile, DisabilityCategory } from '../../types';

export const MOCK_SUSPENDED: UserProfile[] = [
  {
    id: `LT-SUSP-1`,
    email: 'suspended.user@example.com',
    role: 'User',
    firstName: 'Francis',
    lastName: 'Bugtong',
    address: 'Beckel, La Trinidad',
    birthDate: '1990-01-01',
    provincialAddress: 'Benguet',
    civilStatus: 'Single',
    occupation: 'None',
    sex: 'Male',
    bloodType: 'B+',
    age: 33,
    contactNumber: '09000000000',
    disabilityCategory: DisabilityCategory.VisualImpairment,
    familyComposition: [],
    emergencyContact: { name: 'None', relation: 'None', contact: '000' },
    registrantType: 'Self',
    status: 'Suspended',
    photoUrl: 'https://randomuser.me/api/portraits/men/10.jpg',
    customData: {},
    history: { lostAndFound: [], programs: [] }
  }
];
