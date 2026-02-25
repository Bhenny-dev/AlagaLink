
import React, { useState } from 'react';
import FallbackImage from '../shared/FallbackImage';
import { ProgramAvailment, UserProfile } from '@/Providers/AlagaLink/types';

interface PhilHealthPortalProps {
  isAdmin: boolean;
  requests: ProgramAvailment[];
  users: UserProfile[];
  onApply: (type: string, title: string) => void;
  onSelectRequest: (req: ProgramAvailment) => void;
}

const PhilHealthPortal: React.FC<PhilHealthPortalProps> = ({ isAdmin, requests, users, onApply, onSelectRequest }) => {
  const [phConsent, setPhConsent] = useState(false);
  const [phPMRFSubmitted, setPhPMRFSubmitted] = useState(false);
  const [adminTab, setAdminTab] = useState<'requests' | 'approved' | 'records'>('requests');

  if (isAdmin) {
    const pendingRequests = requests.filter(r => r.programType === 'PhilHealth' && r.status === 'Pending');
    const approvedRequests = requests.filter(r => r.programType === 'PhilHealth' && (r.status === 'Approved' || r.status === 'Completed'));

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex border-b border-gray-100 dark:border-white/5">
          <button 
            onClick={() => setAdminTab('requests')} 
            className={`px-8 py-4 font-black text-sm transition-all relative ${adminTab === 'requests' ? 'text-alaga-blue' : 'opacity-40 hover:opacity-100'}`}
          >
            Pending Enrollments ({pendingRequests.length})
            {adminTab === 'requests' && <div className="absolute bottom-0 left-0 w-full h-1 bg-alaga-blue rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setAdminTab('approved')} 
            className={`px-8 py-4 font-black text-sm transition-all relative ${adminTab === 'approved' ? 'text-alaga-blue' : 'opacity-40 hover:opacity-100'}`}
          >
            Approved Registry ({approvedRequests.length})
            {adminTab === 'approved' && <div className="absolute bottom-0 left-0 w-full h-1 bg-alaga-blue rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setAdminTab('records')} 
            className={`px-8 py-4 font-black text-sm transition-all relative ${adminTab === 'records' ? 'text-alaga-blue' : 'opacity-40 hover:opacity-100'}`}
          >
            Benefit Records
            {adminTab === 'records' && <div className="absolute bottom-0 left-0 w-full h-1 bg-alaga-blue rounded-t-full"></div>}
          </button>
        </div>
        
        {adminTab === 'requests' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            {pendingRequests.length > 0 ? pendingRequests.map(req => {
              const u = users.find(user => user.id === req.userId);
              return (
                <div key={req.id} onClick={() => onSelectRequest(req)} className="p-6 bg-white dark:bg-alaga-navy/20 rounded-[16px] border border-gray-100 dark:border-white/5 flex justify-between items-center cursor-pointer hover:border-alaga-blue transition-all group">
                  <div className="flex items-center gap-4">
                    <FallbackImage src={u?.photoUrl} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt={`${u?.firstName} ${u?.lastName}`} fallbackType="Generic" />
                    <div>
                      <p className="font-bold">{u?.firstName} {u?.lastName}</p>
                      <p className="text-[10px] opacity-40 uppercase tracking-widest font-black">{req.title} • {req.dateApplied}</p>
                    </div>
                  </div>
                  <i className="fa-solid fa-chevron-right opacity-0 group-hover:opacity-100 transition-all"></i>
                </div>
              );
            }) : (
              <div className="col-span-2 py-20 text-center opacity-30 italic font-medium">No pending enrollments to review.</div>
            )}
          </div>
        ) : adminTab === 'approved' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            {approvedRequests.length > 0 ? approvedRequests.map(req => {
              const u = users.find(user => user.id === req.userId);
              return (
                <div key={req.id} onClick={() => onSelectRequest(req)} className="p-6 bg-white dark:bg-alaga-navy/20 rounded-[16px] border border-alaga-teal/20 flex justify-between items-center cursor-pointer hover:border-alaga-teal transition-all group">
                  <div className="flex items-center gap-4">
                    <FallbackImage src={u?.photoUrl} className="w-12 h-12 rounded-xl object-cover shadow-sm grayscale-[0.5]" alt={`${u?.firstName} ${u?.lastName}`} fallbackType="Generic" />
                    <div>
                      <p className="font-bold">{u?.firstName} {u?.lastName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-alaga-teal text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Enrolled</span>
                        <p className="text-[9px] opacity-40 font-mono">{req.id}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black opacity-30 uppercase">Member Since</p>
                    <p className="text-xs font-bold">{req.dateApplied}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-2 py-20 text-center opacity-30 italic font-medium">No approved beneficiaries in this category.</div>
            )}
          </div>
        ) : (
          <div className="py-24 text-center space-y-4 bg-alaga-gray dark:bg-white/5 rounded-[24px] border-2 border-dashed border-gray-200 dark:border-white/5 animate-pulse">
            <i className="fa-solid fa-cloud-arrow-down text-4xl opacity-20"></i>
            <p className="text-sm font-bold opacity-40 italic">Syncing with PhilHealth Regional Database (Benguet Branch)...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10 py-6">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-alaga-teal/10 text-alaga-teal flex items-center justify-center rounded-3xl mx-auto">
          <i className="fa-solid fa-shield-halved text-4xl"></i>
        </div>
        <h4 className="text-3xl font-black">PhilHealth Benefits Enrollment</h4>
        <p className="opacity-70 text-lg leading-relaxed">Support for registering and claiming PhilHealth benefits for PWD/CWDs through the <span className="text-alaga-teal font-bold underline">Sponsored Program (LGU/DSWD support)</span>.</p>
      </div>

      <div className="bg-white dark:bg-alaga-navy/20 p-8 rounded-[20px] border border-gray-100 dark:border-white/5 space-y-8 shadow-xl">
        <div className="space-y-4">
          <h5 className="font-black text-sm uppercase tracking-widest opacity-40 border-b border-gray-100 pb-2">PWD/CWD Specific Section</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase opacity-50">Member Category</label>
              <div className="p-3 bg-alaga-gray dark:bg-white/5 rounded-xl font-bold text-sm">Sponsored: PWD Inclusion Flag</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase opacity-50">LGU Support Branch</label>
              <div className="p-3 bg-alaga-gray dark:bg-white/5 rounded-xl font-bold text-sm">PDAO La Trinidad</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h5 className="font-black text-sm uppercase tracking-widest opacity-40 border-b border-gray-100 pb-2">Declaration & Consent</h5>
          <div className="p-6 bg-alaga-teal/5 rounded-[16px] border border-alaga-teal/10 space-y-4">
            <p className="text-sm leading-relaxed">I understand that my status as a PWD or CWD qualifies me for prioritized health benefits under RA 11228.</p>
            <label className="flex items-start gap-4 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={phConsent} 
                onChange={e => setPhConsent(e.target.checked)}
                className="mt-1 w-5 h-5 accent-alaga-teal" 
              />
              <span className="text-sm font-medium group-hover:text-alaga-teal transition-colors">
                &quot;By signing here, I consent to PhilHealth processing my membership with PWD/CWD benefits.&quot;
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h5 className="font-black text-sm uppercase tracking-widest opacity-40">Documentation</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-alaga-gray dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
              <i className="fa-solid fa-file-pdf text-alaga-teal"></i>
              <span className="text-xs font-bold">PMRF Digital Backbone</span>
            </div>
            <label className="flex items-center gap-3 p-4 bg-white dark:bg-alaga-charcoal rounded-2xl border-2 border-dashed border-alaga-teal/30 cursor-pointer hover:bg-alaga-teal/5 transition-all">
              <i className="fa-solid fa-upload text-alaga-teal"></i>
              <span className="text-xs font-bold">{phPMRFSubmitted ? "Document Linked" : "Attach PWD ID"}</span>
              <input type="checkbox" className="hidden" checked={phPMRFSubmitted} onChange={e => setPhPMRFSubmitted(e.target.checked)} />
            </label>
          </div>
        </div>

        <a 
          href="https://www.philhealth.gov.ph/downloads/" 
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 px-6 rounded-3xl font-black text-lg bg-alaga-blue/10 text-alaga-blue border-2 border-alaga-blue hover:bg-alaga-blue hover:text-white transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
        >
          <i className="fa-solid fa-download"></i>
          Download PhilHealth Forms & Guidelines
        </a>

        <button 
          onClick={() => phConsent && onApply('PhilHealth', 'PWD Sponsored Enrollment')}
          disabled={!phConsent}
          className={`w-full py-5 rounded-3xl font-black text-lg transition-all ${phConsent ? 'bg-alaga-teal text-white shadow-xl hover:scale-[1.02]' : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-50'}`}
        >
          Submit Benefits Enrollment
        </button>
      </div>
    </div>
  );
};

export default PhilHealthPortal;
