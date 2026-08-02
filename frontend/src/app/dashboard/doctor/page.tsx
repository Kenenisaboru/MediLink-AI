'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  HelpCircle,
  Loader2,
  LogOut,
  Plus,
  Sparkles,
  User,
  XCircle,
  Stethoscope,
  Pill,
  FlaskConical,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import api from '../../../lib/api';
import { clearTokens } from '../../../lib/auth';
import { useAuthGuard } from '../../../hooks/useAuthGuard';

// ── Types ────────────────────────────────────────────────────────────────────
interface Appointment {
  id: string;
  dateTime: string;
  status: string;
  notes: string | null;
  patient: {
    id: string;
    fullName: string;
    bloodGroup: string | null;
    dateOfBirth: string;
    allergies: string[];
    chronicDiseases: string[];
    user: { phone: string; email: string | null };
  };
}

interface MedFormState {
  patientId: string;
  patientName: string;
  diagnosis: string;
  notes: string;
  medName: string;
  medDosage: string;
  medFrequency: string;
  labTestName: string;
  labInstructions: string;
}

const EMPTY_FORM: MedFormState = {
  patientId: '',
  patientName: '',
  diagnosis: '',
  notes: '',
  medName: '',
  medDosage: '',
  medFrequency: '',
  labTestName: '',
  labInstructions: '',
};

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    ACCEPTED: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
    PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-500 animate-pulse' },
    COMPLETED: { bg: 'bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-500/20', dot: 'bg-sky-500' },
    REJECTED: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-500' },
    CANCELLED: { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/20', dot: 'bg-slate-400' },
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
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard('DOCTOR');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [form, setForm] = useState<MedFormState>(EMPTY_FORM);
  const [showRecordForm, setShowRecordForm] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
      const { data } = await api.get('/doctor/appointments');
      setAppointments(data);
    } catch {
      showToast('Failed to load appointments.', false);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user, fetchData]);

  // ── Appointment status update ──────────────────────────────────────────────
  const updateStatus = async (appointmentId: string, status: string) => {
    setActionLoading(appointmentId + status);
    try {
      const { data } = await api.put('/doctor/appointments/status', { appointmentId, status });
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: data.status } : a))
      );
      showToast(`Appointment marked as ${status}.`);
    } catch (err: any) {
      showToast(err.response?.data?.error ?? 'Update failed.', false);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Create medical record ──────────────────────────────────────────────────
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.diagnosis || !form.notes) {
      showToast('Patient ID, diagnosis, and notes are required.', false);
      return;
    }
    setActionLoading('record');
    try {
      const prescriptions = form.medName
        ? [{ name: form.medName, dosage: form.medDosage, frequency: form.medFrequency, days: 7 }]
        : [];
      const labRequests = form.labTestName
        ? [{ name: form.labTestName, instructions: form.labInstructions, status: 'PENDING' }]
        : [];

      await api.post('/doctor/medical-records', {
        patientId: form.patientId,
        diagnosis: form.diagnosis,
        notes: form.notes,
        prescriptions,
        labRequests,
      });

      setForm(EMPTY_FORM);
      setShowRecordForm(false);
      showToast('Medical record created successfully!');
    } catch (err: any) {
      showToast(err.response?.data?.error ?? 'Failed to create record.', false);
    } finally {
      setActionLoading(null);
    }
  };

  // ── AI Patient Summary ─────────────────────────────────────────────────────
  const fetchAISummary = async (patientId: string) => {
    setAiLoading(true);
    setAiSummary(null);
    setSelectedPatientId(patientId);
    try {
      const { data } = await api.get(`/doctor/ai-summary/${patientId}`);
      setAiSummary(data.summary);
    } catch {
      setAiSummary('Failed to generate AI summary. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push('/auth');
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
        <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
        <span className="text-xs text-slate-400 font-bold tracking-wider mt-4 uppercase animate-pulse">
          Loading Doctor Workspace...
        </span>
      </div>
    );
  }

  const pending = appointments.filter((a) => a.status === 'PENDING');
  const accepted = appointments.filter((a) => a.status === 'ACCEPTED');

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">

      {/* Background depth */}
      <div className="fixed inset-0 bg-mesh -z-10 pointer-events-none" />
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal-500/5 dark:bg-teal-500/10 blur-[140px] pointer-events-none animate-float" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/5 dark:bg-cyan-500/10 blur-[140px] pointer-events-none animate-float-delayed" />

      {/* ── LEFT SIDEBAR ── */}
      <aside className="w-72 hidden lg:flex flex-col justify-between sticky top-0 h-screen bg-white/70 dark:bg-slate-900/60 border-r border-slate-200/40 dark:border-slate-800/40 backdrop-blur-md p-6 shrink-0 z-20">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-lg tracking-tight bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">MediLink AI</div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-teal-600 dark:text-teal-400 block mt-[-4px]">Doctor Workspace</span>
            </div>
          </div>

          {/* Doctor Profile Card */}
          <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500 text-white font-black flex items-center justify-center text-sm shadow-md">
                {((user?.profile as any)?.fullName ?? 'D').charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-xs truncate">Dr. {(user?.profile as any)?.fullName ?? 'Doctor'}</div>
                <div className="text-[10px] text-slate-400 truncate">{(user?.profile as any)?.specialty ?? 'Physician'}</div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="font-black text-sm text-teal-600">{appointments.length}</div>
                <div className="text-[9px] text-slate-400 uppercase">Total</div>
              </div>
              <div>
                <div className="font-black text-sm text-amber-500">{pending.length}</div>
                <div className="text-[9px] text-slate-400 uppercase">Pending</div>
              </div>
              <div>
                <div className="font-black text-sm text-emerald-500">{accepted.length}</div>
                <div className="text-[9px] text-slate-400 uppercase">Active</div>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {[
              { label: 'Pending Approvals', icon: HelpCircle, count: pending.length, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Active Consultations', icon: CheckCircle, count: accepted.length, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'AI Patient Summaries', icon: Sparkles, color: 'text-teal-500', bg: 'bg-teal-500/10' },
              { label: 'Medical Records', icon: FileText, color: 'text-sky-500', bg: 'bg-sky-500/10' },
            ].map(({ label, icon: Icon, count, color, bg }) => (
              <div key={label} className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-extrabold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-default transition-all">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${bg} ${color}`}><Icon className="w-3.5 h-3.5" /></div>
                  <span>{label}</span>
                </div>
                {count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${bg} ${color}`}>{count}</span>
                )}
              </div>
            ))}
          </nav>

          {/* New Record Quick Action */}
          <button
            onClick={() => setShowRecordForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-black text-xs shadow-lg shadow-teal-500/20 hover:scale-[1.02] transition"
          >
            <Plus className="w-4 h-4" /> New Medical Record
          </button>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold text-xs transition">
            <LogOut className="w-4 h-4" /> Logout Account
          </button>
        </div>
      </aside>

      {/* ── RIGHT MAIN PANEL ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/40 dark:border-slate-800/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center text-white"><Activity className="w-4 h-4" /></div>
            <span className="font-black text-base text-teal-600">MediLink Doctor</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-rose-500"><LogOut className="w-4 h-4" /></button>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-8 space-y-8">

          {/* Welcome Banner */}
          <div className="glass-card-pro rounded-3xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-2xl border border-white/20 dark:border-slate-800/20">
            <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-teal-600 dark:text-teal-400 tracking-wider uppercase bg-teal-500/10">
                <TrendingUp className="w-3.5 h-3.5" /> Doctor Clinical Dashboard
              </div>
              <h2 className="text-3xl font-black tracking-tight">
                Welcome back, <span className="bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">Dr. {(user?.profile as any)?.fullName ?? 'Doctor'}</span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
                Manage patient consultation pipelines, review schedules, and query AI-assisted diagnostic summaries.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 shrink-0">
              {[
                { label: 'Total', value: appointments.length, color: 'text-teal-500' },
                { label: 'Pending', value: pending.length, color: 'text-amber-500' },
                { label: 'Active', value: accepted.length, color: 'text-emerald-500' },
              ].map((s) => (
                <div key={s.label} className="glass-card rounded-2xl p-4 text-center border border-white/20 dark:border-slate-800/40">
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 ${toast.ok ? 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'}`}>
              {toast.ok ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span className="text-sm font-bold">{toast.msg}</span>
            </div>
          )}

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left: Appointment Queues (7/12) */}
            <div className="lg:col-span-7 space-y-8">

              {/* Pending Approvals */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold flex items-center gap-2 tracking-tight">
                    <HelpCircle className="w-5 h-5 text-amber-500" /> Pending Approvals
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">{pending.length} Requests</span>
                </div>
                <div className="space-y-4">
                  {pending.length === 0 ? (
                    <div className="glass-card-pro rounded-2xl p-8 text-center opacity-60 text-sm">No pending appointments requiring your action.</div>
                  ) : (
                    pending.map((appt) => (
                      <div key={appt.id} className="glass-card-pro rounded-2xl p-5 border-l-4 border-amber-500 hover:shadow-lg transition-all duration-300 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="font-extrabold text-base">{appt.patient.fullName}</div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              {appt.patient.bloodGroup && (
                                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 font-extrabold">Blood: {appt.patient.bloodGroup}</span>
                              )}
                              <span>Scheduled: {formatDate(appt.dateTime)}</span>
                            </div>
                            {appt.notes && (
                              <p className="text-sm bg-slate-100/50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/30 dark:border-slate-800/30 italic text-slate-600 dark:text-slate-300">"{appt.notes}"</p>
                            )}
                            {appt.patient.allergies.length > 0 && (
                              <div className="text-[11px] font-semibold text-rose-500 bg-rose-500/10 px-2 py-1 rounded-lg inline-block">
                                ⚠ Allergies: {appt.patient.allergies.join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="flex sm:flex-col gap-2 shrink-0">
                            <button onClick={() => updateStatus(appt.id, 'ACCEPTED')} disabled={!!actionLoading} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition">
                              {actionLoading === appt.id + 'ACCEPTED' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Accept
                            </button>
                            <button onClick={() => updateStatus(appt.id, 'REJECTED')} disabled={!!actionLoading} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition">
                              {actionLoading === appt.id + 'REJECTED' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
                            </button>
                            <button onClick={() => fetchAISummary(appt.patient.id)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition">
                              <Sparkles className="w-3.5 h-3.5" /> AI Summary
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Active Consultations */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold flex items-center gap-2 tracking-tight">
                    <CheckCircle className="w-5 h-5 text-emerald-500" /> Active Consultations
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">{accepted.length} Active</span>
                </div>
                <div className="space-y-4">
                  {accepted.length === 0 ? (
                    <div className="glass-card-pro rounded-2xl p-8 text-center opacity-60 text-sm">No active consultations. Accept pending appointments to start.</div>
                  ) : (
                    accepted.map((appt) => (
                      <div key={appt.id} className="glass-card-pro rounded-2xl p-5 border-l-4 border-emerald-500 hover:shadow-lg transition-all duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="font-extrabold text-base">{appt.patient.fullName}</div>
                            <div className="text-xs text-slate-500">{appt.patient.user.phone}</div>
                            <div className="text-[11px] text-slate-400">{formatDate(appt.dateTime)}</div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <button onClick={() => { setForm({ ...EMPTY_FORM, patientId: appt.patient.id, patientName: appt.patient.fullName }); setShowRecordForm(true); }} className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition">
                              <FileText className="w-3.5 h-3.5" /> Record
                            </button>
                            <button onClick={() => fetchAISummary(appt.patient.id)} className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition">
                              <Sparkles className="w-3.5 h-3.5" /> AI Summary
                            </button>
                            <button onClick={() => updateStatus(appt.id, 'COMPLETED')} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition">
                              <CheckCircle className="w-3.5 h-3.5" /> Complete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Right: AI Summary + Record Form (5/12) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">

              {/* AI Patient Summary */}
              {(aiLoading || aiSummary) && (
                <div className="glass-card-pro rounded-3xl p-6 border border-teal-500/20 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none" />
                  <h3 className="font-extrabold flex items-center gap-2 text-teal-700 dark:text-teal-400 mb-4 tracking-tight">
                    <Sparkles className="w-4 h-4 text-teal-500" /> Patient Health Intelligence
                  </h3>
                  {aiLoading ? (
                    <div className="space-y-3">
                      <div className="h-4 skeleton rounded-lg w-2/3" />
                      <div className="h-4 skeleton rounded-lg w-full" />
                      <div className="h-4 skeleton rounded-lg w-5/6" />
                    </div>
                  ) : (
                    <div className="bg-slate-900/5 dark:bg-slate-950/60 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800/80">
                      <pre className="text-xs whitespace-pre-wrap font-sans opacity-95 leading-relaxed overflow-x-auto text-slate-700 dark:text-slate-300">{aiSummary}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* Medical Record Form */}
              {showRecordForm ? (
                <section className="glass-card-pro rounded-3xl p-6 border border-sky-500/20 shadow-2xl space-y-5">
                  <h3 className="text-lg font-extrabold flex items-center gap-2 tracking-tight">
                    <FileText className="w-5 h-5 text-sky-500" /> Create Medical Record
                  </h3>
                  <form onSubmit={handleCreateRecord} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Name</label>
                        <input className="w-full px-3 py-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/60 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/30" value={form.patientName} readOnly placeholder="Select Patient" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient ID</label>
                        <input className="w-full px-3 py-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/60 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/30" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} placeholder="Patient Profile ID" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diagnosis</label>
                      <input className="w-full px-3 py-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/60 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/30" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="e.g. Type 2 Diabetes" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinical Notes</label>
                      <textarea className="w-full px-3 py-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/60 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/30 resize-none h-20" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Enter details..." />
                    </div>
                    <div className="p-3 rounded-2xl bg-teal-500/5 border border-teal-500/10 space-y-2.5">
                      <div className="text-[11px] font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1.5"><Pill className="w-3.5 h-3.5" /> Rx Prescription</div>
                      <input className="w-full px-3 py-2 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-white/30 dark:bg-slate-900/30 text-xs focus:outline-none" value={form.medName} onChange={(e) => setForm({ ...form, medName: e.target.value })} placeholder="Medication Name" />
                      <div className="grid grid-cols-2 gap-2">
                        <input className="w-full px-3 py-2 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-white/30 dark:bg-slate-900/30 text-xs focus:outline-none" value={form.medDosage} onChange={(e) => setForm({ ...form, medDosage: e.target.value })} placeholder="Dosage (500mg)" />
                        <input className="w-full px-3 py-2 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-white/30 dark:bg-slate-900/30 text-xs focus:outline-none" value={form.medFrequency} onChange={(e) => setForm({ ...form, medFrequency: e.target.value })} placeholder="Frequency" />
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-2.5">
                      <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5"><FlaskConical className="w-3.5 h-3.5" /> Lab Request</div>
                      <input className="w-full px-3 py-2 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-white/30 dark:bg-slate-900/30 text-xs focus:outline-none" value={form.labTestName} onChange={(e) => setForm({ ...form, labTestName: e.target.value })} placeholder="Lab Test (e.g. HbA1c)" />
                      <input className="w-full px-3 py-2 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-white/30 dark:bg-slate-900/30 text-xs focus:outline-none" value={form.labInstructions} onChange={(e) => setForm({ ...form, labInstructions: e.target.value })} placeholder="Instructions (e.g. Fasting)" />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={actionLoading === 'record'} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-sky-500/20">
                        {actionLoading === 'record' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Save Record
                      </button>
                      <button type="button" onClick={() => setShowRecordForm(false)} className="px-4 py-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs font-semibold transition hover:bg-slate-100/50 dark:hover:bg-slate-900">Cancel</button>
                    </div>
                  </form>
                </section>
              ) : (
                <div className="glass-card-pro rounded-3xl p-8 border border-slate-200/30 dark:border-slate-800/40 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400 mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">Create New Medical Record</h4>
                    <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">Click "Record" on an active patient or use the button below.</p>
                  </div>
                  <button onClick={() => setShowRecordForm(true)} className="px-4 py-2 border border-sky-500/30 hover:border-sky-500/60 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400 transition">Open Record Form</button>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
