'use strict';
'use client';

import React, { useState } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { SymptomCheckerModal } from '../components/SymptomCheckerModal';
import { SOSWidget } from '../components/SOSWidget';
import { 
  Activity, 
  Bed, 
  ChevronRight, 
  Globe, 
  MapPin, 
  Phone, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  Menu, 
  X,
  CreditCard,
  Droplet
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const { language, setLanguage, t } = useLanguage();
  const [symptomModalOpen, setSymptomModalOpen] = useState(false);
  const [sosPanelOpen, setSosPanelOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search filter hooks (mocking UI lookups)
  const [hospQuery, setHospQuery] = useState('');

  const mockHospitals = [
    {
      name: 'Black Lion (Tikur Anbessa) Hospital',
      city: 'Addis Ababa',
      beds: '720/800 occupied',
      icu: '42/45 occupied',
      queue: '45 mins est.',
      emergency: true,
      color: 'border-red-500/20'
    },
    {
      name: 'St. Paul specialized Hospital',
      city: 'Addis Ababa',
      beds: '450/500 occupied',
      icu: '28/30 occupied',
      queue: '30 mins est.',
      emergency: true,
      color: 'border-red-500/20'
    },
    {
      name: 'Hawassa Referral Hospital',
      city: 'Hawassa',
      beds: '310/400 occupied',
      icu: '15/20 occupied',
      queue: '15 mins est.',
      emergency: true,
      color: 'border-teal-500/20'
    }
  ];

  const filteredHospitals = mockHospitals.filter(h => 
    h.name.toLowerCase().includes(hospQuery.toLowerCase()) || 
    h.city.toLowerCase().includes(hospQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen pb-16 overflow-x-hidden font-sans">
      <div className="bg-mesh" />

      {/* ================= HEADER / NAVBAR ================= */}
      <header className="sticky top-0 z-40 w-full glass-card border-b border-slate-200/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-lg shadow-teal-700/30">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-teal-700 to-cyan-600 bg-clip-text text-transparent">
              {t('appName')}
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <a href="#" className="hover:text-teal-700 transition">{t('home')}</a>
            <a href="#hospitals-section" className="hover:text-teal-700 transition">{t('hospitals')}</a>
            <a href="#features-section" className="hover:text-teal-700 transition">Features</a>
            <a href="#blood-section" className="hover:text-teal-700 transition">Blood bank</a>
          </nav>

          {/* Controls */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Selection */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/40 dark:bg-slate-800/40 rounded-lg border border-slate-200/20">
              <button 
                onClick={() => setLanguage('en')} 
                className={`px-2 py-1 text-xs font-bold rounded transition ${language === 'en' ? 'bg-teal-700 text-white shadow-sm' : 'hover:bg-slate-200/50'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('am')} 
                className={`px-2 py-1 text-xs font-bold rounded transition ${language === 'am' ? 'bg-teal-700 text-white shadow-sm' : 'hover:bg-slate-200/50'}`}
              >
                አማ
              </button>
              <button 
                onClick={() => setLanguage('om')} 
                className={`px-2 py-1 text-xs font-bold rounded transition ${language === 'om' ? 'bg-teal-700 text-white shadow-sm' : 'hover:bg-slate-200/50'}`}
              >
                OM
              </button>
            </div>

            {/* Login Link */}
            <Link 
              href="/dashboard/patient" 
              className="px-5 py-2.5 text-sm font-bold bg-teal-700 hover:bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-700/20 transition hover-scale"
            >
              {t('login')}
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-slate-200/30 transition text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/20 bg-slate-50 dark:bg-slate-900 px-4 py-4 space-y-4 shadow-xl">
            <div className="flex flex-col gap-3 font-semibold text-slate-700 dark:text-slate-200">
              <a href="#" onClick={() => setMobileMenuOpen(false)} className="hover:text-teal-700 transition">{t('home')}</a>
              <a href="#hospitals-section" onClick={() => setMobileMenuOpen(false)} className="hover:text-teal-700 transition">{t('hospitals')}</a>
              <a href="#features-section" onClick={() => setMobileMenuOpen(false)} className="hover:text-teal-700 transition">Features</a>
              <a href="#blood-section" onClick={() => setMobileMenuOpen(false)} className="hover:text-teal-700 transition">Blood bank</a>
            </div>
            
            <div className="flex items-center gap-2 border-t border-slate-200/20 pt-4">
              <span className="text-xs font-bold opacity-60">Language:</span>
              <button onClick={() => setLanguage('en')} className={`px-2.5 py-1 text-xs font-bold rounded ${language === 'en' ? 'bg-teal-700 text-white' : 'bg-slate-200/50'}`}>EN</button>
              <button onClick={() => setLanguage('am')} className={`px-2.5 py-1 text-xs font-bold rounded ${language === 'am' ? 'bg-teal-700 text-white' : 'bg-slate-200/50'}`}>አማ</button>
              <button onClick={() => setLanguage('om')} className={`px-2.5 py-1 text-xs font-bold rounded ${language === 'om' ? 'bg-teal-700 text-white' : 'bg-slate-200/50'}`}>OM</button>
            </div>

            <Link 
              href="/dashboard/patient" 
              className="block w-full text-center py-2.5 font-bold bg-teal-700 text-white rounded-xl shadow-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('login')}
            </Link>
          </div>
        )}
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-bold text-teal-700 dark:text-teal-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Health Transformation Strategy Ready</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            {t('heroTitle')}
          </h1>

          <p className="text-base sm:text-lg opacity-85 leading-relaxed max-w-2xl mx-auto lg:mx-0">
            {t('heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={() => setSymptomModalOpen(true)}
              className="px-6 py-3.5 font-bold bg-teal-700 hover:bg-teal-600 text-white rounded-xl shadow-xl shadow-teal-700/20 flex items-center justify-center gap-2 transition hover-scale"
            >
              <Activity className="w-5 h-5" />
              {t('symptomCheckerBtn')}
            </button>
            
            <button
              onClick={() => setSosPanelOpen(true)}
              className="px-6 py-3.5 font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-xl shadow-rose-600/20 flex items-center justify-center gap-2 transition hover-scale animate-pulse"
            >
              <Phone className="w-5 h-5" />
              {t('emergencySOSBtn')}
            </button>
          </div>
        </div>

        {/* Dashboard graphic card right */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-md overflow-hidden rounded-2xl glass-card border border-white/20 p-6 space-y-4 hover-scale shadow-2xl relative">
            <div className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              Addis Ababa SOS System
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                <Activity className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Emergency Dispatch Monitor</h3>
                <span className="text-xs opacity-60">Status: Active Gateway</span>
              </div>
            </div>

            {/* Outbreak chart mockup */}
            <div className="p-3 rounded-xl bg-slate-900/10 dark:bg-black/20 border border-white/5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Regional Epidemic Indicator (Weekly)</span>
              <div className="h-20 flex items-end justify-between gap-1 pt-4">
                <div className="w-full bg-teal-500/40 h-8 rounded-sm text-center text-[8px] font-bold pt-1">Mon</div>
                <div className="w-full bg-teal-500/60 h-12 rounded-sm text-center text-[8px] font-bold pt-1">Tue</div>
                <div className="w-full bg-teal-500/50 h-10 rounded-sm text-center text-[8px] font-bold pt-1">Wed</div>
                <div className="w-full bg-teal-700 h-16 rounded-sm text-center text-[8px] font-bold pt-1 relative">
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-teal-600">Peak</span>
                  Thu
                </div>
                <div className="w-full bg-teal-500/80 h-14 rounded-sm text-center text-[8px] font-bold pt-1">Fri</div>
              </div>
            </div>

            <div className="text-[11px] opacity-75 border-t border-slate-200/20 pt-3 flex justify-between">
              <span>Verified ICU Bed Allocation: <strong>92% occupied</strong></span>
              <span>Available Drivers: <strong>14 units</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= HOSPITALS DIRECTORY ================= */}
      <section id="hospitals-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200/10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight">{t('hospitals')} & Bed Analytics</h2>
          <p className="text-sm opacity-80 mt-2">Check live telemetry of leading Ethiopian hospitals, predicting waiting queues and clinical capacities before check-in.</p>
        </div>

        {/* Search bar */}
        <div className="max-w-md mx-auto mb-8 relative">
          <Search className="w-5 h-5 absolute left-3 top-3.5 opacity-60" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200/40 bg-white/30 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-teal-700 text-sm font-sans"
            placeholder={t('searchHospitals')}
            value={hospQuery}
            onChange={(e) => setHospQuery(e.target.value)}
          />
        </div>

        {/* Grid of hospitals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredHospitals.map((h, i) => (
            <div key={i} className={`p-5 rounded-2xl glass-card border ${h.color} hover-scale flex flex-col justify-between space-y-4`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-400">
                    Specialized
                  </span>
                  <div className="flex items-center gap-1 text-[11px] opacity-75">
                    <MapPin className="w-3.5 h-3.5" />
                    {h.city}
                  </div>
                </div>
                <h3 className="font-extrabold text-base">{h.name}</h3>
              </div>

              <div className="space-y-2 border-t border-slate-200/20 pt-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="opacity-75 flex items-center gap-1.5"><Bed className="w-4 h-4 text-teal-600" /> Bed Occupancy:</span>
                  <strong className="font-semibold">{h.beds}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-75 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-teal-600" /> ICU Capacity:</span>
                  <strong className="font-semibold">{h.icu}</strong>
                </div>
                <div className="flex justify-between items-center text-xs p-1.5 bg-teal-500/5 rounded">
                  <span className="opacity-75">AI Queue Prediction:</span>
                  <strong className="text-teal-700 dark:text-teal-400">{h.queue}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CORE FEATURES GRID ================= */}
      <section id="features-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200/10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight">Ecosystem Capabilities</h2>
          <p className="text-sm opacity-80 mt-2">Digitizing clinical paths, emergency rescues, and pharmacies in Ethiopia.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl glass-card hover-scale space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-700 dark:text-teal-400">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold">{t('aiTriageTitle')}</h3>
            <p className="text-sm opacity-85">{t('aiTriageDesc')}</p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl glass-card hover-scale space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-700 dark:text-cyan-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">{t('digitalRecordsTitle')}</h3>
            <p className="text-sm opacity-85">{t('digitalRecordsDesc')}</p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl glass-card hover-scale space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-700 dark:text-rose-400">
              <Phone className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold">One-Click GPS SOS Alert</h3>
            <p className="text-sm opacity-85">Instant ambulance dispatching, updating patients of live coordinates and distance telemetries.</p>
          </div>
        </div>
      </section>

      {/* ================= BLOOD BANK SECTION ================= */}
      <section id="blood-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-600">
              <Droplet className="w-4 h-4 fill-current text-rose-500" />
              <span>National Blood Stock Initiative</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">{t('bloodTitle')}</h2>
            <p className="text-sm opacity-85 leading-relaxed">
              {t('bloodDesc')} MediLink coordinates with the Ethiopian Red Cross and major public hospitals to provide real-time lookup for emergency blood bags, assisting transfusion logistics.
            </p>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/20">
                <span className="text-2xl font-black text-rose-500">45 Bags</span>
                <span className="text-xs opacity-75 block mt-1">Black Lion (O+ / A+)</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/20">
                <span className="text-2xl font-black text-rose-500">22 Bags</span>
                <span className="text-xs opacity-75 block mt-1">St. Paul (B+ / O-)</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 p-6 rounded-2xl glass-card border border-white/20 space-y-4">
            <h3 className="font-bold text-base">Payment Integrations</h3>
            <p className="text-xs opacity-80">Pay clinic fees, verify pharmacy prescriptions, and claim insurance invoices using Ethiopian gateways.</p>
            <div className="grid grid-cols-4 gap-3">
              <div className="p-2 border border-slate-200/20 bg-slate-100/50 rounded-lg flex items-center justify-center font-extrabold text-xs text-slate-800">Telebirr</div>
              <div className="p-2 border border-slate-200/20 bg-slate-100/50 rounded-lg flex items-center justify-center font-extrabold text-xs text-teal-700">Chapa</div>
              <div className="p-2 border border-slate-200/20 bg-slate-100/50 rounded-lg flex items-center justify-center font-extrabold text-xs text-blue-700">CBE Birr</div>
              <div className="p-2 border border-slate-200/20 bg-slate-100/50 rounded-lg flex items-center justify-center font-extrabold text-xs text-indigo-700">SantimPay</div>
            </div>
            <div className="text-[10px] opacity-60">Production payments simulator handles callback checkouts automatically.</div>
          </div>
        </div>
      </section>

      {/* ================= MODALS & SLIDE PANELS ================= */}
      <SymptomCheckerModal 
        isOpen={symptomModalOpen} 
        onClose={() => setSymptomModalOpen(false)} 
      />

      {/* SOS Panel Slider */}
      {sosPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full p-6 shadow-2xl relative flex flex-col justify-between overflow-y-auto border-l border-white/10 animate-slideLeft">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/20 mb-6">
                <span className="font-bold text-lg text-rose-600 flex items-center gap-1.5"><Phone className="w-5 h-5 animate-ping" /> Emergency Gateway</span>
                <button onClick={() => setSosPanelOpen(false)} className="p-1 rounded-full hover:bg-slate-200/20 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SOSWidget patientId="patient-demo-uuid-tewodros" />
            </div>

            <div className="mt-8 text-center text-[10px] opacity-60">
              SOS Broadcasts share mock geolocation variables with mock ambulance server listening locally on port 5000.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
