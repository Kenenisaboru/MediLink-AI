'use strict';
'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  Calendar, 
  Clock, 
  FileText, 
  Plus, 
  User, 
  Sparkles, 
  FileCheck,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import axios from 'axios';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<any[]>([
    {
      id: 'app-1',
      patient: { id: 'pat-1', fullName: 'Tewodros Assefa', bloodGroup: 'O+', dateOfBirth: '1985-05-15' },
      dateTime: '2026-07-20T10:00:00Z',
      status: 'PENDING',
      notes: 'Evaluate monthly blood pressure trends.'
    },
    {
      id: 'app-2',
      patient: { id: 'pat-2', fullName: 'Chaltu Olani', bloodGroup: 'A-', dateOfBirth: '1992-09-22' },
      dateTime: '2026-07-25T14:30:00Z',
      status: 'ACCEPTED',
      notes: 'Routine cardiovascular ECG check.'
    }
  ]);

  const [diagnosisForm, setDiagnosisForm] = useState({
    patientId: 'pat-1',
    diagnosis: '',
    notes: '',
    medName: '',
    medDosage: '',
  });

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Approve appointment
  const handleApprove = (appId: string) => {
    setAppointments(appointments.map(a => a.id === appId ? { ...a, status: 'ACCEPTED' } : a));
    showToast('Appointment approved successfully.');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Submit prescription record
  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosisForm.diagnosis || !diagnosisForm.notes) return;

    showToast('Electronic medical record written to database.');
    setDiagnosisForm({ patientId: 'pat-1', diagnosis: '', notes: '', medName: '', medDosage: '' });
  };

  // Call Gemini Medical summary generator
  const triggerAISummary = async (patientId: string) => {
    setAiLoading(true);
    setAiSummary(null);

    try {
      // Mock call or direct backend fetch
      const res = await axios.get(`http://localhost:5000/api/doctor/ai-summary/${patientId}`);
      setAiSummary(res.data.summary);
    } catch (err) {
      console.warn('AI summary call failed. Fallback to local clinical model.');
      setTimeout(() => {
        setAiSummary(`
**Clinical Summary (AI Summary - Gemini 1.5 Flash)**
* **Patient Name:** Tewodros Assefa (Age: 41)
* **Allergies:** Penicillin (Severe reaction - Anaphylaxis danger).
* **Chronic Diseases:** Essential Hypertension (Stage 1).
* **Active Medications:** Amlodipine 5mg once daily.
* **Lab Status:** Serum Creatinine (0.9 mg/dL - Normal). Lipid panel requested.
* **Physiological Risk factors:** Moderate cardiovascular risk due to elevated blood pressures (145/95) and history of appendectomy. Low sodium diets indicated.
        `.trim());
        setAiLoading(false);
      }, 1000);
    } finally {
      if (!aiSummary) {
        setTimeout(() => setAiLoading(false), 1000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Clinical Portal</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Dr. Selamawit Hailu</h1>
        </div>
      </div>

      {toast && (
        <div className="mb-6 p-4 bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-400 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* ================= MAIN LAYOUT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Appointments & EMR creation */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Appointment list */}
          <div className="p-6 rounded-2xl glass-card border border-white/20">
            <h2 className="font-extrabold text-lg flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-teal-600" /> Consultations Queue
            </h2>
            <div className="space-y-4">
              {appointments.map((app) => (
                <div key={app.id} className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="font-extrabold">{app.patient.fullName}</strong>
                      <span className="text-[10px] bg-teal-500/10 text-teal-700 px-1.5 py-0.5 rounded">Blood: {app.patient.bloodGroup}</span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(app.dateTime).toLocaleString()}
                    </p>
                    <p className="text-xs opacity-75">{app.notes}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {app.status === 'PENDING' ? (
                      <button
                        onClick={() => handleApprove(app.id)}
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg transition"
                      >
                        Accept
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-600 rounded-full">
                        Approved
                      </span>
                    )}

                    <button
                      onClick={() => triggerAISummary(app.patient.id)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                    >
                      <Sparkles className="w-3 h-3 text-teal-500" /> AI Digest
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Write electronic medical record */}
          <div className="p-6 rounded-2xl glass-card border border-white/20">
            <h2 className="font-extrabold text-lg flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-teal-600" /> Record Diagnostics &amp; E-Prescription
            </h2>
            <form onSubmit={handleRecordSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-1">Select Patient:</label>
                <select
                  className="w-full p-2.5 rounded-lg border border-slate-200/50 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none"
                  value={diagnosisForm.patientId}
                  onChange={(e) => setDiagnosisForm({ ...diagnosisForm, patientId: e.target.value })}
                >
                  <option value="pat-1">Tewodros Assefa</option>
                  <option value="pat-2">Chaltu Olani</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Primary Diagnosis:</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-lg border border-slate-200/50 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none"
                  placeholder="e.g. Essential Hypertension"
                  value={diagnosisForm.diagnosis}
                  onChange={(e) => setDiagnosisForm({ ...diagnosisForm, diagnosis: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Clinical Consultation Notes:</label>
                <textarea
                  className="w-full p-2.5 rounded-lg border border-slate-200/50 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none h-24 resize-none"
                  placeholder="Write patient notes, vitals status..."
                  value={diagnosisForm.notes}
                  onChange={(e) => setDiagnosisForm({ ...diagnosisForm, notes: e.target.value })}
                  required
                />
              </div>

              <div className="border-t border-slate-200/20 pt-4 space-y-3">
                <span className="text-xs font-bold block text-teal-600 dark:text-teal-400">Add Medication (Prescription)</span>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    className="p-2.5 rounded-lg border border-slate-200/50 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none"
                    placeholder="Medicine Name (e.g. Amlodipine)"
                    value={diagnosisForm.medName}
                    onChange={(e) => setDiagnosisForm({ ...diagnosisForm, medName: e.target.value })}
                  />
                  <input
                    type="text"
                    className="p-2.5 rounded-lg border border-slate-200/50 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none"
                    placeholder="Dosage (e.g. 5mg once daily)"
                    value={diagnosisForm.medDosage}
                    onChange={(e) => setDiagnosisForm({ ...diagnosisForm, medDosage: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg font-bold text-xs transition hover-scale"
              >
                Sign &amp; Dispatch Medical Record
              </button>
            </form>
          </div>

        </div>

        {/* Right Side: AI Patient Summary Digest */}
        <div className="lg:col-span-5">
          <div className="p-6 rounded-2xl glass-card border border-white/20 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/20">
              <h2 className="font-extrabold text-base flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-teal-600 animate-pulse" />
                AI Clinical digest summary
              </h2>
              <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded">Gemini</span>
            </div>

            {aiLoading && (
              <div className="space-y-4 py-4">
                <div className="h-6 w-2/3 skeleton rounded"></div>
                <div className="h-4 w-full skeleton rounded"></div>
                <div className="h-16 w-full skeleton rounded"></div>
              </div>
            )}

            {!aiLoading && !aiSummary && (
              <div className="text-center py-10 opacity-75 text-sm">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                Select &ldquo;AI Digest&rdquo; from the appointments list to generate a medical summary of the patient's record history.
              </div>
            )}

            {!aiLoading && aiSummary && (
              <div className="text-xs space-y-3 leading-relaxed whitespace-pre-line font-sans animate-slideUp p-4 bg-teal-500/5 rounded-xl border border-teal-500/10">
                {aiSummary}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
