
import React from 'react';
import Image from 'next/image';
import { LostReport } from '@/Providers/AlagaLink/types';

interface LostFoundGridProps {
  reports: LostReport[];
  onSelect: (report: LostReport) => void;
}

const LostFoundGrid: React.FC<LostFoundGridProps> = ({ reports, onSelect }) => {
  const calculateHoursMissing = (time: string) => {
    /* eslint-disable-next-line react-hooks/purity -- computing relative hours is safe here */
    return Math.floor((Date.now() - new Date(time).getTime()) / (1000 * 60 * 60));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {reports.map(report => {
        const hours = calculateHoursMissing(report.timeMissing);
        const isUrgent = hours >= 24;
        const isFound = report.status === 'Found';

        return (
          <div 
            key={report.id} 
            onClick={() => onSelect(report)}
            className="bg-white dark:bg-alaga-charcoal rounded-[20px] md:rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-white/5 cursor-pointer group flex flex-col h-full"
          >
            <div className="h-44 md:h-52 relative overflow-hidden shrink-0 bg-alaga-gray dark:bg-alaga-navy">
              <Image
                src={report.photoUrl || `https://picsum.photos/seed/${report.id}/500/500`}
                alt={report.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg z-10 ${isFound ? 'bg-alaga-teal text-white' : 'bg-red-500 text-white animate-pulse'}`}>
                {report.status}
              </div>
            </div>

            <div className="p-4 md:p-5 flex-1 flex flex-col">
              <div className="mb-3 md:mb-4">
                <h4 className="font-black text-sm md:text-base mb-0.5 group-hover:text-alaga-blue transition-colors truncate">{report.name}</h4>
                <p className="text-[10px] opacity-60 flex items-center font-medium truncate">
                  <i className="fa-solid fa-location-dot mr-1.5 text-alaga-blue"></i>
                  <span className="truncate">{report.lastSeen}</span>
                </p>
              </div>

              <div className="mt-auto">
                <div className={`p-2.5 md:p-3 rounded-xl flex items-center justify-between transition-all ${
                  isFound 
                    ? 'bg-alaga-teal/10 text-alaga-teal' 
                    : isUrgent 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                      : 'bg-alaga-blue text-white shadow-lg shadow-alaga-blue/30'
                }`}>
                  <span className="text-[10px] font-black">
                    {isFound ? 'Found & Safe' : `${hours}h Missing`}
                  </span>
                  <i className={`fa-solid ${isFound ? 'fa-circle-check' : 'fa-person-circle-question'} text-xs opacity-80`}></i>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LostFoundGrid;