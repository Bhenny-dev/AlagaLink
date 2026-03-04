import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';

import LandingPageRestored from '@/Components/AlagaLink/home/LandingPageRestored';

export default function Welcome({ auth }) {
    const isLoggedIn = !!auth?.user;
    const role = auth?.user?.role || auth?.user?.alagalink_role;
    const isAdmin = role === 'Admin' || role === 'SuperAdmin';

    const section = new URLSearchParams(window.location.search).get('section');

    useEffect(() => {
        if (!isLoggedIn) return;
        router.visit(route('dashboard', {}, false));
    }, [isLoggedIn, isAdmin]);

    if (isLoggedIn) {
        return (
            <>
                <Head title="Redirecting" />
            </>
        );
    }

    return (
        <>
            <Head title="AlagaLink" />
            <LandingPageRestored initialSection={section} />
        </>
    );
}
