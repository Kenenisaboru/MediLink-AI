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
} from 'lucide-react';
import api from '../../../lib/api';
import { clearTokens } from '../../../lib/auth';
import { useAuthGuard } from '../../../hooks/useAuthGuard';

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
  const { user, loading: authLoading } = useAuthGuard('LAB_STAFF');

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

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
      const { data } = await api.get('/lab/requests');
      setRequests(data);
    } catch (err: any) {
      showToast(err.response?.data?.error ?? 'Failed to fetch lab requests.', false);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, fetchData]);

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest || !resultInput) return;

    setActionLoading(true);
    try {
      await api.post('/lab/results', {
        recordId: activeRequest.recordId,
        requestIndex: activeRequest.requestIndex,
        result: resultInput,
        resultNotes: notesInput
      });

      showToast('Lab result submitted and published successfully.');
      setActiveRequest(null);
      setResultInput('');
      setNotesInput('');
      setAiExplanation(null);
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.error ?? 'Submission failed.', false);
    } finally {
      setActionLoading(false);
    }
  };

  const fetchAIExplanation = async (reqItem: LabRequest) => {
    if (!resultInput) {
      showToast('Please enter a test outcome value first to explain.', false);
      return;
    }
    setAiLoading(true);
    setAiExplanation(null);
    try {
      const { data } = await api.get('/lab/explain', {
        params: {
          testName: reqItem.testName,
          resultValue: resultInput
        }
      });
      setAiExplanation(data.explanation);
    } catch {
      setAiExplanation('Could not generate AI explanation. Please check result ranges manually.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push('/auth');
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <span className="text-xs text-slate-400 font-bold tracking-wider mt-4 uppercase animate-pulse">
          Loading Laboratory Workstation...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-24 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      <div className="fixed inset-0 bg-mesh -z-10 pointer-events-none" />
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-float" />

      {/* Header */}
      <header className="sticky top-0 z-30 glass-card-pro border-b border-slate-200/40 dark:border-slate-800/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-pulse-glow">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                MediLink Diagnostic Lab
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-500 block mt-[-4px]">
                Diagnostics & Report Publishing Workstation
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        {toast && (
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border shadow-lg ${
            toast.ok ? 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600'
          }`}>
            {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{toast.msg}</span>
          </div>
        )}

        {/* KPI Stats */}
        <div className="grid grid-cols-3 gap-6">
          <div className="glass-card-pro rounded-3xl p-6 border border-white/20 dark:border-slate-800/20 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Diagnostic Requests</span>
              <h4 className="text-2xl font-black">{requests.length}</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <FlaskConical className="w-6 h-6 animate-float" />
            </div>
          </div>
          <div className="glass-card-pro rounded-3xl p-6 border border-white/20 dark:border-slate-800/20 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Analysis</span>
              <h4 className="text-2xl font-black text-amber-500">{pendingCount}</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="w-6 h-6 animate-float" />
            </div>
          </div>
          <div className="glass-card-pro rounded-3xl p-6 border border-white/20 dark:border-slate-800/20 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Published Reports</span>
              <h4 className="text-2xl font-black text-emerald-500">{completedCount}</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <FileCheck className="w-6 h-6 animate-float" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side List (7/12) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="glass-card-pro rounded-3xl p-4 border border-white/20 dark:border-slate-800/20 flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 opacity-60 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient name or lab test..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {(['ALL', 'PENDING', 'COMPLETED'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`flex-1 sm:flex-initial px-3 py-2 text-xs font-bold rounded-xl transition ${
                      filterStatus === status ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-200/80'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className="glass-card-pro rounded-3xl p-8 text-center opacity-60 text-xs font-semibold">
                  No diagnostic requests match filter.
                </div>
              ) : (
                filtered.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => {
                      setActiveRequest(req);
                      setResultInput(req.result || '');
                      setNotesInput(req.resultNotes || '');
                      setAiExplanation(null);
                    }}
                    className={`glass-card-pro rounded-3xl p-6 border hover-scale cursor-pointer transition-all duration-300 ${
                      activeRequest?.id === req.id ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/20 dark:border-slate-800/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100">{req.patientName}</h4>
                        <span className="text-[10px] text-slate-400">Ordering Physician: Dr. {req.requestedBy}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                        req.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="border-t border-slate-200/40 dark:border-slate-800/40 pt-3 text-xs space-y-1">
                      <div><strong className="text-slate-400 uppercase text-[10px]">Test Type:</strong> <span className="font-bold text-slate-800 dark:text-slate-200">{req.testName}</span></div>
                      <div className="opacity-80"><strong>Instructions:</strong> {req.instructions}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Side Workstation (5/12) */}
          <div className="lg:col-span-5">
            {activeRequest ? (
              <div className="glass-card-pro rounded-3xl p-6 border border-indigo-500/30 space-y-5 shadow-2xl lg:sticky lg:top-24">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-500 px-2.5 py-1 rounded-lg">
                    Lab Analysis Console
                  </span>
                  <h3 className="font-black text-xl mt-3">{activeRequest.patientName}</h3>
                  <p className="text-xs text-slate-400">Diagnostic Target: {activeRequest.testName}</p>
                </div>

                <form onSubmit={handleSubmitResult} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Test Result Value</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 135 mg/dL or Normal/Positive"
                      className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      value={resultInput}
                      onChange={(e) => setResultInput(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Clinical Observations / Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Enter laboratory observations or reference ranges..."
                      className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fetchAIExplanation(activeRequest)}
                      className="flex-1 py-3 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center justify-center gap-1.5 transition shadow-lg shadow-purple-500/20"
                    >
                      <Sparkles className="w-4 h-4" /> AI Patient Explanation
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 py-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center gap-1.5 transition shadow-lg shadow-indigo-500/20"
                    >
                      <Upload className="w-4 h-4" /> Publish Report
                    </button>
                  </div>
                </form>

                {aiLoading && (
                  <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/10 text-center text-xs">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-purple-400" />
                    Generating patient-friendly clinical translation...
                  </div>
                )}

                {aiExplanation && (
                  <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 space-y-2 text-xs">
                    <span className="font-extrabold text-purple-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Patient Friendly Explanation
                    </span>
                    <p className="italic leading-relaxed text-slate-300">"{aiExplanation}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card-pro rounded-3xl p-12 text-center opacity-60 text-xs font-semibold">
                Select a diagnostic request to verify and publish reports.
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}

