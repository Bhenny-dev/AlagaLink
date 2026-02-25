import { Head, router } from '@inertiajs/react';
import AlagaLayout from '@/Layouts/AlagaLink/AlagaLayout';
import ProfilePage from '@/Pages/AlagaLink/Profile';

const pageToRouteName = {
    home: 'dashboard',
    programs: 'programs',
    'lost-found': 'lost-found',
    members: 'members',
    profile: 'identity-profile',
    about: 'about',
};

export default function IdentityProfile() {
    const handleNavigate = (page) => {
        const routeName = pageToRouteName[page];
        if (!routeName) return;
        router.visit(route(routeName));
    };

    return (
        <AlagaLayout currentPage="profile" onNavigate={handleNavigate}>
            <Head title="Identity Profile" />
            <ProfilePage />
        </AlagaLayout>
    );
}
