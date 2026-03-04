import React from 'react';
import Navbar from '@/Components/AlagaLink/Navbar';
import FloatingAssistiveButton from '@/Components/AlagaLink/FloatingAssistiveButton';

export default function AlagaLayout({
    currentPage,
    onNavigate,
    children,
}: {
    currentPage: string;
    onNavigate: (page: string) => void;
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen pb-24">
            <Navbar onNavigate={onNavigate} currentPage={currentPage} />
            <main className="pt-24 animate-in fade-in duration-500">{children}</main>
            <FloatingAssistiveButton />
        </div>
    );
}
