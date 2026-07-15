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

interface MedRecord {
  id: string;
  diagnosis: string;
  date: string;
  notes: string;
  patient: { fullName: string };
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
  const map: Record<string, string> = {
    ACCEPTED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    COMPLETED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    REJECTED: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    CANCELLED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  };
  return `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${map[status] ?? 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`;
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  const pending = appointments.filter((a) => a.status === 'PENDING');
  const accepted = appointments.filter((a) => a.status === 'ACCEPTED');

  return (
    <div className="min-h-screen relative pb-20">
      <div className="bg-mesh" />

      {/* Nav */}
      <header className="sticky top-0 z-30 glass-card border-b border-slate-200/20 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-base bg-gradient-to-r from-teal-700 to-cyan-600 bg-clip-text text-transparent">
              Doctor Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm font-semibold opacity-70">
              {(user?.profile as any)?.fullName ?? 'Doctor'}
            </span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 transition">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Toast */}
        {toast && (
          <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${toast.ok ? 'bg-teal-500/10 border-teal-500/20 text-teal-700' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'}`}>
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Appointments', value: appointments.length, icon: Calendar, color: 'teal' },
            { label: 'Pending Review', value: pending.length, icon: HelpCircle, color: 'amber' },
            { label: 'Active / Accepted', value: accepted.length, icon: CheckCircle, color: 'emerald' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card rounded-2xl border border-white/20 p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center text-${color}-600`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black">{value}</div>
                <div className="text-xs opacity-60">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pending Appointments */}
        <section>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500" /> Pending Approval
          </h3>
          <div className="space-y-3">
            {pending.length === 0 ? (
              <div className="glass-card rounded-2xl border border-white/20 p-8 text-center opacity-60 text-sm">
                No pending appointments.
              </div>
            ) : (
              pending.map((appt) => (
                <div key={appt.id} className="glass-card rounded-2xl border border-amber-500/20 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="font-bold">{appt.patient.fullName}</div>
                      <div className="text-xs opacity-60">
                        {appt.patient.bloodGroup && <span className="text-rose-500 font-bold mr-1">{appt.patient.bloodGroup}</span>}
                        {formatDate(appt.dateTime)}
                      </div>
                      {appt.notes && <div className="text-sm opacity-70 mt-1 italic">"{appt.notes}"</div>}
                      {appt.patient.allergies.length > 0 && (
                        <div className="text-xs text-purple-600 font-bold mt-1">⚠ Allergies: {appt.patient.allergies.join(', ')}</div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => updateStatus(appt.id, 'ACCEPTED')}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
                      >
                        {actionLoading === appt.id + 'ACCEPTED' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Accept
                      </button>
                      <button
                        onClick={() => updateStatus(appt.id, 'REJECTED')}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition"
                      >
                        {actionLoading === appt.id + 'REJECTED' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                        Reject
                      </button>
                      <button
                        onClick={() => fetchAISummary(appt.patient.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-lg transition"
                      >
                        <Sparkles className="w-3 h-3" /> AI Summary
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* AI Summary Panel */}
        {(aiLoading || aiSummary) && (
          <div className="glass-card rounded-2xl border border-teal-500/20 p-6 space-y-3">
            <h3 className="font-bold flex items-center gap-2 text-teal-700 dark:text-teal-400">
              <Sparkles className="w-4 h-4" /> AI-Generated Patient Summary
            </h3>
            {aiLoading ? (
              <div className="space-y-2">
                <div className="h-4 skeleton rounded w-2/3" />
                <div className="h-4 skeleton rounded w-full" />
                <div className="h-4 skeleton rounded w-3/4" />
              </div>
            ) : (
              <pre className="text-sm whitespace-pre-wrap font-sans opacity-90 leading-relaxed">{aiSummary}</pre>
            )}
          </div>
        )}

        {/* Accepted Appointments */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" /> Active Appointments
            </h3>
            <button
              onClick={() => setShowRecordForm(!showRecordForm)}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-teal-700/20"
            >
              <Plus className="w-4 h-4" /> New Medical Record
            </button>
          </div>
          <div className="space-y-3">
            {accepted.length === 0 ? (
              <div className="glass-card rounded-2xl border border-white/20 p-8 text-center opacity-60 text-sm">
                No active appointments.
              </div>
            ) : (
              accepted.map((appt) => (
                <div key={appt.id} className="glass-card rounded-2xl border border-emerald-500/20 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold">{appt.patient.fullName}</div>
                      <div className="text-xs opacity-60">{formatDate(appt.dateTime)}</div>
                      <div className="text-xs opacity-50 mt-0.5">{appt.patient.user.phone}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setForm({ ...EMPTY_FORM, patientId: appt.patient.id, patientName: appt.patient.fullName }); setShowRecordForm(true); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition"
                      >
                        <FileText className="w-3 h-3" /> Add Record
                      </button>
                      <button
                        onClick={() => fetchAISummary(appt.patient.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-lg transition"
                      >
                        <Sparkles className="w-3 h-3" /> AI Summary
                      </button>
                      <button
                        onClick={() => updateStatus(appt.id, 'COMPLETED')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold rounded-lg transition"
                      >
                        <CheckCircle className="w-3 h-3" /> Complete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Medical Record Form */}
        {showRecordForm && (
          <section className="glass-card rounded-2xl border border-blue-500/20 p-6">
            <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" /> Create Medical Record
            </h3>
            <form onSubmit={handleCreateRecord} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold opacity-60 mb-1 block">Patient Name</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-slate-200/40 bg-white/30 dark:bg-slate-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    value={form.patientName}
                    readOnly
                    placeholder="Select from appointments above"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold opacity-60 mb-1 block">Patient ID</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-slate-200/40 bg-white/30 dark:bg-slate-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    value={form.patientId}
                    onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                    placeholder="Patient profile ID"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold opacity-60 mb-1 block">Diagnosis</label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-slate-200/40 bg-white/30 dark:bg-slate-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                  placeholder="e.g. Essential Hypertension"
                />
              </div>

              <div>
                <label className="text-xs font-bold opacity-60 mb-1 block">Clinical Notes</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-slate-200/40 bg-white/30 dark:bg-slate-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none h-24"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Detailed clinical notes..."
                />
              </div>

              {/* Prescription */}
              <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/20 space-y-3">
                <div className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5" /> Prescription (optional)
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input className="w-full px-3 py-2 rounded-lg border border-slate-200/40 bg-white/30 dark:bg-slate-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30" value={form.medName} onChange={(e) => setForm({ ...form, medName: e.target.value })} placeholder="Drug name" />
                  <input className="w-full px-3 py-2 rounded-lg border border-slate-200/40 bg-white/30 dark:bg-slate-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30" value={form.medDosage} onChange={(e) => setForm({ ...form, medDosage: e.target.value })} placeholder="Dosage (e.g. 5mg)" />
                  <input className="w-full px-3 py-2 rounded-lg border border-slate-200/40 bg-white/30 dark:bg-slate-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30" value={form.medFrequency} onChange={(e) => setForm({ ...form, medFrequency: e.target.value })} placeholder="Frequency" />
                </div>
              </div>

              {/* Lab Request */}
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-3">
                <div className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" /> Lab Request (optional)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input className="w-full px-3 py-2 rounded-lg border border-slate-200/40 bg-white/30 dark:bg-slate-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" value={form.labTestName} onChange={(e) => setForm({ ...form, labTestName: e.target.value })} placeholder="Test name (e.g. CBC)" />
                  <input className="w-full px-3 py-2 rounded-lg border border-slate-200/40 bg-white/30 dark:bg-slate-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30" value={form.labInstructions} onChange={(e) => setForm({ ...form, labInstructions: e.target.value })} placeholder="Instructions (e.g. 12h fast)" />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={actionLoading === 'record'}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-bold rounded-xl transition shadow-lg"
                >
                  {actionLoading === 'record' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Save Record
                </button>
                <button type="button" onClick={() => setShowRecordForm(false)} className="px-6 py-2.5 rounded-xl border border-slate-200/40 hover:bg-slate-100/40 text-sm font-semibold transition">
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

      </main>
    </div>
  );
}
