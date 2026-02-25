import { Head, router } from '@inertiajs/react';
import AlagaLayout from '@/Layouts/AlagaLink/AlagaLayout';
import MembersPage from '@/Pages/AlagaLink/Members';

const pageToRouteName = {
    home: 'dashboard',
    programs: 'programs',
    'lost-found': 'lost-found',
    members: 'members',
    profile: 'identity-profile',
    about: 'about',
};

export default function Members() {
    const handleNavigate = (page) => {
        const routeName = pageToRouteName[page];
        if (!routeName) return;
        router.visit(route(routeName));
    };

    return (
        <AlagaLayout currentPage="members" onNavigate={handleNavigate}>
            <Head title="Members" />
            <MembersPage />
        </AlagaLayout>
    );
}
