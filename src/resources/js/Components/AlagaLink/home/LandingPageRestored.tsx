import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { router, useForm } from '@inertiajs/react';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';
import { AssistiveDevice, DisabilityCategory, MedicalService, LivelihoodProgram, ProgramAvailment, UserProfile, FamilyMember } from '@/Providers/AlagaLink/types';
import CommunityVigilCarousel from '../lost-found/CommunityVigilCarousel';
import RegistrationWorkflow from '../members/RegistrationWorkflow';

const LandingPage: React.FC<{ initialSection?: string | null; allowAdminRegistration?: boolean }> = ({
  initialSection = null,
  allowAdminRegistration = true,
}) => {
  const {
    addProgramRequest,
    addUser,
    searchSignal,
    setSearchSignal,
    notifications,
    currentUser,
    devices,
    medicalServices,
    livelihoodPrograms,
  } = useAppContext();

  const loginForm = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const [showLoginPopover, setShowLoginPopover] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showAdminRegistrationModal, setShowAdminRegistrationModal] = useState(false);
  const [showPublicRegistrationModal, setShowPublicRegistrationModal] = useState(false);

  const programsRef = useRef<HTMLDivElement>(null);
  const missingRef = useRef<HTMLDivElement>(null);
  const joinRef = useRef<HTMLDivElement>(null);
  const [aboutService, setAboutService] = useState<{ title: string; description: string } | null>(null);

  // Services catalog for landing page preview
  type ApplyTarget = { sentinelServiceId?: string; title?: string; id?: string; requestedItemId?: string; name?: string } | null;
  const [selectedService, setSelectedService] = useState<{ id: string; title: string; desc: string } | null>(null);
  const [showServicePopover, setShowServicePopover] = useState(false);
  const [showApplyPopover, setShowApplyPopover] = useState(false);
  const [applyTarget, setApplyTarget] = useState<ApplyTarget>(null);

  const openService = (id: string, title: string, desc: string) => {
    setSelectedService({ id, title, desc });
    setShowServicePopover(true);
  };

  const handleApplyAttempt = (item?: { id?: string; title?: string } | null) => {
    if (!item && selectedService?.id) {
      setApplyTarget({ sentinelServiceId: selectedService.id, title: selectedService.title });
    } else {
      setApplyTarget(item || null);
    }
    setShowApplyPopover(true);
  };

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    loginForm.post(route('login', {}, false), {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        setShowLoginPopover(false);
      },
      onError: (errors) => {
        const message =
          (typeof errors.email === 'string' && errors.email) ||
          (typeof errors.password === 'string' && errors.password) ||
          'Login failed. Please check your credentials and try again.';
        setLoginError(message);

        // Keep the user anchored to the login section.
        // (Some auth failure flows can trigger an Inertia re-render that resets scroll.)
        scrollTo(joinRef);
      },
      onFinish: () => {
        loginForm.reset('password');
      },
    });
  };

  const extractFirstError = (errors: Record<string, unknown>): string => {
    for (const value of Object.values(errors)) {
      if (typeof value === 'string' && value.trim() !== '') return value;
      if (Array.isArray(value)) {
        const first = value.find(v => typeof v === 'string' && v.trim() !== '');
        if (typeof first === 'string') return first;
      }
    }
    return '';
  };

  const handlePublicRegisterSubmit = (data: Partial<UserProfile>, _family: FamilyMember[]) => {
    const isStaff = data.registrantType === 'PDAO Staff' || data.role === 'Admin' || data.role === 'SuperAdmin';

    const firstName = (data.firstName || '').trim();
    const middleName = (data.middleName || '').trim();
    const lastName = (data.lastName || '').trim();
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();

    const staffOffice = (data.customData as unknown as { staffOffice?: string } | undefined)?.staffOffice || '';
    const staffPosition = (data.customData as unknown as { staffPosition?: string } | undefined)?.staffPosition || '';

    const payload: Record<string, unknown> = {
      account_type: isStaff ? 'staff' : 'pwd',
      name: fullName,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      email: (data.email || '').trim(),
      password: data.password || '',
      password_confirmation: data.password || '',
      contact_number: data.contactNumber || '',
      address: data.address || '',
      birth_date: data.birthDate || '',
      sex: data.sex || 'Other',
      blood_type: data.bloodType || '',
      disability_category: isStaff ? '' : (data.disabilityCategory || ''),
      emergency_contact_name: data.emergencyContact?.name || '',
      emergency_contact_relation: data.emergencyContact?.relation || '',
      emergency_contact_number: data.emergencyContact?.contact || '',
      staff_office: isStaff ? staffOffice : '',
      staff_position: isStaff ? staffPosition : '',
    };

    return new Promise<{ success: boolean; message?: string }>((resolve) => {
      router.post(route('register', {}, false), payload, {
        preserveScroll: true,
        onSuccess: () => {
          setShowPublicRegistrationModal(false);
          setShowLoginPopover(false);
          resolve({ success: true, message: 'Account created. Please log in.' });
        },
        onError: (errors) => {
          const message = extractFirstError(errors as Record<string, unknown>) || 'Registration failed. Please review your details and try again.';
          resolve({ success: false, message });
        },
      });
    });
  };

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';
  const canUseAdminRegistration = Boolean(allowAdminRegistration && isAdmin);

  const handleAdminRegisterSubmit = (data: Partial<UserProfile>, _family: FamilyMember[]) => {
    if (!canUseAdminRegistration) return false;

    const isStaff = data.registrantType === 'PDAO Staff' || data.role === 'Admin' || data.role === 'SuperAdmin';
    const sex = (data.sex || 'Male') as 'Male' | 'Female' | 'Other';
    const photoUrl =
      data.photoUrl ||
      `https://randomuser.me/api/portraits/${sex === 'Female' ? 'women' : 'men'}/${Math.floor(Math.random() * 99)}.jpg`;

    const newUser: UserProfile = {
      ...(data as UserProfile),
      id: isStaff ? `ADM-LT-${Date.now()}` : `LT-PWD-${Date.now()}`,
      status: 'Pending',
      role: isStaff ? 'Admin' : 'User',
      disabilityCategory: isStaff
        ? DisabilityCategory.None
        : (data.disabilityCategory as DisabilityCategory) || DisabilityCategory.Autism,
      photoUrl,
      provincialAddress: data.provincialAddress || '',
      familyComposition: data.familyComposition || [],
      emergencyContact: data.emergencyContact || { name: '', relation: '', contact: '' },
      customData: data.customData || {},
      history: { lostAndFound: [], programs: [] },
    };

    addUser(newUser);
    return true;
  };

  React.useEffect(() => {
    if (initialSection === 'login') {
      setShowLoginPopover(true);
      setShowAdminRegistrationModal(false);
      setShowPublicRegistrationModal(false);
    }

    if (initialSection === 'signup') {
      setShowPublicRegistrationModal(true);
      setShowAdminRegistrationModal(false);
      setShowLoginPopover(false);
    }

    if (initialSection === 'admin-register') {
      if (canUseAdminRegistration) {
        setShowAdminRegistrationModal(true);
        setShowLoginPopover(false);
        setShowPublicRegistrationModal(false);
      } else {
        setShowAdminRegistrationModal(false);
        setShowLoginPopover(true);
        setShowPublicRegistrationModal(false);
      }
    }
  }, [initialSection]);

  React.useEffect(() => {
    if (!searchSignal) return;
    if (searchSignal.page === 'home') {
      if (searchSignal.section === 'login') setShowLoginPopover(true);
      if (searchSignal.section === 'signup') {
        setShowPublicRegistrationModal(true);
        setShowLoginPopover(false);
      }
      if (searchSignal.section === 'admin-register') {
        if (canUseAdminRegistration) {
          setShowAdminRegistrationModal(true);
          setShowLoginPopover(false);
          setShowPublicRegistrationModal(false);
        }
      }
      setSearchSignal(null);
    }
  }, [searchSignal, setSearchSignal]);

  const highlights = [
    { title: 'Inclusive Registry', icon: 'fa-users-viewfinder', color: 'text-alaga-blue', ref: joinRef, desc: 'Digital profiling for PWD/CWD families.' },
    { title: 'Municipal Aid', icon: 'fa-hand-holding-medical', color: 'text-alaga-teal', ref: programsRef, desc: 'Direct access to medicine & devices.' },
    { title: 'Rapid Recovery', icon: 'fa-person-circle-question', color: 'text-red-500', ref: missingRef, desc: 'Community alert system for safety.' }
  ];

  const openAbout = (title: string, description: string) => setAboutService({ title, description });


  const idNotif = notifications.some(n => n.programType === 'ID' || (n.link && n.link.startsWith('programs:ID')));
  const assistiveNotif = notifications.some(n => n.programType === 'Device' || (n.link && n.link.includes('requests') && n.programType === 'Device'));
  const medicalNotif = notifications.some(n => n.programType === 'Medical' || (n.link && n.link.includes('requests') && n.programType === 'Medical'));
  const philhealthNotif = notifications.some(n => n.programType === 'PhilHealth' || (n.link && n.link.startsWith('programs:PhilHealth')));
  const livelihoodNotif = notifications.some(n => n.programType === 'Livelihood' || (n.link && n.link.startsWith('programs:Livelihood')));

  return (
    <div className="min-h-screen bg-white dark:bg-alaga-navy text-gray-900 dark:text-white transition-colors duration-500 overflow-x-hidden">
      <section id="home" className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-12">
          <div className="space-y-4">
            <div className="w-[22rem] h-[22rem] md:w-[28rem] md:h-[28rem] mx-auto relative animate-float">
              <div className="absolute inset-0 rounded-full bg-alaga-blue/20 blur-3xl"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src="/images/Alagalink_Logo/AlagaLink_Logo.png"
                  alt="AlagaLink"
                  width={1500}
                  height={1500}
                  className="w-full h-full object-contain alaga-logo-glow-light-blue"
                  priority
                />
              </div>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-3d-heavy tracking-tighter leading-none">Alaga<span className="text-alaga-blue">Link</span></h1>
            <p className="text-sm md:text-xl font-black uppercase tracking-[0.4em] opacity-40">La Trinidad PWD/CWD Information System</p>
          </div>
          <p className="text-lg md:text-2xl font-medium opacity-70 max-w-2xl mx-auto leading-relaxed">Bridging the gap between the community and municipal services through digital inclusion and high-integrity profiling.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
            {highlights.map((h, i) => (
              <div key={i} onClick={() => scrollTo(h.ref)} className="inflated-card bg-white dark:bg-alaga-charcoal p-8 rounded-[32px] border border-gray-100 dark:border-white/5 cursor-pointer group hover:scale-105 active:scale-95 transition-all">
                <i className={`fa-solid ${h.icon} ${h.color} text-4xl mb-4 group-hover:scale-110 transition-transform`}></i>
                <h4 className="font-black text-lg mb-1">{h.title}</h4>
                <p className="text-xs opacity-50 font-medium">{h.desc}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              scrollTo(joinRef);
              setShowLoginPopover(false);
            }}
            className="px-12 py-6 bg-alaga-blue text-white rounded-[32px] font-black text-xl shadow-lg hover:scale-105 active:scale-95 transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-alaga-blue/20 flex items-center gap-4 mx-auto"
          >
            Enter Municipal Portal <i className="fa-solid fa-chevron-down text-sm animate-bounce"></i>
          </button>
        </div>
      </section>

      <section id="community-vigil" ref={missingRef} className="py-20 px-6 bg-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 md:mb-16 text-center">
            <h2 className="text-5xl md:text-6xl font-extrabold leading-tight">Community Vigilance</h2>
            <p className="text-xs font-black uppercase tracking-[0.3em] opacity-30 mt-2">Lost & Found Recovery System</p>
            <p className="text-sm opacity-60 mt-4 max-w-2xl mx-auto">Our community-driven missing & found registry highlights urgent cases and recent recoveries.</p>
          </div>

          <CommunityVigilCarousel />
        </div>
      </section>

      <section id="programs" ref={programsRef} className="py-32 px-6 bg-alaga-gray dark:bg-alaga-navy/40 relative">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-3d">Programs & Services</h2>
            <p className="text-xs font-black uppercase tracking-[0.3em] opacity-30">The Service Delivery Backbone</p>
          </div>

          <div className="space-y-8">

            {/* Dashboard-style PWD ID Issuance (featured) */}
            <div className="max-w-4xl mx-auto inflated-card bg-white dark:bg-alaga-charcoal rounded-[32px] p-14 md:p-16 relative grid md:grid-cols-4 gap-6 items-center cursor-pointer transition-transform duration-300 ease-out transform-gpu hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-alaga-blue/10 md:min-h-[320px]" onClick={() => openService('id', 'PWD ID Issuance', 'Apply for an official PWD ID. You will need basic identification documents and proof of disability. Click Register to continue to login/registration.') }>
              <div className="md:col-span-3 text-left">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-alaga-blue/10 text-alaga-blue rounded-full mb-3">
                  <i className="fa-solid fa-id-card-clip text-lg"></i>
                  <span className="text-[11px] font-black uppercase tracking-widest">Official Identification</span>
                </div>
                <h3 className="text-5xl md:text-6xl font-black mb-2 text-3d-heavy tracking-tighter drop-shadow-lg animate-pulse">PWD ID Issuance</h3>
                <p className="opacity-70 text-sm md:text-base mb-4 leading-relaxed">Apply for your official PWD identification. This ID helps you access priority services and availments from the municipal offices.</p>
                <div className="flex items-center gap-4">
                  <button onClick={(e) => { e.stopPropagation(); openAbout('PWD ID Issuance', 'Apply for an official PWD ID. You will need basic identification documents and proof of disability. Click Register to continue to login/registration.'); }} className="px-6 py-3 bg-alaga-blue text-white rounded-xl font-black uppercase tracking-widest text-sm transition-transform duration-200 hover:scale-105 shadow-sm">About</button>
                  <button onClick={(e) => { e.stopPropagation(); scrollTo(joinRef); }} className="px-6 py-3 border-2 border-alaga-blue text-alaga-blue rounded-xl font-black uppercase tracking-widest text-sm transition-transform duration-200 hover:scale-105">Register Now</button>
                </div>
              </div>
              <div className="md:col-span-1 text-center">
                {idNotif && (
                  <span className="inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full w-6 h-6">!</span>
                )}
                <div className="mt-4 text-xs opacity-60">Need assistance? Visit the PWD services counter.</div>
              </div>
            </div>

            {/* Service cards: PhilHealth, Assistive Devices, Medical Services, Livelihood */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* PhilHealth Card */}
              <div className="inflated-card bg-white dark:bg-alaga-charcoal rounded-[24px] overflow-hidden flex flex-col group transition-transform duration-300 ease-out transform-gpu hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-alaga-gold/10 h-full min-h-[260px] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-alaga-gold text-[10px] font-black uppercase tracking-widest">Health & Benefits</span>
                    <h3 className="text-2xl font-black mt-2">PhilHealth</h3>
                  </div>
                  {philhealthNotif && <span className="w-3 h-3 bg-red-500 rounded-full" />}
                </div>
                <p className="opacity-70 text-xs md:text-sm mt-4 flex-1 leading-relaxed">Sponsored enrollment and assistance for PWD members to access government health insurance benefits.</p>
                <div className="mt-6 flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); openService('philhealth', 'PhilHealth', 'Sponsored PhilHealth enrollment and benefit assistance for eligible PWD members.'); }} className="px-4 py-2 bg-alaga-gold text-alaga-navy rounded-xl font-black uppercase tracking-widest text-xs transition-transform duration-200 hover:scale-105 shadow-sm">Details</button>
                  <button onClick={(e) => { e.stopPropagation(); openAbout('PhilHealth', 'PhilHealth enrollment and benefits. Click Register to proceed to login/registration.'); }} className="px-4 py-2 border border-gray-200 rounded-xl text-xs uppercase tracking-widest">About</button>
                </div>
              </div>

              {/* Assistive Devices Card */}
              <div className="inflated-card bg-white dark:bg-alaga-charcoal rounded-[24px] overflow-hidden flex flex-col group transition-transform duration-300 ease-out transform-gpu hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-alaga-blue/10 h-full min-h-[260px] p-0">
                <div className="relative h-44 overflow-hidden cursor-pointer bg-gradient-to-br from-alaga-blue/10 to-alaga-blue/5">
                <Image src="/images/programs/standard wheelchair.jpg" alt="Wheelchairs and assistive devices" fill className="object-cover transition-transform duration-700 group-hover:scale-105 rounded-t-lg" sizes="(min-width:1024px) 25vw, 100vw" />
                </div>
                <div className="p-6 space-y-3 flex flex-col flex-1">
                  <span className="text-alaga-blue text-[10px] font-black uppercase tracking-widest">Inventory Support</span>
                  <h3 className="text-2xl font-black">Assistive Devices</h3>
                  {assistiveNotif && <span className="absolute top-6 right-6 w-3 h-3 bg-red-500 rounded-full shadow-md" />}
                  <p className="opacity-70 text-xs md:text-sm font-medium leading-relaxed flex-1">Request wheelchairs, hearing aids, and mobility tools directly through your verified digital identity.</p>
                  <div className="mt-4 flex items-center gap-3">
                    <button onClick={(e) => { e.stopPropagation(); openService('devices', 'Assistive Devices', 'Request wheelchairs, hearing aids, and mobility tools.'); }} className="px-4 py-2 bg-alaga-blue text-white rounded-xl font-black uppercase tracking-widest text-xs transition-transform duration-200 hover:scale-105 shadow-sm">Details</button>
                    <button onClick={(e) => { e.stopPropagation(); openAbout('Assistive Devices', 'Request wheelchairs, hearing aids, and mobility tools. Click Request in the details to proceed to login.'); }} className="px-4 py-2 border border-gray-200 rounded-xl text-xs uppercase tracking-widest">About</button>
                  </div>
                </div>
              </div>

              {/* Medical Services Card */}
              <div className="inflated-card bg-white dark:bg-alaga-charcoal rounded-[24px] overflow-hidden flex flex-col group hover:shadow-2xl transition-all h-full min-h-[260px] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">Clinical Support</span>
                    <h3 className="text-2xl font-black mt-2">Medical Services</h3>
                  </div>
                  {medicalNotif && <span className="w-3 h-3 bg-red-500 rounded-full" />}
                </div>
                <p className="opacity-60 text-xs mt-4 flex-1">Access medicines, therapeutic sessions, and medical referrals for PWD members.</p>
                <div className="mt-6 flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); openService('medical', 'Medical Services', 'Access medicines, therapeutic sessions, and medical referrals for PWD members.'); }} className="px-4 py-2 bg-red-500 text-white rounded-xl font-black text-xs">Details</button>
                  <button onClick={(e) => { e.stopPropagation(); openAbout('Medical Services', 'Access medicines and medical assistance. Click Request in the details to proceed to login.'); }} className="px-4 py-2 border border-gray-200 rounded-xl text-xs">About</button>
                </div>
              </div>

              {/* Livelihood Hub Card */}
              <div className="inflated-card bg-white dark:bg-alaga-charcoal rounded-[24px] overflow-hidden flex flex-col group hover:shadow-2xl transition-all h-fit p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-alaga-teal text-[10px] font-black uppercase tracking-widest">Growth & Empowerment</span>
                    <h3 className="text-2xl font-black mt-2">Livelihood Hub</h3>
                  </div>
                  {livelihoodNotif && <span className="w-3 h-3 bg-red-500 rounded-full" />}
                </div>
                <p className="opacity-60 text-xs mt-4">Access workshops in ethnic weaving, digital literacy, and strawberry processing tailored for PWD/CWD members.</p>
                <div className="mt-6 flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); openService('livelihood', 'Livelihood Hub', 'Workshops and grants to support PWD livelihoods.'); }} className="px-4 py-2 bg-alaga-teal text-white rounded-xl font-black text-xs">Details</button>
                  <button onClick={(e) => { e.stopPropagation(); openAbout('Livelihood Hub', 'Access workshops in ethnic weaving, digital literacy, and strawberry processing. Click Request in the details to proceed to login.'); }} className="px-4 py-2 border border-gray-200 rounded-xl text-xs">About</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>



      <section id="login" ref={joinRef} className="py-32 px-6 bg-alaga-blue text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-10 rotate-12"><i className="fa-solid fa-id-card-clip text-[400px]"></i></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="bg-white/10 backdrop-blur-3xl p-10 md:p-16 rounded-[48px] border border-white/20 shadow-[0_50px_100px_rgba(0,0,0,0.3)] space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-4xl md:text-5xl font-black">Join Us!</h2>
              <p className="opacity-80 font-medium text-sm">Access your municipal account.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative group">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-70 block mb-2">Email</label>
                <i className="fa-solid fa-envelope absolute left-4 top-[46px] opacity-40 text-sm"></i>
                <input required type="email" value={loginForm.data.email} onChange={e => { loginForm.setData('email', e.target.value); setLoginError(''); }} placeholder="Enter your email..." className="w-full pl-12 pr-6 py-4 bg-white/15 border-2 border-white/25 rounded-[20px] font-medium text-base placeholder:text-white/40 outline-none transition-colors focus:bg-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/30" />
              </div>
              <div className="relative group">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-70 block mb-2">Password</label>
                <i className="fa-solid fa-lock absolute left-4 top-[46px] opacity-40 text-sm"></i>
                <input required type="password" value={loginForm.data.password} onChange={(e) => { loginForm.setData('password', e.target.value); setLoginError(''); }} placeholder="Enter your password..." className="w-full pl-12 pr-6 py-4 bg-white/15 border-2 border-white/25 rounded-[20px] font-medium text-base placeholder:text-white/40 outline-none transition-colors focus:bg-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/30" />
              </div>
              {loginError && <div className="p-3 rounded-[12px] bg-red-500/20 border border-red-300/50 text-red-100 text-xs font-black flex items-center gap-2"><i className="fa-solid fa-exclamation-circle"></i> {loginError}</div>}
              <button type="submit" disabled={loginForm.processing} className="w-full py-4 rounded-[20px] bg-alaga-gold text-alaga-navy font-black uppercase tracking-widest text-sm hover:shadow-lg hover:shadow-alaga-gold/50 hover:scale-105 transition-transform duration-200 active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-alaga-gold/30 disabled:opacity-60 disabled:hover:scale-100"><i className="fa-solid fa-arrow-right-to-bracket"></i> Log In</button>
            </form>
            <div className="flex items-center gap-4"><div className="h-px flex-1 bg-white/20"></div><p className="text-[11px] font-black uppercase opacity-60">New Here?</p><div className="h-px flex-1 bg-white/20"></div></div>
            {canUseAdminRegistration ? (
              <button onClick={() => { setShowAdminRegistrationModal(true); setShowPublicRegistrationModal(false); setShowLoginPopover(false); setLoginError(''); loginForm.reset(); }} className="w-full py-4 rounded-[20px] bg-alaga-gold text-alaga-navy font-black uppercase tracking-widest text-sm hover:shadow-lg hover:shadow-alaga-gold/50 hover:scale-105 transition-transform duration-200 active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-alaga-gold/30"><i className="fa-solid fa-user-plus"></i> Open Registration Portal</button>
            ) : (
              <button onClick={() => { setShowPublicRegistrationModal(true); setShowAdminRegistrationModal(false); setShowLoginPopover(false); setLoginError(''); loginForm.reset(); }} className="w-full py-4 rounded-[20px] bg-white text-alaga-blue font-black uppercase tracking-widest text-sm hover:shadow-lg hover:shadow-white/50 hover:scale-105 transition-transform duration-200 active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-white/30"><i className="fa-solid fa-user-plus"></i> Register (PWD / Staff)</button>
            )}
          </div>
        </div>
      </section>

      {showServicePopover && selectedService && (
        <div className="fixed inset-0 z-[460] alagalink-overlay-scroll alagalink-topbar-safe flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300 ease-out">
          <div className="bg-white dark:bg-alaga-charcoal rounded-[24px] w-full max-w-3xl p-6 shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-y-auto max-h-[80vh] transform-gpu transition-transform duration-300 ease-out">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-3 px-3 py-1 bg-alaga-blue/10 text-alaga-blue rounded-full mb-3">
                  <i className={`fa-solid ${selectedService.id === 'id' ? 'fa-id-card-clip' : selectedService.id === 'philhealth' ? 'fa-shield-halved' : selectedService.id === 'medical' ? 'fa-hospital' : selectedService.id === 'devices' ? 'fa-wheelchair' : 'fa-briefcase'} text-lg`}></i>
                  <h3 className="text-2xl font-black ml-2">{selectedService.title}</h3>
                </div>
                <p className="opacity-70 mt-2">{selectedService.desc}</p>
              </div>
              <button onClick={() => setShowServicePopover(false)} className="text-sm text-gray-500">Close</button>
            </div>

            <div className="mt-6 space-y-4">
              {selectedService.id === 'devices' && devices.map((d: AssistiveDevice) => (
                <div key={d.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100">
                  {d.photoUrl ? (
                    <Image src={d.photoUrl} alt={d.name} width={64} height={48} className="object-cover rounded" />
                  ) : (
                    <div className="w-16 h-12 rounded bg-gray-100" aria-hidden />
                  )}
                  <div className="flex-1">
                    <div className="font-black">{d.name}</div>
                    <div className="text-xs opacity-60">{d.description || d.overview || ''}</div>
                  </div>
                  <button onClick={() => { if (currentUser) { const req: ProgramAvailment = { id: `req-${Date.now()}`, userId: currentUser.id, programType: 'Device', title: d.name || 'Device Request', status: 'Pending', dateApplied: new Date().toISOString(), details: '', requestedItemId: d.id }; addProgramRequest(req); setShowServicePopover(false); } else { handleApplyAttempt({ id: d.id, title: d.name }); } }} className="px-3 py-2 bg-alaga-blue text-white rounded-md uppercase tracking-widest text-xs font-black transition-transform duration-200 hover:scale-105 shadow-sm">Request</button>
                </div>
              ))}

              {selectedService.id === 'medical' && medicalServices.map((m: MedicalService) => (
                <div key={m.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100">
                  {m.photoUrl ? (
                    <Image src={m.photoUrl} alt={m.name} width={64} height={48} className="object-cover rounded" />
                  ) : (
                    <div className="w-16 h-12 rounded bg-gray-100" aria-hidden />
                  )}
                  <div className="flex-1">
                    <div className="font-black">{m.name}</div>
                    <div className="text-xs opacity-60">{m.assistanceDetail || m.overview || ''}</div>
                  </div>
                  <button onClick={() => { if (currentUser) { const req: ProgramAvailment = { id: `req-${Date.now()}`, userId: currentUser.id, programType: 'Medical', title: m.name || 'Medical Request', status: 'Pending', dateApplied: new Date().toISOString(), details: '', requestedItemId: m.id }; addProgramRequest(req); setShowServicePopover(false); } else { handleApplyAttempt({ id: m.id, title: m.name }); } }} className="px-3 py-2 bg-red-500 text-white rounded-md uppercase tracking-widest text-xs font-black transition-transform duration-200 hover:scale-105 shadow-sm">Request</button>
                </div>
              ))}

              {selectedService.id === 'livelihood' && livelihoodPrograms.map((l: LivelihoodProgram) => (
                <div key={l.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100">
                  {l.photoUrl ? (
                    <Image src={l.photoUrl} alt={l.photoAlt || l.title} width={64} height={48} className="object-cover rounded" />
                  ) : (
                    <div className="w-16 h-12 rounded bg-gray-100" aria-hidden />
                  )}
                  <div className="flex-1">
                    <div className="font-black">{l.title}</div>
                    <div className="text-xs opacity-60">{(l as unknown as { desc?: string; description?: string }).desc || (l as unknown as { desc?: string; description?: string }).description || l.overview || ''}</div>
                  </div>
                  <button onClick={() => { if (currentUser) { const req: ProgramAvailment = { id: `req-${Date.now()}`, userId: currentUser.id, programType: 'Livelihood', title: l.title || 'Livelihood Request', status: 'Pending', dateApplied: new Date().toISOString(), details: '', requestedItemId: l.id }; addProgramRequest(req); setShowServicePopover(false); } else { handleApplyAttempt({ id: l.id, title: l.title }); } }} className="px-3 py-2 bg-alaga-teal text-white rounded-md uppercase tracking-widest text-xs font-black transition-transform duration-200 hover:scale-105 shadow-sm">Request</button>
                </div>
              ))}

              {selectedService.id === 'philhealth' && (
                <div className="p-4 rounded-lg border border-gray-100">
                  <p className="opacity-70 text-sm">Sponsored PhilHealth enrollment and benefit assistance. To apply, please register or log in and follow the PhilHealth enrollment workflow.</p>
                </div>
              )}

              {selectedService.id === 'id' && (
                <div className="p-4 rounded-lg border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-alaga-blue/10 text-alaga-blue rounded-lg flex items-center justify-center text-2xl"><i className="fa-solid fa-id-card-clip"></i></div>
                    <div>
                      <div className="font-black text-lg">Official PWD ID Issuance</div>
                      <div className="opacity-60 text-sm mt-1">Apply for a new, replacement, or renewal of your official PWD identification. You will need identification documents and supporting documents as required by the municipal office.</div>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between p-3 rounded border border-gray-100">
                      <div>
                        <div className="font-black">New PWD ID Issuance</div>
                        <div className="text-xs opacity-60">Apply for your first official Municipal PWD ID.</div>
                      </div>
                      <button onClick={() => { if (currentUser) { const req: ProgramAvailment = { id: `req-${Date.now()}`, userId: currentUser.id, programType: 'ID', title: 'New PWD ID Issuance', status: 'Pending', dateApplied: new Date().toISOString(), details: '' }; addProgramRequest(req); setShowServicePopover(false); } else { handleApplyAttempt({ title: 'New PWD ID Issuance' }); } }} className="px-3 py-2 bg-alaga-blue text-white rounded text-xs font-black">Apply</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {showApplyPopover && (
        <div className="fixed inset-0 z-[470] alagalink-overlay-scroll alagalink-topbar-safe flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-alaga-charcoal rounded-[24px] w-full max-w-md p-6 shadow-[0_40px_80px_rgba(0,0,0,0.4)] border border-white/10">
            <h4 className="font-black text-lg">Please sign in to apply</h4>
            <p className="opacity-60 text-sm mt-2">To request this service{applyTarget ? `: ${applyTarget.title}` : ''}, you need to be logged in. Please register or login to continue.</p>
            <div className="mt-6 flex items-center gap-3">
              <button onClick={() => { scrollTo(joinRef); setShowApplyPopover(false); setShowServicePopover(false); setShowLoginPopover(false); }} className="px-4 py-2 bg-alaga-blue text-white rounded-xl font-black">Scroll to Login</button>
              <button onClick={() => { setShowApplyPopover(false); }} className="px-4 py-2 border border-gray-200 rounded-xl">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {aboutService && (
        <div className="fixed inset-0 z-[450] alagalink-overlay-scroll alagalink-topbar-safe flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"><div className="bg-white dark:bg-alaga-charcoal rounded-[32px] w-full max-w-2xl p-8 shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/10"><div className="flex items-start justify-between"><div><h3 className="text-2xl font-black">{aboutService.title}</h3><p className="opacity-60 mt-2">{aboutService.description}</p></div><button onClick={() => setAboutService(null)} className="text-sm text-gray-500">Close</button></div><div className="mt-6 flex items-center gap-4"><button onClick={() => { scrollTo(joinRef); setAboutService(null); }} className="px-6 py-3 bg-alaga-blue text-white rounded-[12px] font-black">Register / Login</button><button onClick={() => setAboutService(null)} className="px-6 py-3 border border-gray-200 rounded-[12px]">Dismiss</button></div></div></div>
      )}

      <footer className="py-20 px-6 text-center opacity-30"><p className="text-[10px] font-black uppercase tracking-[0.5em]">La Trinidad Municipal Government • Benguet Province</p></footer>

      {showAdminRegistrationModal && canUseAdminRegistration && (
        <div className="fixed inset-0 z-[480] alagalink-overlay-scroll alagalink-topbar-safe flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-alaga-charcoal rounded-[32px] w-full max-w-6xl shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden relative">
            <button
              onClick={() => setShowAdminRegistrationModal(false)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-20"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="max-h-[85vh] overflow-y-auto p-6 md:p-10">
              <RegistrationWorkflow
                onSubmit={handleAdminRegisterSubmit}
                onCancel={() => setShowAdminRegistrationModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showPublicRegistrationModal && (
        <div className="fixed inset-0 z-[475] alagalink-overlay-scroll alagalink-topbar-safe flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-alaga-charcoal rounded-[32px] w-full max-w-6xl shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden relative">
            <button
              onClick={() => setShowPublicRegistrationModal(false)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-20"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="max-h-[85vh] overflow-y-auto p-6 md:p-10">
              <RegistrationWorkflow
                onSubmit={handlePublicRegisterSubmit}
                onCancel={() => setShowPublicRegistrationModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showLoginPopover && (
        <div className="fixed inset-0 z-[400] alagalink-overlay-scroll alagalink-topbar-safe flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-alaga-charcoal rounded-[48px] w-full max-w-md shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 relative border border-white/10">
            <button
              onClick={() => {
                setShowLoginPopover(false);
                setLoginError('');
                loginForm.reset();
              }}
              className="absolute top-8 right-8 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-20"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="p-12 md:p-16 space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-black">System Login</h3>
                <p className="opacity-60 font-medium text-sm">Access your AlagaLink account</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest opacity-60 block mb-3">Email</label>
                  <input
                    type="email"
                    value={loginForm.data.email}
                    onChange={(e) => {
                      loginForm.setData('email', e.target.value);
                      setLoginError('');
                    }}
                    placeholder="Enter your email"
                    className="w-full px-6 py-4 rounded-[20px] bg-alaga-gray dark:bg-white/5 border border-alaga-gold/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-alaga-blue placeholder:opacity-30 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest opacity-60 block mb-3">Password</label>
                  <input
                    type="password"
                    value={loginForm.data.password}
                    onChange={(e) => {
                      loginForm.setData('password', e.target.value);
                      setLoginError('');
                    }}
                    placeholder="Enter your password"
                    className="w-full px-6 py-4 rounded-[20px] bg-alaga-gray dark:bg-white/5 border border-alaga-gold/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-alaga-blue placeholder:opacity-30 font-medium"
                  />
                </div>

                {loginError && (
                  <div className="p-4 rounded-[16px] bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-black">
                    <i className="fa-solid fa-exclamation-circle mr-2"></i> {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginForm.processing}
                  className="w-full py-4 rounded-[20px] bg-alaga-blue text-white font-black uppercase tracking-widest text-sm hover:shadow-lg hover:shadow-alaga-blue/50 transition-all active:scale-95 disabled:opacity-60"
                >
                  <i className="fa-solid fa-arrow-right-to-bracket mr-2"></i> Log In Now
                </button>
              </form>

              <div className="text-center text-xs opacity-60 font-medium">Don&apos;t have an account? Contact your municipal administrator.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

