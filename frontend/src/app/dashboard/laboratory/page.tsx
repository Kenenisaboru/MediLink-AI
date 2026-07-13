'use strict';
'use client';

import React, { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';

interface LabRequest {
  id: string;
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
  const [requests, setRequests] = useState<LabRequest[]>([
    {
      id: 'lab-1',
      patientName: 'Tewodros Assefa',
      testName: 'Lipid Profile',
      instructions: '12-hour fasting required',
      requestedBy: 'Dr. Yonas Tariku',
      requestedAt: '2026-07-12T08:30:00Z',
      status: 'PENDING',
    },
    {
      id: 'lab-2',
      patientName: 'Tewodros Assefa',
      testName: 'Serum Creatinine',
      instructions: 'Fasting preferred',
      requestedBy: 'Dr. Yonas Tariku',
      requestedAt: '2026-07-10T10:00:00Z',
      status: 'COMPLETED',
      result: '0.9 mg/dL',
      resultNotes: 'Within normal physiological range. No acute renal compromise detected.',
    },
    {
      id: 'lab-3',
      patientName: 'Chaltu Olani',
      testName: 'Complete Blood Count (CBC)',
      instructions: 'No special prep',
      requestedBy: 'Dr. Chala Beyene',
      requestedAt: '2026-07-11T14:00:00Z',
      status: 'IN_PROGRESS',
    },
    {
      id: 'lab-4',
      patientName: 'Abdi Mohammed',
      testName: 'Malaria Antigen RDT',
      instructions: 'Blood smear sample required',
      requestedBy: 'Dr. Selamawit Hailu',
      requestedAt: '2026-07-13T06:45:00Z',
      status: 'PENDING',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [toast, setToast] = useState<string | null>(null);
  const [uploadModal, setUploadModal] = useState<string | null>(null);
  const [resultInput, setResultInput] = useState({ value: '', notes: '' });
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const filtered = requests.filter(r => {
    const matchesSearch = r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.testName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const inProgressCount = requests.filter(r => r.status === 'IN_PROGRESS').length;
  const completedCount = requests.filter(r => r.status === 'COMPLETED').length;

  const handleStartProcessing = (id: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'IN_PROGRESS' as const } : r));
    showToast('Test marked as In Progress. Sample is being processed.');
  };

  const handleUploadResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModal || !resultInput.value) return;

    setRequests(requests.map(r => r.id === uploadModal ? {
      ...r,
      status: 'COMPLETED' as const,
      result: resultInput.value,
      resultNotes: resultInput.notes,
    } : r));

    showToast('Lab result uploaded successfully. Patient has been notified.');
    setUploadModal(null);
    setResultInput({ value: '', notes: '' });
  };

  const generateAIExplanation = (testName: string, result: string) => {
    setAiExplanation(null);
    setTimeout(() => {
      if (testName.includes('Creatinine')) {
        setAiExplanation(
          `The Serum Creatinine test measures kidney function. A result of ${result} is within the normal range (0.7–1.3 mg/dL for adults). This indicates healthy kidney filtration. No immediate clinical concern. The patient should continue regular hydration and follow up as scheduled.\n\nDisclaimer: This AI explanation is for informational purposes only and does not replace professional medical interpretation.`
        );
      } else if (testName.includes('CBC')) {
        setAiExplanation(
          `A Complete Blood Count (CBC) evaluates overall health by measuring red blood cells, white blood cells, hemoglobin, and platelets. Results help detect infections, anemia, clotting disorders, and immune system conditions. Please consult the ordering physician for a detailed interpretation.\n\nDisclaimer: This AI explanation is for informational purposes only.`
        );
      } else {
        setAiExplanation(
          `The "${testName}" with a value of "${result}" should be interpreted in clinical context by the ordering physician. Factors such as patient age, medications, and medical history influence result significance.\n\nDisclaimer: This AI explanation is for informational purposes only.`
        );
      }
    }, 800);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'IN_PROGRESS': return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
      default: return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Laboratory Portal</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Wudase Diagnostic Laboratory</h1>
          <p className="text-xs opacity-70 mt-1">Bole Road, Addis Ababa</p>
        </div>
      </div>

      {toast && (
        <div className="mb-6 p-4 bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-400 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-2xl glass-card border border-white/20 hover-scale">
          <div className="flex items-center gap-2 mb-2 text-amber-600">
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Pending</span>
          </div>
          <span className="text-2xl font-black">{pendingCount}</span>
        </div>
        <div className="p-4 rounded-2xl glass-card border border-white/20 hover-scale">
          <div className="flex items-center gap-2 mb-2 text-cyan-600">
            <FlaskConical className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Processing</span>
          </div>
          <span className="text-2xl font-black">{inProgressCount}</span>
        </div>
        <div className="p-4 rounded-2xl glass-card border border-white/20 hover-scale">
          <div className="flex items-center gap-2 mb-2 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Completed</span>
          </div>
          <span className="text-2xl font-black">{completedCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Lab Requests Table */}
        <div className="lg:col-span-8">
          <div className="p-6 rounded-2xl glass-card border border-white/20">
            <h2 className="font-extrabold text-lg flex items-center gap-2 mb-4">
              <FlaskConical className="w-5 h-5 text-teal-600" />
              Lab Test Requests
            </h2>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 opacity-50" />
                <input
                  type="text"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200/40 bg-white/20 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-teal-700 text-sm"
                  placeholder="Search patient or test name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2.5 rounded-xl border border-slate-200/40 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Requests List */}
            <div className="space-y-4">
              {filtered.map((req) => (
                <div key={req.id} className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/10">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold">{req.testName}</h3>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${getStatusBadge(req.status)}`}>
                          {req.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs flex items-center gap-1 opacity-80">
                        <User className="w-3 h-3" />
                        Patient: <strong>{req.patientName}</strong>
                      </p>
                      <p className="text-xs opacity-60">Requested by {req.requestedBy} &bull; {new Date(req.requestedAt).toLocaleString()}</p>
                      {req.instructions && (
                        <p className="text-xs italic text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {req.instructions}
                        </p>
                      )}

                      {/* Completed result display */}
                      {req.status === 'COMPLETED' && req.result && (
                        <div className="mt-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                            <FileText className="w-3.5 h-3.5" />
                            Result: <span className="text-base">{req.result}</span>
                          </div>
                          {req.resultNotes && (
                            <p className="text-[11px] opacity-80">{req.resultNotes}</p>
                          )}
                          <button
                            onClick={() => generateAIExplanation(req.testName, req.result!)}
                            className="mt-1 px-3 py-1 bg-teal-700 hover:bg-teal-600 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition"
                          >
                            <Sparkles className="w-3 h-3" /> AI Explain Result
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === 'PENDING' && (
                        <button
                          onClick={() => handleStartProcessing(req.id)}
                          className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1"
                        >
                          <FlaskConical className="w-3.5 h-3.5" /> Start
                        </button>
                      )}
                      {req.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => { setUploadModal(req.id); setResultInput({ value: '', notes: '' }); }}
                          className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1"
                        >
                          <Upload className="w-3.5 h-3.5" /> Upload Result
                        </button>
                      )}
                      {req.status === 'COMPLETED' && (
                        <button className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" /> PDF Report
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-10 opacity-60 text-sm">No lab requests found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Explanation Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl glass-card border border-white/20">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/20 mb-4">
              <h2 className="font-extrabold text-base flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
                AI Result Explanation
              </h2>
              <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded">Gemini</span>
            </div>

            {!aiExplanation && (
              <div className="text-center py-10 opacity-60 text-sm">
                <FlaskConical className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                Click &ldquo;AI Explain Result&rdquo; on a completed test to generate a patient-friendly interpretation.
              </div>
            )}

            {aiExplanation && (
              <div className="text-xs leading-relaxed whitespace-pre-line p-4 bg-teal-500/5 rounded-xl border border-teal-500/10 animate-slideUp">
                {aiExplanation}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="p-6 rounded-2xl glass-card border border-white/20">
            <h2 className="font-extrabold text-base mb-4">Today&rsquo;s Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-3 rounded-xl bg-slate-500/5 border border-slate-200/10">
                <span className="opacity-75">Tests Processed</span>
                <strong>12</strong>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-500/5 border border-slate-200/10">
                <span className="opacity-75">Avg Turnaround</span>
                <strong>4.2 hours</strong>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-500/5 border border-slate-200/10">
                <span className="opacity-75">Reports Generated</span>
                <strong>8</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Result Modal */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl glass-card border border-white/20 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/20 mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-600" /> Upload Lab Result
              </h2>
              <button onClick={() => setUploadModal(null)} className="p-1 rounded-full hover:bg-slate-200/30 transition text-xl">&times;</button>
            </div>

            <form onSubmit={handleUploadResult} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">Result Value:</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-lg border border-slate-200/50 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
                  placeholder="e.g. 0.9 mg/dL, Positive, 12.5 g/dL"
                  value={resultInput.value}
                  onChange={(e) => setResultInput({ ...resultInput, value: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1">Notes / Interpretation:</label>
                <textarea
                  className="w-full p-2.5 rounded-lg border border-slate-200/50 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none h-24 resize-none"
                  placeholder="Within normal range. No abnormalities detected..."
                  value={resultInput.notes}
                  onChange={(e) => setResultInput({ ...resultInput, notes: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl transition hover-scale"
              >
                Upload &amp; Notify Patient
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
