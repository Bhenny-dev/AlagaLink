
import React from 'react';

interface LostFoundHeaderProps {
  filter: string;
  onSetFilter: (filter: 'All' | 'Missing' | 'Found') => void;
  onOpenReportModal: () => void;
  isAdmin: boolean;
}

const LostFoundHeader: React.FC<LostFoundHeaderProps> = ({ filter, onSetFilter, onOpenReportModal, isAdmin }) => {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h2 className="text-3xl font-bold flex items-center">
          <i className="fa-solid fa-magnifying-glass-location mr-3 text-red-500"></i>
          Lost & Found Portal
        </h2>
        <p className="opacity-60">Help our community reconnect. Every share counts.</p>
        
        <div className="flex space-x-2 mt-4 bg-white dark:bg-alaga-charcoal p-1 rounded-full w-fit border border-gray-100 dark:border-white/5">
          {(['All', 'Missing', 'Found'] as const).map((f: 'All' | 'Missing' | 'Found') => (
            <button 
              key={f}
              onClick={() => onSetFilter(f)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${filter === f ? 'bg-alaga-blue text-white shadow-md' : 'hover:bg-alaga-gray dark:hover:bg-white/5'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      
      {isAdmin && (
        <button 
          onClick={onOpenReportModal}
          className="bg-red-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all flex items-center justify-center shrink-0"
        >
          <i className="fa-solid fa-plus mr-2"></i> Report Missing
        </button>
      )}
    </header>
  );
};

export default LostFoundHeader;
