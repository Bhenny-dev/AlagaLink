import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{js,jsx,ts,tsx}',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                'alaga-blue': '#2546F0',
                'alaga-gold': '#FFD43B',
                'alaga-teal': '#00BF7D',
                'alaga-navy': '#1A1A40',
                'alaga-charcoal': '#2E2E2E',
                'alaga-gray': '#F5F5F5',
            },
            backgroundImage: {
                grid: 'linear-gradient(to right, rgb(229 231 235 / 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgb(229 231 235 / 0.25) 1px, transparent 1px)',
                'grid-dark': 'linear-gradient(to right, rgb(55 65 81 / 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgb(55 65 81 / 0.25) 1px, transparent 1px)',
            },
        },
    },

    plugins: [forms],
};
