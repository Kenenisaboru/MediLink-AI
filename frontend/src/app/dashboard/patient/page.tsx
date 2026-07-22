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

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  const [symptomModalOpen, setSymptomModalOpen] = useState(false);
  const [paymentModalTx, setPaymentModalTx] = useState<Transaction | null>(null);
  const [telemedicineRoom, setTelemedicineRoom] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({ doctorId: '', dateTime: '', notes: '' });

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
          Loading Patient Health Command...
        </span>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(
    (a) => a.status !== 'CANCELLED' && a.status !== 'REJECTED'
  );

  return (
    <div className="min-h-screen relative pb-24 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Background depth elements */}
      <div className="fixed inset-0 bg-mesh -z-10 pointer-events-none" />
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none animate-float" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none animate-float-delayed" />

      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-30 glass-card-pro border-b border-slate-200/40 dark:border-slate-800/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 dark:bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/20 animate-pulse-glow">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-teal-600 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                MediLink AI
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-teal-600 block mt-[-4px]">
                Patient Health Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
              <User className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold opacity-80">
                {profile?.fullName ?? (user?.profile as any)?.fullName ?? 'Patient'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">

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

        {/* ── Hero Profile & Vitals Telemetry Banner ── */}
        {profile && (
          <div className="glass-card-pro rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-white/20 dark:border-slate-800/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-teal-500/30 shrink-0">
                  {profile.fullName.charAt(0)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black tracking-tight">{profile.fullName}</h2>
                    {profile.bloodGroup && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-extrabold text-xs flex items-center gap-1">
                        <Droplet className="w-3 h-3 fill-current" /> {profile.bloodGroup}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {profile.gender} · DOB: {new Date(profile.dateOfBirth).toLocaleDateString('en-ET')}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {profile.chronicDiseases.map((d) => (
                      <span key={d} className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
                        {d}
                      </span>
                    ))}
                    {profile.allergies.map((a) => (
                      <span key={a} className="px-2.5 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-400 font-bold text-[11px]">
                        ⚠ Allergy: {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vitals Quick Gauge Widget */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/5 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/80">
                <div className="text-center space-y-1 p-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Heart Rate</span>
                  <div className="text-lg font-black text-rose-500 flex items-center justify-center gap-1">
                    <Heart className="w-4 h-4 fill-current animate-pulse" /> 72 <span className="text-[10px] font-normal text-slate-400">BPM</span>
                  </div>
                </div>
                <div className="text-center space-y-1 p-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Blood Pressure</span>
                  <div className="text-lg font-black text-teal-500 flex items-center justify-center gap-1">
                    <Activity className="w-4 h-4" /> 120/80
                  </div>
                </div>
                <div className="text-center space-y-1 p-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">SpO2 Oxygen</span>
                  <div className="text-lg font-black text-cyan-500 flex items-center justify-center gap-1">
                    <Zap className="w-4 h-4" /> 98%
                  </div>
                </div>
                <div className="text-center space-y-1 p-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Triage Status</span>
                  <div className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg inline-block mt-0.5">
                    STABLE
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Action Navigation Hub ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { icon: Sparkles, label: 'AI Symptom Check', action: () => setSymptomModalOpen(true), gradient: 'from-teal-600 to-cyan-600', color: 'teal' },
            { icon: Calendar, label: 'Book Appointment', action: () => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' }), gradient: 'from-cyan-600 to-blue-600', color: 'cyan' },
            { icon: FileText, label: 'Medical History', action: () => document.getElementById('records-section')?.scrollIntoView({ behavior: 'smooth' }), gradient: 'from-blue-600 to-indigo-600', color: 'blue' },
            { icon: ShieldAlert, label: 'Emergency SOS', action: () => document.getElementById('sos-section')?.scrollIntoView({ behavior: 'smooth' }), gradient: 'from-rose-600 to-red-600', color: 'rose' },
          ].map(({ icon: Icon, label, action, gradient, color }) => (
            <button
              key={label}
              onClick={action}
              className="glass-card-pro p-5 rounded-3xl hover-scale flex flex-col items-center gap-3 text-center transition-all duration-300 group border border-white/20 dark:border-slate-800/20"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold tracking-tight">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Main Workspace Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Appointments & Records (7/12) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Appointments Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-500" /> Upcoming Consultations
                </h3>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  {upcomingAppointments.length} Active
                </span>
              </div>

              <div className="space-y-4">
                {upcomingAppointments.length === 0 ? (
                  <div className="glass-card-pro rounded-3xl p-8 text-center opacity-60 text-xs font-semibold">
                    No upcoming appointments scheduled.
                  </div>
                ) : (
                  upcomingAppointments.map((appt) => (
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
                              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:scale-105 transition"
                            >
                              <Video className="w-3.5 h-3.5" /> Telemedicine Call
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Medical History Records */}
            <section id="records-section" className="space-y-4">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" /> Electronic Medical History
              </h3>
              <div className="space-y-3">
                {medicalRecords.length === 0 ? (
                  <div className="glass-card-pro rounded-3xl p-8 text-center opacity-60 text-xs font-semibold">
                    No clinical history recorded yet.
                  </div>
                ) : (
                  medicalRecords.slice(0, 5).map((rec) => (
                    <div key={rec.id} className="glass-card-pro rounded-2xl p-5 hover:shadow-lg transition-all duration-300">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{rec.diagnosis}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Dr. {rec.doctor.fullName} · {formatDate(rec.date)}
                          </div>
                        </div>
                        <Stethoscope className="w-5 h-5 text-blue-500 opacity-60" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>

          {/* Right Column: Booking & Billing (5/12) */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
            
            {/* Appointment Booking Form */}
            <section id="booking-section" className="glass-card-pro rounded-3xl p-6 border border-cyan-500/20 shadow-2xl space-y-4">
              <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-500" /> Book Consultation
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
                    placeholder="Describe symptoms or reasons for visit..."
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-teal-500/20"
                >
                  {bookingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                  Confirm Appointment Booking
                </button>
              </form>
            </section>

            {/* Billing & Payments */}
            <section className="space-y-4">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-500" /> Digital Checkout & Bills
              </h3>

              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="glass-card-pro rounded-3xl p-6 text-center opacity-60 text-xs font-semibold">
                    No pending invoices or billing statements.
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div key={tx.id} className="glass-card-pro rounded-2xl p-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-extrabold text-sm">{tx.amount.toLocaleString()} ETB</div>
                        <div className="text-[10px] text-slate-400">{tx.gateway} · {tx.reference}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusBadge(tx.status)}
                        {tx.status === 'PENDING' && (
                          <button
                            onClick={() => setPaymentModalTx(tx)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition"
                          >
                            Pay Bill
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>

        </div>

        {/* ── Emergency SOS Broadcast Widget ── */}
        <section id="sos-section" className="glass-card-pro rounded-3xl border border-rose-500/30 p-8 shadow-2xl space-y-4">
          <h3 className="text-xl font-black text-rose-600 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 animate-pulse" /> Emergency SOS Ambulance Telemetry
          </h3>
          {profile ? (
            <SOSWidget patientId={profile.id} />
          ) : (
            <div className="text-xs opacity-60">Initializing SOS gateway...</div>
          )}
        </section>

      </main>

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

      {/* Express Payment Selector Modal */}
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

