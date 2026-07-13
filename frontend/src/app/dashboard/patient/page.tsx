'use strict';
'use client';

import React, { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import axios from 'axios';

export default function PatientDashboard() {
  const { t } = useLanguage();
  const [symptomModalOpen, setSymptomModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({ doctorId: 'doc-1', dateTime: '', notes: '' });
  const [appointments, setAppointments] = useState<any[]>([
    {
      id: 'app-1',
      doctor: { fullName: 'Dr. Selamawit Hailu', specialty: 'Pediatrics', hospital: { name: 'Black Lion Hospital' } },
      dateTime: '2026-07-20T10:00:00Z',
      status: 'ACCEPTED',
      telemedicineRoomId: 'room-tewodros-selam-999',
      notes: 'Monthly blood pressure evaluation and follow-up'
    },
    {
      id: 'app-2',
      doctor: { fullName: 'Dr. Chala Beyene', specialty: 'Cardiology', hospital: { name: 'Black Lion Hospital' } },
      dateTime: '2026-07-25T14:30:00Z',
      status: 'PENDING',
      notes: 'Consultation regarding heart palpitations.'
    }
  ]);
  const [bills, setBills] = useState<any[]>([
    { id: 'b-1', amount: 150.00, gateway: 'CHAPA', reference: 'TX-CHAPA-8392', status: 'SUCCESS', description: 'Lab report fees (Serum Creatinine)' },
    { id: 'b-2', amount: 350.00, gateway: 'TELEBIRR', reference: 'TX-TELE-9831', status: 'PENDING', description: 'Consultation Fee (Dr. Selamawit)' }
  ]);
  const [message, setMessage] = useState<string | null>(null);

  // Form submit simulator
  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.dateTime) return;
    
    const selectedDocName = bookingForm.doctorId === 'doc-1' ? 'Dr. Selamawit Hailu' : 'Dr. Chala Beyene';
    const selectedSpec = bookingForm.doctorId === 'doc-1' ? 'Pediatrics' : 'Cardiology';

    const newApp = {
      id: `app-${Date.now()}`,
      doctor: { fullName: selectedDocName, specialty: selectedSpec, hospital: { name: 'Black Lion Hospital' } },
      dateTime: bookingForm.dateTime,
      status: 'PENDING',
      notes: bookingForm.notes
    };

    setAppointments([newApp, ...appointments]);
    setMessage('Appointment requested successfully!');
    setBookingForm({ doctorId: 'doc-1', dateTime: '', notes: '' });
    setTimeout(() => setMessage(null), 3000);
  };

  // Payment simulator
  const handlePayment = (billId: string, gateway: string) => {
    setMessage(`Initiating ${gateway} mock checkout...`);
    setTimeout(() => {
      // Mark as successful locally for validation demonstration
      setBills(bills.map(b => b.id === billId ? { ...b, status: 'SUCCESS', reference: `TX-${gateway}-MOCK-${Math.floor(Math.random() * 90000)}` } : b));
      setMessage('Payment simulated successfully! Invoice status updated.');
      setTimeout(() => setMessage(null), 3000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Patient Dashboard</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Hello, Tewodros Assefa</h1>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setSymptomModalOpen(true)}
            className="px-4 py-2.5 text-xs font-bold bg-teal-700 hover:bg-teal-600 text-white rounded-xl shadow-lg transition"
          >
            Open AI Symptom Check
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-400 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>{message}</span>
        </div>
      )}

      {/* ================= GRID CONTENT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Records, Bookings, Billings */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Medical profile summary card */}
          <div className="p-6 rounded-2xl glass-card border border-white/20">
            <h2 className="font-extrabold text-lg flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-teal-600" /> Medical Profile Summary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/10">
                <span className="text-xs opacity-60 block">Blood Group:</span>
                <strong className="text-base text-rose-500">O+</strong>
              </div>
              <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/10">
                <span className="text-xs opacity-60 block">Allergies:</span>
                <strong className="text-sm text-amber-500">Penicillin</strong>
              </div>
              <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/10 col-span-1">
                <span className="text-xs opacity-60 block">Chronic Conditions:</span>
                <strong className="text-sm">Hypertension</strong>
              </div>
            </div>
          </div>

          {/* Appointments section */}
          <div className="p-6 rounded-2xl glass-card border border-white/20">
            <h2 className="font-extrabold text-lg flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-teal-600" /> Active Appointments
            </h2>
            
            <div className="space-y-4">
              {appointments.map((app) => (
                <div key={app.id} className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold">{app.doctor.fullName}</h3>
                    <p className="text-xs opacity-75">{app.doctor.specialty} &bull; {app.doctor.hospital.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(app.dateTime).toLocaleString()}
                    </p>
                    {app.notes && <p className="text-xs italic opacity-75 mt-1">Note: {app.notes}</p>}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${app.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                      {app.status}
                    </span>
                    {app.status === 'ACCEPTED' && app.telemedicineRoomId && (
                      <a 
                        href={`/consultation/${app.telemedicineRoomId}`} 
                        className="p-2 bg-teal-700 hover:bg-teal-600 text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold hover-scale"
                      >
                        <Video className="w-4 h-4" /> Telemedicine
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Book Appointment Form */}
          <div className="p-6 rounded-2xl glass-card border border-white/20">
            <h2 className="font-extrabold text-lg flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-teal-600" /> Book Consultation
            </h2>
            <form onSubmit={handleBook} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">Select Specialist:</label>
                  <select 
                    className="w-full p-2.5 rounded-lg border border-slate-200/50 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none"
                    value={bookingForm.doctorId}
                    onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                  >
                    <option value="doc-1">Dr. Selamawit Hailu (Pediatrics)</option>
                    <option value="doc-2">Dr. Chala Beyene (Cardiology)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Appointment Date &amp; Time:</label>
                  <input
                    type="datetime-local"
                    className="w-full p-2.5 rounded-lg border border-slate-200/50 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none"
                    value={bookingForm.dateTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, dateTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Symptoms/Notes:</label>
                <textarea
                  className="w-full p-2.5 rounded-lg border border-slate-200/50 bg-white/20 dark:bg-slate-800/40 text-sm focus:outline-none h-20 resize-none"
                  placeholder="Describe your current status or reasons for clinical check..."
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg font-bold text-xs hover-scale transition"
              >
                Submit Booking Request
              </button>
            </form>
          </div>

          {/* Billing / Invoice List */}
          <div className="p-6 rounded-2xl glass-card border border-white/20">
            <h2 className="font-extrabold text-lg flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-teal-600" /> Pending &amp; Settled Invoices
            </h2>
            <div className="space-y-4">
              {bills.map((bill) => (
                <div key={bill.id} className="p-4 rounded-xl bg-slate-500/5 border border-slate-200/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold">{bill.description}</h3>
                    <p className="text-xs opacity-70">Amount: <strong>{bill.amount} ETB</strong></p>
                    <p className="text-xs text-slate-500">Ref: {bill.reference}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {bill.status === 'SUCCESS' ? (
                      <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-600 rounded-full flex items-center gap-1">
                        Paid via {bill.gateway}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePayment(bill.id, 'CHAPA')}
                          className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg transition"
                        >
                          Chapa Pay
                        </button>
                        <button
                          onClick={() => handlePayment(bill.id, 'TELEBIRR')}
                          className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg transition"
                        >
                          Telebirr
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: SOS Widget & Emergency coordinates telemetry */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl glass-card border border-red-500/10">
            <h2 className="font-extrabold text-lg flex items-center gap-2 mb-4 text-rose-500">
              <ShieldAlert className="w-5 h-5" /> Emergency SOS Alert
            </h2>
            <SOSWidget patientId="patient-demo-uuid-tewodros" />
          </div>

          {/* Active medical prescriptions lists */}
          <div className="p-6 rounded-2xl glass-card border border-white/20">
            <h2 className="font-extrabold text-lg flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-teal-600" /> Active Prescriptions
            </h2>
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-500/5 border border-slate-200/10">
                <h3 className="font-bold text-sm">Amlodipine 5mg</h3>
                <span className="text-xs opacity-75 block mt-0.5">Dosage: 1 tablet daily</span>
                <span className="text-xs opacity-60 block mt-1">Prescribed by Dr. Yonas Tariku</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <SymptomCheckerModal 
        isOpen={symptomModalOpen} 
        onClose={() => setSymptomModalOpen(false)} 
      />
    </div>
  );
}
