
import { UserProfile, DisabilityCategory } from '../../types';

export const MOCK_PENDING: UserProfile[] = [
  {
    id: `LT-PEND-1`,
    email: 'j.pucay@gmail.com',
    role: 'User',
    firstName: 'Jolina',
    lastName: 'Pucay',
    address: 'Poblacion, La Trinidad',
    birthDate: '2015-08-12',
    provincialAddress: 'Benguet',
    civilStatus: 'Single',
    occupation: 'Student',
    sex: 'Female',
    bloodType: 'A+',
    age: 8,
    contactNumber: '09456677889',
    disabilityCategory: DisabilityCategory.DevelopmentalDelay,
    familyComposition: [],
    emergencyContact: { name: 'Maria Pucay', relation: 'Mother', contact: '09456677889' },
    registrantType: 'Guardian',
    status: 'Pending',
    photoUrl: 'https://randomuser.me/api/portraits/women/45.jpg',
    customData: {},
    history: { lostAndFound: [], programs: [] }
  },
  {
    id: `ADM-PEND-001`,
    email: 'eliza.torres@alagalink.ph',
    role: 'Admin',
    firstName: 'Eliza',
    lastName: 'Torres',
    address: 'Bahong, La Trinidad',
    birthDate: '1995-02-14',
    provincialAddress: 'Benguet',
    civilStatus: 'Single',
    occupation: 'Social Worker (Applicant)',
    sex: 'Female',
    bloodType: 'O+',
    age: 28,
    contactNumber: '09129998888',
    disabilityCategory: DisabilityCategory.None,
    familyComposition: [],
    emergencyContact: { name: 'Mario Torres', relation: 'Father', contact: '09129998888' },
    registrantType: 'PDAO Staff',
    professionalQualifications: {
      citizenship: 'Filipino',
      residency: 'La Trinidad',
      education: 'BS in Social Work',
      eligibility: 'Registered Social Worker',
      trainingHours: 30,
      experienceYears: 4,
      licenseNumber: 'PRC-RSW-PENDING',
      isSocialWorker: true
    },
    status: 'Pending',
    photoUrl: 'https://randomuser.me/api/portraits/women/62.jpg',
    customData: {},
    history: { lostAndFound: [], programs: [] }
  }
];
