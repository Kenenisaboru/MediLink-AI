'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Clock,
  Download,
  FileText,
  FlaskConical,
  Plus,
  Search,
  Upload,
  User,
  Sparkles,
  AlertTriangle,
  LogOut,
  Loader2,
  Activity,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import api from '../../../lib/api';
import { clearTokens } from '../../../lib/auth';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import DashboardHeader from '../../../components/DashboardHeader';

interface LabRequest {
  id: string;
  recordId: string;
  requestIndex: number;
  patientName: string;
  testName: string;
  instructions: string;
  requestedBy: string;
  requestedAt: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  result?: string;
  resultNotes?: string;
}

export default function LaboratoryDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard('LABORATORY_TECH');

  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [activeRequest, setActiveRequest] = useState<LabRequest | null>(null);

  const [resultInput, setResultInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRequests = useCallback(async () => {
    setDataLoading(true);
    try {
      const { data } = await api.get('/lab/requests');
      setRequests(data);
      if (data.length > 0 && !activeRequest) {
        setActiveRequest(data[0]);
        setResultInput(data[0].result || '');
        setNotesInput(data[0].resultNotes || '');
      }
    } catch {
      showToast('Failed to fetch laboratory requests.', false);
    } finally {
      setDataLoading(false);
    }
  }, [activeRequest]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchRequests();
    }
  }, [authLoading, user, fetchRequests]);

  const handlePublishResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest || !resultInput.trim()) {
      showToast('Diagnostic result value is required.', false);
      return;
    }
    setActionLoading(true);
    try {
      await api.post('/lab/upload-result', {
        recordId: activeRequest.recordId,
        requestIndex: activeRequest.requestIndex,
        result: resultInput,
        resultNotes: notesInput
      });

      showToast('Diagnostic report published to patient file.');
      await fetchRequests();
    } catch (err: any) {
      showToast(err.response?.data?.error ?? 'Publication failed.', false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAIExplain = async () => {
    if (!activeRequest || !resultInput.trim()) {
      showToast('Enter test result value to trigger AI interpretation.', false);
      return;
    }
    setAiLoading(true);
    setAiExplanation(null);
    try {
      const { data } = await api.get('/lab/explain', {
        params: {
          testName: activeRequest.testName,
          resultValue: resultInput
        }
      });
      setAiExplanation(data.explanation);
    } catch {
      setAiExplanation('Could not generate AI explanation. Please check reference ranges manually.');
    } finally {
      setAiLoading(false);
    }
  };

  const filtered = requests.filter((req) => {
    const matchesSearch = req.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.testName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const completedCount = requests.filter((r) => r.status === 'COMPLETED').length;

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <span className="text-xs text-indigo-400 font-bold tracking-wider mt-4 uppercase animate-pulse">
          Loading Laboratory Workstation...
        </span>
      </div>
    );
  }

  const techName = user?.email ?? 'Lab Technician';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Background */}
      <div className="fixed inset-0 bg-mesh -z-10 pointer-events-none" />
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[140px] pointer-events-none animate-float" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none animate-float-delayed" />

      {/* Unified Navigation Header */}
      <DashboardHeader userRole={user?.role} userName={techName} title="Diagnostic Laboratory Workstation" />

      <div className="flex-1 flex min-w-0">

        {/* ── LEFT SIDEBAR (SIDE-BY-SIDE LAYOUT) ── */}
        <aside className="w-72 hidden lg:flex flex-col justify-between sticky top-16 h-[calc(100vh-4rem)] bg-white/70 dark:bg-slate-900/60 border-r border-slate-200/40 dark:border-slate-800/40 backdrop-blur-md p-6 shrink-0 z-20">
          <div className="space-y-6">
            
            {/* Lab Technician Vitals Card */}
            <div className="p-4 rounded-3xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 space-y-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20">
                  <FlaskConical className="w-6 h-6 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-black text-sm truncate text-slate-800 dark:text-slate-100">{techName}</div>
                  <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    Certified Lab Workstation
                  </span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white/50 dark:bg-slate-900/50">
                  <div className="font-black text-sm text-indigo-500">{requests.length}</div>
                  <div className="text-[9px] text-slate-400 font-extrabold uppercase">Total</div>
                </div>
                <div className="p-2 rounded-xl bg-white/50 dark:bg-slate-900/50">
                  <div className="font-black text-sm text-amber-500">{pendingCount}</div>
                  <div className="text-[9px] text-slate-400 font-extrabold uppercase">Pending</div>
                </div>
                <div className="p-2 rounded-xl bg-white/50 dark:bg-slate-900/50">
                  <div className="font-black text-sm text-emerald-500">{completedCount}</div>
                  <div className="text-[9px] text-slate-400 font-extrabold uppercase">Published</div>
                </div>
              </div>
            </div>

            {/* Nav Filters */}
            <nav className="space-y-1">
              <div className="text-[10px] font-black uppercase text-slate-400 px-3 py-1 tracking-wider">
                Workstation Filter
              </div>
              {[
                { status: 'ALL', label: 'All Requests', icon: FlaskConical, count: requests.length, color: 'text-indigo-500' },
                { status: 'PENDING', label: 'Pending Processing', icon: Clock, count: pendingCount, color: 'text-amber-500' },
                { status: 'COMPLETED', label: 'Completed Reports', icon: FileCheck, count: completedCount, color: 'text-emerald-500' },
              ].map(({ status, label, icon: Icon, count, color }) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-extrabold transition ${
                    filterStatus === status
                      ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span>{label}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black bg-white/50 dark:bg-slate-800 ${color}`}>{count}</span>
                </button>
              ))}
            </nav>

          </div>

          <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] text-slate-400 font-extrabold text-center uppercase tracking-wider">
            FMOH Accredited Pathology & Diagnostics
          </div>
        </aside>

        {/* ── RIGHT MAIN PANEL ── */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* Toast */}
          {toast && (
            <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md ${
              toast.ok ? 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}>
              {toast.ok ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              <span className="text-sm font-bold">{toast.msg}</span>
            </div>
          )}

          {/* Welcome Banner */}
          <div className="glass-card-pro rounded-3xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-2xl border border-white/20 dark:border-slate-800/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-2 z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black text-indigo-600 dark:text-indigo-400 tracking-wider uppercase bg-indigo-500/10 border border-indigo-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Diagnostic Laboratory Workstation
              </div>
              <h2 className="text-3xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Pathology & Report Publishing</span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl">
                Process doctor diagnostic test requests, publish verified lab findings, and utilize AI-assisted range reference interpretations.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 shrink-0 z-10">
              <div className="glass-card rounded-2xl p-3 text-center border border-white/20 dark:border-slate-800/40">
                <div className="text-xl font-black text-indigo-500">{requests.length}</div>
                <div className="text-[9px] text-slate-400 uppercase font-extrabold">Total</div>
              </div>
              <div className="glass-card rounded-2xl p-3 text-center border border-white/20 dark:border-slate-800/40">
                <div className="text-xl font-black text-amber-500">{pendingCount}</div>
                <div className="text-[9px] text-slate-400 uppercase font-extrabold">Pending</div>
              </div>
              <div className="glass-card rounded-2xl p-3 text-center border border-white/20 dark:border-slate-800/40">
                <div className="text-xl font-black text-emerald-500">{completedCount}</div>
                <div className="text-[9px] text-slate-400 uppercase font-extrabold">Done</div>
              </div>
            </div>
          </div>

          {/* Side-by-side: Request List (7/12) & Active Report Workspace (5/12) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Side List (7/12) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="glass-card-pro rounded-3xl p-4 border border-white/20 dark:border-slate-800/20 flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search patient name or lab test..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filtered.length === 0 ? (
                  <div className="glass-card-pro rounded-3xl p-8 text-center opacity-60 text-xs font-semibold">
                    No diagnostic requests match current filter.
                  </div>
                ) : (
                  filtered.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => {
                        setActiveRequest(req);
                        setResultInput(req.result || '');
                        setNotesInput(req.resultNotes || '');
                      }}
                      className={`glass-card-pro rounded-3xl p-6 border transition-all cursor-pointer space-y-3 ${
                        activeRequest?.id === req.id
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xl'
                          : 'border-white/20 dark:border-slate-800/20 hover:border-indigo-500/30'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block">{req.testName}</span>
                          <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100">{req.patientName}</h4>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                          req.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      {req.instructions && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40 italic">
                          "Instructions: {req.instructions}"
                        </p>
                      )}

                      <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-200/40 dark:border-slate-800/40 pt-2.5 font-semibold">
                        <span>Ordered by: {req.requestedBy}</span>
                        <span>{new Date(req.requestedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

            {/* Right Side Editor Panel (5/12) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              {activeRequest ? (
                <div className="glass-card-pro rounded-3xl p-6 border border-indigo-500/30 space-y-5 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-slate-200/40 dark:border-slate-800/40 pb-3">
                    <div>
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">Report Publisher</span>
                      <h3 className="font-black text-base">{activeRequest.testName}</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{activeRequest.patientName}</span>
                  </div>

                  <form onSubmit={handlePublishResult} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Quantitative Result Value</label>
                      <input
                        type="text"
                        placeholder="e.g. 14.2 g/dL Hemoglobin"
                        className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        value={resultInput}
                        onChange={(e) => setResultInput(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Pathologist Remarks & Notes</label>
                      <textarea
                        rows={3}
                        placeholder="Clinical remarks or reference range observations..."
                        className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        value={notesInput}
                        onChange={(e) => setNotesInput(e.target.value)}
                      />
                    </div>

                    {/* AI Explanation Button & Box */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleAIExplain}
                        className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-indigo-500/20"
                      >
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Trigger AI Interpretation
                      </button>

                      {aiLoading && (
                        <div className="p-3 text-center text-xs text-indigo-500 font-bold flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Analyzing result ranges...
                        </div>
                      )}

                      {aiExplanation && (
                        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed font-medium">
                          {aiExplanation}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                      Publish Official Laboratory Report
                    </button>
                  </form>
                </div>
              ) : (
                <div className="glass-card-pro rounded-3xl p-8 text-center opacity-60 text-xs font-semibold">
                  Select a test request from the list to publish report.
                </div>
              )}
            </div>

          </div>

        </main>
      </div>

    </div>
  );
}
