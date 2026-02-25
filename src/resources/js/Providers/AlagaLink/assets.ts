/**
 * Shared image/asset utilities for AlagaLink.
 *
 * These are UI-level helpers/constants (not seeded DB data).
 */

export const MUNICIPAL_ASSETS = {
  // Brand & Identity
  LOGO: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=200&h=200&fit=crop',

  // Default User Placeholders
  USER_MALE: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=400&h=400&fit=crop',
  USER_FEMALE: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=400&fit=crop',

  // Program Categories
  ID_CARD_PREVIEW: 'https://images.unsplash.com/photo-1613243555988-441166d4d6fd?q=80&w=800&h=400&fit=crop',
  WHEELCHAIR_STOCK: 'https://images.unsplash.com/photo-1544126592-807daa2b567b?q=80&w=800&h=400&fit=crop',
  MEDICINE_STOCK: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&h=400&fit=crop',
  WORKSHOP_LOCAL: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800&h=400&fit=crop',

  // Incident Markers
  MISSING_PERSON_PLACEHOLDER: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=800&h=800&fit=crop'
} as const;

export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
