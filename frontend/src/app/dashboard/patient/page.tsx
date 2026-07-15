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
} from 'lucide-react';
import api from '../../../lib/api';
import { getStoredUser, clearTokens } from '../../../lib/auth';
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
  const map: Record<string, string> = {
    ACCEPTED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    COMPLETED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    REJECTED: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    CANCELLED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    SUCCESS: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    FAILED: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  };
  return `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${map[status] ?? 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`;
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

// ── Main Component ─────────────────────────────────────────────────────────
export default function PatientDashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard('PATIENT');

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  const [symptomModalOpen, setSymptomModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({ doctorId: '', dateTime: '', notes: '' });

  const [dataLoading, setDataLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch all patient data ─────────────────────────────────────────────────
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

  // ── Book appointment ───────────────────────────────────────────────────────
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

  // ── Initiate payment ───────────────────────────────────────────────────────
  const handlePayment = async (gateway: string, amount: number) => {
    try {
      const { data } = await api.post('/payments/initiate', { gateway, amount });
      setMessage(`Payment initiated. Ref: ${data.reference}. Redirecting...`);
      setTimeout(() => window.open(data.paymentUrl, '_blank'), 1500);
    } catch (err: any) {
      setMessage('Payment initiation failed.');
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push('/auth');
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
          <p className="text-sm opacity-60">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(
    (a) => a.status !== 'CANCELLED' && a.status !== 'REJECTED'
  );

  return (
    <div className="min-h-screen relative pb-20">
      <div className="bg-mesh" />

      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-30 glass-card border-b border-slate-200/20 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-base bg-gradient-to-r from-teal-700 to-cyan-600 bg-clip-text text-transparent">
              MediLink AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm font-semibold opacity-70">
              {profile?.fullName ?? user?.profile?.fullName as string ?? 'Patient'}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 transition"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Toast messages */}
        {(message || error) && (
          <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${
            error
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-600'
              : 'bg-teal-500/10 border-teal-500/20 text-teal-700'
          }`}>
            {error ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {message || error}
          </div>
        )}

        {/* ── Profile Card ── */}
        {profile && (
          <div className="glass-card rounded-2xl border border-white/20 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-700 dark:text-teal-400 shrink-0">
                <User className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-extrabold">{profile.fullName}</h2>
                <p className="text-sm opacity-60">
                  {profile.gender} · Born {new Date(profile.dateOfBirth).toLocaleDateString('en-ET')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {profile.bloodGroup && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 font-bold">
                    <Droplet className="w-3 h-3" /> {profile.bloodGroup}
                  </span>
                )}
                {profile.chronicDiseases.map((d) => (
                  <span key={d} className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 font-bold">
                    {d}
                  </span>
                ))}
                {profile.allergies.map((a) => (
                  <span key={a} className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 font-bold">
                    ⚠ {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Activity, label: 'AI Symptom Check', action: () => setSymptomModalOpen(true), color: 'teal' },
            { icon: Calendar, label: 'Book Appointment', action: () => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' }), color: 'cyan' },
            { icon: FileText, label: 'Medical History', action: () => document.getElementById('records-section')?.scrollIntoView({ behavior: 'smooth' }), color: 'blue' },
            { icon: ShieldAlert, label: 'Emergency SOS', action: () => document.getElementById('sos-section')?.scrollIntoView({ behavior: 'smooth' }), color: 'rose' },
          ].map(({ icon: Icon, label, action, color }) => (
            <button
              key={label}
              onClick={action}
              className={`p-4 rounded-2xl glass-card border border-white/20 hover-scale flex flex-col items-center gap-2 text-center text-sm font-semibold transition`}
            >
              <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center text-${color}-600 dark:text-${color}-400`}>
                <Icon className="w-5 h-5" />
              </div>
              {label}
            </button>
          ))}
        </div>

        {/* ── Appointments ── */}
        <section>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" /> Appointments
            <span className="ml-auto text-sm font-normal opacity-60">{upcomingAppointments.length} scheduled</span>
          </h3>
          <div className="space-y-3">
            {upcomingAppointments.length === 0 ? (
              <div className="glass-card rounded-2xl border border-white/20 p-8 text-center opacity-60 text-sm">
                No upcoming appointments.
              </div>
            ) : (
              upcomingAppointments.map((appt) => (
                <div key={appt.id} className="glass-card rounded-2xl border border-white/20 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="font-bold">{appt.doctor.fullName}</div>
                    <div className="text-sm opacity-60">
                      {appt.doctor.specialty} · {appt.doctor.hospital.name}
                    </div>
                    <div className="text-xs opacity-50 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(appt.dateTime)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={statusBadge(appt.status)}>{appt.status}</span>
                    {appt.status === 'ACCEPTED' && appt.telemedicineRoomId && (
                      <button className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-500 px-2 py-1 rounded-lg border border-teal-500/30 hover:bg-teal-500/5 transition">
                        <Video className="w-3.5 h-3.5" /> Join
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Book Appointment ── */}
        <section id="booking-section" className="glass-card rounded-2xl border border-white/20 p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-600" /> Book New Appointment
          </h3>
          <form onSubmit={handleBookAppointment} className="space-y-3">
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-slate-200/40 bg-white/30 dark:bg-slate-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              placeholder="Doctor ID (from hospital search)"
              value={bookingForm.doctorId}
              onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
            />
            <input
              type="datetime-local"
              className="w-full px-4 py-3 rounded-xl border border-slate-200/40 bg-white/30 dark:bg-slate-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              value={bookingForm.dateTime}
              onChange={(e) => setBookingForm({ ...bookingForm, dateTime: e.target.value })}
            />
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-slate-200/40 bg-white/30 dark:bg-slate-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none h-20"
              placeholder="Notes for the doctor (optional)"
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
            />
            <button
              type="submit"
              disabled={bookingLoading}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-600 disabled:bg-slate-400 text-white font-bold rounded-xl flex items-center gap-2 transition shadow-lg shadow-teal-700/20"
            >
              {bookingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              Book Appointment
            </button>
          </form>
        </section>

        {/* ── Medical History ── */}
        <section id="records-section">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Medical History
          </h3>
          <div className="space-y-3">
            {medicalRecords.length === 0 ? (
              <div className="glass-card rounded-2xl border border-white/20 p-8 text-center opacity-60 text-sm">
                No medical records yet.
              </div>
            ) : (
              medicalRecords.slice(0, 5).map((rec) => (
                <div key={rec.id} className="glass-card rounded-2xl border border-white/20 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{rec.diagnosis}</div>
                      <div className="text-xs opacity-60 mt-0.5">
                        Dr. {rec.doctor.fullName} · {formatDate(rec.date)}
                      </div>
                    </div>
                    <Stethoscope className="w-4 h-4 opacity-30" />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Billing & Payments ── */}
        <section>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" /> Billing
          </h3>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="glass-card rounded-2xl border border-white/20 p-8 text-center opacity-60 text-sm">
                No transactions yet.
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="glass-card rounded-2xl border border-white/20 p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold">{tx.amount.toLocaleString()} ETB</div>
                    <div className="text-xs opacity-60">{tx.gateway} · {tx.reference}</div>
                    <div className="text-xs opacity-50">{formatDate(tx.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={statusBadge(tx.status)}>{tx.status}</span>
                    {tx.status === 'PENDING' && (
                      <button
                        onClick={() => handlePayment(tx.gateway, tx.amount)}
                        className="text-xs font-bold text-teal-600 hover:text-teal-500 px-2 py-1 rounded-lg border border-teal-500/30 hover:bg-teal-500/5 transition"
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── SOS Section ── */}
        <section id="sos-section" className="glass-card rounded-2xl border border-rose-500/20 p-6">
          <h3 className="text-lg font-bold mb-4 text-rose-600 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> Emergency SOS
          </h3>
          {profile ? (
            <SOSWidget patientId={profile.id} />
          ) : (
            <div className="text-sm opacity-60">Loading patient profile...</div>
          )}
        </section>

      </main>

      {/* Symptom Checker Modal */}
      <SymptomCheckerModal
        isOpen={symptomModalOpen}
        onClose={() => setSymptomModalOpen(false)}
      />
    </div>
  );
}
