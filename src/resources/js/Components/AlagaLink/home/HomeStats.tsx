
import React from 'react';

interface Stat {
  label: string;
  value: number;
  icon: string;
  color: string;
  link: string;
  sublabel?: string;
}

interface HomeStatsProps {
  stats: Stat[];
  onNavigate: (page: string) => void;
}

const HomeStats: React.FC<HomeStatsProps> = ({ stats, onNavigate }) => {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
      {stats.map((stat, i) => (
        <div 
          key={i} 
          onClick={() => onNavigate(stat.link)}
          className="inflated-card bg-white dark:bg-alaga-charcoal p-5 md:p-8 rounded-[20px] md:rounded-[32px] cursor-pointer group border border-gray-100 dark:border-white/5 relative overflow-hidden active:scale-95"
        >
          <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity ${stat.color}`}></div>
          
          <div className={`${stat.color} w-10 h-10 md:w-16 md:h-16 rounded-[14px] md:rounded-[24px] flex items-center justify-center text-white mb-4 md:mb-6 group-hover:scale-110 transition-all duration-500 shadow-xl inner-glow relative overflow-hidden`}>
            <i className={`fa-solid ${stat.icon} text-lg md:text-2xl glow-icon`}></i>
          </div>
          
          <h4 className="text-gray-500 dark:text-white/40 text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] mb-1 text-3d line-clamp-1">{stat.label}</h4>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl md:text-5xl font-black tracking-tighter text-3d-heavy">{stat.value}</p>
          </div>
          
          <div className="mt-4 md:mt-6 hidden md:flex items-center text-[10px] font-black text-alaga-blue uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
            Access Portal <i className="fa-solid fa-arrow-right-long ml-2"></i>
          </div>
        </div>
      ))}
    </section>
  );
};

export default HomeStats;