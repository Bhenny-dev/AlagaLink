import React from 'react';
import Image from 'next/image';
import { ProgramAvailment, UserProfile, Narrative, DisabilityCategory } from '@/Providers/AlagaLink/types';

interface AdminEvaluationOverlayProps {
  req: ProgramAvailment;
  user?: UserProfile;
  fields?: React.ReactNode;
  onClose: () => void;
  onApprove: (id: string, status: ProgramAvailment['status'], narrative: Narrative) => void;
  onReject: (id: string, status: ProgramAvailment['status']) => void;
  onUpdate?: (id: string, patch: Partial<ProgramAvailment>) => void;
}

const AdminEvaluationOverlay: React.FC<AdminEvaluationOverlayProps> = ({ req, user, fields, onClose, onApprove, onReject, onUpdate }) => {
  const isDecisionStage = req.status === 'Pending';
  const isIdLifecycleStage = req.programType === 'ID' && (req.status === 'Approved' || req.status === 'Ready for Claiming');
  const isFinalized = req.programType === 'ID'
    ? (req.status === 'Rejected' || req.status === 'Claimed')
    : req.status !== 'Pending';

  // Basic logic to detect common mismatches for assistive devices
  const checkMismatch = () => {
    if (!user || req.programType !== 'Device') return null;

    const category = user.disabilityCategory;
    const title = req.title.toLowerCase();

    const isMobilityItem = title.includes('wheelchair') || title.includes('crutch') || title.includes('cane');
    const isHearingItem = title.includes('hearing');
    const isVisualItem = title.includes('braille') || title.includes('white cane');

    const hasMobilityDisability = category === DisabilityCategory.OrthopedicImpairment || category === DisabilityCategory.TraumaticBrainInjury;
    const hasHearingDisability = category === DisabilityCategory.HearingImpairment || category === DisabilityCategory.Deafness;
    const hasVisualDisability = category === DisabilityCategory.VisualImpairment || category === DisabilityCategory.DeafBlindness;

    if (isMobilityItem && !hasMobilityDisability) return "Mismatch: Mobility aid requested for non-orthopedic category.";
    if (isHearingItem && !hasHearingDisability) return "Mismatch: Hearing aid requested for non-hearing category.";
    if (isVisualItem && !hasVisualDisability) return "Mismatch: Visual aid requested for non-visual category.";

    return null;
  };

  const mismatchWarning = checkMismatch();

  return (
    <div className="h-full w-full bg-white dark:bg-alaga-charcoal overflow-hidden animate-in slide-in-from-bottom-6 duration-500">
      <div className="flex flex-col md:flex-row h-full">
        {/* User Sidebar: Full Profile Visualization */}
        <div className="md:w-1/3 bg-alaga-gray dark:bg-alaga-navy/20 p-10 border-r border-gray-100 dark:border-white/5 overflow-y-auto no-scrollbar">
          <div className="text-center mb-8">
            <Image src={user?.photoUrl || ''} width={160} height={160} className="rounded-[20px] mx-auto object-cover shadow-2xl border-4 border-white mb-6" alt="" />
            <h4 className="text-3xl font-black leading-tight">{user?.firstName} {user?.lastName}</h4>
            <p className="text-[10px] font-mono opacity-40 tracking-widest mt-1 uppercase">PWD Registry ID: {user?.id}</p>
          </div>

          <div className="space-y-6">
            {/* Validation Insights (New Section) */}
            {mismatchWarning && !isFinalized && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 animate-pulse">
                <i className="fa-solid fa-triangle-exclamation text-red-500 mt-1"></i>
                <div>
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Inconsistency Detected</p>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 leading-tight mt-1">{mismatchWarning}</p>
                </div>
              </div>
            )}

            <div className="p-6 bg-white dark:bg-alaga-charcoal rounded-[20px] shadow-sm border border-gray-100 dark:border-white/5">
              <p className="text-[10px] font-black opacity-40 uppercase mb-3 tracking-widest flex items-center gap-2">
                <i className="fa-solid fa-file-circle-info text-alaga-blue"></i> Applicant Remarks
              </p>
              <p className="text-sm italic leading-relaxed opacity-70">{req.details || 'No additional details provided by the applicant.'}</p>
              {req.philhealthConsent && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                  <span className="bg-alaga-teal/10 text-alaga-teal px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                    <i className="fa-solid fa-signature mr-2"></i> Consent Form Linked
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-white dark:bg-alaga-charcoal rounded-2xl border border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Medical Classification</p>
                <p className="font-bold text-alaga-blue text-sm">{user?.disabilityCategory}</p>
              </div>
              <div className="p-4 bg-white dark:bg-alaga-charcoal rounded-2xl border border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Primary Contact</p>
                <p className="font-bold text-sm">{user?.contactNumber}</p>
              </div>
              <div className="p-4 bg-white dark:bg-alaga-charcoal rounded-2xl border border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Address</p>
                <p className="font-bold text-sm leading-tight">{user?.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel: Evaluation Desk */}
        <div className="flex-1 flex flex-col p-10 bg-white dark:bg-alaga-charcoal overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-4xl font-black">Evaluation Desk</h3>
              <p className="opacity-60 font-medium">Processing Request: <span className="text-alaga-blue font-black underline">{req.title}</span></p>
            </div>
            {!isDecisionStage && (
              <div className={`flex items-center gap-3 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-xl ${
                req.status === 'Approved' || req.status === 'Completed' || req.status === 'Claimed'
                  ? 'bg-alaga-teal text-white'
                  : req.status === 'Rejected'
                    ? 'bg-red-500 text-white'
                    : req.status === 'Ready for Claiming'
                      ? 'bg-purple-500 text-white'
                        : 'bg-alaga-blue text-white'
              }`}>
                <i className={`fa-solid ${
                  req.status === 'Approved' || req.status === 'Completed' || req.status === 'Claimed'
                    ? 'fa-circle-check'
                    : req.status === 'Rejected'
                      ? 'fa-circle-xmark'
                      : req.status === 'Ready for Claiming'
                        ? 'fa-box'
                          : 'fa-clock'
                }`}></i>
                Status: {req.status}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-8">
            <div className="bg-alaga-gray dark:bg-alaga-navy/20 p-8 rounded-[20px] border border-gray-100 dark:border-white/5 space-y-8">
              <div className="flex items-center gap-3 text-alaga-blue">
                <i className="fa-solid fa-clipboard-check text-xl"></i>
                <h5 className="font-black uppercase text-sm tracking-widest">Decision Narrative</h5>
              </div>

              <div className="space-y-6">
                {fields}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase opacity-50 tracking-widest">Justification / Findings</label>
                  <textarea
                    rows={8}
                    id="eval-narrative"
                    readOnly={!isDecisionStage}
                    className={`w-full p-6 rounded-[16px] bg-white dark:bg-alaga-charcoal border-2 border-gray-100 dark:border-white/5 outline-none focus:border-alaga-blue transition-all text-sm leading-relaxed ${isFinalized ? 'opacity-50 italic cursor-not-allowed' : ''}`}
                    placeholder={!isDecisionStage ? "" : "Document the assessment findings and reasons for the final decision..."}
                    defaultValue={req.adminNarrative?.why || ""}
                  ></textarea>
                </div>
              </div>
            </div>

            {isDecisionStage ? (
              <div className="flex flex-col sm:flex-row gap-6 pt-4">
                <button
                  onClick={() => {
                    const why = (document.getElementById('eval-narrative') as HTMLTextAreaElement).value;
                    const nav: Narrative = {
                      what: req.title,
                      when: new Date().toISOString(),
                      how: 'Admin Evaluation Desk',
                      why: why || 'Request approved after manual review of credentials.'
                    };
                    onApprove(req.id, 'Approved', nav);
                  }}
                  className="flex-1 bg-alaga-teal text-white py-6 rounded-[20px] font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <i className="fa-solid fa-check-double"></i>
                  Approve & Registry Update
                </button>
                <button
                  onClick={() => {
                    onReject(req.id, 'Rejected');
                  }}
                  className="flex-1 bg-white dark:bg-alaga-charcoal text-red-500 border-2 border-red-500 py-6 rounded-[20px] font-black text-lg shadow-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3"
                >
                  <i className="fa-solid fa-ban"></i>
                  Reject Request
                </button>
              </div>
            ) : isIdLifecycleStage ? (
              <div className="space-y-6 pt-4">
                <div className="p-6 bg-alaga-gray dark:bg-alaga-navy/20 rounded-[20px] border border-gray-100 dark:border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">PWD ID Release Workflow</p>
                  <p className="text-sm font-medium opacity-70">Advance the physical card lifecycle after approval.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                  {req.status === 'Approved' && (
                    <button
                      onClick={() => {
                        if (!onUpdate) return;
                        onUpdate(req.id, {
                          status: 'Ready for Claiming',
                          readyForClaimingAt: new Date().toISOString(),
                          issuanceLocation: req.issuanceLocation || 'PDAO Office, Km. 5',
                        });
                      }}
                      className="flex-1 bg-purple-500 text-white py-6 rounded-[20px] font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <i className="fa-solid fa-box"></i>
                      Mark Ready for Claiming
                    </button>
                  )}

                  {req.status === 'Ready for Claiming' && (
                    <button
                      onClick={() => {
                        if (!onUpdate) return;
                        onUpdate(req.id, {
                          status: 'Claimed',
                          claimedAt: new Date().toISOString(),
                          claimedLocation: req.issuanceLocation || 'PDAO Office, Km. 5',
                        });
                      }}
                      className="flex-1 bg-alaga-teal text-white py-6 rounded-[20px] font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <i className="fa-solid fa-id-card"></i>
                      Mark as Claimed
                    </button>
                  )}

                  <button onClick={onClose} className="flex-1 bg-white dark:bg-alaga-charcoal text-alaga-blue border-2 border-alaga-blue py-6 rounded-[20px] font-black text-lg shadow-xl hover:bg-alaga-blue hover:text-white transition-all flex items-center justify-center gap-3">
                    <i className="fa-solid fa-arrow-left"></i>
                    Return
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-10 bg-alaga-blue/5 border-2 border-dashed border-alaga-blue/10 rounded-[20px] text-center space-y-6">
                 <div className="w-16 h-16 bg-alaga-blue/10 text-alaga-blue rounded-full flex items-center justify-center mx-auto text-2xl">
                    <i className="fa-solid fa-lock"></i>
                 </div>
                 <div>
                    <h5 className="font-black text-xl mb-1">Record Entry Locked</h5>
                    <p className="opacity-40 font-bold uppercase text-[10px] tracking-widest">Finalized on {req.adminNarrative?.when ? new Date(req.adminNarrative.when).toLocaleDateString() : 'N/A'}</p>
                 </div>
                 <button onClick={onClose} className="bg-alaga-blue text-white px-8 py-3 rounded-xl text-xs font-black shadow-lg">
                   Return to Portal
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminEvaluationOverlay;
