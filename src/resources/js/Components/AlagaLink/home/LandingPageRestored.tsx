import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useForm } from '@inertiajs/react';
import { useAppContext } from '@/Providers/AlagaLink/AppContext';
import { AssistiveDevice, DisabilityCategory, MedicalService, LivelihoodProgram, ProgramAvailment } from '@/Providers/AlagaLink/types';
import CommunityVigilCarousel from '../lost-found/CommunityVigilCarousel';

const LandingPage: React.FC<{ initialSection?: string | null }> = ({ initialSection = null }) => {
  const {
    addProgramRequest,
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

  const signupForm = useForm({
    account_type: '' as '' | 'pwd' | 'staff',
    alagalink_role: '' as '' | 'User' | 'Admin',
    first_name: '',
    middle_name: '',
    last_name: '',
    name: '',
    email: '',
    contact_number: '',
    address: '',
    disability_category: DisabilityCategory.Autism as string,
    staff_position: '',
    password: '',
    password_confirmation: '',
  });

  const [showSignupPopover, setShowSignupPopover] = useState(false);
  const [showLoginPopover, setShowLoginPopover] = useState(false);
  const [showPWDIDPopover, setShowPWDIDPopover] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [registrationType, setRegistrationType] = useState<null | 'pwd' | 'staff'>(null);

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
      onSuccess: () => {
        setShowLoginPopover(false);
        setShowSignupPopover(false);
        window.location.href = route('dashboard', {}, false);
      },
      onError: (errors) => {
        const message =
          (typeof errors.email === 'string' && errors.email) ||
          (typeof errors.password === 'string' && errors.password) ||
          'Login failed. Please check your credentials and try again.';
        setLoginError(message);
      },
      onFinish: () => {
        loginForm.reset('password');
      },
    });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    const cleanedFirst = signupForm.data.first_name.trim();
    const cleanedMiddle = signupForm.data.middle_name.trim();
    const cleanedLast = signupForm.data.last_name.trim();
    const computedName = [cleanedFirst, cleanedMiddle, cleanedLast].filter(Boolean).join(' ');

    const accountType = registrationType;
    const alagaRole = accountType === 'staff' ? 'Admin' : 'User';

    if (!accountType) {
      setSignupError('Please select a registration type (PWD or Staff) first.');
      return;
    }

    signupForm.transform((data) => ({
      ...data,
      account_type: accountType,
      alagalink_role: alagaRole,
      name: computedName,
      first_name: cleanedFirst,
      middle_name: cleanedMiddle,
      last_name: cleanedLast,
    }));

    signupForm.post('/register', {
      onSuccess: () => {
        setShowSignupPopover(false);
        setRegistrationType(null);
        setShowLoginPopover(true);
      },
      onError: (errors) => {
        const message =
          (typeof errors.first_name === 'string' && errors.first_name) ||
          (typeof errors.last_name === 'string' && errors.last_name) ||
          (typeof errors.name === 'string' && errors.name) ||
          (typeof errors.email === 'string' && errors.email) ||
          (typeof errors.contact_number === 'string' && errors.contact_number) ||
          (typeof errors.address === 'string' && errors.address) ||
          (typeof errors.disability_category === 'string' && errors.disability_category) ||
          (typeof errors.password === 'string' && errors.password) ||
          'Registration failed. Please review your details and try again.';
        setSignupError(message);
      },
      onFinish: () => {
        signupForm.reset('password', 'password_confirmation');
      },
    });
  };

  const goToRegister = () => {
    setShowPWDIDPopover(false);
    setShowLoginPopover(false);
    setLoginError('');
    loginForm.reset();
    setRegistrationType(null);
    setShowPWDIDPopover(true);
  };

  const beginRegistration = (type: 'pwd' | 'staff') => {
    setRegistrationType(type);
    setShowPWDIDPopover(false);
    setShowLoginPopover(false);
    setShowSignupPopover(true);
    setSignupError('');

    signupForm.setData('account_type', type);
    signupForm.setData('alagalink_role', type === 'staff' ? 'Admin' : 'User');
    signupForm.setData('disability_category', type === 'staff' ? DisabilityCategory.None : DisabilityCategory.Autism);
  };

  React.useEffect(() => {
    if (initialSection === 'login') {
      setShowLoginPopover(true);
      setShowSignupPopover(false);
      setShowPWDIDPopover(false);
    }

    if (initialSection === 'signup') {
      setShowPWDIDPopover(true);
      setShowLoginPopover(false);
      setShowSignupPopover(false);
    }
  }, [initialSection]);

  React.useEffect(() => {
    if (!searchSignal) return;
    if (searchSignal.page === 'home') {
      if (searchSignal.section === 'login') setShowLoginPopover(true);
      if (searchSignal.section === 'signup') setShowPWDIDPopover(true);
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
            <div className="w-24 h-24 bg-alaga-blue rounded-[32px] flex items-center justify-center mx-auto shadow-2xl inner-glow animate-float">
              <i className="fa-solid fa-hands-holding-child text-white text-5xl"></i>
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
          <button onClick={() => setShowLoginPopover(true)} className="px-12 py-6 bg-alaga-blue text-white rounded-[32px] font-black text-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-4 mx-auto">Enter Municipal Portal <i className="fa-solid fa-chevron-down text-sm animate-bounce"></i></button>
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
              <p className="opacity-80 font-medium text-sm">Access your account or start your official registration.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative group">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-70 block mb-2">Email</label>
                <i className="fa-solid fa-envelope absolute left-4 top-[46px] opacity-40 text-sm"></i>
                <input required type="email" value={loginForm.data.email} onChange={e => { loginForm.setData('email', e.target.value); setLoginError(''); }} placeholder="Enter your email..." className="w-full pl-12 pr-6 py-4 bg-white/15 border-2 border-white/20 focus:border-white rounded-[16px] font-medium text-base placeholder:text-white/40 outline-none transition-all focus:bg-white/20" />
              </div>
              <div className="relative group">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-70 block mb-2">Password</label>
                <i className="fa-solid fa-lock absolute left-4 top-[46px] opacity-40 text-sm"></i>
                <input required type="password" value={loginForm.data.password} onChange={(e) => { loginForm.setData('password', e.target.value); setLoginError(''); }} placeholder="Enter your password..." className="w-full pl-12 pr-6 py-4 bg-white/15 border-2 border-white/20 focus:border-white rounded-[16px] font-medium text-base placeholder:text-white/40 outline-none transition-all focus:bg-white/20" />
              </div>
              {loginError && <div className="p-3 rounded-[12px] bg-red-500/20 border border-red-300/50 text-red-100 text-xs font-black flex items-center gap-2"><i className="fa-solid fa-exclamation-circle"></i> {loginError}</div>}
              <button type="submit" disabled={loginForm.processing} className="w-full py-4 rounded-[16px] bg-white text-alaga-blue font-black uppercase tracking-widest text-sm hover:shadow-lg hover:shadow-white/50 hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100"><i className="fa-solid fa-arrow-right-to-bracket"></i> Log In</button>
            </form>
            <div className="flex items-center gap-4"><div className="h-px flex-1 bg-white/20"></div><p className="text-[11px] font-black uppercase opacity-60">New Here?</p><div className="h-px flex-1 bg-white/20"></div></div>
            <button onClick={() => { setShowPWDIDPopover(true); setLoginError(''); loginForm.reset(); }} className="w-full py-4 rounded-[16px] bg-alaga-gold text-alaga-navy font-black uppercase tracking-widest text-sm hover:shadow-lg hover:shadow-alaga-gold/50 hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2"><i className="fa-solid fa-user-plus"></i> Start Official Registration</button>
          </div>
        </div>
      </section>

      {showServicePopover && selectedService && (
        <div className="fixed inset-0 z-[460] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-opacity duration-300 ease-out">
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
        <div className="fixed inset-0 z-[470] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-alaga-charcoal rounded-[24px] w-full max-w-md p-6 shadow-[0_40px_80px_rgba(0,0,0,0.4)] border border-white/10">
            <h4 className="font-black text-lg">Please sign in to apply</h4>
            <p className="opacity-60 text-sm mt-2">To request this service{applyTarget ? `: ${applyTarget.title}` : ''}, you need to be logged in. Please register or login to continue.</p>
            <div className="mt-6 flex items-center gap-3">
              <button onClick={() => { scrollTo(joinRef); setShowApplyPopover(false); setShowServicePopover(false); setShowLoginPopover(true); }} className="px-4 py-2 bg-alaga-blue text-white rounded-xl font-black">Scroll to Login</button>
              <button onClick={() => { setShowApplyPopover(false); }} className="px-4 py-2 border border-gray-200 rounded-xl">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {aboutService && (
        <div className="fixed inset-0 z-[450] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"><div className="bg-white dark:bg-alaga-charcoal rounded-[32px] w-full max-w-2xl p-8 shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/10"><div className="flex items-start justify-between"><div><h3 className="text-2xl font-black">{aboutService.title}</h3><p className="opacity-60 mt-2">{aboutService.description}</p></div><button onClick={() => setAboutService(null)} className="text-sm text-gray-500">Close</button></div><div className="mt-6 flex items-center gap-4"><button onClick={() => { scrollTo(joinRef); setAboutService(null); }} className="px-6 py-3 bg-alaga-blue text-white rounded-[12px] font-black">Register / Login</button><button onClick={() => setAboutService(null)} className="px-6 py-3 border border-gray-200 rounded-[12px]">Dismiss</button></div></div></div>
      )}

      <footer className="py-20 px-6 text-center opacity-30"><p className="text-[10px] font-black uppercase tracking-[0.5em]">La Trinidad Municipal Government • Benguet Province</p></footer>

      {showLoginPopover && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"><div className="bg-white dark:bg-alaga-charcoal rounded-[48px] w-full max-w-md shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 relative border border-white/10"><button onClick={() => { setShowLoginPopover(false); setLoginError(''); loginForm.reset(); }} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-20"><i className="fa-solid fa-xmark"></i></button><div className="p-12 md:p-16 space-y-8"><div className="text-center space-y-2"><h3 className="text-3xl font-black">System Login</h3><p className="opacity-60 font-medium text-sm">Access your AlagaLink account</p></div><form onSubmit={handleLogin} className="space-y-6"><div><label className="text-xs font-black uppercase tracking-widest opacity-60 block mb-3">Email</label><input type="email" value={loginForm.data.email} onChange={(e) => { loginForm.setData('email', e.target.value); setLoginError(''); }} placeholder="Enter your email" className="w-full px-6 py-4 rounded-[20px] bg-alaga-gray dark:bg-white/5 border border-alaga-gold/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-alaga-blue placeholder:opacity-30 font-medium" /></div><div><label className="text-xs font-black uppercase tracking-widest opacity-60 block mb-3">Password</label><input type="password" value={loginForm.data.password} onChange={(e) => { loginForm.setData('password', e.target.value); setLoginError(''); }} placeholder="Enter your password" className="w-full px-6 py-4 rounded-[20px] bg-alaga-gray dark:bg-white/5 border border-alaga-gold/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-alaga-blue placeholder:opacity-30 font-medium" /></div>{loginError && <div className="p-4 rounded-[16px] bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-black"><i className="fa-solid fa-exclamation-circle mr-2"></i> {loginError}</div>}<button type="submit" disabled={loginForm.processing} className="w-full py-4 rounded-[20px] bg-alaga-blue text-white font-black uppercase tracking-widest text-sm hover:shadow-lg hover:shadow-alaga-blue/50 transition-all active:scale-95 disabled:opacity-60"><i className="fa-solid fa-arrow-right-to-bracket mr-2"></i> Log In Now</button></form><div className="text-center text-xs opacity-60 font-medium">Don&apos;t have an account? <button onClick={() => { setShowLoginPopover(false); setShowSignupPopover(false); setShowPWDIDPopover(true); setLoginError(''); loginForm.reset(); }} className="text-alaga-teal font-black ml-1 hover:underline">Sign up here</button></div></div></div></div>
      )}

      {showPWDIDPopover && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-alaga-charcoal rounded-[48px] w-full max-w-3xl shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 relative border border-white/10">
            <button onClick={() => { setShowPWDIDPopover(false); setRegistrationType(null); setSignupError(''); signupForm.reset(); }} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-20">
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="p-12 md:p-20 space-y-12">
              <div className="text-center space-y-4">
                <h3 className="text-4xl font-black">Select Registration Type</h3>
                <p className="opacity-60 font-medium">Choose the form that matches your account.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div onClick={() => beginRegistration('pwd')} className="p-10 rounded-[32px] bg-alaga-teal/5 border-4 border-transparent hover:border-alaga-teal cursor-pointer transition-all group relative overflow-hidden">
                  <i className="fa-solid fa-id-card text-5xl text-alaga-teal mb-6 group-hover:scale-110 transition-transform"></i>
                  <h4 className="text-2xl font-black mb-2">PWD Applicant</h4>
                  <p className="text-sm opacity-50 font-medium leading-relaxed">Register as a Person with Disabilities to access benefits and services.</p>
                  <i className="fa-solid fa-id-card absolute -right-6 -bottom-6 text-[120px] opacity-5 -rotate-12"></i>
                </div>
                <div onClick={() => beginRegistration('staff')} className="p-10 rounded-[32px] bg-alaga-blue/5 border-4 border-transparent hover:border-alaga-blue cursor-pointer transition-all group relative overflow-hidden">
                  <i className="fa-solid fa-shield-halved text-5xl text-alaga-blue mb-6 group-hover:scale-110 transition-transform"></i>
                  <h4 className="text-2xl font-black mb-2">Staff/Admin</h4>
                  <p className="text-sm opacity-50 font-medium leading-relaxed">Register as administrative staff to manage PDAO and MSWDO operations.</p>
                  <i className="fa-solid fa-shield-halved absolute -right-6 -bottom-6 text-[120px] opacity-5 -rotate-12"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSignupPopover && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-alaga-charcoal rounded-[48px] w-full max-w-md shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 relative border border-white/10">
            <button onClick={() => { setShowSignupPopover(false); setSignupError(''); setRegistrationType(null); signupForm.reset(); }} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-20">
              <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="p-12 md:p-16 space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-black">{registrationType === 'staff' ? 'Staff Registration' : 'PWD Registration'}</h3>
                <p className="opacity-60 font-medium text-sm">Complete your credentials to pre-fill your profile</p>
              </div>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => { setShowSignupPopover(false); setRegistrationType(null); setShowPWDIDPopover(true); }} className="text-xs font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
                  <i className="fa-solid fa-arrow-left mr-2"></i> Back
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{registrationType === 'staff' ? 'Staff/Admin' : 'PWD Applicant'}</span>
              </div>
              <form onSubmit={handleSignup} className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest opacity-60 block mb-3">First Name</label>
                  <input
                    type="text"
                    value={signupForm.data.first_name}
                    onChange={(e) => { signupForm.setData('first_name', e.target.value); setSignupError(''); }}
                    placeholder="Enter your first name"
                    className="w-full px-6 py-4 rounded-[20px] bg-alaga-gray dark:bg-white/5 border border-alaga-gold/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-alaga-blue placeholder:opacity-30 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest opacity-60 block mb-3">Middle Name (Optional)</label>
                  <input
                    type="text"
                    value={signupForm.data.middle_name}
                    onChange={(e) => { signupForm.setData('middle_name', e.target.value); setSignupError(''); }}
                    placeholder="Enter your middle name"
                    className="w-full px-6 py-4 rounded-[20px] bg-alaga-gray dark:bg-white/5 border border-alaga-gold/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-alaga-blue placeholder:opacity-30 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest opacity-60 block mb-3">Last Name</label>
                  <input
                    type="text"
                    value={signupForm.data.last_name}
                    onChange={(e) => { signupForm.setData('last_name', e.target.value); setSignupError(''); }}
                    placeholder="Enter your last name"
                    className="w-full px-6 py-4 rounded-[20px] bg-alaga-gray dark:bg-white/5 border border-alaga-gold/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-alaga-blue placeholder:opacity-30 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest opacity-60 block mb-3">Email</label>
                  <input
                    type="email"
                    value={signupForm.data.email}
                    onChange={(e) => { signupForm.setData('email', e.target.value); setSignupError(''); }}
                    placeholder="Enter your email"
                    className="w-full px-6 py-4 rounded-[20px] bg-alaga-gray dark:bg-white/5 border border-alaga-gold/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-alaga-blue placeholder:opacity-30 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest opacity-60 block mb-3">Contact Number</label>
                  <input
                    type="tel"
                    value={signupForm.data.contact_number}
                    onChange={(e) => { signupForm.setData('contact_number', e.target.value); setSignupError(''); }}
                    placeholder="Enter your contact number"
                    className="w-full px-6 py-4 rounded-[20px] bg-alaga-gray dark:bg-white/5 border border-alaga-gold/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-alaga-blue placeholder:opacity-30 font-medium"
                    required
                  />
                </div>

                {registrationType === 'pwd' && (
                  <>
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest opacity-60 block mb-3">Address</label>
                      <input
                        type="text"
                        value={signupForm.data.address}
                        onChange={(e) => { signupForm.setData('address', e.target.value); setSignupError(''); }}
                        placeholder="Enter your address"
                        className="w-full px-6 py-4 rounded-[20px] bg-alaga-gray dark:bg-white/5 border border-alaga-gold/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-alaga-blue placeholder:opacity-30 font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest opacity-60 block mb-3">Disability Category</label>
                      <select
                        value={signupForm.data.disability_category}
                        onChange={(e) => { signupForm.setData('disability_category', e.target.value); setSignupError(''); }}
                        className="w-full px-6 py-4 rounded-[20px] bg-alaga-gray dark:bg-white/5 border border-alaga-gold/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-alaga-blue font-medium"
                        required
                      >
                        {Object.values(DisabilityCategory)
                          .filter(v => v !== DisabilityCategory.None)
                          .map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                      </select>
                    </div>
                  </>
                )}

                {registrationType === 'staff' && (
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest opacity-60 block mb-3">Position</label>
                    <input
                      type="text"
                      value={signupForm.data.staff_position}
                      onChange={(e) => { signupForm.setData('staff_position', e.target.value); setSignupError(''); }}
                      placeholder="Enter your position"
                      className="w-full px-6 py-4 rounded-[20px] bg-alaga-gray dark:bg-white/5 border border-alaga-gold/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-alaga-blue placeholder:opacity-30 font-medium"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-black uppercase tracking-widest opacity-60 block mb-3">Password</label>
                  <input
                    type="password"
                    value={signupForm.data.password}
                    onChange={(e) => { signupForm.setData('password', e.target.value); setSignupError(''); }}
                    placeholder="Create a password"
                    className="w-full px-6 py-4 rounded-[20px] bg-alaga-gray dark:bg-white/5 border border-alaga-gold/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-alaga-blue placeholder:opacity-30 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest opacity-60 block mb-3">Confirm Password</label>
                  <input
                    type="password"
                    value={signupForm.data.password_confirmation}
                    onChange={(e) => { signupForm.setData('password_confirmation', e.target.value); setSignupError(''); }}
                    placeholder="Confirm your password"
                    className="w-full px-6 py-4 rounded-[20px] bg-alaga-gray dark:bg-white/5 border border-alaga-gold/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-alaga-blue placeholder:opacity-30 font-medium"
                    required
                  />
                </div>
                {signupError && (
                  <div className="p-4 rounded-[16px] bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-black">
                    <i className="fa-solid fa-exclamation-circle mr-2"></i> {signupError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={signupForm.processing}
                  className="w-full py-4 rounded-[20px] bg-alaga-gold text-alaga-navy font-black uppercase tracking-widest text-sm hover:shadow-lg hover:shadow-alaga-gold/50 transition-all active:scale-95 disabled:opacity-60"
                >
                  <i className="fa-solid fa-user-plus mr-2"></i> Register
                </button>
              </form>
              <div className="text-center text-xs opacity-60 font-medium">
                Already have an account?
                <button onClick={() => { setShowSignupPopover(false); setShowLoginPopover(true); setSignupError(''); signupForm.reset(); }} className="text-alaga-blue font-black ml-1 hover:underline">Log in here</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
