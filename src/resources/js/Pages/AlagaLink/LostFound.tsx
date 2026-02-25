
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';
import { LostReport } from '@/Providers/AlagaLink/types';

import LostFoundHeader from '@/Components/AlagaLink/lost-found/LostFoundHeader';
import LostFoundGrid from '@/Components/AlagaLink/lost-found/LostFoundGrid';
import CaseDetailModal from '@/Components/AlagaLink/lost-found/CaseDetailModal';
import ReportMissingWizard from '@/Components/AlagaLink/lost-found/ReportMissingWizard';

const LostFound: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { reports, globalSearchQuery, searchSignal, setSearchSignal, addReport, currentUser } = useAppContext();
  const [filter, setFilter] = useState<'All' | 'Missing' | 'Found'>('Missing');
  const [selectedReport, setSelectedReport] = useState<LostReport | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Updated to include SuperAdmin
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  // Handle Universal Search Signal for Lost & Found
  useEffect(() => {
    if (searchSignal && searchSignal.page === 'lost-found' && searchSignal.itemId) {
      const targetReport = reports.find(r => r.id === searchSignal.itemId);
      if (targetReport) {
        Promise.resolve().then(() => {
          if (targetReport.status === 'Missing' || targetReport.status === 'Found') {
            setFilter(targetReport.status);
          } else {
            setFilter('All');
          }
          setSelectedReport(targetReport);
        });
      }
    }
  }, [searchSignal, reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
                            r.lastSeen.toLowerCase().includes(globalSearchQuery.toLowerCase());
      const matchesFilter = filter === 'All' || r.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [reports, filter, globalSearchQuery]);

  const closeDetail = () => {
    setSelectedReport(null);
    setSearchSignal(null);
  };

  const handleReportSubmit = (reportData: LostReport) => {
    addReport(reportData);
    setIsWizardOpen(false);
    setFilter('Missing');
    // Scroll to top to see the new report
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      <LostFoundHeader 
        filter={filter} 
        onSetFilter={setFilter} 
        onOpenReportModal={() => setIsWizardOpen(true)}
        isAdmin={isAdmin}
      />
      
      <LostFoundGrid 
        reports={filteredReports} 
        onSelect={setSelectedReport} 
      />
      
      {/* Case Detail */}
      {selectedReport && (
        <CaseDetailModal 
          report={selectedReport} 
          onClose={closeDetail} 
        />
      )}

      {/* Multi-Step Report Missing Wizard - Only accessible if Admin/SuperAdmin is triggered */}
      {isWizardOpen && isAdmin && (
        <ReportMissingWizard 
          onClose={() => setIsWizardOpen(false)} 
          onNavigate={onNavigate}
          onSubmit={handleReportSubmit}
        />
      )}
    </div>
  );
};

export default LostFound;
