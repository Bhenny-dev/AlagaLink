'use client';
import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { LostReport } from '@/Providers/AlagaLink/types';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';
import CaseDetailModal from './CaseDetailModal';

const AUTO_ROTATE_MS = 5000;

// Add keyframe animations
const floatingStyles = `
  @keyframes subtleFloat {
    0%, 100% {
      transform: translateY(0px) scale(1);
    }
    50% {
      transform: translateY(-8px) scale(1.02);
    }
  }

  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(26, 137, 188, 0.7);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(26, 137, 188, 0);
    }
  }

  @keyframes inflate3d {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), inset -2px -2px 8px rgba(0, 0, 0, 0.05);
    }
    50% {
      transform: scale(1.02);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25), inset -4px -4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  .animate-subtle-float {
    animation: subtleFloat 6s ease-in-out infinite;
  }

  .animate-pulse-glow {
    animation: pulse-glow 2s infinite;
  }

  .inflate-3d {
    animation: inflate3d 4s ease-in-out infinite;
  }

  .inflate-3d-hover:hover {
    animation: inflate3d 2s ease-in-out infinite;
  }
`;

const calcHoursMissing = (time: string) => Math.floor((Date.now() - new Date(time).getTime()) / (1000 * 60 * 60));

const CommunityVigilCarousel: React.FC = () => {
  const { reports } = useAppContext();
  const missing = useMemo(() => reports.filter(r => r.status === 'Missing'), [reports]);
  const found = useMemo(() => reports.filter(r => r.status === 'Found'), [reports]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<LostReport | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [hoveredFoundId, setHoveredFoundId] = useState<string | null>(null);
  const timerRef = React.useRef<number | null>(null);

  useEffect(() => {
    // Auto rotate unless paused
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!isPaused && missing.length > 1) {
      timerRef.current = window.setInterval(() => {
        setIndex(i => (i + 1) % Math.max(1, missing.length));
      }, AUTO_ROTATE_MS);
    }
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [missing.length, isPaused]);

  // Keyboard navigation (left/right arrows)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setIndex(i => (i + 1) % Math.max(1, missing.length));
      }
      if (e.key === 'ArrowLeft') {
        setIndex(i => (i - 1 + Math.max(1, missing.length)) % Math.max(1, missing.length));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [missing.length]);

  if (missing.length === 0 && found.length === 0) return null;

  return (
    <>
      <style>{floatingStyles}</style>
      <div className="w-full p-0 bg-transparent" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} tabIndex={0}>
        {/* Missing Person Card */}
        <div className="w-full mb-8 relative overflow-hidden">
          {missing.map((m, i) => {
            const visible = i === index;
            const hours = calcHoursMissing(m.timeMissing);
            const isUrgent = hours >= 24;

            return (
              <div
                key={m.id}
                className={`transition-all duration-700 ease-in-out ${visible ? 'opacity-100 z-20' : 'opacity-0 z-10 absolute inset-0'}`}
                aria-hidden={!visible}
              >
                <div className="bg-white dark:bg-alaga-charcoal border-2 border-gray-200 dark:border-white/10 rounded-[24px] p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow inflate-3d-hover cursor-pointer hover:scale-[1.01]" onClick={() => setSelected(m)}>
                  {/* Header: Image, Name, and Condition */}
                  <div className="flex gap-6 md:gap-8 mb-8">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => setSelected(m)}
                        className="w-32 h-32 md:w-40 md:h-40 relative overflow-hidden rounded-[16px] shadow-lg hover:shadow-xl transition-shadow z-10"
                        aria-label={`View photo of ${m.name}`}
                      >
                        <Image
                          src={m.photoUrl || `https://picsum.photos/seed/${m.id}/1600/1000`}
                          alt={m.name}
                          fill
                          className="w-full h-full object-cover object-center"
                          sizes="(min-width:1024px) 160px, 128px"
                        />
                        <div className="absolute top-2 left-2">
                          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white text-sm shadow-md">
                            <i className="fa-solid fa-person-circle-question text-xs"></i>
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Name and Condition Section */}
                    <div className="flex-1 flex flex-col justify-start">
                      {/* Name with responsive sizing */}
                      <h3 className="font-extrabold text-alaga-navy dark:text-white mb-2 leading-tight"
                        style={{
                          fontSize: m.name.length > 20 ? 'clamp(1.5rem, 4vw, 2.5rem)' : 'clamp(2rem, 6vw, 3rem)'
                        }}>
                        {m.name}
                      </h3>

                      {/* Condition/Disability - centered below */}
                      <div className="mb-4">
                        <p className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide text-center bg-gray-100 dark:bg-white/5 rounded-full px-4 py-2 inline-block">
                          {m.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Information Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {/* Section 1: When Missing */}
                    <div className="border-l-4 border-alaga-blue pl-4">
                      <h4 className="font-black text-alaga-navy dark:text-white mb-3 text-sm uppercase tracking-wide">When Missing</h4>
                      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <i className="fa-solid fa-location-dot text-alaga-blue"></i>
                          <span className="font-medium">{m.lastSeen}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="fa-solid fa-clock text-alaga-blue"></i>
                          <span className="font-medium">{m.missingNarrative?.when || `${Math.max(1, hours)}h ago`}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Descriptions */}
                    <div className="border-l-4 border-alaga-teal pl-4">
                      <h4 className="font-black text-alaga-navy dark:text-white mb-3 text-sm uppercase tracking-wide">Description</h4>
                      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-start gap-2">
                          <i className="fa-solid fa-shirt text-alaga-teal mt-0.5 flex-shrink-0"></i>
                          <span className="font-medium">{m.clothes || 'N/A'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <i className="fa-solid fa-ruler-vertical text-alaga-teal mt-0.5 flex-shrink-0"></i>
                          <span className="font-medium">{m.height || 'N/A'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <i className="fa-solid fa-person text-alaga-teal mt-0.5 flex-shrink-0"></i>
                          <span className="font-medium">{m.bodyType || 'N/A'}</span>
                        </div>
                        {m.dissemination?.context && (
                          <div className="flex items-start gap-2">
                            <i className="fa-solid fa-note-sticky text-alaga-teal mt-0.5 flex-shrink-0"></i>
                            <span className="font-medium text-xs">{m.dissemination.context}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 3: Hours Missing with Effect */}
                    <div className="flex items-center justify-center">
                      <div className={`relative w-40 h-40 flex items-center justify-center rounded-full ${isUrgent ? 'animate-pulse-glow' : ''}`}>
                        <div className={`absolute inset-0 rounded-full ${isUrgent ? 'bg-red-500/20' : 'bg-alaga-blue/20'}`}></div>
                        <div className={`relative flex flex-col items-center justify-center p-6 rounded-full ${isUrgent ? 'bg-red-500' : 'bg-alaga-blue'} text-white shadow-lg`}>
                          <div className="text-3xl md:text-4xl font-black">{hours}</div>
                          <div className="text-xs font-bold uppercase tracking-widest">Hours</div>
                          <div className="text-xs font-bold uppercase tracking-widest">Missing</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Indicators - Smaller */}
        {missing.length > 0 && (
          <div className="flex items-center justify-center gap-2 flex-wrap mb-8" role="tablist" aria-label="Missing person slides">
            {missing.map((m, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Show slide ${i + 1} - ${m.name}`}
                role="tab"
                aria-selected={i === index}
                className={`transition-all duration-300 ${i === index ? 'w-5 h-5 rounded-full bg-alaga-blue shadow-md ring-1 ring-alaga-blue' : 'w-3 h-3 rounded-full border border-alaga-blue/40 bg-white/5 hover:border-alaga-blue/70'}`}
                title={m.name}
              ></button>
            ))}
          </div>
        )}

        {/* Found Persons Section - Small Cards Centered */}
        {found.length > 0 && (
          <div className="mt-8">
            {/* Found Tag - Horizontal */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-1 flex-1 bg-gradient-to-r from-transparent to-alaga-teal opacity-50"></div>
              <div className="px-6 py-2 rounded-full bg-alaga-teal text-alaga-navy font-black text-sm">
                Found • {found.length}
              </div>
              <div className="h-1 flex-1 bg-gradient-to-l from-transparent to-alaga-teal opacity-50"></div>
            </div>

            {/* Found Cards Grid - Centered */}
            <div className="flex justify-center flex-wrap gap-4">
              {found.map(f => (
                <div
                  key={f.id}
                  className="relative"
                  onMouseEnter={() => setHoveredFoundId(f.id)}
                  onMouseLeave={() => setHoveredFoundId(null)}
                >
                  <button
                    onClick={() => setSelected(f)}
                    className="group relative w-24 h-24 overflow-hidden rounded-[14px] border-2 border-alaga-teal/30 hover:border-alaga-teal transition-all hover:shadow-lg"
                    aria-label={`Preview ${f.name}`}
                  >
                    <Image
                      src={f.photoUrl || `https://picsum.photos/seed/${f.id}/200/300`}
                      alt={f.name}
                      fill
                      className="w-full h-full object-cover"
                      sizes="96px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                      <div className="text-white text-xs font-bold px-2 py-1 truncate w-full text-center">{f.name}</div>
                    </div>
                    <div className="absolute top-1 right-1 bg-alaga-teal text-alaga-navy rounded-full w-6 h-6 flex items-center justify-center text-xs font-black">
                      <i className="fa-solid fa-check"></i>
                    </div>
                  </button>

                  {/* Hover Tooltip */}
                  {hoveredFoundId === f.id && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 bg-white dark:bg-alaga-charcoal rounded-lg shadow-xl z-50 border border-gray-200 dark:border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-200 w-56">
                      <div className="flex gap-3 p-3">
                        {/* Image */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={f.photoUrl || `https://picsum.photos/seed/${f.id}/200/300`}
                            alt={f.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-sm text-alaga-navy dark:text-white truncate">{f.name}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{f.description}</p>
                          {f.foundNarrative?.when && (
                            <p className="text-xs font-medium text-alaga-teal mt-1">
                              <i className="fa-solid fa-location-dot mr-1"></i>
                              {f.foundNarrative.when}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selected && (
          <CaseDetailModal report={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </>
  );
};

export default CommunityVigilCarousel;
