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
  Search,
  Filter,
  X,
  Phone,
  Mail,
  HeartPulse,
} from 'lucide-react';
import api from '../../../lib/api';
import { clearTokens } from '../../../lib/auth';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import DashboardHeader from '../../../components/DashboardHeader';
import { getSocket } from '../../../lib/socket';
import { exportPrescriptionPDF } from '../../../lib/pdfExport';

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
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');
  
  const [form, setForm] = useState<MedFormState>(EMPTY_FORM);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'COMPLETED'>('ALL');

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

  useEffect(() => {
    if (authLoading || !user) return;
    const socket = getSocket();

    const handleNewAppointment = (data: any) => {
      showToast(`New appointment scheduled by ${data.patientName || 'a patient'}.`);
      fetchData();
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {});
      } catch (e) {}
    };

    socket.on('appointment-created', handleNewAppointment);

    return () => {
      socket.off('appointment-created', handleNewAppointment);
    };
  }, [authLoading, user, fetchData]);

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

      if (prescriptions.length > 0) {
        exportPrescriptionPDF({
          doctorName: (user?.profile as any)?.fullName ?? 'Physician',
          specialty: (user?.profile as any)?.specialty,
          patientName: form.patientName || form.patientId,
          patientId: form.patientId,
          diagnosis: form.diagnosis,
          notes: form.notes,
          prescriptions,
        });
      }

      setForm(EMPTY_FORM);
      setShowRecordForm(false);
      showToast('Medical record created successfully! E-Prescription generated.');
    } catch (err: any) {
      showToast(err.response?.data?.error ?? 'Failed to create record.', false);
    } finally {
      setActionLoading(null);
    }
  };

  const fetchAISummary = async (patientId: string, patientName: string) => {
    setAiLoading(true);
    setAiSummary(null);
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName);
    try {
      const { data } = await api.get(`/doctor/ai-summary/${patientId}`);
      setAiSummary(data.summary);
    } catch {
      setAiSummary('Failed to generate AI summary. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const openRecordModal = (patientId: string, patientName: string) => {
    setForm({
      ...EMPTY_FORM,
      patientId,
      patientName,
    });
    setShowRecordForm(true);
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
        <span className="text-xs text-teal-400 font-bold tracking-wider mt-4 uppercase animate-pulse">
          Loading Professional Clinical Workspace...
        </span>
      </div>
    );
  }

  const pending = appointments.filter((a) => a.status === 'PENDING');
  const accepted = appointments.filter((a) => a.status === 'ACCEPTED');
  const completed = appointments.filter((a) => a.status === 'COMPLETED');

  const filteredAppointments = appointments.filter((a) => {
    const matchesTab = activeTab === 'ALL' || a.status === activeTab;
    const matchesSearch = a.patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.patient.user?.phone && a.patient.user.phone.includes(searchQuery));
    return matchesTab && matchesSearch;
  });

  const doctorName = (user?.profile as any)?.fullName ?? 'Physician';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#02060e] text-slate-800 dark:text-slate-100 transition-colors duration-300">

      {/* Background Depth */}
      <div className="fixed inset-0 bg-mesh -z-10 pointer-events-none" />
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal-500/5 dark:bg-teal-500/10 blur-[140px] pointer-events-none animate-float" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/5 dark:bg-cyan-500/10 blur-[140px] pointer-events-none animate-float-delayed" />

      {/* Unified Navigation Header */}
      <DashboardHeader userRole={user?.role} userName={`Dr. ${doctorName}`} title="Doctor Clinical Workspace" />

      <div className="flex-1 flex min-w-0">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-72 hidden lg:flex flex-col justify-between sticky top-16 h-[calc(100vh-4rem)] bg-white/70 dark:bg-slate-900/60 border-r border-slate-200/40 dark:border-slate-800/40 backdrop-blur-md p-6 shrink-0 z-20">
          <div className="space-y-6">
            
            {/* Doctor Profile Card */}
            <div className="p-4 rounded-3xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 space-y-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white font-black flex items-center justify-center text-lg shadow-lg shadow-teal-500/20">
                  {doctorName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-black text-sm truncate text-slate-800 dark:text-slate-100">Dr. {doctorName}</div>
                  <div className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider truncate">
                    {(user?.profile as any)?.specialty ?? 'Specialist Physician'}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white/50 dark:bg-slate-900/50">
                  <div className="font-black text-sm text-teal-600">{appointments.length}</div>
                  <div className="text-[9px] text-slate-400 font-extrabold uppercase">Total</div>
                </div>
                <div className="p-2 rounded-xl bg-white/50 dark:bg-slate-900/50">
                  <div className="font-black text-sm text-amber-500">{pending.length}</div>
                  <div className="text-[9px] text-slate-400 font-extrabold uppercase">Pending</div>
                </div>
                <div className="p-2 rounded-xl bg-white/50 dark:bg-slate-900/50">
                  <div className="font-black text-sm text-emerald-500">{accepted.length}</div>
                  <div className="text-[9px] text-slate-400 font-extrabold uppercase">Active</div>
                </div>
              </div>
            </div>

            {/* Quick Filter Tabs Nav */}
            <nav className="space-y-1">
              {[
                { tab: 'ALL', label: 'All Consultations', icon: Activity, count: appointments.length, color: 'text-teal-500', bg: 'bg-teal-500/10' },
                { tab: 'PENDING', label: 'Pending Approvals', icon: HelpCircle, count: pending.length, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { tab: 'ACCEPTED', label: 'Active Pipeline', icon: CheckCircle, count: accepted.length, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { tab: 'COMPLETED', label: 'Completed Records', icon: FileText, count: completed.length, color: 'text-sky-500', bg: 'bg-sky-500/10' },
              ].map(({ tab, label, icon: Icon, count, color, bg }) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-extrabold transition ${
                    activeTab === tab
                      ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${bg} ${color}`}><Icon className="w-3.5 h-3.5" /></div>
                    <span>{label}</span>
                  </div>
                  {count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${bg} ${color}`}>{count}</span>
                  )}
                </button>
              ))}
            </nav>

            {/* New Record Quick Action */}
            <button
              onClick={() => setShowRecordForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-teal-500/20 hover:scale-[1.02] transition"
            >
              <Plus className="w-4 h-4" /> Write E-Prescription & Record
            </button>
          </div>

          <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] text-slate-400 font-extrabold text-center uppercase tracking-wider">
            FMOH Licensed Professional Portal
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* Toast */}
          {toast && (
            <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 ${toast.ok ? 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'}`}>
              {toast.ok ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span className="text-sm font-bold">{toast.msg}</span>
            </div>
          )}

          {/* Clinical Hero Banner */}
          <div className="glass-card-pro rounded-3xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-2xl border border-white/20 dark:border-slate-800/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-2 z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black text-teal-600 dark:text-teal-400 tracking-wider uppercase bg-teal-500/10 border border-teal-500/20">
                <Stethoscope className="w-3.5 h-3.5" /> Doctor Clinical Operations
              </div>
              <h2 className="text-3xl font-black tracking-tight">
                Clinical Workspace, <span className="bg-gradient-to-r from-teal-600 to-cyan-500 bg-clip-text text-transparent">Dr. {doctorName}</span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl font-medium">
                Manage consultation queues, review AI-synthesized patient health histories, write electronic prescriptions, and issue lab diagnostic orders.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 z-10 shrink-0">
              <button
                onClick={() => setShowRecordForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-teal-500/20 transition"
              >
                <Plus className="w-4 h-4" /> New Medical Record
              </button>
            </div>
          </div>

          {/* Search & Filter Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-500" /> Patient Consultations Queue
              </h3>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-600 border border-teal-500/20">
                {filteredAppointments.length} Record(s)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patient name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500/30 w-64"
                />
              </div>
            </div>
          </div>

          {/* Consultation List */}
          <div className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <div className="glass-card-pro rounded-3xl p-12 text-center opacity-60 space-y-3">
                <User className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="font-extrabold text-slate-500 text-sm">No consultation records match the active criteria.</p>
              </div>
            ) : (
              filteredAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="glass-card-pro rounded-3xl p-6 border border-white/20 dark:border-slate-800/20 hover:border-teal-500/30 hover:shadow-2xl transition-all duration-300 space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Patient Core Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 font-black text-sm flex items-center justify-center">
                          {appt.patient.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-base text-slate-800 dark:text-slate-100">{appt.patient.fullName}</h4>
                            {statusBadge(appt.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {appt.patient.user?.phone && (
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-teal-500" /> {appt.patient.user.phone}</span>
                            )}
                            {appt.patient.bloodGroup && (
                              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black text-[11px]">
                                Blood: {appt.patient.bloodGroup}
                              </span>
                            )}
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" /> {formatDate(appt.dateTime)}</span>
                          </div>
                        </div>
                      </div>

                      {appt.notes && (
                        <p className="text-xs bg-slate-100/50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 italic text-slate-600 dark:text-slate-300">
                          "{appt.notes}"
                        </p>
                      )}

                      {(appt.patient.allergies.length > 0 || appt.patient.chronicDiseases.length > 0) && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {appt.patient.allergies.map((alg) => (
                            <span key={alg} className="text-[10px] font-black text-rose-600 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                              ⚠ Allergy: {alg}
                            </span>
                          ))}
                          {appt.patient.chronicDiseases.map((cd) => (
                            <span key={cd} className="text-[10px] font-black text-purple-600 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                              🏥 Condition: {cd}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {appt.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => updateStatus(appt.id, 'ACCEPTED')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition shadow-md shadow-emerald-500/20"
                          >
                            {actionLoading === appt.id + 'ACCEPTED' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Accept
                          </button>
                          <button
                            onClick={() => updateStatus(appt.id, 'REJECTED')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl transition shadow-md shadow-rose-500/20"
                          >
                            {actionLoading === appt.id + 'REJECTED' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => fetchAISummary(appt.patient.id, appt.patient.fullName)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold rounded-xl transition shadow-md shadow-teal-500/20"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> AI Health Summary
                      </button>

                      <button
                        onClick={() => openRecordModal(appt.patient.id, appt.patient.fullName)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold rounded-xl transition shadow-md shadow-sky-500/20"
                      >
                        <FileText className="w-3.5 h-3.5" /> Write Prescription
                      </button>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>

        </main>
      </div>

      {/* ── AI SUMMARY MODAL / DRAWER ── */}
      {selectedPatientId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card-pro w-full max-w-2xl rounded-3xl p-8 border border-teal-500/30 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-lg">AI Patient Health Intelligence</h3>
                  <p className="text-xs text-slate-400">Synthesized clinical record for {selectedPatientName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientId(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
                <span className="text-xs font-extrabold text-teal-500 uppercase animate-pulse">
                  Querying MediLink Medical Knowledge Model...
                </span>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs font-semibold text-teal-800 dark:text-teal-200 leading-relaxed whitespace-pre-line">
                  {aiSummary}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
              <button
                onClick={() => setSelectedPatientId(null)}
                className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 font-extrabold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE MEDICAL RECORD & PRESCRIPTION MODAL ── */}
      {showRecordForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card-pro w-full max-w-2xl rounded-3xl p-8 border border-white/20 dark:border-slate-800/20 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Write E-Prescription & Consultation Record</h3>
                  <p className="text-xs text-slate-400">Issue official digital diagnostic and medication orders</p>
                </div>
              </div>
              <button
                onClick={() => setShowRecordForm(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400">Patient ID</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Patient ID"
                    value={form.patientId}
                    onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-slate-400">Patient Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="Patient Name"
                    value={form.patientName}
                    onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Primary Diagnosis</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Bacterial Pharyngitis"
                  value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Clinical Consultation Notes</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed clinical findings and recommendations..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              {/* Medication Section */}
              <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 space-y-3">
                <div className="text-xs font-black text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                  <Pill className="w-4 h-4" /> E-Prescription Order (Optional)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Medication Name (e.g., Amoxicillin)"
                    value={form.medName}
                    onChange={(e) => setForm({ ...form, medName: e.target.value })}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#02060e] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g., 500mg)"
                    value={form.medDosage}
                    onChange={(e) => setForm({ ...form, medDosage: e.target.value })}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#02060e] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Frequency (e.g., 3x daily for 7 days)"
                    value={form.medFrequency}
                    onChange={(e) => setForm({ ...form, medFrequency: e.target.value })}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#02060e] focus:outline-none"
                  />
                </div>
              </div>

              {/* Lab Request Section */}
              <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 space-y-3">
                <div className="text-xs font-black text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4" /> Laboratory Diagnostic Order (Optional)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Test Name (e.g., Complete Blood Count - CBC)"
                    value={form.labTestName}
                    onChange={(e) => setForm({ ...form, labTestName: e.target.value })}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#02060e] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Instructions for Lab (e.g., Fasting required)"
                    value={form.labInstructions}
                    onChange={(e) => setForm({ ...form, labInstructions: e.target.value })}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#02060e] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/40 dark:border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setShowRecordForm(false)}
                  className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 font-extrabold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'record'}
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-teal-500/20 transition flex items-center gap-2"
                >
                  {actionLoading === 'record' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Submit Medical Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
