import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';

import LandingPageRestored from '@/Components/AlagaLink/home/LandingPageRestored';

export default function Welcome({ auth }) {
    const isLoggedIn = !!auth?.user;

    useEffect(() => {
        if (!isLoggedIn) return;
        router.visit(route('dashboard', {}, false));
    }, [isLoggedIn]);

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
            <LandingPageRestored />
        </>
    );
}
