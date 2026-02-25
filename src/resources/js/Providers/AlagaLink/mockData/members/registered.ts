
import { UserProfile, DisabilityCategory } from '../../types';

const rawNames = [
  "Aljon Daguio Dumayag", "Maricel Banao Gawidan", "Jethro Lumawig Saguid", "Analyn Dulag Pumihic", "Ronel Balangcod Olsim",
  "Kristine Bayle Bugtong", "Elmer Gondayao Cuyop", "Charmaine Labiang Gupaal", "Bryan Gawis Tuguinay", "Liza Patingan Waclin",
  "Nathaniel Gacayan Balanoy", "Jolina Pucay Dacquel", "Renz Tabbada Gawidan", "Sheena Bayeng Dulnuan", "Carlo Duyan Langbayan",
  "Marjorie Sagayo Pumihic", "Kent Balanag Gondayao", "Angelica Dulnuan Dacquel", "Joshua Gupaal Balangcod", "Trisha Waclin Bugtong",
  "Daryl Langbayan Gacayan", "Kimberly Tuguinay Bayle", "Alvin Saguid Duyan", "Rowena Cuyop Bayeng", "Jomar Pumihic Tabbada",
  "Hazel Balanoy Sagayo", "Cedric Dacquel Gondayao", "Nicole Gawidan Dulag", "Francis Bugtong Patingan", "Shaira Gacayan Balangag",
  "Jerome Dulag Bayeng", "Bianca Langbayan Gupaal", "Kevin Duyan Banao", "Marites Sagayo Pucay", "Ian Bayle Dumayag",
  "Clarisse Balangcod Waclin", "Patrick Gondayao Tuguinay", "Roselyn Patingan Saguid", "Vincent Dacquel Balangag", "Arianne Bugtong Dulnuan",
  "Kenrick Gacayan Bayle", "Lyka Tabbada Gawis", "Noel Dulag Langbayan", "Janine Saguid Pucay", "Aldrin Bayeng Dumayag",
  "Glenda Balangag Gupaal", "Jayson Waclin Banao", "Maribel Duyan Gondayao", "Tristan Bugtong Sagayo", "Eliza Pucay Balangcod"
];

const categories = Object.values(DisabilityCategory).filter(c => c !== DisabilityCategory.None);

export const MOCK_REGISTERED: UserProfile[] = rawNames.map((fullName, index) => {
  const parts = fullName.split(' ');
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  
  const sex = index % 2 === 0 ? 'Male' : 'Female';
  const photoUrl = sex === 'Male' 
    ? `https://randomuser.me/api/portraits/men/${index % 99}.jpg`
    : `https://randomuser.me/api/portraits/women/${index % 99}.jpg`;

  const id = `LT-PWD-${1000 + index}`;
  
  // Assign digital ID metadata to approved users only (first 10 Active users)
  // Users 0-29: Active status, users 0-9 have approved IDs
  // Users 30-49: Pending status, no IDs
  const isApproved = index < 10;
  const isPending = index >= 30;
  const idMetadata = isApproved ? {
    idNumber: `CAR-BEN-LT-${2023000 + index}`,
    issuedDate: '2023-01-15',
    expiryDate: '2028-01-15',
    issuingOfficer: 'JOE B. KIS-ING',
    issuingOffice: 'PDAO La Trinidad',
    causeOfDisability: index % 3 === 0 ? 'Congenital' : 'Acquired (Accident)',
    qrCodeValue: `https://alagalink.ph/verify/CAR-BEN-LT-${2023000 + index}`
  } : undefined;

  return {
    id,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@alagalink.ph`,
    password: 'password',
    role: 'User',
    firstName,
    middleName: parts.length > 2 ? parts[1] : '',
    lastName,
    address: `${index % 5 === 0 ? 'Pico' : index % 3 === 0 ? 'Poblacion' : 'Km. 5'}, La Trinidad`,
    birthDate: `19${75 + (index % 25)}-${((index % 12) + 1).toString().padStart(2, '0')}-15`,
    provincialAddress: 'Benguet',
    civilStatus: index % 4 === 0 ? 'Married' : 'Single',
    occupation: (index % 3 === 0 ? 'Self-Employed' : 'Student'),
    sex,
    bloodType: index % 4 === 0 ? 'A+' : (index % 4 === 1 ? 'B+' : 'O+'),
    age: 20 + (index % 40),
    contactNumber: `0917${(1000000 + index).toString().substring(1)}`,
    disabilityCategory: categories[index % categories.length],
    familyComposition: [],
    emergencyContact: { 
      name: `Guardian of ${firstName}`, 
      relation: 'Parent', 
      contact: '0911-222-3333' 
    },
    registrantType: 'Self',
    idMetadata,
    status: isPending ? 'Pending' : 'Active',
    photoUrl,
    customData: {},
    history: { 
      lostAndFound: [], 
      programs: [
        { 
          id: `h-${index}`, 
          userId: id,
          programType: 'ID', 
          title: isApproved ? 'ID Issuance Complete' : 'Initial Registry Entry', 
          status: 'Completed', 
          dateApplied: '2023-01-01' 
        }
      ] 
    }
  };
});
