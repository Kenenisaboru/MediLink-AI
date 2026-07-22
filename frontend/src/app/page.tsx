'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../components/LanguageContext';
import { SymptomCheckerModal } from '../components/SymptomCheckerModal';
import { SOSWidget } from '../components/SOSWidget';
import NotificationBell from '../components/NotificationBell';
import api from '../lib/api';
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
  Droplet,
  CheckCircle,
  Siren,
  Clock,
  ArrowRight,
  Stethoscope,
  Building2,
  HeartPulse,
  Award
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const { language, setLanguage, t } = useLanguage();
  const [symptomModalOpen, setSymptomModalOpen] = useState(false);
  const [sosPanelOpen, setSosPanelOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState<'AI' | 'TELEMETRY' | 'SOS' | 'PAYMENTS'>('AI');

  const [hospQuery, setHospQuery] = useState('');
  const [hospitals, setHospitals] = useState<any[]>([]);

  const defaultHospitals = [
    {
      id: 'hosp-1',
      name: 'Black Lion (Tikur Anbessa) Hospital',
      city: 'Addis Ababa',
      address: 'Zewditu St, Addis Ababa',
      occupiedBeds: 720,
      totalBeds: 800,
      occupiedICUBeds: 42,
      totalICUBeds: 45,
      queueLength: 45,
      isEmergencyAvailable: true,
      rating: 4.9
    },
    {
      id: 'hosp-2',
      name: 'St. Paul Specialized Hospital',
      city: 'Addis Ababa',
      address: 'Swaziland St, Gulele, Addis Ababa',
      occupiedBeds: 450,
      totalBeds: 500,
      occupiedICUBeds: 28,
      totalICUBeds: 30,
      queueLength: 30,
      isEmergencyAvailable: true,
      rating: 4.8
    },
    {
      id: 'hosp-3',
      name: 'Hawassa Comprehensive Referral Hospital',
      city: 'Hawassa',
      address: 'Near Hawassa University Main Campus',
      occupiedBeds: 310,
      totalBeds: 400,
      occupiedICUBeds: 15,
      totalICUBeds: 20,
      queueLength: 15,
      isEmergencyAvailable: true,
      rating: 4.7
    }
  ];

  const bloodStocksList = [
    { hospital: 'Addis Ababa Central Bank', group: 'O-', count: 14, status: 'CRITICAL' },
    { hospital: 'St. Paul Specialized Hospital', group: 'A+', count: 32, status: 'STABLE' },
    { hospital: 'Hawassa Referral Hospital', group: 'B-', count: 8, status: 'LOW' },
    { hospital: 'Mekelle General Hospital', group: 'AB+', count: 19, status: 'STABLE' },
  ];

  useEffect(() => {
    async function loadHospitals() {
      try {
        const { data } = await api.get('/hospitals');
        if (Array.isArray(data) && data.length > 0) {
          setHospitals(data);
        } else {
          setHospitals(defaultHospitals);
        }
      } catch {
        setHospitals(defaultHospitals);
      }
    }
    loadHospitals();
  }, []);

  const filteredHospitals = hospitals.filter(h => 
    h.name.toLowerCase().includes(hospQuery.toLowerCase()) || 
    h.city.toLowerCase().includes(hospQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen pb-16 overflow-x-hidden font-sans text-slate-800 dark:text-slate-100">
      <div className="bg-mesh" />

      {/* Top Notification Announcement Bar */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-cyan-900 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 border-b border-teal-500/20">
        <span className="px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-200 text-[10px] uppercase font-extrabold tracking-wider">
          MediLink AI 2.0
        </span>
        <span>Real-Time Emergency Dispatch & Multilingual Clinical Gemini Integration is Live in Ethiopia</span>
      </div>

      {/* ================= HEADER / NAVBAR ================= */}
      <header className="sticky top-0 z-40 w-full glass-card border-b border-slate-200/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-teal-700/30 group-hover:scale-105 transition">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                {t('appName')}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 -mt-1">
                Ethiopian Healthcare AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            <a href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition">{t('home')}</a>
            <a href="#features-section" className="hover:text-teal-600 dark:hover:text-teal-400 transition">Features</a>
            <a href="#hospitals-section" className="hover:text-teal-600 dark:hover:text-teal-400 transition">{t('hospitals')}</a>
            <a href="#blood-section" className="hover:text-teal-600 dark:hover:text-teal-400 transition">Blood Bank</a>
            <a href="#languages-section" className="hover:text-teal-600 dark:hover:text-teal-400 transition">Languages</a>
          </nav>

          {/* Controls & Language Selector */}
          <div className="hidden md:flex items-center gap-4">
            <NotificationBell />

            {/* Language Selection */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/50 dark:bg-slate-800/60 rounded-xl border border-slate-200/20">
              <button 
                onClick={() => setLanguage('en')} 
                className={`px-2.5 py-1 text-xs font-black rounded-lg transition ${language === 'en' ? 'bg-teal-700 text-white shadow-md' : 'hover:bg-slate-200/50 opacity-70'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('am')} 
                className={`px-2.5 py-1 text-xs font-black rounded-lg transition ${language === 'am' ? 'bg-teal-700 text-white shadow-md' : 'hover:bg-slate-200/50 opacity-70'}`}
              >
                አማ
              </button>
              <button 
                onClick={() => setLanguage('om')} 
                className={`px-2.5 py-1 text-xs font-black rounded-lg transition ${language === 'om' ? 'bg-teal-700 text-white shadow-md' : 'hover:bg-slate-200/50 opacity-70'}`}
              >
                OM
              </button>
            </div>

            {/* Login Link */}
            <Link 
              href="/auth" 
              className="px-5 py-2.5 text-xs font-extrabold bg-teal-700 hover:bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-700/20 transition hover-scale flex items-center gap-1.5"
            >
              <span>{t('login')}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <NotificationBell />
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl hover:bg-slate-200/30 transition text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-card border-b border-slate-200/20 px-4 py-4 space-y-4 animate-fadeIn">
            <nav className="flex flex-col space-y-2 text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              <a href="#" className="p-2 hover:bg-slate-200/30 rounded-lg">{t('home')}</a>
              <a href="#features-section" className="p-2 hover:bg-slate-200/30 rounded-lg">Features</a>
              <a href="#hospitals-section" className="p-2 hover:bg-slate-200/30 rounded-lg">{t('hospitals')}</a>
              <a href="#blood-section" className="p-2 hover:bg-slate-200/30 rounded-lg">Blood Bank</a>
              <a href="#languages-section" className="p-2 hover:bg-slate-200/30 rounded-lg">Languages</a>
            </nav>
            <div className="pt-3 border-t border-slate-200/20 flex flex-col gap-3">
              <div className="flex justify-center gap-2 p-1.5 bg-slate-200/40 rounded-xl">
                <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-xs font-bold rounded ${language === 'en' ? 'bg-teal-700 text-white' : ''}`}>EN</button>
                <button onClick={() => setLanguage('am')} className={`px-3 py-1 text-xs font-bold rounded ${language === 'am' ? 'bg-teal-700 text-white' : ''}`}>አማ</button>
                <button onClick={() => setLanguage('om')} className={`px-3 py-1 text-xs font-bold rounded ${language === 'om' ? 'bg-teal-700 text-white' : ''}`}>OM</button>
              </div>
              <Link 
                href="/auth" 
                className="w-full text-center py-3 text-xs font-extrabold bg-teal-700 text-white rounded-xl shadow-md"
              >
                {t('login')}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card border border-teal-500/30 text-teal-700 dark:text-teal-400 text-xs font-extrabold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
            AI Emergency & Healthcare Infrastructure
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
            Next-Gen Healthcare for <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">Ethiopia</span>
          </h1>

          <p className="text-base sm:text-lg opacity-85 max-w-2xl font-medium leading-relaxed">
            Instant AI clinical symptom analysis in Amharic & Afaan Oromo, real-time hospital bed & ICU queue tracking, local Telebirr payments, and 1-tap emergency dispatch.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button
              onClick={() => setSymptomModalOpen(true)}
              className="w-full sm:w-auto px-7 py-4 bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 text-white font-extrabold rounded-2xl shadow-2xl shadow-teal-700/30 flex items-center justify-center gap-2.5 transition hover-scale text-sm"
            >
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              {t('checkSymptoms')}
            </button>

            <button
              onClick={() => setSosPanelOpen(true)}
              className="w-full sm:w-auto px-7 py-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-extrabold rounded-2xl shadow-2xl shadow-rose-600/35 flex items-center justify-center gap-2.5 transition hover-scale text-sm relative overflow-hidden group"
            >
              <Siren className="w-5 h-5 animate-bounce" />
              <span>{t('sosEmergency')}</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/20 text-xs">
            <div>
              <div className="text-lg font-black text-teal-600 dark:text-teal-400">30,000+</div>
              <div className="opacity-60 text-[11px] font-bold">Patients Served</div>
            </div>
            <div>
              <div className="text-lg font-black text-cyan-600 dark:text-cyan-400">12+</div>
              <div className="opacity-60 text-[11px] font-bold">Referral Hospitals</div>
            </div>
            <div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">99.8%</div>
              <div className="opacity-60 text-[11px] font-bold">Uptime Reliability</div>
            </div>
            <div>
              <div className="text-lg font-black text-rose-500">1-Tap</div>
              <div className="opacity-60 text-[11px] font-bold">Telebirr SOS</div>
            </div>
          </div>
        </div>

        {/* Hero Interactive Card Graphic */}
        <div className="w-full lg:w-5/12 glass-card-pro rounded-3xl border border-white/30 p-6 shadow-2xl relative space-y-5 hover-scale animate-float">
          <div className="flex items-center justify-between border-b border-slate-200/20 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600 animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400">Live Network Telemetry</span>
            </div>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/20 shadow-sm flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm">Network Bed Capacity</div>
                  <span className="text-[10px] opacity-60">Addis Ababa & Regional Hubs</span>
                </div>
              </div>
              <div className="text-right">
                <strong className="text-sm font-black text-teal-700 dark:text-teal-400">1,480 Available</strong>
                <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-teal-500 h-full w-3/4"></div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/20 shadow-sm flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm">National Blood Reserve</div>
                  <span className="text-[10px] opacity-60">Central Bank Dispatch</span>
                </div>
              </div>
              <div className="text-right">
                <strong className="text-xs font-extrabold text-rose-500 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                  O- & A+ Critical
                </strong>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/20 to-teal-950/20 border border-purple-500/20 text-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="font-extrabold">Clinical AI Multilingual Triage</div>
                  <span className="text-[10px] opacity-75">Amharic, Afaan Oromo, English</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-extrabold">Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES SHOWCASE SECTION ================= */}
      <section id="features-section" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-600 text-xs font-extrabold uppercase tracking-wider">
            Engineered For Impact
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Complete Healthcare Lifecycle Support</h2>
          <p className="opacity-75 text-sm font-medium">
            Designed specifically to address clinical workflows, language barriers, and emergency response in Ethiopia.
          </p>
        </div>

        {/* Feature Tabs */}
        <div className="flex justify-center gap-2 border-b border-slate-200/20 pb-4 overflow-x-auto">
          {(['AI', 'TELEMETRY', 'SOS', 'PAYMENTS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFeatureTab(tab)}
              className={`px-5 py-2.5 text-xs font-black rounded-xl transition ${
                activeFeatureTab === tab 
                  ? 'bg-teal-700 text-white shadow-lg shadow-teal-700/20' 
                  : 'bg-white/10 hover:bg-slate-200/40 opacity-70'
              }`}
            >
              {tab === 'AI' && '🤖 AI Diagnostics'}
              {tab === 'TELEMETRY' && '🏥 Hospital Telemetry'}
              {tab === 'SOS' && '🚨 1-Tap SOS Dispatch'}
              {tab === 'PAYMENTS' && '💳 Local Payments'}
            </button>
          ))}
        </div>

        {/* Feature Display Card */}
        <div className="glass-card-pro p-8 rounded-3xl border border-white/20 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {activeFeatureTab === 'AI' && (
            <>
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-extrabold uppercase text-purple-600 dark:text-purple-400">Powered by Google Gemini</span>
                <h3 className="text-2xl font-black">AI Multilingual Symptom Analysis & Clinical Triage</h3>
                <p className="text-xs opacity-80 leading-relaxed font-medium">
                  Patients input symptoms naturally in Amharic, Afaan Oromo, or English. The clinical AI evaluates severity, suggests immediate home care instructions, recommends appropriate medical specialists, and flags emergency conditions.
                </p>
                <div className="space-y-2 text-xs font-bold">
                  <div className="flex items-center gap-2 text-emerald-600"><CheckCircle className="w-4 h-4" /> Native Amharic & Afaan Oromo NLP support</div>
                  <div className="flex items-center gap-2 text-emerald-600"><CheckCircle className="w-4 h-4" /> Emergency triage severity grading</div>
                  <div className="flex items-center gap-2 text-emerald-600"><CheckCircle className="w-4 h-4" /> Direct integration with Doctor consultations</div>
                </div>
              </div>
              <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-3">
                <div className="text-purple-400 font-bold">&gt; Input: "ከባድ እራስ ምታት እና ትኩሳት አለብኝ"</div>
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200">
                  <strong>AI Response:</strong> የመተንፈሻ አካላት ኢንፌክሽን ወይም ከፍተኛ ትኩሳት ምልክት ሊሆን ይችላል:: እባክዎ አቅራቢያ የሚገኝ ሆስፒታል ያግኙ::
                </div>
              </div>
            </>
          )}

          {activeFeatureTab === 'TELEMETRY' && (
            <>
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-extrabold uppercase text-teal-600 dark:text-teal-400">Live Hospital Telemetry</span>
                <h3 className="text-2xl font-black">Real-Time Bed, ICU & Waiting Queue Monitoring</h3>
                <p className="text-xs opacity-80 leading-relaxed font-medium">
                  Eliminating emergency room guesswork. Hospitals maintain live counts of general beds, ICU availability, and estimated waiting queues so patients and ambulances can navigate straight to available resources.
                </p>
                <div className="space-y-2 text-xs font-bold">
                  <div className="flex items-center gap-2 text-emerald-600"><CheckCircle className="w-4 h-4" /> Hospital Admin Capacity Control Panel</div>
                  <div className="flex items-center gap-2 text-emerald-600"><CheckCircle className="w-4 h-4" /> Real-Time ICU availability updates</div>
                </div>
              </div>
              <div className="lg:col-span-6 space-y-3">
                <div className="p-4 rounded-2xl glass-card border border-teal-500/30">
                  <div className="flex justify-between font-bold text-xs">
                    <span>Tikur Anbessa Hospital</span>
                    <span className="text-teal-600">720 / 800 Beds</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-teal-600 h-full w-[90%]"></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeFeatureTab === 'SOS' && (
            <>
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-extrabold uppercase text-rose-500">WebSocket Dispatch</span>
                <h3 className="text-2xl font-black">1-Tap Emergency SOS & Ambulance Trackers</h3>
                <p className="text-xs opacity-80 leading-relaxed font-medium">
                  In critical emergencies, pressing the SOS button broadcasts live patient coordinates directly to available mobile ambulance units with continuous 5-second GPS position updates.
                </p>
              </div>
              <div className="lg:col-span-6 p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-3">
                <div className="flex justify-between font-bold text-rose-600">
                  <span className="flex items-center gap-1.5"><Siren className="w-4 h-4 animate-bounce" /> Emergency Beacon Active</span>
                  <span>GPS Broadcasted</span>
                </div>
                <div className="font-bold text-sm">Ambulance Unit CODE-3-A109 Dispatched</div>
              </div>
            </>
          )}

          {activeFeatureTab === 'PAYMENTS' && (
            <>
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-extrabold uppercase text-cyan-600">Financial Inclusion</span>
                <h3 className="text-2xl font-black">Telebirr, Chapa & CBE Birr Payment Gateways</h3>
                <p className="text-xs opacity-80 leading-relaxed font-medium">
                  Integrated with local payment platforms for instant medical bill settlement, pharmacy prescriptions, and lab test invoices without requiring credit cards.
                </p>
              </div>
              <div className="lg:col-span-6 grid grid-cols-2 gap-4 text-center">
                <div className="p-4 rounded-2xl glass-card border border-white/20 font-black text-sm text-teal-600">
                  telebirr
                </div>
                <div className="p-4 rounded-2xl glass-card border border-white/20 font-black text-sm text-cyan-600">
                  CHAPA
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ================= HOSPITALS SECTION ================= */}
      <section id="hospitals-section" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/20 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Live Hospital Network</span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-1">{t('hospitals')}</h2>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3.5 opacity-60" />
            <input
              type="text"
              placeholder="Search by hospital name or city..."
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200/40 bg-white/20 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-teal-700"
              value={hospQuery}
              onChange={(e) => setHospQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredHospitals.map((hosp) => (
            <div key={hosp.id || hosp.name} className="p-6 rounded-3xl glass-card-pro border border-white/20 shadow-xl space-y-4 hover-scale">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-base leading-snug">{hosp.name}</h3>
                  <span className="text-xs opacity-60 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {hosp.city}
                  </span>
                </div>
                {hosp.isEmergencyAvailable && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    24/7 ER
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3 bg-white/10 rounded-xl">
                  <span className="opacity-60 text-[10px] uppercase font-bold block">Bed Occupancy</span>
                  <strong className="text-xs font-bold text-teal-600">{hosp.occupiedBeds} / {hosp.totalBeds}</strong>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <span className="opacity-60 text-[10px] uppercase font-bold block">ICU Units</span>
                  <strong className="text-xs font-bold text-cyan-600">{hosp.occupiedICUBeds} / {hosp.totalICUBeds}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= BLOOD BANK SECTION ================= */}
      <section id="blood-section" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="border-b border-slate-200/20 pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Emergency Resources</span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1">National Blood Reserves</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bloodStocksList.map((item, idx) => (
            <div key={idx} className="p-5 rounded-2xl glass-card border border-rose-500/20 hover-scale space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-black text-rose-500">{item.group}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                  item.status === 'CRITICAL' ? 'bg-rose-500/20 text-rose-600' : 'bg-emerald-500/20 text-emerald-600'
                }`}>
                  {item.status}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-xs">{item.hospital}</h4>
                <span className="text-[10px] opacity-60 font-semibold">{item.count} Bags Available</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-teal-900 via-teal-800 to-cyan-900 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-black">Ready to Experience MediLink AI?</h3>
            <p className="text-xs opacity-80 max-w-xl font-medium">
              Join thousands of healthcare providers, patients, and emergency responders across Ethiopia.
            </p>
          </div>
          <Link
            href="/auth"
            className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-2xl shadow-xl transition hover-scale text-xs uppercase tracking-wider"
          >
            Access Platform Portals
          </Link>
        </div>
      </section>

      {/* ================= FOOTER SECTION ================= */}
      <footer className="mt-16 border-t border-slate-200/20 bg-slate-900/90 dark:bg-slate-950/90 text-slate-300 pt-16 pb-12 px-4 sm:px-6 lg:px-8 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 text-xs">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20">
                <Activity className="w-6 h-6 text-white animate-pulse" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                MediLink <span className="text-teal-400">AI</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium max-w-sm text-xs">
              Ethiopia’s Premier Healthcare AI Infrastructure. Bridging clinical triage, real-time hospital bed telemetry, Telebirr payments, and 1-Tap emergency SOS ambulance dispatch.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-extrabold text-teal-400">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>All 12 National Referral Nodes Online</span>
            </div>
          </div>

          {/* Col 2: Platform Portals */}
          <div className="space-y-3">
            <h4 className="font-extrabold uppercase tracking-wider text-white text-xs">Role Portals</h4>
            <ul className="space-y-2 font-medium opacity-80 text-xs">
              <li><Link href="/auth" className="hover:text-teal-400 transition">Patient Workspace</Link></li>
              <li><Link href="/auth" className="hover:text-teal-400 transition">Doctor Consultation Hub</Link></li>
              <li><Link href="/auth" className="hover:text-teal-400 transition">Hospital Admin Console</Link></li>
              <li><Link href="/auth" className="hover:text-teal-400 transition">Laboratory Diagnostics</Link></li>
              <li><Link href="/auth" className="hover:text-teal-400 transition">Kenema Pharmacy Portal</Link></li>
              <li><Link href="/auth" className="hover:text-teal-400 transition">Ambulance Dispatch Hub</Link></li>
            </ul>
          </div>

          {/* Col 3: Key Innovations */}
          <div className="space-y-3">
            <h4 className="font-extrabold uppercase tracking-wider text-white text-xs">Core Features</h4>
            <ul className="space-y-2 font-medium opacity-80 text-xs">
              <li><a href="#features-section" className="hover:text-teal-400 transition">Multilingual AI Triage</a></li>
              <li><a href="#hospitals-section" className="hover:text-teal-400 transition">Live Bed & ICU Counters</a></li>
              <li><a href="#blood-section" className="hover:text-teal-400 transition">National Blood Bank Ticker</a></li>
              <li><a href="#" className="hover:text-teal-400 transition">Telebirr & Chapa Payments</a></li>
              <li><a href="#" className="hover:text-teal-400 transition">Encrypted Telemedicine</a></li>
            </ul>
          </div>

          {/* Col 4: Emergency Contacts */}
          <div className="space-y-3">
            <h4 className="font-extrabold uppercase tracking-wider text-rose-400 text-xs flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Emergency Hotlines
            </h4>
            <div className="space-y-2 font-medium text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-rose-500/20 flex justify-between items-center">
                <span>National Health Hotline</span>
                <strong className="text-rose-400 font-extrabold">907</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-rose-500/20 flex justify-between items-center">
                <span>Ambulance Emergency</span>
                <strong className="text-rose-400 font-extrabold">911</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-rose-500/20 flex justify-between items-center">
                <span>Tikur Anbessa ER</span>
                <strong className="text-rose-400 font-extrabold">+251 11 551 1211</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright sub-bar */}
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] opacity-60 font-medium">
          <div>
            © 2026 MediLink AI. Built with pride for Ethiopia 🇪🇹
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Clinical AI Safety Disclaimers</a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {symptomModalOpen && (
        <SymptomCheckerModal isOpen={symptomModalOpen} onClose={() => setSymptomModalOpen(false)} />
      )}

      {sosPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl glass-card border border-white/20 p-6">
            <button 
              onClick={() => setSosPanelOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200/30 transition text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
            <SOSWidget patientId="guest-patient-demo" />
          </div>
        </div>
      )}
    </div>
  );
}
