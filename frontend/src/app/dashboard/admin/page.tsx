'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Bed,
  Building2,
  CreditCard,
  Droplet,
  Globe,
  Loader2,
  LogOut,
  Siren,
  TrendingUp,
  Users,
  Stethoscope,
  BarChart3,
  CheckCircle,
  ShieldCheck,
  Zap,
  Radio,
  Eye,
} from 'lucide-react';
import api from '../../../lib/api';
import { clearTokens } from '../../../lib/auth';
import { useAuthGuard } from '../../../hooks/useAuthGuard';

interface Metrics {
  patients: number;
  doctors: number;
  hospitals: number;
  totalRevenue: number;
  emergencyAlerts: number;
  activeEmergencies: number;
}

interface Outbreak {
  disease: string;
  count: number;
}

interface Hospital {
  id: string;
  name: string;
  city: string;
  totalBeds: number;
  occupiedBeds: number;
  totalICUBeds: number;
  occupiedICUBeds: number;
  queueLength: number;
  rating: number;
  isEmergencyAvailable: boolean;
}

function StatCard({ icon: Icon, label, value, gradient, color, sub }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  gradient: string;
  color: string;
  sub?: string;
}) {
  return (
    <div className={`glass-card-pro rounded-3xl p-5 border border-white/20 dark:border-slate-800/20 hover-scale flex flex-col justify-between space-y-3 bg-gradient-to-br ${gradient}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider opacity-60 text-slate-400">{label}</span>
        <div className={`w-10 h-10 rounded-xl bg-slate-900/40 flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 animate-float" />
        </div>
      </div>
      <div>
        <div className="text-3xl font-black tracking-tight">{value}</div>
        {sub && <div className="text-[11px] text-teal-600 dark:text-teal-400 font-extrabold mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function occupancyColor(pct: number): string {
  if (pct >= 90) return 'bg-gradient-to-r from-rose-600 to-red-500';
  if (pct >= 70) return 'bg-gradient-to-r from-amber-600 to-yellow-500';
  return 'bg-gradient-to-r from-emerald-600 to-teal-500';
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard();

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [outbreaks, setOutbreaks] = useState<Outbreak[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [metricsRes, hospitalsRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/hospitals'),
      ]);
      setMetrics(metricsRes.data.statistics);
      setOutbreaks(metricsRes.data.outbreaks ?? []);
      setHospitals(hospitalsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to load national admin telemetry.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'HOSPITAL_ADMIN') {
        router.replace('/auth');
        return;
      }
      fetchData();
    }
  }, [authLoading, user, fetchData, router]);

  const handleLogout = () => {
    clearTokens();
    router.push('/auth');
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
        <span className="text-xs text-slate-400 font-bold tracking-wider mt-4 uppercase animate-pulse">
          Loading National Health Command Center...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <div className="glass-card-pro rounded-3xl border border-rose-500/30 p-8 text-center space-y-4 max-w-md">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="font-extrabold text-rose-500 text-sm">{error}</p>
          <button onClick={() => router.push('/auth')} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs">
            Return to Authentication
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-24 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      <div className="fixed inset-0 bg-mesh -z-10 pointer-events-none" />
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-float" />

      {/* Nav */}
      <header className="sticky top-0 z-30 glass-card-pro border-b border-slate-200/40 dark:border-slate-800/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-pulse-glow">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                MediLink National Command
              </span>
              <span className="ml-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        {/* Active Emergencies Banner */}
        {metrics && metrics.activeEmergencies > 0 && (
          <div className="flex items-center justify-between p-5 rounded-3xl border border-rose-500/40 bg-gradient-to-r from-rose-500/20 via-red-500/10 to-transparent text-rose-600 dark:text-rose-400 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center">
                <Siren className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold text-sm block">NATIONAL EMERGENCY ESCALATION ACTIVE</span>
                <span className="text-xs opacity-80">{metrics.activeEmergencies} live high-priority emergency SOS broadcast beacon(s) active across regional sectors.</span>
              </div>
            </div>
            <span className="px-3 py-1 bg-rose-600 text-white font-extrabold text-xs rounded-xl uppercase tracking-wider animate-pulse">
              LIVE BEACON
            </span>
          </div>
        )}

        {/* ── KPI Stats ── */}
        {metrics && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" /> National Telemetry Metrics
              </h2>
              <span className="text-xs font-extrabold text-slate-400">Live Health Systems Index</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard icon={Users} label="Registered Patients" value={metrics.patients.toLocaleString()} gradient="from-indigo-500/10 to-transparent" color="text-indigo-500" />
              <StatCard icon={Stethoscope} label="Verified Doctors" value={metrics.doctors} gradient="from-cyan-500/10 to-transparent" color="text-cyan-500" />
              <StatCard icon={Building2} label="Hospitals Connected" value={metrics.hospitals} gradient="from-blue-500/10 to-transparent" color="text-blue-500" />
              <StatCard icon={CreditCard} label="Platform Revenue" value={`${(metrics.totalRevenue / 1000).toFixed(1)}K ETB`} gradient="from-emerald-500/10 to-transparent" color="text-emerald-500" sub="Verified digital checkout" />
              <StatCard icon={Siren} label="SOS Dispatches" value={metrics.emergencyAlerts} gradient="from-amber-500/10 to-transparent" color="text-amber-500" />
              <StatCard icon={Activity} label="Active Emergencies" value={metrics.activeEmergencies} gradient="from-rose-500/10 to-transparent" color="text-rose-500" />
            </div>
          </section>
        )}

        {/* ── Outbreak Radar ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Globe className="w-5 h-5 text-rose-500" /> Epidemic Surveillance & Outbreak Radar
            </h2>
            <span className="text-xs font-extrabold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> FMOH Surveillance
            </span>
          </div>

          {outbreaks.length === 0 ? (
            <div className="glass-card-pro rounded-3xl border border-white/20 p-8 text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="font-extrabold text-emerald-600 text-sm">No epidemic indicators or clusters detected in patient records.</p>
              <p className="text-xs opacity-60">Automated scanning active for Malaria, Cholera, Dengue, Measles, and Respiratory clusters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {outbreaks.map((ob) => {
                const severity = ob.count > 100 ? 'HIGH' : ob.count > 30 ? 'MEDIUM' : 'LOW';
                const colorMap = { HIGH: 'rose', MEDIUM: 'amber', LOW: 'teal' };
                const c = colorMap[severity];
                return (
                  <div key={ob.disease} className={`glass-card-pro rounded-3xl border border-${c}-500/30 p-6 space-y-4 hover-scale`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-${c}-500/10 text-${c}-500 border border-${c}-500/30 uppercase tracking-wider`}>
                        {severity} RISK THREAT
                      </span>
                      <Eye className={`w-4 h-4 text-${c}-500`} />
                    </div>
                    <div>
                      <h4 className="font-black text-lg">{ob.disease}</h4>
                      <div className="text-3xl font-black mt-1 text-slate-800 dark:text-slate-100">
                        {ob.count} <span className="text-xs font-bold text-slate-400">reported cases</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Hospital Capacity Grid ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Bed className="w-5 h-5 text-blue-500" /> Hospital Capacity Telemetry Grid
            </h2>
            <span className="text-xs font-extrabold text-slate-400">{hospitals.length} Regional Centers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.length === 0 ? (
              <div className="col-span-3 glass-card-pro rounded-3xl border border-white/20 p-8 text-center opacity-60 text-xs font-semibold">
                No hospital telemetry endpoints connected.
              </div>
            ) : (
              hospitals.map((h) => {
                const bedPct = h.totalBeds > 0 ? Math.round((h.occupiedBeds / h.totalBeds) * 100) : 0;
                const icuPct = h.totalICUBeds > 0 ? Math.round((h.occupiedICUBeds / h.totalICUBeds) * 100) : 0;
                return (
                  <div key={h.id} className="glass-card-pro rounded-3xl border border-white/20 dark:border-slate-800/20 p-6 space-y-5 hover-scale">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-extrabold text-base leading-snug">{h.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{h.city}</p>
                      </div>
                      {h.isEmergencyAvailable && (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/30 shrink-0">
                          ER READY
                        </span>
                      )}
                    </div>

                    {/* Standard Bed Occupancy */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-extrabold">
                        <span className="text-slate-400 flex items-center gap-1.5"><Bed className="w-3.5 h-3.5" /> General Beds</span>
                        <span>{h.occupiedBeds}/{h.totalBeds} ({bedPct}%)</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-200/50 dark:bg-slate-800/60 overflow-hidden p-0.5">
                        <div className={`h-full rounded-full transition-all duration-500 ${occupancyColor(bedPct)}`} style={{ width: `${bedPct}%` }} />
                      </div>
                    </div>

                    {/* ICU Occupancy */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-extrabold">
                        <span className="text-slate-400 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> ICU Beds</span>
                        <span>{h.occupiedICUBeds}/{h.totalICUBeds} ({icuPct}%)</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-200/50 dark:bg-slate-800/60 overflow-hidden p-0.5">
                        <div className={`h-full rounded-full transition-all duration-500 ${occupancyColor(icuPct)}`} style={{ width: `${icuPct}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-slate-200/40 dark:border-slate-800/40 pt-3 font-semibold text-slate-500">
                      <span>Queue Wait: <strong className="text-slate-800 dark:text-slate-200">{h.queueLength} min</strong></span>
                      <span>Rating: <strong className="text-amber-500">★ {h.rating.toFixed(1)}</strong></span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </main>
    </div>
  );
}

