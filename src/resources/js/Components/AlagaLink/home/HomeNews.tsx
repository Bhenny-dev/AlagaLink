
import React, { useState, useMemo } from 'react';
import Image from 'next/image';

type UpdateItem = {
  id: string;
  title: string;
  date: string;
  timestamp?: number;
  summary: string;
  detail?: string;
  photoUrl?: string;
  type?: string;
  category?: string;
};

interface HomeNewsProps {
  updates: UpdateItem[];
  onSelect: (update: UpdateItem) => void;
  isAdmin?: boolean;
}

const HomeNews: React.FC<HomeNewsProps> = ({ updates = [], onSelect, isAdmin = false }) => {
  const [filter, setFilter] = useState<'All' | 'Alerts' | 'Programs' | 'Registry'>('All');

  const filteredItems = useMemo(() => {
    const isAlert = (item: UpdateItem) => item.type === 'Alert' || item.type === 'Urgent';
    const isProgram = (item: UpdateItem) => item.type === 'Program' || item.type === 'Service' || item.type === 'Supply';
    const getTime = (item: UpdateItem) => {
      if (typeof item.timestamp === 'number') return item.timestamp;
      const parsed = Date.parse(item.date);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const base = updates
      .filter(item => {
        if (filter === 'All') return isAlert(item) || isProgram(item);
        if (filter === 'Alerts') return isAlert(item);
        if (filter === 'Programs') return isProgram(item);
        if (filter === 'Registry') return item.type === 'Registry';
        return true;
      })
      .slice()
      .sort((a, b) => getTime(b) - getTime(a));

    return base;
  }, [updates, filter]);

  const categories = [
    { label: 'Front Page', id: 'All' },
    { label: 'Public Alerts', id: 'Alerts' },
    { label: 'Community Aid', id: 'Programs' },
    ...(isAdmin ? [{ label: 'Registry Logs', id: 'Registry' }] : [])
  ];

  const getBadgeStyle = (type: string) => {
    switch(type) {
      case 'Urgent': return 'text-red-600 dark:text-red-400 font-black';
      case 'Alert': return 'text-alaga-teal font-black';
      case 'Program': return 'text-alaga-blue font-black';
      case 'Service': return 'text-alaga-blue font-black';
      case 'Supply': return 'text-alaga-blue font-black';
      case 'Registry': return 'text-purple-600 font-black';
      default: return 'text-gray-500 font-bold';
    }
  };

  return (
    <section className="animate-in fade-in duration-1000 space-y-8">
      {/* Newspaper Masthead */}
      <div className="border-y-4 border-gray-900 dark:border-white/40 py-6 text-center space-y-4">
        <div className="flex items-center justify-between px-2 opacity-60">
          <p className="text-[10px] font-black uppercase tracking-widest italic">Vol. {new Date().getFullYear()} • No. 4.90</p>
          <p className="text-[10px] font-black uppercase tracking-widest italic">Benguet Province, Philippines</p>
        </div>
        <h3 className="text-5xl md:text-8xl font-black tracking-tighter uppercase font-serif italic text-gray-900 dark:text-white">
          The Municipal Gazette
        </h3>
        <div className="flex items-center justify-center gap-6 px-4">
          <div className="h-px flex-1 bg-gray-900 dark:bg-white/40"></div>
          <p className="text-[11px] font-black uppercase tracking-[0.5em] whitespace-nowrap">Official Community Bulletin</p>
          <div className="h-px flex-1 bg-gray-900 dark:bg-white/40"></div>
        </div>
      </div>

      {/* Editorial Filter Bar - Newspaper Style */}
      <div className="flex items-center justify-center gap-4 flex-wrap border-b border-gray-200 dark:border-white/10 pb-4">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id as 'All' | 'Alerts' | 'Programs' | 'Registry')}
            className={`px-4 py-1 text-[11px] font-black uppercase tracking-widest transition-all ${
              filter === cat.id
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'hover:underline opacity-40'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Newspaper Grid Layout */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0">

          {/* LEFT COLUMN: Feature Story (Span 7) */}
          <div className="lg:col-span-7 lg:pr-8 lg:border-r border-gray-200 dark:border-white/10 space-y-6">
            <div
              className="group cursor-pointer space-y-4"
              onClick={() => onSelect(filteredItems[0])}
            >
              <div className="space-y-2">
                <span className={`text-[10px] uppercase tracking-widest ${getBadgeStyle(filteredItems[0].type || 'Normal')}`}>
                  {filteredItems[0].type || 'Update'} • {filteredItems[0].date}
                </span>
                <h4 className="text-3xl md:text-5xl font-black leading-[0.95] tracking-tighter text-gray-900 dark:text-white hover:text-alaga-blue transition-colors">
                  {filteredItems[0].title}
                </h4>
              </div>
              <div className="aspect-[16/9] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
                {filteredItems[0].photoUrl ? (
                  <Image src={filteredItems[0].photoUrl} width={1280} height={720} className="w-full h-full object-cover" alt={filteredItems[0].title} />
                ) : (
                  <div className="w-full h-full bg-gray-100" />
                )}
              </div>
              <p className="text-lg font-medium leading-tight text-gray-700 dark:text-gray-300 first-letter:text-5xl first-letter:font-black first-letter:mr-2 first-letter:float-left text-justify">
                {filteredItems[0].summary}
              </p>
              <p className="text-sm opacity-60 leading-relaxed italic border-l-2 border-gray-200 dark:border-white/20 pl-4">
                {filteredItems[0].detail}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Secondary Stories (Span 5) */}
          <div className="lg:col-span-5 lg:pl-8 space-y-8">
            {filteredItems.slice(1, 5).map((item, i) => (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={`group cursor-pointer space-y-3 pb-8 ${i !== 3 ? 'border-b border-gray-100 dark:border-white/5' : ''}`}
              >
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <span className={`text-[9px] uppercase tracking-widest ${getBadgeStyle(item.type || 'Normal')}`}>
                      {item.type || 'Update'} • {item.date}
                    </span>
                    <h5 className="text-xl font-black leading-[1.1] tracking-tight group-hover:text-alaga-blue transition-colors">
                      {item.title}
                    </h5>
                    <p className="text-xs opacity-70 font-medium leading-snug line-clamp-2">
                      {item.summary}
                    </p>
                  </div>
                  <div className="w-24 h-24 shrink-0 overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                    {item.photoUrl ? (
                      <Image src={item.photoUrl} width={96} height={96} className="w-full h-full object-cover" alt={item.title} />
                    ) : (
                      <div className="w-full h-full bg-gray-100" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* BOTTOM ROW: Remaining Stories (Span 12) */}
          {filteredItems.length > 5 && (
            <div className="lg:col-span-12 mt-12 pt-12 border-t-4 border-double border-gray-900 dark:border-white/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredItems.slice(5).map(item => (
                  <div
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className="group cursor-pointer border border-gray-100 dark:border-white/5 overflow-hidden"
                  >
                    <div className="aspect-video w-full overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                      {item.photoUrl ? (
                        <Image src={item.photoUrl} width={640} height={360} className="w-full h-full object-cover" alt={item.title} />
                      ) : (
                        <div className="w-full h-full bg-gray-100" />
                      )}
                    </div>
                    <div className="p-5 space-y-2">
                      <span className={`text-[9px] uppercase tracking-widest ${getBadgeStyle(item.type || 'Normal')}`}>
                        {item.type || 'Update'} • {item.date}
                      </span>
                      <h6 className="font-black leading-tight tracking-tight text-gray-900 dark:text-white group-hover:text-alaga-blue transition-colors line-clamp-2">
                        {item.title}
                      </h6>
                      <p className="text-[12px] opacity-70 font-medium leading-relaxed line-clamp-3">
                        {item.summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-40 text-center opacity-10 border-2 border-dashed border-gray-200 dark:border-white/10">
          <i className="fa-solid fa-newspaper text-8xl"></i>
          <p className="mt-4 font-black uppercase tracking-[0.5em]">No News Found</p>
        </div>
      )}

      {/* Gazete Footer Note */}
      <div className="pt-8 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
        <p className="text-[9px] font-black uppercase opacity-30 tracking-widest">© PDAO La Trinidad Communications Unit</p>
        <div className="flex gap-4">
          <i className="fa-brands fa-facebook text-xs opacity-20 hover:opacity-100 cursor-pointer transition-opacity"></i>
          <i className="fa-brands fa-twitter text-xs opacity-20 hover:opacity-100 cursor-pointer transition-opacity"></i>
          <i className="fa-solid fa-rss text-xs opacity-20 hover:opacity-100 cursor-pointer transition-opacity"></i>
        </div>
      </div>
    </section>
  );
};

export default HomeNews;
