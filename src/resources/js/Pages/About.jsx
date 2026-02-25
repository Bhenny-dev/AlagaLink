import React from 'react';
import { Head, router } from '@inertiajs/react';
import AlagaLayout from '@/Layouts/AlagaLink/AlagaLayout';
import { DEVELOPERS, CONTRIBUTORS } from '@/Providers/AlagaLink/constants';

const pageToRouteName = {
    home: 'dashboard',
    programs: 'programs',
    'lost-found': 'lost-found',
    members: 'members',
    profile: 'identity-profile',
    about: 'about',
};

export default function About() {
    const handleNavigate = (page) => {
        const routeName = pageToRouteName[page];
        if (!routeName) return;
        router.visit(route(routeName));
    };

    return (
        <AlagaLayout currentPage="about" onNavigate={handleNavigate}>
            <Head title="About" />
            <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-4">
                    <i className="fa-solid fa-hands-holding-child text-6xl text-alaga-blue glow-about"></i>
                    <h2 className="text-4xl font-bold">About AlagaLink</h2>
                    <p className="text-lg opacity-70">
                        Empowering Persons with Disabilities and Children with Special Needs through digital inclusion.
                    </p>
                </div>
                <div className="bg-white dark:bg-alaga-charcoal p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 space-y-6">
                    <div>
                        <h3 className="text-xl font-bold mb-2 text-alaga-blue">Our Mission</h3>
                        <p className="opacity-70 leading-relaxed">
                            To bridge the gap between PWDs and municipal services in La Trinidad, ensuring efficient profiling,
                            accessible programs, and a safer community environment.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-bold mb-4 opacity-50 uppercase text-xs tracking-widest">Developers</h4>
                            <ul className="space-y-2">
                                {DEVELOPERS.map((d) => (
                                    <li key={d} className="font-medium">
                                        • {d}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4 opacity-50 uppercase text-xs tracking-widest">Contributors</h4>
                            <ul className="space-y-2">
                                {CONTRIBUTORS.map((c) => (
                                    <li key={c} className="font-medium">
                                        • {c}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AlagaLayout>
    );
}
