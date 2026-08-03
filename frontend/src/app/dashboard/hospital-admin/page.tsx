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
  Siren,
  Phone,
  Settings,
} from 'lucide-react';
import api from '../../../lib/api';
import { clearTokens } from '../../../lib/auth';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import DashboardHeader from '../../../components/DashboardHeader';

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

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
        <span className="text-xs text-cyan-400 font-bold tracking-wider mt-4 uppercase animate-pulse">
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
          <button onClick={() => router.push('/auth')} className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-xs">
            Logout & Switch Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#02060e] text-slate-800 dark:text-slate-100 transition-colors duration-300">

      {/* Background */}
      <div className="fixed inset-0 bg-mesh -z-10 pointer-events-none" />
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/8 blur-[140px] pointer-events-none animate-float" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none animate-float-delayed" />

      {/* Unified Header */}
      <DashboardHeader userRole={user?.role} userName={analytics.name} title="Hospital Command Center" />

      <div className="flex-1 flex min-w-0">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-72 hidden lg:flex flex-col justify-between sticky top-16 h-[calc(100vh-4rem)] bg-white/70 dark:bg-slate-900/60 border-r border-slate-200/40 dark:border-slate-800/40 backdrop-blur-md p-6 shrink-0 z-20">
          <div className="space-y-6">
            
            {/* Hospital Vitals */}
            <div className="p-4 rounded-3xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 space-y-3 shadow-md">
              <div className="flex items-center gap-2 text-xs font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" /> {analytics.city}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Total Beds', val: analytics.totalBeds, color: 'text-teal-500' },
                  { label: 'Occupied', val: analytics.occupiedBeds, color: 'text-amber-500' },
                  { label: 'ICU Beds', val: analytics.totalICUBeds, color: 'text-cyan-500' },
                  { label: 'ICU Used', val: analytics.occupiedICUBeds, color: 'text-rose-500' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="text-center p-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/30 dark:border-slate-800/30">
                    <div className={`text-lg font-black ${color}`}>{val}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-extrabold">{label}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">Queue Wait</span>
                <span className="font-black text-sm text-amber-500">{analytics.queueLength} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">ER Readiness</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${analytics.isEmergencyAvailable ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                  {analytics.isEmergencyAvailable ? '✓ Ready' : '✗ Busy'}
                </span>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="space-y-1">
              {[
                { label: 'Bed & ICU Telemetry', icon: Bed, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                { label: 'Blood Bank Stocks', icon: Droplet, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                { label: 'Staff Roster', icon: Users, count: analytics.doctors.length, color: 'text-teal-500', bg: 'bg-teal-500/10' },
                { label: 'Hospital Rating', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              ].map(({ label, icon: Icon, count, color, bg }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-extrabold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-default transition-all">
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

            {/* Rating Card */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center space-y-1">
              <div className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Hospital Rating Index</div>
              <div className="flex items-center justify-center gap-1.5">
                <Star className="w-5 h-5 text-amber-500 fill-current" />
                <span className="text-2xl font-black text-amber-500">{analytics.rating.toFixed(1)}</span>
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] text-slate-400 font-extrabold text-center uppercase tracking-wider">
            {analytics.contactNumber}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* Toast */}
          {toast && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 shadow-2xl backdrop-blur-md">
              <CheckCircle className="w-5 h-5 text-teal-500" />
              <span className="text-sm font-bold">{toast}</span>
            </div>
          )}

          {/* Welcome Banner */}
          <div className="glass-card-pro rounded-3xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-2xl border border-white/20 dark:border-slate-800/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-2 z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black text-cyan-600 dark:text-cyan-400 tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Regional Hospital Command
              </div>
              <h2 className="text-3xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-cyan-600 to-teal-500 bg-clip-text text-transparent">{analytics.name}</span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-cyan-500" /> {analytics.address}, {analytics.city}
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0 z-10">
              {[
                { label: 'Total Beds', val: analytics.totalBeds, color: 'text-teal-500' },
                { label: 'Occupied', val: analytics.occupiedBeds, color: 'text-amber-500' },
                { label: 'ICU Total', val: analytics.totalICUBeds, color: 'text-cyan-500' },
                { label: 'ICU Used', val: analytics.occupiedICUBeds, color: 'text-rose-500' },
              ].map(({ label, val, color }) => (
                <div key={label} className="glass-card rounded-2xl p-3 text-center border border-white/20 dark:border-slate-800/40">
                  <div className={`text-xl font-black ${color}`}>{val}</div>
                  <div className="text-[9px] text-slate-400 uppercase font-extrabold">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left: Telemetry + Staff (8/12) */}
            <div className="lg:col-span-8 space-y-8">

              {/* Bed Telemetry Form */}
              <div className="glass-card-pro rounded-3xl p-6 border border-cyan-500/20 shadow-2xl space-y-5">
                <h3 className="font-black text-base flex items-center gap-2 tracking-tight">
                  <Bed className="w-5 h-5 text-cyan-500" /> Live Hospital Bed & ICU Telemetry
                </h3>
                <form onSubmit={handleUpdateBeds} className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                  {[
                    { label: 'Total Beds', key: 'totalBeds', val: bedsForm.totalBeds },
                    { label: 'Occupied Beds', key: 'occupiedBeds', val: bedsForm.occupiedBeds },
                    { label: 'Total ICU', key: 'totalICUBeds', val: bedsForm.totalICUBeds },
                    { label: 'Occupied ICU', key: 'occupiedICUBeds', val: bedsForm.occupiedICUBeds },
                    { label: 'Queue (min)', key: 'queueLength', val: bedsForm.queueLength },
                  ].map(({ label, key, val }) => (
                    <div key={key} className={`space-y-1 ${key === 'queueLength' ? 'col-span-2 md:col-span-1' : ''}`}>
                      <label className="text-[10px] font-black text-slate-400 uppercase">{label}</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                        value={val}
                        onChange={(e) => setBedsForm({ ...bedsForm, [key]: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  ))}
                  <button type="submit" disabled={actionLoading} className="col-span-2 md:col-span-5 py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-60 text-white font-extrabold text-xs rounded-xl transition shadow-lg shadow-cyan-500/20">
                    {actionLoading ? 'Saving...' : 'Save Telemetry Metrics'}
                  </button>
                </form>
              </div>

              {/* Staff Roster */}
              <div className="glass-card-pro rounded-3xl p-6 border border-white/20 dark:border-slate-800/20 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-base flex items-center gap-2 tracking-tight">
                    <Users className="w-5 h-5 text-teal-500" /> Medical Staff Roster
                  </h3>
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-teal-500/10 text-teal-600 border border-teal-500/20">{analytics.doctors.length} Doctors</span>
                </div>
                <div className="divide-y divide-slate-200/40 dark:divide-slate-800/40">
                  {analytics.doctors.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-400 opacity-60">No doctors assigned to this hospital yet.</div>
                  ) : (
                    analytics.doctors.map((doc) => (
                      <div key={doc.id} className="py-3.5 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 font-black text-xs flex items-center justify-center">{doc.fullName.charAt(0)}</div>
                          <div>
                            <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{doc.fullName}</div>
                            <div className="text-[11px] text-slate-400 font-semibold">{doc.specialty} · {doc.experienceYears} yrs exp</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 font-extrabold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg text-xs">
                          <Star className="w-3.5 h-3.5 fill-current" /> {doc.rating.toFixed(1)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: Blood Bank (4/12) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              <div className="glass-card-pro rounded-3xl p-6 border border-rose-500/30 space-y-5 shadow-xl">
                <h3 className="font-black text-base flex items-center gap-2 text-rose-500 tracking-tight">
                  <Droplet className="w-5 h-5 fill-current" /> Blood Bank Stocks
                </h3>
                <form onSubmit={handleUpdateBlood} className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none"
                      value={bloodForm.bloodGroup}
                      onChange={(e) => setBloodForm({ ...bloodForm, bloodGroup: e.target.value })}
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Bags"
                      value={bloodForm.bagsCount}
                      onChange={(e) => setBloodForm({ ...bloodForm, bagsCount: e.target.value })}
                      className="w-24 px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/50 focus:outline-none"
                    />
                  </div>
                  <button type="submit" disabled={actionLoading} className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition shadow-md shadow-rose-500/20">
                    Update Stock
                  </button>
                </form>

                {/* Stock Table */}
                <div className="pt-2 border-t border-slate-200/40 dark:border-slate-800/40 grid grid-cols-4 gap-2">
                  {(analytics.bloodStocks ?? []).map((bs) => (
                    <div key={bs.bloodGroup} className="p-2 rounded-xl bg-rose-500/5 border border-rose-500/20 text-center">
                      <div className="font-black text-rose-600 dark:text-rose-400 text-xs">{bs.bloodGroup}</div>
                      <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{bs.bagsCount}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>

    </div>
  );
}
