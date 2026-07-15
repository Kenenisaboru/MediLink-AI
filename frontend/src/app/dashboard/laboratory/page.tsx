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
  Loader2
} from 'lucide-react';
import api from '../../../lib/api';
import { clearTokens } from '../../../lib/auth';
import { useAuthGuard } from '../../../hooks/useAuthGuard';

interface LabRequest {
  id: string; // generated client composite
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

      showToast('Lab result submitted successfully.');
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
      showToast('Please type a result value first to explain.', false);
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

  const filtered = requests.filter(req => {
    const matchesSearch = req.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.testName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const completedCount = requests.filter(r => r.status === 'COMPLETED').length;

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Diagnostic Laboratory</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Laboratory Staff Dashboard</h1>
          <p className="text-xs opacity-70 mt-1">Process diagnostic requests and publish digital reports</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition font-bold"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {toast && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 border ${
          toast.ok ? 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600'
        }`}>
          {toast.ok ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-2xl glass-card border border-white/20">
          <div className="flex items-center gap-2 mb-2 text-teal-600">
            <FlaskConical className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Total Requests</span>
          </div>
          <span className="text-2xl font-black">{requests.length}</span>
        </div>
        <div className="p-4 rounded-2xl glass-card border border-white/20">
          <div className="flex items-center gap-2 mb-2 text-amber-600">
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Pending</span>
          </div>
          <span className="text-2xl font-black">{pendingCount}</span>
        </div>
        <div className="p-4 rounded-2xl glass-card border border-white/20">
          <div className="flex items-center gap-2 mb-2 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Completed</span>
          </div>
          <span className="text-2xl font-black">{completedCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 rounded-2xl glass-card border border-white/20 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-3.5 opacity-60" />
              <input
                type="text"
                placeholder="Search patient name or test name..."
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200/40 bg-white/20 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-teal-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {(['ALL', 'PENDING', 'COMPLETED'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`flex-1 sm:flex-initial px-3 py-2 text-xs font-bold rounded-lg transition ${
                    filterStatus === status ? 'bg-teal-700 text-white shadow-md' : 'bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-200/80'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="p-8 text-center glass-card rounded-2xl border border-white/20 opacity-60 text-xs font-semibold">
                No diagnostic requests found.
              </div>
            ) : (
              filtered.map(req => (
                <div
                  key={req.id}
                  onClick={() => {
                    setActiveRequest(req);
                    setResultInput(req.result || '');
                    setNotesInput(req.resultNotes || '');
                    setAiExplanation(null);
                  }}
                  className={`p-4 rounded-2xl glass-card border hover-scale cursor-pointer transition ${
                    activeRequest?.id === req.id ? 'border-teal-500 bg-teal-500/5' : 'border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-extrabold text-sm">{req.patientName}</h4>
                      <span className="text-[10px] opacity-60">Requested by: Dr. {req.requestedBy}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      req.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="border-t border-slate-200/10 pt-2 text-xs">
                    <div><strong>Test:</strong> {req.testName}</div>
                    <div className="opacity-75 mt-1"><strong>Instructions:</strong> {req.instructions}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side Workstation */}
        <div className="lg:col-span-5">
          {activeRequest ? (
            <div className="p-6 rounded-2xl glass-card border border-white/20 space-y-4 sticky top-6">
              <div>
                <span className="text-[9px] font-extrabold uppercase bg-teal-500/10 text-teal-700 px-2 py-0.5 rounded">Diagnostic Workspace</span>
                <h3 className="font-extrabold text-base mt-2">{activeRequest.patientName}</h3>
                <p className="text-xs opacity-60">Test: {activeRequest.testName}</p>
              </div>

              <form onSubmit={handleSubmitResult} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold opacity-60 mb-1 block pl-1">Laboratory Outcome / Value</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 140 mg/dL or Negative"
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200/40 bg-white/20 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-teal-700"
                    value={resultInput}
                    onChange={(e) => setResultInput(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold opacity-60 mb-1 block pl-1">Diagnostic Notes / References</label>
                  <textarea
                    rows={3}
                    placeholder="Describe range values or specific observations..."
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200/40 bg-white/20 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-teal-700 resize-none"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fetchAIExplanation(activeRequest)}
                    className="flex-1 py-2.5 text-xs font-bold bg-purple-700 hover:bg-purple-600 text-white rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Explain Result
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-2.5 text-xs font-bold bg-teal-700 hover:bg-teal-600 text-white rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <Upload className="w-4 h-4" />
                    Publish Report
                  </button>
                </div>
              </form>

              {aiLoading && (
                <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 text-center text-xs">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-purple-600" />
                  Generating multilingual clinical translation...
                </div>
              )}

              {aiExplanation && (
                <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-2 text-xs">
                  <span className="font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Patient Translation</span>
                  <p className="italic leading-relaxed opacity-95">"{aiExplanation}"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center glass-card rounded-2xl border border-white/20 opacity-60 text-xs font-semibold">
              Select a diagnostic request to verify and publish results.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
