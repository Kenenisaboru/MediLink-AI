'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../../components/LanguageContext';
import { SymptomCheckerModal } from '../../../components/SymptomCheckerModal';
import { SOSWidget } from '../../../components/SOSWidget';
import {
  Activity,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  Heart,
  Plus,
  ShieldAlert,
  User,
  Video,
  CheckCircle,
  AlertTriangle,
  LogOut,
  Loader2,
  Stethoscope,
  Droplet,
  Zap,
  TrendingUp,
  Sparkles,
  ChevronRight,
  QrCode,
  X,
  PhoneCall,
  Search,
  Crown,
  Check,
  Bell,
  Pill,
  Thermometer,
  Award,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import api from '../../../lib/api';
import { clearTokens } from '../../../lib/auth';
import { useAuthGuard } from '../../../hooks/useAuthGuard';

// ── Types ────────────────────────────────────────────────────────────────────
interface PatientProfile {
  id: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup: string | null;
  allergies: string[];
  chronicDiseases: string[];
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

interface Appointment {
  id: string;
  dateTime: string;
  status: string;
  notes: string | null;
  telemedicineRoomId: string | null;
  doctor: {
    fullName: string;
    specialty: string;
    hospital: { name: string };
  };
}

interface Transaction {
  id: string;
  amount: number;
  gateway: string;
  reference: string;
  status: string;
  createdAt: string;
}

interface MedicalRecord {
  id: string;
  diagnosis: string;
  date: string;
  doctor: { fullName: string };
}

type TabType = 'overview' | 'triage' | 'appointments' | 'records' | 'prescriptions' | 'membership';

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    ACCEPTED: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500 animate-pulse' },
    PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-500' },
    COMPLETED: { bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-500' },
    REJECTED: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-500' },
    CANCELLED: { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/20', dot: 'bg-slate-400' },
    SUCCESS: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
    FAILED: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-500' },
  };
  const config = map[status] ?? { bg: 'bg-slate-500/10', text: 'text-slate-600', border: 'border-slate-500/20', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ET', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PatientDashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard('PATIENT');

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  // Membership Tier State
  const [membershipTier, setMembershipTier] = useState<'FREE' | 'PRO' | 'FAMILY'>('FREE');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<{ name: string; price: number; tier: 'PRO' | 'FAMILY' } | null>(null);

  const [symptomModalOpen, setSymptomModalOpen] = useState(false);
  const [paymentModalTx, setPaymentModalTx] = useState<Transaction | null>(null);
  const [telemedicineRoom, setTelemedicineRoom] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({ doctorId: '', dateTime: '', notes: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [profileRes, apptRes, txRes, recordsRes] = await Promise.all([
        api.get('/patient/profile'),
        api.get('/patient/appointments'),
        api.get('/patient/transactions'),
        api.get('/patient/medical-history'),
      ]);
      setProfile(profileRes.data);
      setAppointments(apptRes.data);
      setTransactions(txRes.data);
      setMedicalRecords(recordsRes.data);
    } catch (err: any) {
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, fetchData]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.doctorId || !bookingForm.dateTime) {
      setMessage('Doctor ID and date/time are required.');
      return;
    }
    setBookingLoading(true);
    try {
      const { data } = await api.post('/patient/appointments', bookingForm);
      setAppointments((prev) => [data, ...prev]);
      setBookingForm({ doctorId: '', dateTime: '', notes: '' });
      setMessage('Appointment booked successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.error ?? 'Booking failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePayment = async (gateway: string, amount: number) => {
    try {
      const { data } = await api.post('/payments/initiate', { gateway, amount });
      setMessage(`Payment initiated. Ref: ${data.reference}. Redirecting to payment portal...`);
      if (selectedPlanForCheckout) {
        setMembershipTier(selectedPlanForCheckout.tier);
        setSelectedPlanForCheckout(null);
        setUpgradeModalOpen(false);
      }
      setTimeout(() => window.open(data.paymentUrl, '_blank'), 1200);
    } catch {
      setMessage('Payment initiation failed.');
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push('/auth');
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
        <span className="text-xs text-slate-400 font-bold tracking-wider mt-4 uppercase animate-pulse">
          Loading MediLink Pro Health Command...
        </span>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(
    (a) => a.status !== 'CANCELLED' && a.status !== 'REJECTED'
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Dynamic Background Depth */}
      <div className="fixed inset-0 bg-mesh -z-10 pointer-events-none" />
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal-500/10 blur-[140px] pointer-events-none animate-float" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none animate-float-delayed" />

      {/* ── LEFT NAVIGATION SIDEBAR (SIDE-BY-SIDE) ── */}
      <aside className="w-72 hidden lg:flex flex-col justify-between sticky top-0 h-screen bg-white/70 dark:bg-slate-900/60 border-r border-slate-200/40 dark:border-slate-800/40 backdrop-blur-md p-6 shrink-0 z-20">
        <div className="space-y-8">
          
          {/* Logo & Brand info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-lg tracking-tight bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">
                MediLink AI
              </div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-teal-600 dark:text-teal-400 block mt-[-4px]">
                Health Command
              </span>
            </div>
          </div>

          {/* Profile Card */}
          <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500 text-white font-black flex items-center justify-center text-sm shadow-md">
                {profile?.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-xs truncate">{profile?.fullName}</div>
                <div className="text-[10px] text-slate-400 truncate">{profile?.gender}</div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase flex items-center gap-1 ${
                membershipTier === 'PRO'
                  ? 'bg-amber-500/20 text-amber-500'
                  : membershipTier === 'FAMILY'
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                <Crown className="w-2.5 h-2.5 fill-current" /> {membershipTier}
              </span>
              {membershipTier === 'FREE' && (
                <button
                  onClick={() => setUpgradeModalOpen(true)}
                  className="text-[10px] font-black text-amber-500 hover:underline"
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>

          {/* Sidebar Menu Links */}
          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Overview & Vitals', icon: Activity },
              { id: 'triage', label: 'AI Symptom Checker', icon: Sparkles },
              { id: 'appointments', label: 'Appointments', icon: Calendar },
              { id: 'records', label: 'EHR Medical History', icon: FileText },
              { id: 'prescriptions', label: 'Prescriptions & Meds', icon: Pill },
              { id: 'membership', label: 'Membership Plans', icon: Crown },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-extrabold transition-all ${
                  activeTab === id
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

        </div>

        {/* Sidebar Footer */}
        <div className="space-y-4 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold text-xs active:scale-95 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>

      {/* ── RIGHT MAIN PANEL CONTENT AREA ── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/40 dark:border-slate-800/40 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center text-white">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-black text-base text-teal-600">MediLink</span>
          </div>

          {/* Quick Tab Selector for Mobile */}
          <div className="flex items-center gap-2">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabType)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-black"
            >
              <option value="overview">Overview & Vitals</option>
              <option value="triage">AI Symptom Checker</option>
              <option value="appointments">Appointments</option>
              <option value="records">EHR History</option>
              <option value="prescriptions">Prescriptions</option>
              <option value="membership">Membership Upgrade</option>
            </select>

            <button onClick={handleLogout} className="p-2 text-rose-500">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-8 space-y-8">
          
          {/* Top Panel Actions & Vitals Telemetry Header (Includes Search) */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200/40 dark:border-slate-800/40 pb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight capitalize">
                {activeTab.replace('-', ' ')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your patient telemetry, clinical appointments, and memberships.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search health records, doctors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
              </div>
            </div>
          </div>

          {/* Global Toast Messages */}
          {(message || error) && (
            <div className={`flex items-center gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all ${
              error
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                : 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300'
            }`}>
              {error ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              <span className="text-sm font-bold">{message || error}</span>
            </div>
          )}

          {/* ── TAB 1: OVERVIEW & VITALS ── */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Upgrade Banner for Free Users */}
              {membershipTier === 'FREE' && (
                <div className="glass-card-pro rounded-3xl p-6 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-teal-500/10 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl">
                  <div className="flex items-center gap-4 z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 shrink-0">
                      <Crown className="w-7 h-7 fill-current" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                        Upgrade to MediLink AI Pro — Unlock 24/7 Unlimited AI Consultations
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Get instant priority emergency dispatch, 15% discount on hospital checkups, and direct Telemedicine video rooms for 499 ETB/mo.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUpgradeModalOpen(true)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-105 transition-all shrink-0 z-10"
                  >
                    View Pro Membership Plans
                  </button>
                </div>
              )}

              {/* Patient Header Card */}
              {profile && (
                <div className="glass-card-pro rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-white/20 dark:border-slate-800/20">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex items-start gap-5">
                      <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-teal-500/30 shrink-0">
                        {profile.fullName.charAt(0)}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <h2 className="text-2xl font-black tracking-tight">{profile.fullName}</h2>
                          {profile.bloodGroup && (
                            <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-black text-xs flex items-center gap-1">
                              <Droplet className="w-3.5 h-3.5 fill-current" /> {profile.bloodGroup}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Gender: {profile.gender} · Born: {new Date(profile.dateOfBirth).toLocaleDateString('en-ET')} · Emergency: {profile.emergencyContactName ?? 'N/A'} ({profile.emergencyContactPhone ?? 'N/A'})
                        </p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {profile.chronicDiseases.map((d) => (
                            <span key={d} className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs">
                              {d}
                            </span>
                          ))}
                          {profile.allergies.map((a) => (
                            <span key={a} className="px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-400 font-bold text-xs">
                              ⚠ Allergy: {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Daily Overall Health Score Badge */}
                    <div className="glass-card rounded-2xl p-4 border border-teal-500/30 flex items-center gap-4">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="6" className="text-slate-200 dark:text-slate-800" fill="transparent" />
                          <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="6" className="text-teal-500" strokeDasharray="163" strokeDashoffset="16" fill="transparent" />
                        </svg>
                        <span className="absolute font-black text-sm text-teal-600 dark:text-teal-400">92%</span>
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase text-slate-400">Health Index</div>
                        <div className="text-sm font-black text-emerald-500">EXCELLENT</div>
                        <div className="text-[10px] text-slate-500">Updated 5m ago</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vitals Telemetry Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { title: 'Heart Rate', value: '72 BPM', status: 'Normal', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10', spark: '📈 Stable' },
                  { title: 'Blood Pressure', value: '120/80', status: 'Optimal', icon: Activity, color: 'text-teal-500', bg: 'bg-teal-500/10', spark: 'Optimal' },
                  { title: 'Blood Glucose', value: '95 mg/dL', status: 'Fasting Normal', icon: Droplet, color: 'text-cyan-500', bg: 'bg-cyan-500/10', spark: 'Optimal' },
                  { title: 'BMI & Weight', value: '22.4 BMI', status: '68.5 kg', icon: Thermometer, color: 'text-purple-500', bg: 'bg-purple-500/10', spark: 'Ideal Range' },
                ].map((v) => (
                  <div key={v.title} className="glass-card-pro p-6 rounded-3xl space-y-3 border border-white/20 dark:border-slate-800/20 hover:scale-[1.02] transition-transform">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-slate-400">{v.title}</span>
                      <div className={`p-2.5 rounded-xl ${v.bg} ${v.color}`}>
                        <v.icon className="w-5 h-5 fill-current" />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-black">{v.value}</div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="font-bold text-emerald-500">{v.status}</span>
                        <span className="text-slate-400 text-[10px]">{v.spark}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upcoming Consultations & Action Shortcuts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-teal-500" /> Upcoming Consultations
                    </h3>
                    <button onClick={() => setActiveTab('appointments')} className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">
                      View All ({upcomingAppointments.length})
                    </button>
                  </div>

                  <div className="space-y-4">
                    {upcomingAppointments.length === 0 ? (
                      <div className="glass-card-pro rounded-3xl p-8 text-center opacity-60 text-xs font-semibold">
                        No upcoming appointments scheduled.
                      </div>
                    ) : (
                      upcomingAppointments.slice(0, 3).map((appt) => (
                        <div key={appt.id} className="glass-card-pro rounded-3xl p-6 border-l-4 border-teal-500 hover:shadow-xl transition-all duration-300">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-base">{appt.doctor.fullName}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {appt.doctor.specialty} · {appt.doctor.hospital.name}
                              </p>
                              <div className="text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1 mt-1">
                                <Clock className="w-3.5 h-3.5" /> {formatDate(appt.dateTime)}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {statusBadge(appt.status)}
                              {appt.status === 'ACCEPTED' && appt.telemedicineRoomId && (
                                <button
                                  onClick={() => setTelemedicineRoom(appt.telemedicineRoomId)}
                                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:scale-105 transition"
                                >
                                  <Video className="w-3.5 h-3.5" /> Join Video Call
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Action Hub */}
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" /> Quick Patient Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { title: 'AI Symptom Checker', desc: 'Multilingual Triage', icon: Sparkles, action: () => setSymptomModalOpen(true), color: 'from-teal-600 to-cyan-600' },
                      { title: 'Book Doctor', desc: 'Schedule Visit', icon: Calendar, action: () => setActiveTab('appointments'), color: 'from-cyan-600 to-blue-600' },
                      { title: 'View Records', desc: 'EHR & Labs', icon: FileText, action: () => setActiveTab('records'), color: 'from-blue-600 to-indigo-600' },
                      { title: 'Emergency SOS', desc: 'Ambulance Dispatch', icon: ShieldAlert, action: () => document.getElementById('sos-widget-anchor')?.scrollIntoView({ behavior: 'smooth' }), color: 'from-rose-600 to-red-600' },
                    ].map((act) => (
                      <button
                        key={act.title}
                        onClick={act.action}
                        className="glass-card-pro p-5 rounded-3xl text-left space-y-3 border border-white/20 dark:border-slate-800/20 hover-scale"
                      >
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${act.color} flex items-center justify-center text-white shadow-md`}>
                          <act.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-extrabold text-xs">{act.title}</div>
                          <div className="text-[10px] text-slate-400">{act.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Emergency SOS Anchor */}
              <div id="sos-widget-anchor" className="glass-card-pro rounded-3xl border border-rose-500/30 p-8 shadow-2xl space-y-4">
                <h3 className="text-xl font-black text-rose-600 flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6 animate-pulse" /> Emergency SOS Ambulance Broadcast
                </h3>
                {profile ? <SOSWidget patientId={profile.id} /> : <div className="text-xs opacity-60">Initializing SOS...</div>}
              </div>

            </div>
          )}

          {/* ── TAB 2: AI SYMPTOM CHECKER ── */}
          {activeTab === 'triage' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="glass-card-pro rounded-3xl p-8 border border-teal-500/30 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight">Multilingual AI Clinical Symptom Checker</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Supports Amharic (አማርኛ), Afaan Oromo, and English. Powered by Google Gemini AI.
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/5 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 text-center space-y-4">
                  <p className="text-sm font-semibold">
                    Click below to launch the interactive AI symptom assessment module.
                  </p>
                  <button
                    onClick={() => setSymptomModalOpen(true)}
                    className="px-8 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-black text-xs rounded-2xl shadow-xl hover:scale-105 transition"
                  >
                    Launch AI Symptom Assessment
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: APPOINTMENTS ── */}
          {activeTab === 'appointments' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
              
              {/* Appointments List (7/12) */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-500" /> Scheduled Appointments
                </h3>

                <div className="space-y-4">
                  {appointments.length === 0 ? (
                    <div className="glass-card-pro rounded-3xl p-8 text-center opacity-60 text-xs font-semibold">
                      No appointments booked yet.
                    </div>
                  ) : (
                    appointments.map((appt) => (
                      <div key={appt.id} className="glass-card-pro rounded-3xl p-6 border border-white/20 dark:border-slate-800/20 hover:shadow-xl transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="font-extrabold text-base">{appt.doctor.fullName}</div>
                            <div className="text-xs text-slate-500">{appt.doctor.specialty} · {appt.doctor.hospital.name}</div>
                            <div className="text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1 mt-1">
                              <Clock className="w-3.5 h-3.5" /> {formatDate(appt.dateTime)}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {statusBadge(appt.status)}
                            {appt.status === 'ACCEPTED' && appt.telemedicineRoomId && (
                              <button
                                onClick={() => setTelemedicineRoom(appt.telemedicineRoomId)}
                                className="px-3.5 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl shadow-lg hover:scale-105 transition flex items-center gap-1.5"
                              >
                                <Video className="w-3.5 h-3.5" /> Join Room
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Booking Form (5/12) */}
              <div className="lg:col-span-5 glass-card-pro rounded-3xl p-6 border border-cyan-500/20 shadow-2xl space-y-4">
                <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                  <Plus className="w-5 h-5 text-cyan-500" /> Book New Consultation
                </h3>

                <form onSubmit={handleBookAppointment} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Doctor ID</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/60 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                      placeholder="Doctor Profile ID"
                      value={bookingForm.doctorId}
                      onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appointment Date & Time</label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/60 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                      value={bookingForm.dateTime}
                      onChange={(e) => setBookingForm({ ...bookingForm, dateTime: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes for Doctor (Optional)</label>
                    <textarea
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/60 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none h-20"
                      placeholder="Describe symptoms..."
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg"
                  >
                    {bookingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    Confirm Booking
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* ── TAB 4: MEDICAL RECORDS ── */}
          {activeTab === 'records' && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" /> Electronic Medical Health Records (EHR)
              </h3>

              <div className="space-y-4">
                {medicalRecords.length === 0 ? (
                  <div className="glass-card-pro rounded-3xl p-8 text-center opacity-60 text-xs font-semibold">
                    No medical records logged yet.
                  </div>
                ) : (
                  medicalRecords.map((rec) => (
                    <div key={rec.id} className="glass-card-pro rounded-3xl p-6 space-y-3 border border-white/20 dark:border-slate-800/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-extrabold text-base text-slate-800 dark:text-slate-200">{rec.diagnosis}</div>
                          <div className="text-xs text-slate-500">Dr. {rec.doctor.fullName} · {formatDate(rec.date)}</div>
                        </div>
                        <Stethoscope className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── TAB 5: PRESCRIPTIONS ── */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Pill className="w-5 h-5 text-purple-500" /> Active Prescriptions & Refill Tracker
              </h3>

              <div className="glass-card-pro rounded-3xl p-8 text-center opacity-60 text-xs font-semibold">
                No active prescription refills requested. Check back after your next consultation.
              </div>
            </div>
          )}

          {/* ── TAB 6: MEMBERSHIP PLANS ── */}
          {activeTab === 'membership' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="text-center space-y-2 max-w-2xl mx-auto">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold text-xs inline-flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 fill-current" /> Upgrade Your Care Plan
                </span>
                <h2 className="text-3xl font-black tracking-tight">Flexible Healthcare Membership Tiers</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Unlock 24/7 AI Triage, Telemedicine Video Calls, and Priority Emergency Ambulance Telemetry.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Free Plan */}
                <div className="glass-card-pro p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-sm font-extrabold uppercase text-slate-400">Free Basic Plan</div>
                    <div className="text-3xl font-black">0 ETB <span className="text-xs font-semibold text-slate-400">/ forever</span></div>
                    <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Standard Hospital Appointments</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Basic Symptom Checker</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Basic EHR Medical History</li>
                    </ul>
                  </div>
                  <button disabled className="w-full py-3 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold text-xs">
                    {membershipTier === 'FREE' ? 'Current Plan' : 'Free Tier'}
                  </button>
                </div>

                {/* Pro Plan */}
                <div className="glass-card-pro p-8 rounded-3xl border-2 border-amber-500/60 relative space-y-6 flex flex-col justify-between shadow-2xl scale-105 bg-gradient-to-b from-amber-500/5 to-transparent">
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] uppercase shadow-md">
                    Most Popular
                  </span>
                  <div className="space-y-4">
                    <div className="text-sm font-extrabold uppercase text-amber-500">MediLink Pro Plan</div>
                    <div className="text-3xl font-black">499 ETB <span className="text-xs font-semibold text-slate-400">/ month</span></div>
                    <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-2 font-semibold"><Check className="w-4 h-4 text-amber-500" /> 24/7 Unlimited Gemini AI Triage</li>
                      <li className="flex items-center gap-2 font-semibold"><Check className="w-4 h-4 text-amber-500" /> Telemedicine HD Video Calls</li>
                      <li className="flex items-center gap-2 font-semibold"><Check className="w-4 h-4 text-amber-500" /> Priority ER Ambulance Telemetry</li>
                      <li className="flex items-center gap-2 font-semibold"><Check className="w-4 h-4 text-amber-500" /> 15% Pharmacy & Lab Discounts</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setSelectedPlanForCheckout({ name: 'MediLink Pro', price: 499, tier: 'PRO' })}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:scale-105 transition"
                  >
                    {membershipTier === 'PRO' ? 'Active Pro Plan' : 'Subscribe for 499 ETB'}
                  </button>
                </div>

                {/* Family Care Plan */}
                <div className="glass-card-pro p-8 rounded-3xl border border-indigo-500/30 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="text-sm font-extrabold uppercase text-indigo-400">Family Care Plan</div>
                    <div className="text-3xl font-black">999 ETB <span className="text-xs font-semibold text-slate-400">/ month</span></div>
                    <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> Includes Up to 5 Family Members</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> Dedicated Doctor Hotline</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400" /> Annual Health Checkup Included</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setSelectedPlanForCheckout({ name: 'Family Care', price: 999, tier: 'FAMILY' })}
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg hover:scale-105 transition"
                  >
                    {membershipTier === 'FAMILY' ? 'Active Family Plan' : 'Subscribe for 999 ETB'}
                  </button>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Modals & Drawers ── */}

      {/* Upgrade Plan Trigger Modal */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl glass-card-pro rounded-3xl border border-amber-500/40 p-8 space-y-6 relative">
            <button onClick={() => setUpgradeModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                <Crown className="w-6 h-6 fill-current" />
              </div>
              <h3 className="text-xl font-black">Upgrade to MediLink AI Pro</h3>
              <p className="text-xs text-slate-400">Select a membership tier to continue with instant Ethiopian payment checkout.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setSelectedPlanForCheckout({ name: 'MediLink Pro', price: 499, tier: 'PRO' })}
                className="p-5 rounded-2xl glass-card border border-amber-500/30 hover:border-amber-500 cursor-pointer space-y-2 text-center"
              >
                <div className="font-extrabold text-sm text-amber-500">MediLink Pro</div>
                <div className="text-xl font-black">499 ETB/mo</div>
                <div className="text-[10px] text-slate-400">Unlimited AI Triage & Telemedicine</div>
              </div>

              <div
                onClick={() => setSelectedPlanForCheckout({ name: 'Family Care', price: 999, tier: 'FAMILY' })}
                className="p-5 rounded-2xl glass-card border border-indigo-500/30 hover:border-indigo-500 cursor-pointer space-y-2 text-center"
              >
                <div className="font-extrabold text-sm text-indigo-400">Family Care</div>
                <div className="text-xl font-black">999 ETB/mo</div>
                <div className="text-[10px] text-slate-400">5 Accounts & Dedicated Hotline</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Checkout & Gateway Selection */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-card-pro rounded-3xl border border-amber-500/40 p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-4 h-4 fill-current" /> Checkout: {selectedPlanForCheckout.name}
              </span>
              <button onClick={() => setSelectedPlanForCheckout(null)} className="p-1 rounded-full hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <div className="text-3xl font-black text-amber-400">{selectedPlanForCheckout.price} ETB</div>
              <p className="text-xs text-slate-400">Monthly Membership Subscription</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {['TELEBIRR', 'CHAPA', 'CBEBIRR', 'SANTIMPAY'].map((gw) => (
                <button
                  key={gw}
                  onClick={() => handlePayment(gw, selectedPlanForCheckout.price)}
                  className="p-4 rounded-2xl glass-card border border-amber-500/20 hover:border-amber-500 hover-scale text-center font-black text-xs space-y-1"
                >
                  <QrCode className="w-5 h-5 mx-auto text-amber-400" />
                  <div>{gw}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Symptom Checker Modal */}
      <SymptomCheckerModal
        isOpen={symptomModalOpen}
        onClose={() => setSymptomModalOpen(false)}
      />

      {/* Telemedicine Video Call Modal Simulation */}
      {telemedicineRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl glass-card-pro rounded-3xl border border-teal-500/30 p-6 space-y-5 text-center">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-4 h-4 animate-pulse" /> Telemedicine Live Consultation
              </span>
              <button onClick={() => setTelemedicineRoom(null)} className="p-1 rounded-full hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="w-full h-64 rounded-2xl bg-slate-900 border border-teal-500/20 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-mesh opacity-20" />
              <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 animate-pulse">
                <PhoneCall className="w-8 h-8" />
              </div>
              <span className="text-sm font-bold text-slate-200">Connecting to Encrypted Doctor Room...</span>
              <span className="text-xs text-slate-500">Room ID: {telemedicineRoom}</span>
            </div>

            <button
              onClick={() => setTelemedicineRoom(null)}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition"
            >
              End Call
            </button>
          </div>
        </div>
      )}

      {/* Bill Checkout Selector Modal */}
      {paymentModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-card-pro rounded-3xl border border-purple-500/30 p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                Select Ethiopian Payment Gateway
              </span>
              <button onClick={() => setPaymentModalTx(null)} className="p-1 rounded-full hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <div className="text-2xl font-black">{paymentModalTx.amount.toLocaleString()} ETB</div>
              <p className="text-xs text-slate-400">Reference: {paymentModalTx.reference}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {['TELEBIRR', 'CHAPA', 'CBEBIRR', 'SANTIMPAY'].map((gw) => (
                <button
                  key={gw}
                  onClick={() => {
                    handlePayment(gw, paymentModalTx.amount);
                    setPaymentModalTx(null);
                  }}
                  className="p-4 rounded-2xl glass-card border border-purple-500/20 hover:border-purple-500/50 hover-scale text-center font-black text-xs space-y-1"
                >
                  <QrCode className="w-5 h-5 mx-auto text-purple-400" />
                  <div>{gw}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
