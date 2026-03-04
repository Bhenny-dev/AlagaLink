import React from 'react';
import { Head, router } from '@inertiajs/react';
import AlagaLayout from '@/Layouts/AlagaLink/AlagaLayout';

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
                    <div className="w-28 h-28 md:w-36 md:h-36 mx-auto">
                        <img
                            src="/images/Alagalink_Logo/AlagaLink_Logo.png"
                            alt="AlagaLink"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs md:text-sm font-black uppercase tracking-[0.4em] opacity-40">About Us</p>
                        <h1 className="text-6xl md:text-8xl font-black text-3d-heavy tracking-tighter leading-none">
                            Alaga<span className="text-alaga-blue">Link</span>
                        </h1>
                    </div>
                    <p className="text-sm md:text-xl font-black uppercase tracking-[0.4em] opacity-40">
                        La Trinidad PWD/CWD Information System
                    </p>
                    <p className="text-lg opacity-70 max-w-2xl mx-auto leading-relaxed">
                        AlagaLink helps bridge the gap between the community and municipal services through digital inclusion and
                        high-integrity profiling.
                    </p>
                </div>

                <div className="bg-white dark:bg-alaga-charcoal p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 space-y-8">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-alaga-blue">What AlagaLink Is</h3>
                        <p className="opacity-70 leading-relaxed">
                            AlagaLink is a municipal information system built to support Persons with Disabilities (PWDs) and
                            Children with Special Needs (CWDs) by keeping essential records organized, accessible, and actionable
                            for both beneficiaries and authorized municipal staff.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-alaga-blue">Our Mission</h3>
                            <p className="opacity-70 leading-relaxed">
                                To bridge the gap between PWDs and municipal services in La Trinidad by enabling efficient
                                profiling, accessible programs, and a safer community environment.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-alaga-blue">Our Vision</h3>
                            <p className="opacity-70 leading-relaxed">
                                A community where assistance is easier to access, services are inclusive by design, and every
                                eligible resident can be supported through timely, transparent processes.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-xl font-bold text-alaga-blue">Key Information</h3>
                        <ul className="space-y-2 opacity-80 leading-relaxed">
                            <li>• Digital profiling and identity records for eligible residents.</li>
                            <li>• Program and availment tracking to support municipal assistance workflows.</li>
                            <li>• Notifications and updates to keep users informed of approvals and next steps.</li>
                            <li>• Community reporting support for lost/found or missing-related cases when applicable.</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-alaga-blue">Data & Access</h3>
                        <p className="opacity-70 leading-relaxed">
                            Access to records is role-based. Beneficiaries can view their own information and status updates,
                            while authorized staff can process applications and manage program-related actions.
                        </p>
                    </div>
                </div>
            </div>
        </AlagaLayout>
    );
}
