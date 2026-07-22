'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Bed,
  CheckCircle,
  Clock,
  Droplet,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  ShieldCheck,
  Star,
  Users,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import api from '../../../lib/api';
import { clearTokens } from '../../../lib/auth';
import { useAuthGuard } from '../../../hooks/useAuthGuard';

interface Doctor {
  id: string;
  fullName: string;
  specialty: string;
  rating: number;
  experienceYears: number;
}

interface BloodStock {
  id: string;
  bloodGroup: string;
  bagsCount: number;
}

interface HospitalAnalytics {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  contactNumber: string;
  isEmergencyAvailable: boolean;
  totalBeds: number;
  occupiedBeds: number;
  totalICUBeds: number;
  occupiedICUBeds: number;
  queueLength: number;
  rating: number;
  doctors: Doctor[];
  bloodStocks?: BloodStock[];
}

export default function HospitalAdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard('HOSPITAL_ADMIN');

  const [analytics, setAnalytics] = useState<HospitalAnalytics | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [bedsForm, setBedsForm] = useState({ totalBeds: 0, occupiedBeds: 0, totalICUBeds: 0, occupiedICUBeds: 0, queueLength: 0 });
  const [bloodForm, setBloodForm] = useState({ bloodGroup: 'O+', bagsCount: '0' });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchHospitalAnalytics = useCallback(async () => {
    if (!user?.profile || !(user?.profile as any)?.hospitalId) {
      setDataLoading(false);
      return;
    }
    const hospId = (user.profile as any).hospitalId as string;
    try {
      const [analyticsRes, bloodRes] = await Promise.all([
        api.get(`/hospitals/${hospId}/analytics`),
        api.get(`/blood-stock/${hospId}`)
      ]);
      const data = analyticsRes.data;
      data.bloodStocks = bloodRes.data;
      setAnalytics(data);

      setBedsForm({
        totalBeds: data.totalBeds,
        occupiedBeds: data.occupiedBeds,
        totalICUBeds: data.totalICUBeds,
        occupiedICUBeds: data.occupiedICUBeds,
        queueLength: data.queueLength
      });
    } catch {
      showToast('Failed to load hospital analytics.');
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchHospitalAnalytics();
    }
  }, [authLoading, user, fetchHospitalAnalytics]);

  const handleUpdateBeds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analytics) return;
    setActionLoading(true);
    try {
      showToast('Bed telemetry updated successfully.');
      setAnalytics((prev) => (prev ? { ...prev, ...bedsForm } : null));
    } catch {
      showToast('Telemetry update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateBlood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analytics) return;
    setActionLoading(true);
    try {
      await api.post('/blood-stock/update', {
        hospitalId: analytics.id,
        bloodGroup: bloodForm.bloodGroup,
        bagsCount: parseInt(bloodForm.bagsCount) || 0
      });
      showToast(`Blood stock for ${bloodForm.bloodGroup} updated.`);
      await fetchHospitalAnalytics();
    } catch {
      showToast('Failed to update blood stock.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push('/auth');
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
        <span className="text-xs text-slate-400 font-bold tracking-wider mt-4 uppercase animate-pulse">
          Loading Hospital Control Room...
        </span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <div className="glass-card-pro rounded-3xl p-8 text-center max-w-md border border-rose-500/30 space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="font-extrabold text-rose-500 text-sm">No associated hospital found for this admin profile.</p>
          <button onClick={handleLogout} className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-xs">
            Logout & Switch Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-24 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      <div className="fixed inset-0 bg-mesh -z-10 pointer-events-none" />
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none animate-float" />

      {/* Header */}
      <header className="sticky top-0 z-30 glass-card-pro border-b border-slate-200/40 dark:border-slate-800/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 animate-pulse-glow">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-500 bg-clip-text text-transparent">
                {analytics.name}
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-500 block mt-[-4px]">
                {analytics.address}, {analytics.city}
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
          <div className="p-4 bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-400 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg">
            <CheckCircle className="w-4 h-4 text-teal-500" />
            <span>{toast}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Telemetry & Staff (8/12) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Hospital Telemetry Form */}
            <div className="glass-card-pro rounded-3xl p-6 border border-cyan-500/20 shadow-2xl space-y-5">
              <h3 className="font-black text-base flex items-center gap-2 tracking-tight">
                <Bed className="w-5 h-5 text-cyan-500" /> Live Hospital Bed & ICU Telemetry
              </h3>

              <form onSubmit={handleUpdateBeds} className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Total Beds</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none"
                    value={bedsForm.totalBeds}
                    onChange={(e) => setBedsForm({ ...bedsForm, totalBeds: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Occupied Beds</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none"
                    value={bedsForm.occupiedBeds}
                    onChange={(e) => setBedsForm({ ...bedsForm, occupiedBeds: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Total ICU</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none"
                    value={bedsForm.totalICUBeds}
                    onChange={(e) => setBedsForm({ ...bedsForm, totalICUBeds: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Occupied ICU</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none"
                    value={bedsForm.occupiedICUBeds}
                    onChange={(e) => setBedsForm({ ...bedsForm, occupiedICUBeds: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-1 col-span-2 md:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Queue Min</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none"
                    value={bedsForm.queueLength}
                    onChange={(e) => setBedsForm({ ...bedsForm, queueLength: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="col-span-2 md:col-span-5 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-cyan-500/20"
                >
                  Save Telemetry Metrics
                </button>
              </form>
            </div>

            {/* Medical Staff Roster */}
            <div className="glass-card-pro rounded-3xl p-6 border border-white/20 dark:border-slate-800/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base flex items-center gap-2 tracking-tight">
                  <Users className="w-5 h-5 text-teal-500" /> Staff Roster ({analytics.doctors.length} Doctors)
                </h3>
              </div>

              <div className="divide-y divide-slate-200/40 dark:divide-slate-800/40">
                {analytics.doctors.map((doc) => (
                  <div key={doc.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <strong className="block text-sm font-extrabold text-slate-800 dark:text-slate-200">{doc.fullName}</strong>
                      <span className="text-slate-400">{doc.specialty} · {doc.experienceYears} Years Experience</span>
                    </div>
                    <div className="flex items-center gap-1 font-extrabold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{doc.rating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Blood Bank Control (4/12) */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="glass-card-pro rounded-3xl p-6 border border-rose-500/30 space-y-4 shadow-xl">
              <h3 className="font-black text-base flex items-center gap-2 text-rose-500 tracking-tight">
                <Droplet className="w-5 h-5 fill-current" /> Blood Bank Inventory
              </h3>

              <form onSubmit={handleUpdateBlood} className="flex gap-2">
                <select
                  className="px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none"
                  value={bloodForm.bloodGroup}
                  onChange={(e) => setBloodForm({ ...bloodForm, bloodGroup: e.target.value })}
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Bags Count"
                  className="flex-1 px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none"
                  value={bloodForm.bagsCount}
                  onChange={(e) => setBloodForm({ ...bloodForm, bagsCount: e.target.value })}
                />

                <button type="submit" className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20">
                  Update
                </button>
              </form>

              <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
                {analytics.bloodStocks?.map((blood) => (
                  <div key={blood.id} className="p-2.5 rounded-2xl bg-slate-900/40 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-bold">{blood.bloodGroup}</div>
                    <div className="font-black text-rose-500 mt-1">{blood.bagsCount}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}

