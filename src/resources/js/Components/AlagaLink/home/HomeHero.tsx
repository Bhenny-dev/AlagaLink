'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

type UpdateItem = {
  id: string;
  title: string;
  date?: string;
  timestamp?: number;
  summary?: string;
  detail?: string;
  photoUrl?: string;
  type?: string;
  category?: string;
};

interface HomeHeroProps {
  updates: UpdateItem[];
  onClick: (update: UpdateItem) => void;
}

const HomeHero: React.FC<HomeHeroProps> = ({ updates, onClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    // Defer setState to avoid synchronous state update within effect
    Promise.resolve().then(() => setIsClient(true));

    if (updates.length <= 1) return;

    const timer = setInterval(() => {
      if (!mountedRef.current) return;
      setIsTransitioning(true);
      setTimeout(() => {
        if (mountedRef.current) {
          setCurrentIndex((prev) => (prev + 1) % updates.length);
          setIsTransitioning(false);
        }
      }, 500);
    }, 6000);

    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [updates.length]);

  if (!updates || updates.length === 0) return null;
  
  // Prevent hydration mismatch by using consistent initial render on server
  const currentUpdate = isClient ? updates[currentIndex] : updates[0];

  const getBadgeColor = (type: string) => {
    switch(type) {
      case 'Urgent': return 'bg-red-500';
      case 'Alert': return 'bg-alaga-teal';
      case 'Program': return 'bg-alaga-blue';
      case 'Supply': return 'bg-purple-500';
      default: return 'bg-alaga-gold';
    }
  };

  return (
    <section 
      className="relative h-[300px] md:h-[500px] rounded-[20px] md:rounded-[32px] overflow-hidden group cursor-pointer shadow-2xl shadow-alaga-blue/10 bg-alaga-navy" 
      onClick={() => onClick(currentUpdate)}
    >
      <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <Image
          src={currentUpdate.photoUrl || `https://picsum.photos/seed/hero-${currentUpdate.id}/1200/800`}
          alt={currentUpdate.title}
          fill
          className="w-full h-full object-cover object-center scale-100 transition-transform duration-[10s] group-hover:scale-110 will-change-transform"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-alaga-navy via-alaga-navy/60 to-transparent"></div>
      </div>

      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-16">
        <div className={`space-y-3 md:space-y-4 transition-all duration-700 ease-out transform ${isTransitioning ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`}>
          <div className="flex items-center gap-2">
            <span className={`${getBadgeColor(currentUpdate.type || 'Normal')} text-white text-[8px] md:text-[10px] font-black px-3 md:px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-2`}>
              {(currentUpdate.type || '') === 'Urgent' && <span className="animate-ping w-1.5 h-1.5 bg-white rounded-full"></span>}
              {currentUpdate.type || 'Municipal Update'}
            </span>
          </div>
          
          <h2 className="text-2xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-2xl line-clamp-2">
            {currentUpdate.title}
          </h2>
          
          <p className="text-white/80 text-sm md:text-xl max-w-3xl line-clamp-1 md:line-clamp-2 font-medium leading-relaxed drop-shadow-md">
            {currentUpdate.summary}
          </p>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 md:right-16 flex gap-1.5 md:gap-2">
        {updates.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 md:h-1.5 transition-all duration-500 rounded-full ${i === currentIndex ? 'w-6 md:w-8 bg-white' : 'w-1 md:w-2 bg-white/30'}`}
          ></div>
        ))}
      </div>
    </section>
  );
};

export default HomeHero;