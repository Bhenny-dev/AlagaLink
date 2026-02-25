
import React, { useState, useEffect } from 'react';
import { UserProfile, DisabilityCategory, FamilyMember, ProfessionalQualifications } from '@/Providers/AlagaLink/types';
import { DISABILITY_CATEGORIES } from '@/Providers/AlagaLink/constants';
import ImageInput from '../shared/ImageInput';
import { MUNICIPAL_ASSETS } from '@/Providers/AlagaLink/assets';

interface RegistrationWorkflowProps {
  onSubmit: (data: Partial<UserProfile>, family: FamilyMember[]) => boolean | Promise<boolean | { success: boolean; message?: string } | void>;
  onCancel?: () => void;
  initialData?: Partial<UserProfile>;
  isEditMode?: boolean;
}

const RegistrationWorkflow: React.FC<RegistrationWorkflowProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditMode = false
}) => {
  const [step, setStep] = useState<'Choice' | 'Form'>(
    (isEditMode || (initialData && initialData.registrantType)) ? 'Form' : 'Choice'
  );

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    firstName: '',
    middleName: '',
    lastName: '',
    address: '',
    birthDate: '',
    provincialAddress: '',
    civilStatus: 'Single',
    occupation: '',
    sex: 'Male',
    bloodType: 'O+',
    age: 0,
    contactNumber: '',
    email: '',
    password: 'password',
    disabilityCategory: DisabilityCategory.Autism,
    registrantType: 'Self',
    photoUrl: MUNICIPAL_ASSETS.USER_MALE,
    accountConnection: { platform: 'None', connectedAt: '' },
    customData: {
      causeOfDisability: 'Congenital'
    },
    ...initialData
  });

  const [qualifications, setQualifications] = useState<ProfessionalQualifications>(
    initialData?.professionalQualifications || {
      citizenship: 'Filipino',
      residency: 'La Trinidad',
      education: '',
      eligibility: '',
      trainingHours: 0,
      experienceYears: 0,
      licenseNumber: '',
      isSocialWorker: false
    }
  );

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(initialData?.familyComposition || []);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [emergencyContact, setEmergencyContact] = useState(
    initialData?.emergencyContact || { name: '', relation: '', contact: '' }
  );

  const [submissionStatus, setSubmissionStatus] = useState<'idle'|'submitting'|'success'|'error'>('idle');
  const [submissionMessage, setSubmissionMessage] = useState<string>('');

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age >= 0 ? age : 0;
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bDate = e.target.value;
    const computedAge = calculateAge(bDate);
    setFormData({ ...formData, birthDate: bDate, age: computedAge });
  };

  useEffect(() => {
    if (initialData) {
      // Defer state updates to avoid synchronous setState in effects
      Promise.resolve().then(() => {
        setFormData(prev => ({ ...prev, ...initialData }));
        if (initialData.professionalQualifications) {
          setQualifications(initialData.professionalQualifications);
        }
        setFamilyMembers(initialData.familyComposition || []);
        setEmergencyContact(initialData.emergencyContact || { name: '', relation: '', contact: '' });
        if (initialData.registrantType) setStep('Form');
      });
    }
  }, [initialData]);

  const handleSelectRole = (type: 'User' | 'Staff') => {
    if (type === 'Staff') {
      setFormData({
        ...formData,
        registrantType: 'PDAO Staff',
        role: 'Admin',
        disabilityCategory: DisabilityCategory.None,
        photoUrl: MUNICIPAL_ASSETS.USER_MALE
      });
    } else {
      setFormData({
        ...formData,
        registrantType: 'Self',
        role: 'User',
        disabilityCategory: DisabilityCategory.Autism,
        photoUrl: MUNICIPAL_ASSETS.USER_MALE
      });
    }
    setStep('Form');
  };

  const familyCounterRef = React.useRef(0);
  const handleAddFamily = () => {
    const id = `fam-${++familyCounterRef.current}`;
    setFamilyMembers(prev => [...prev, { id, fullName: '', relation: '', age: 0, sex: 'Male' }]);
  };

  const updateFamilyMember = (id: string, field: keyof FamilyMember, value: string | number | boolean) => {
    setFamilyMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const removeFamilyMember = (id: string) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
  };

  const filteredCategories = DISABILITY_CATEGORIES.filter(c =>
    c.toLowerCase().includes(pickerSearch.toLowerCase()) && c !== DisabilityCategory.None
  );

  const isStaff = formData.registrantType === 'PDAO Staff';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionStatus('submitting');
    setSubmissionMessage('');

    const finalData = {
      ...formData,
      emergencyContact,
      familyComposition: familyMembers,
      professionalQualifications: isStaff ? qualifications : undefined
    };

    try {
      const result = await onSubmit(finalData, familyMembers);
      let success = false;
      let message = '';

      if (result === undefined) {
        success = true;
      } else if (typeof result === 'boolean') {
        success = result;
      } else if (typeof result === 'object') {
        success = Boolean((result as { success?: boolean }).success ?? false);
        message = (result as { message?: string }).message || '';
      }

      if (success) {
        setSubmissionStatus('success');
        setSubmissionMessage(message || 'Registration successful.');
        // Close after short delay so user can see feedback
        setTimeout(() => {
          setSubmissionStatus('idle');
          setSubmissionMessage('');
          if (onCancel) onCancel();
        }, 1800);
      } else {
        setSubmissionStatus('error');
        setSubmissionMessage(message || 'Registration failed. Please try again.');
      }
    } catch (err: unknown) {
      const message = (err as Error)?.message || 'Registration failed. Please try again.';
      setSubmissionStatus('error');
      setSubmissionMessage(message);
    }
  };

  if (step === 'Choice') {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black">Registration Portal</h2>
          <p className="opacity-60 font-medium text-lg">Please select the type of registry record you wish to create.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div onClick={() => handleSelectRole('User')} className="bg-white dark:bg-alaga-charcoal p-10 rounded-[32px] border-4 border-transparent hover:border-alaga-teal cursor-pointer transition-all hover:shadow-2xl group relative overflow-hidden">
            <div className="w-20 h-20 bg-alaga-teal/10 text-alaga-teal rounded-[24px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform"><i className="fa-solid fa-person-rays text-4xl"></i></div>
            <h3 className="text-2xl font-black mb-2">PWD/CWD Member</h3>
            <p className="text-sm opacity-60 leading-relaxed font-medium">Register a person with disability or a child with special needs.</p>
            <div className="mt-8 flex items-center text-alaga-teal font-black text-xs uppercase tracking-widest gap-2">Start Member Form <i className="fa-solid fa-arrow-right"></i></div>
            <i className="fa-solid fa-person-rays absolute -right-4 -bottom-4 text-9xl opacity-5 -rotate-12"></i>
          </div>
          <div onClick={() => handleSelectRole('Staff')} className="bg-white dark:bg-alaga-charcoal p-10 rounded-[32px] border-4 border-transparent hover:border-alaga-blue cursor-pointer transition-all hover:shadow-2xl group relative overflow-hidden">
            <div className="w-20 h-20 bg-alaga-blue/10 text-alaga-blue rounded-[24px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform"><i className="fa-solid fa-shield-halved text-4xl"></i></div>
            <h3 className="text-2xl font-black mb-2">PDAO/MSWDO Staff</h3>
            <p className="text-sm opacity-60 leading-relaxed font-medium">Register an administrative officer or municipal technician.</p>
            <div className="mt-8 flex items-center text-alaga-blue font-black text-xs uppercase tracking-widest gap-2">Start Staff Form <i className="fa-solid fa-arrow-right"></i></div>
            <i className="fa-solid fa-shield-halved absolute -right-4 -bottom-4 text-9xl opacity-5 -rotate-12"></i>
          </div>
        </div>
        <div className="flex justify-center pt-8"><button onClick={onCancel} className="text-xs font-black uppercase tracking-widest opacity-40 hover:opacity-100 underline decoration-2 underline-offset-4">Cancel and Return</button></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${isStaff ? 'bg-alaga-blue' : 'bg-alaga-teal'}`}><i className={`fa-solid ${isStaff ? 'fa-shield-halved' : 'fa-person-rays'}`}></i></div>
          <div>
            <h2 className="text-3xl font-black">{isEditMode ? 'Update Credentials' : `New ${isStaff ? 'Staff' : 'Member'} Registration`}</h2>
            <p className="opacity-60 font-medium">{isEditMode ? `Modifying profile for ${formData.firstName} ${formData.lastName}.` : `Complete the ${isStaff ? 'official staff qualification' : 'community registry'} profile below.`}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="bg-white dark:bg-alaga-charcoal rounded-[20px] p-10 shadow-sm border border-gray-100 dark:border-white/5 space-y-10">
          <div className="flex items-center gap-4 text-alaga-teal">
            <i className="fa-solid fa-user-circle text-2xl"></i>
            <h3 className="text-xl font-black">1. Primary Information</h3>
          </div>

          <ImageInput
            value={formData.photoUrl || ''}
            onChange={val => setFormData({...formData, photoUrl: val})}
            label="Identification Photo"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                 { label: 'First Name', field: 'firstName', required: true },
                 { label: 'Middle Name', field: 'middleName', required: false },
                 { label: 'Last Name', field: 'lastName', required: true }
               ].map(item => (
                 <div key={item.field} className="space-y-2">
                   <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">{item.label}</label>
                   <input required={item.required} value={formData[item.field as keyof UserProfile] as string || ''} onChange={e => setFormData({...formData, [item.field]: e.target.value})} className={`w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/30 border-none outline-none focus:ring-2 font-bold ${isStaff ? 'ring-alaga-blue/30' : 'ring-alaga-teal/30'}`} />
                 </div>
               ))}
            </div>
            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Permanent Address</label>
              <input required value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className={`w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/30 border-none outline-none focus:ring-2 font-bold ${isStaff ? 'ring-alaga-blue/30' : 'ring-alaga-teal/30'}`} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Birth Date</label>
              <input type="date" required value={formData.birthDate || ''} onChange={handleBirthDateChange} className={`w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/30 border-none outline-none focus:ring-2 font-bold ${isStaff ? 'ring-alaga-blue/30' : 'ring-alaga-teal/30'}`} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Age (Auto-computed)</label>
              <input type="number" readOnly value={formData.age || 0} className="w-full p-4 rounded-2xl bg-gray-200 dark:bg-alaga-navy/50 border-none outline-none font-black text-alaga-blue cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Sex</label>
              <select value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value as 'Male' | 'Female' | 'Other'})} className={`w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/30 border-none outline-none focus:ring-2 font-bold appearance-none ${isStaff ? 'ring-alaga-blue/30' : 'ring-alaga-teal/30'}`}><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Blood Type</label>
              <select value={formData.bloodType} onChange={e => setFormData({...formData, bloodType: e.target.value})} className={`w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/30 border-none outline-none focus:ring-2 font-bold appearance-none ${isStaff ? 'ring-alaga-blue/30' : 'ring-alaga-teal/30'}`}><option value="O+">O+</option><option value="O-">O-</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option></select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Occupation</label>
              <input value={formData.occupation || ''} onChange={e => setFormData({...formData, occupation: e.target.value})} placeholder="e.g. Student, Farmer" className={`w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/30 border-none outline-none focus:ring-2 font-bold ${isStaff ? 'ring-alaga-blue/30' : 'ring-alaga-teal/30'}`} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Civil Status</label>
              <select value={formData.civilStatus} onChange={e => setFormData({...formData, civilStatus: e.target.value})} className={`w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/30 border-none outline-none focus:ring-2 font-bold appearance-none ${isStaff ? 'ring-alaga-blue/30' : 'ring-alaga-teal/30'}`}><option value="Single">Single</option><option value="Married">Married</option><option value="Widowed">Widowed</option><option value="Separated">Separated</option></select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Contact Number</label>
              <input required value={formData.contactNumber || ''} onChange={e => setFormData({...formData, contactNumber: e.target.value})} className={`w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/30 border-none outline-none focus:ring-2 font-bold ${isStaff ? 'ring-alaga-blue/30' : 'ring-alaga-teal/30'}`} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Email Address</label>
              <input required type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/30 border-none outline-none focus:ring-2 font-bold ${isStaff ? 'ring-alaga-blue/30' : 'ring-alaga-teal/30'}`} />
            </div>
            <div className="md:col-span-1 space-y-2">
              <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Password</label>
              <input required type="password" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Enter secure password" className={`w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/30 border-none outline-none focus:ring-2 font-bold ${isStaff ? 'ring-alaga-blue/30' : 'ring-alaga-teal/30'}`} />
            </div>
          </div>
        </div>

        {isStaff && (
          <div className="bg-white dark:bg-alaga-charcoal rounded-[20px] p-10 shadow-sm border border-alaga-blue/20 space-y-8 animate-in zoom-in-95">
            <div className="flex items-center gap-4 text-alaga-blue"><i className="fa-solid fa-briefcase text-2xl"></i><h3 className="text-xl font-black">2. Professional Qualifications (PDAO / MSWDO)</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Highest Educational Attainment</label><input required value={qualifications.education} onChange={e => setQualifications({...qualifications, education: e.target.value})} className="w-full p-4 rounded-2xl bg-alaga-blue/5 border-none outline-none focus:ring-2 ring-alaga-blue/30 font-bold" placeholder="e.g. BS Social Work, Public Admin" /></div>
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Civil Service / PRC Eligibility</label><input required value={qualifications.eligibility} onChange={e => setQualifications({...qualifications, eligibility: e.target.value})} className="w-full p-4 rounded-2xl bg-alaga-blue/5 border-none outline-none focus:ring-2 ring-alaga-blue/30 font-bold" placeholder="e.g. Career Service Prof, Licensed Social Worker" /></div>
                 <div className="flex items-center gap-4 p-4 bg-alaga-gray dark:bg-white/5 rounded-2xl"><input type="checkbox" checked={qualifications.isSocialWorker} onChange={e => setQualifications({...qualifications, isSocialWorker: e.target.checked})} className="w-5 h-5 accent-alaga-blue" /><label className="text-sm font-bold opacity-70">Applicant is a Licensed Social Worker</label></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Relevant Training (Hrs)</label><input type="number" required value={qualifications.trainingHours} onChange={e => setQualifications({...qualifications, trainingHours: parseInt(e.target.value)})} className="w-full p-4 rounded-2xl bg-alaga-blue/5 border-none outline-none focus:ring-2 ring-alaga-blue/30 font-bold" /></div>
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Exp. in Social Welfare (Yrs)</label><input type="number" required value={qualifications.experienceYears} onChange={e => setQualifications({...qualifications, experienceYears: parseInt(e.target.value)})} className="w-full p-4 rounded-2xl bg-alaga-blue/5 border-none outline-none focus:ring-2 ring-alaga-blue/30 font-bold" /></div>
                 <div className="col-span-2 space-y-2"><label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Professional License No. (If applicable)</label><input value={qualifications.licenseNumber} onChange={e => setQualifications({...qualifications, licenseNumber: e.target.value})} className="w-full p-4 rounded-2xl bg-alaga-blue/5 border-none outline-none focus:ring-2 ring-alaga-blue/30 font-bold" placeholder="PRC-XXX-XXXXXXX" /></div>
              </div>
            </div>
          </div>
        )}

        {!isStaff && (
          <div className="bg-white dark:bg-alaga-charcoal rounded-[20px] p-10 shadow-sm border border-gray-100 dark:border-white/5 space-y-8">
            <div className="flex items-center gap-4 text-purple-500"><i className="fa-solid fa-handicap text-2xl"></i><h3 className="text-xl font-black">2. Disability Profile (IDEA Categories)</h3></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="relative">
                  <label className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-2 block">Primary Classification</label>
                  <button type="button" onClick={() => setShowPicker(!showPicker)} className="w-full p-6 rounded-[12px] bg-purple-500/5 border border-purple-500/20 text-left flex justify-between items-center group hover:bg-purple-500/10 transition-all">
                    <div><span className="text-xl font-black text-purple-600">{formData.disabilityCategory}</span></div>
                    <i className="fa-solid fa-magnifying-glass text-xl opacity-20 group-hover:opacity-100 transition-opacity"></i>
                  </button>
                  {showPicker && (
                    <div className="absolute top-full mt-4 left-0 w-full bg-white dark:bg-alaga-charcoal shadow-2xl rounded-[16px] p-8 z-[100] border border-gray-100 dark:border-white/10 animate-in zoom-in-95 duration-200">
                      <div className="relative mb-6"><i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 opacity-30"></i><input autoFocus placeholder="Search 14 IDEA categories..." className="w-full pl-12 pr-4 py-4 bg-alaga-gray dark:bg-alaga-navy/40 rounded-2xl border-none outline-none focus:ring-2 ring-purple-500/30" value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} /></div>
                      <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto no-scrollbar">
                        {filteredCategories.map(c => (<div key={c} onClick={() => { setFormData({...formData, disabilityCategory: c as DisabilityCategory}); setShowPicker(false); }} className={`p-4 rounded-2xl cursor-pointer text-sm font-bold flex items-center justify-between transition-all ${formData.disabilityCategory === c ? 'bg-purple-500 text-white' : 'hover:bg-purple-500/10'}`}>{c}{formData.disabilityCategory === c && <i className="fa-solid fa-check"></i>}</div>))}
                      </div>
                    </div>
                  )}
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Cause of Disability</label>
                  <select
                    value={formData.customData?.causeOfDisability || 'Congenital'}
                    onChange={e => setFormData({...formData, customData: {...formData.customData, causeOfDisability: e.target.value}})}
                    className="w-full p-6 rounded-[12px] bg-alaga-gray dark:bg-alaga-navy/30 border-none outline-none focus:ring-2 ring-purple-500/30 font-bold appearance-none"
                  >
                    <option value="Congenital">Congenital / Inborn</option>
                    <option value="Acquired (Accident)">Acquired (Accident)</option>
                    <option value="Acquired (Illness)">Acquired (Illness)</option>
                    <option value="Other">Other Causes</option>
                  </select>
               </div>
            </div>
          </div>
        )}

        {!isStaff && (
          <div className="bg-white dark:bg-alaga-charcoal rounded-[20px] p-10 shadow-sm border border-gray-100 dark:border-white/5 space-y-8">
            <div className="flex items-center justify-between"><div className="flex items-center gap-4 text-alaga-gold"><i className="fa-solid fa-people-group text-2xl"></i><h3 className="text-xl font-black">3. Family Composition</h3></div><button type="button" onClick={handleAddFamily} className="px-6 py-3 bg-alaga-gold text-alaga-navy rounded-2xl font-black text-xs hover:scale-105 transition-all">+ Add Member</button></div>
            <div className="space-y-4">
              {familyMembers.length === 0 ? (<div className="py-12 text-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[16px] opacity-40"><i className="fa-solid fa-users text-4xl mb-4"></i><p className="font-bold">No family members listed.</p></div>) : (
                <div className="grid grid-cols-1 gap-4">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="p-6 bg-alaga-gray dark:bg-alaga-navy/20 rounded-[16px] border border-gray-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end relative"><button type="button" onClick={() => removeFamilyMember(member.id)} className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all"><i className="fa-solid fa-times"></i></button>
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase opacity-40">Full Name</label><input value={member.fullName} onChange={e => updateFamilyMember(member.id, 'fullName', e.target.value)} className="w-full p-3 rounded-xl bg-white dark:bg-alaga-charcoal border-none outline-none font-bold" /></div>
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase opacity-40">Relation</label><input value={member.relation} onChange={e => updateFamilyMember(member.id, 'relation', e.target.value)} className="w-full p-3 rounded-xl bg-white dark:bg-alaga-charcoal border-none outline-none font-bold" /></div>
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase opacity-40">Age</label><input type="number" value={member.age} onChange={e => updateFamilyMember(member.id, 'age', parseInt(e.target.value))} className="w-full p-3 rounded-xl bg-white dark:bg-alaga-charcoal border-none outline-none font-bold" /></div>
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase opacity-40">Sex</label><select value={member.sex} onChange={e => updateFamilyMember(member.id, 'sex', e.target.value as 'Male' | 'Female' | 'Other')} className="w-full p-3 rounded-xl bg-white dark:bg-alaga-charcoal border-none outline-none font-bold"><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-alaga-charcoal rounded-[20px] p-10 shadow-sm border border-gray-100 dark:border-white/5 space-y-8">
          <div className="flex items-center gap-4 text-red-500"><i className="fa-solid fa-phone-volume text-2xl"></i><h3 className="text-xl font-black">{(isStaff ? '3. ' : '4. ') + 'Emergency Contact Info'}</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2"><label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Full Name</label><input required value={emergencyContact.name} onChange={e => setEmergencyContact({...emergencyContact, name: e.target.value})} className="w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/30 border-none outline-none focus:ring-2 ring-red-500/30 font-bold" /></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Relation</label><input required value={emergencyContact.relation} onChange={e => setEmergencyContact({...emergencyContact, relation: e.target.value})} className="w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/30 border-none outline-none focus:ring-2 ring-red-500/30 font-bold" /></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Contact Number</label><input required value={emergencyContact.contact} onChange={e => setEmergencyContact({...emergencyContact, contact: e.target.value})} className="w-full p-4 rounded-2xl bg-alaga-gray dark:bg-alaga-navy/30 border-none outline-none focus:ring-2 ring-red-500/30 font-bold" /></div>
          </div>
        </div>

        {submissionStatus !== 'idle' && (
          <div className={`p-4 rounded-lg text-white font-bold mb-4 ${submissionStatus === 'success' ? 'bg-green-600' : submissionStatus === 'submitting' ? 'bg-yellow-500 text-black' : 'bg-red-600'}`}>
            {submissionStatus === 'submitting' ? 'Submitting...' : submissionMessage}
          </div>
        )}

        <div className={`p-12 rounded-[24px] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden text-white ${isStaff ? 'bg-alaga-blue' : 'bg-alaga-teal'}`}>
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><i className={`fa-solid ${isStaff ? 'fa-shield-halved' : 'fa-hands-holding-child'} text-9xl`}></i></div>
          <div className="relative z-10 max-w-xl">
            <h4 className="text-3xl font-black mb-3">{isEditMode ? 'Authorize Changes' : 'Submission Verification'}</h4>
            <p className="opacity-80 text-lg leading-relaxed font-medium">By finalizing this form, you certify that all information provided is true and correct.</p>
          </div>
          <button type="submit" disabled={submissionStatus === 'submitting'} className={`relative z-10 bg-alaga-gold text-alaga-navy px-12 py-6 rounded-[32px] font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 ${submissionStatus === 'submitting' ? 'opacity-60 cursor-not-allowed' : ''}`}>{submissionStatus === 'submitting' ? 'Submitting...' : (isEditMode ? 'Save Verified Entry' : 'Finalize Registry Entry')}<i className={`fa-solid ${submissionStatus === 'submitting' ? 'fa-spinner fa-spin' : (isEditMode ? 'fa-check-double' : 'fa-paper-plane')}`}></i></button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationWorkflow;
