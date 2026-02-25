import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { AppProvider } from '@/Providers/AlagaLink/AppContext';
import { useEffect, useState } from 'react';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        const InertiaRoot = () => {
            const [pageProps, setPageProps] = useState(
                props?.initialPage?.props ?? {},
            );

            useEffect(() => {
                const handler = (event) => {
                    const nextProps = event?.detail?.page?.props;
                    if (nextProps) setPageProps(nextProps);
                };

                document.addEventListener('inertia:success', handler);
                return () => document.removeEventListener('inertia:success', handler);
            }, []);

            const laravelUser = pageProps?.auth?.user ?? null;
            const alagalinkSeed = pageProps?.alagalink ?? null;

            return (
                <AppProvider initialLaravelUser={laravelUser} initialSeed={alagalinkSeed}>
                    <App {...props} />
                </AppProvider>
            );
        };

        root.render(<InertiaRoot />);
    },
    progress: {
        color: '#4B5563',
    },
});
