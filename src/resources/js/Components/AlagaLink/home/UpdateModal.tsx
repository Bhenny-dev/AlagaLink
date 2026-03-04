
import React from 'react';
import Image from 'next/image';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';

type UpdateItem = {
  id: string;
  title: string;
  photoUrl?: string;
  type?: 'Urgent' | 'Alert' | string;
  date?: string;
  summary?: string;
  detail?: string;
  link?: string;
  itemId?: string;
  section?: string;
};

interface UpdateModalProps {
  update: UpdateItem | null;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ update, onClose, onNavigate }) => {
  const { setSearchSignal } = useAppContext();

  if (!update) return null;

  const handleLearnMore = () => {
    if (update.link && update.link !== 'home') {
      // If the update is linked to a specific item, set the search signal for deep-linking
      if (update.itemId) {
        setSearchSignal({
          page: update.link,
          section: update.section,
          itemId: update.itemId
        });
      }
      onNavigate(update.link);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 alagalink-overlay-scroll alagalink-topbar-safe">
      <div className="bg-white dark:bg-alaga-charcoal rounded-[24px] max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-300 no-scrollbar">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-red-500 hover:text-white text-gray-400 transition-all z-20">
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        <div className="h-56 overflow-hidden relative">
          <Image
            src={update.photoUrl || `https://picsum.photos/seed/${update.id}/800/400`}
            alt={update.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-alaga-charcoal/80 to-transparent"></div>

          <div className="absolute bottom-12 left-10">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white mb-2 inline-block shadow-lg ${
              update.type === 'Urgent' ? 'bg-red-500' :
              update.type === 'Alert' ? 'bg-alaga-teal' : 'bg-alaga-blue'
            }`}>
              {update.type || 'Information'}
            </span>
          </div>
        </div>

        <div className="p-8 -mt-10 relative z-10 bg-white dark:bg-alaga-charcoal rounded-t-[24px]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-alaga-blue text-xs font-black uppercase tracking-widest">{update.date}</span>
            <div className="flex gap-2">
               <i className="fa-solid fa-share-nodes text-sm opacity-20 hover:opacity-100 cursor-pointer transition-opacity"></i>
               <i className="fa-solid fa-bookmark text-sm opacity-20 hover:opacity-100 cursor-pointer transition-opacity"></i>
            </div>
          </div>

          <h2 className="text-2xl font-black mt-2 mb-4 leading-tight">{update.title}</h2>

          <div className="prose dark:prose-invert text-sm leading-relaxed mb-8 opacity-70 font-medium">
            <p className="mb-4">{update.summary}</p>
            <div className="p-4 bg-alaga-gray dark:bg-white/5 rounded-2xl border-l-4 border-alaga-blue italic">
              {update.detail}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleLearnMore}
              className="flex-1 bg-alaga-blue text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-alaga-blue/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <i className="fa-solid fa-arrow-up-right-from-square text-sm"></i>
              More Information
            </button>
            <button
              onClick={onClose}
              className="px-6 py-4 bg-alaga-gray dark:bg-white/5 rounded-2xl font-black text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateModal;
