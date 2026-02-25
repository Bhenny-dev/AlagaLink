
import React, { useState } from 'react';
import Image from 'next/image';
import { UserProfile } from '@/Providers/AlagaLink/types';

interface DigitalIdCardProps { user: UserProfile; }

const DigitalIdCard: React.FC<DigitalIdCardProps> = ({ user }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!user.idMetadata) return null;

  const { idNumber, issuedDate, expiryDate, qrCodeValue, issuingOfficer } = user.idMetadata;

  const addressParts = user.address.split(',');
  const barangayOnly = addressParts[0].trim();
  const cityOnly = addressParts[1]?.trim() || 'La Trinidad';

  return (
    <div className="w-full max-w-[540px] mx-auto perspective-1000 select-none">
      {/* 
          PVC ID (CR80) Standard Specs:
          Physical Size: 85.60 mm x 53.98 mm
          Digital Aspect Ratio: 1.5858
          Corner Radius: 12px (approx 3.18mm)
      */}
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className={`relative aspect-[1.5858/1] w-full transition-transform duration-1000 cursor-pointer preserve-3d rounded-[12px] shadow-[0_35px_70px_-15px_rgba(37,70,240,0.4)] ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        
        {/* ============================================================
            FRONT SIDE - RICH BLUE PROFESSIONAL THEME
            ============================================================ */}
        <div className="absolute inset-0 backface-hidden rounded-[12px] overflow-hidden bg-alaga-blue border border-white/10 flex flex-col p-[2.5mm] z-10 shadow-inner">
          {/* Minimalist Security Textures */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/circuit-board.png')` }}></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30 pointer-events-none"></div>
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col h-full text-white">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 flex items-center justify-center bg-white rounded-lg p-1 shadow-md">
                  <Image src="https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=200&h=200&fit=crop" alt="Municipal Seal" width={36} height={36} className="h-full object-contain" />
                </div>
                <div className="leading-none">
                  <p className="text-[5.5px] font-black uppercase tracking-[0.15em] opacity-60">Republic of the Philippines</p>
                  <p className="text-[8.5pt] font-black uppercase tracking-tight">Municipality of La Trinidad</p>
                  <p className="text-[6.5pt] font-bold uppercase tracking-[0.2em] text-alaga-gold">Province of Benguet</p>
                </div>
              </div>
              <div className="text-right">
                 <p className="text-[7.5pt] font-black italic tracking-tighter leading-none text-alaga-gold">PWD IDENTIFICATION CARD</p>
                 <p className="text-[5.5px] font-black uppercase opacity-40 mt-0.5">Registry Backbone ID</p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-12 gap-3 mt-1 items-center">
              
              {/* Photo Area */}
              <div className="col-span-3 flex flex-col justify-center items-center">
                <div className="aspect-[25/30] w-full bg-alaga-navy/40 border-[1pt] border-white/20 rounded shadow-2xl overflow-hidden relative">
                  <Image src={user.photoUrl} alt={user.firstName} fill className="object-cover" />
                  <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]"></div>
                </div>
                <div className="mt-1 flex gap-1 opacity-40">
                   <div className="w-1 h-1 bg-white rounded-full"></div>
                   <div className="w-1 h-1 bg-white rounded-full"></div>
                   <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
              </div>

              {/* Identity Details */}
              <div className="col-span-6 flex flex-col gap-1 border-l border-white/10 pl-3">
                <div>
                  <p className="text-[6.5pt] font-black opacity-50 uppercase leading-none">PWD-ID No:</p>
                  <p className="text-[10.5pt] font-black text-white tracking-tighter leading-none">{idNumber}</p>
                </div>

                <div className="my-0.5">
                  <p className="text-[11.5pt] font-black uppercase leading-tight tracking-tight text-white drop-shadow-sm">
                    {user.lastName.toUpperCase()}, {user.firstName}
                  </p>
                  <p className="text-[7pt] font-black opacity-60 uppercase tracking-widest">{user.middleName || ''}</p>
                </div>

                <div className="space-y-1">
                   <p className="text-[8.5pt] font-black text-alaga-gold uppercase leading-none">{user.disabilityCategory}</p>
                   <div className="flex gap-4 border-t border-white/5 pt-1 mt-1">
                      <div>
                        <p className="text-[5.5pt] font-black opacity-50 uppercase">Date of Birth</p>
                        <p className="text-[8pt] font-bold leading-none">{new Date(user.birthDate).toLocaleDateString('en-US')}</p>
                      </div>
                      <div>
                        <p className="text-[5.5pt] font-black opacity-50 uppercase">Sex</p>
                        <p className="text-[8pt] font-bold leading-none">{user.sex.toUpperCase()}</p>
                      </div>
                   </div>
                   <div className="pt-0.5">
                      <p className="text-[5.5pt] font-black opacity-50 uppercase">Address</p>
                      <p className="text-[7.5pt] font-bold leading-none truncate">{barangayOnly}, {cityOnly}</p>
                   </div>
                </div>
              </div>

              {/* Icons & Accents */}
              <div className="col-span-3 flex flex-col items-end justify-between h-full py-1">
                <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-alaga-gold shadow-lg border border-white/10">
                  <i className="fa-solid fa-wheelchair text-xl"></i>
                </div>
                <div className="text-right space-y-1 mt-auto">
                   <div>
                      <p className="text-[5.5pt] font-black opacity-50 uppercase leading-none">Blood Type</p>
                      <p className="text-[8pt] font-black text-red-400 leading-none">{user.bloodType}</p>
                   </div>
                   <div className="pt-1 border-t border-white/10">
                      <p className="text-[5.5pt] font-black opacity-50 uppercase leading-none">Valid Until</p>
                      <p className="text-[8.5pt] font-black text-white leading-none">{expiryDate}</p>
                   </div>
                </div>
              </div>
            </div>

            {/* Signatures Strip */}
            <div className="mt-2 pt-1 border-t border-white/10 flex items-end justify-between">
              <div className="w-[38%] text-center">
                <div className="border-b border-white/30 w-full h-3 mb-0.5"></div>
                <p className="text-[5.5pt] font-black uppercase opacity-40">Signature of Holder</p>
              </div>
              <div className="w-[48%] text-center">
                <p className="text-[7.5pt] font-serif italic text-alaga-gold leading-none h-4 drop-shadow-sm">{issuingOfficer}</p>
                <div className="border-b border-alaga-gold/20 w-full mt-0.5 mb-0.5"></div>
                <p className="text-[5.5pt] font-black uppercase opacity-40">Authorized Signatory (PDAO)</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            BACK SIDE - CLEAN MINIMALIST SECURITY
            ============================================================ */}
        <div className="absolute inset-0 backface-hidden rounded-[12px] overflow-hidden bg-white border border-gray-200 rotate-y-180 flex flex-col p-[4mm] shadow-inner z-0">
           <div className="absolute inset-0 bg-alaga-blue/5 pointer-events-none" style={{ backgroundImage: `radial-gradient(#2546F0 0.2px, transparent 0.2px)`, backgroundSize: '6px 6px' }}></div>
           
           <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-center text-[9pt] font-black text-alaga-blue uppercase tracking-[0.1em] border-b border-gray-100 pb-2 mb-4">
                Official PWD System Credentials
              </h3>

              <div className="flex-1 grid grid-cols-12 gap-6 items-center">
                 {/* QR Code Section */}
                 <div className="col-span-5 flex flex-col items-center gap-2">
                    <div className="p-1.5 bg-white border border-alaga-blue/20 rounded-[14px] shadow-xl">
                       <Image
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrCodeValue}&bgcolor=ffffff&color=2546F0`}
                          width={150}
                          height={150}
                          alt="Verification QR"
                          className="object-contain"
                       />
                    </div>
                    <p className="text-[6pt] font-black text-alaga-blue text-center uppercase tracking-tighter leading-tight opacity-60">
                      Scan to Verify<br/>Authenticity
                    </p>
                 </div>

                 {/* Information Summary */}
                 <div className="col-span-7 space-y-3">
                    <div className="grid grid-cols-1 gap-1.5">
                       <div className="space-y-0">
                          <p className="text-[5.5pt] font-black text-gray-400 uppercase leading-none">Full Legal Name</p>
                          <p className="text-[8.5pt] font-black text-gray-900 leading-none">{user.firstName} {user.lastName}</p>
                       </div>
                       <div className="space-y-0">
                          <p className="text-[5.5pt] font-black text-gray-400 uppercase leading-none">System Control No.</p>
                          <p className="text-[8.5pt] font-black text-alaga-blue font-mono leading-none">{idNumber}</p>
                       </div>
                       <div className="space-y-0">
                          <p className="text-[5.5pt] font-black text-gray-400 uppercase leading-none">Issuing Authority</p>
                          <p className="text-[7.5pt] font-bold text-gray-700 leading-none">Municipality of La Trinidad</p>
                       </div>
                    </div>

                    <div className="p-2.5 bg-alaga-blue/5 rounded-xl border border-alaga-blue/10">
                       <p className="text-[6pt] font-black text-alaga-blue uppercase mb-0.5 tracking-tighter">Emergency Contact</p>
                       <p className="text-[7.5pt] font-black text-gray-900 leading-none truncate">{user.emergencyContact.name}</p>
                       <p className="text-[8.5pt] font-black text-alaga-blue mt-1">{user.emergencyContact.contact}</p>
                    </div>
                 </div>
              </div>

              {/* Legal & Privacy Footer */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-start gap-4">
                 <div className="flex-1">
                    <p className="text-[6.5pt] font-medium text-gray-400 leading-tight text-justify">
                      This card is non-transferable and valid only when presented by the cardholder. Misuse is punishable by law under <b>RA 7277</b> and <b>RA 9442</b>. Data protected under <b>RA 10173</b>.
                    </p>
                 </div>
                 <div className="text-right shrink-0 opacity-30">
                    <i className="fa-solid fa-shield-check text-2xl text-alaga-blue"></i>
                 </div>
              </div>
              
              <div className="mt-2 pt-1 border-t border-gray-50 flex justify-between items-center opacity-20">
                 <p className="text-[5pt] font-black uppercase tracking-[0.3em]">End of Document Block</p>
                 <p className="text-[5pt] font-black uppercase tracking-widest italic">Issued: {issuedDate}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Control Actions & Interaction Tooltip */}
      <div className="mt-10 flex flex-col items-center gap-5">
         <div className="flex flex-wrap items-center justify-center gap-4">
            <button 
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex items-center gap-3 px-8 py-4 bg-alaga-blue text-white rounded-3xl shadow-2xl hover:bg-alaga-navy active:scale-95 transition-all text-xs font-black uppercase tracking-widest group"
            >
               <i className={`fa-solid ${isFlipped ? 'fa-id-card' : 'fa-qrcode'} group-hover:rotate-12 transition-transform`}></i>
               {isFlipped ? 'Front Profile' : 'Back (Security)'}
            </button>
            <button className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 transition-all text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 shadow-lg">
               <i className="fa-solid fa-file-pdf text-red-500"></i>
               Print PDF
            </button>
         </div>
         
         <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 animate-pulse flex items-center gap-3">
           <i className="fa-solid fa-hand-pointer"></i>
           Tap card to flip 180°
         </p>
      </div>
    </div>
  );
};

export default DigitalIdCard;
