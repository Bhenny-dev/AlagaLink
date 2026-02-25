import { Head, router } from '@inertiajs/react';
import AlagaLayout from '@/Layouts/AlagaLink/AlagaLayout';
import LostFoundPage from '@/Pages/AlagaLink/LostFound';

const pageToRouteName = {
    home: 'dashboard',
    programs: 'programs',
    'lost-found': 'lost-found',
    members: 'members',
    profile: 'identity-profile',
    about: 'about',
};

export default function LostFound() {
    const handleNavigate = (page) => {
        const routeName = pageToRouteName[page];
        if (!routeName) return;
        router.visit(route(routeName));
    };

    return (
        <AlagaLayout currentPage="lost-found" onNavigate={handleNavigate}>
            <Head title="Lost & Found" />
            <LostFoundPage onNavigate={handleNavigate} />
        </AlagaLayout>
    );
}
