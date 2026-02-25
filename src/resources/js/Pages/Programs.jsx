import { Head, router } from '@inertiajs/react';
import AlagaLayout from '@/Layouts/AlagaLink/AlagaLayout';
import ProgramsPage from '@/Pages/AlagaLink/Programs';

const pageToRouteName = {
    home: 'dashboard',
    programs: 'programs',
    'lost-found': 'lost-found',
    members: 'members',
    profile: 'identity-profile',
    about: 'about',
};

export default function Programs() {
    const handleNavigate = (page) => {
        const routeName = pageToRouteName[page];
        if (!routeName) return;
        router.visit(route(routeName));
    };

    return (
        <AlagaLayout currentPage="programs" onNavigate={handleNavigate}>
            <Head title="Programs" />
            <ProgramsPage />
        </AlagaLayout>
    );
}
