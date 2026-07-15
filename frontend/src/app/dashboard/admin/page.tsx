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
} from 'lucide-react';
import api from '../../../lib/api';
import { clearTokens } from '../../../lib/auth';
import { useAuthGuard } from '../../../hooks/useAuthGuard';

// ── Types ────────────────────────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) {
  return (
    <div className="glass-card rounded-2xl border border-white/20 p-5 flex items-center gap-4 hover-scale">
      <div className={`w-12 h-12 rounded-2xl bg-${color}-500/10 flex items-center justify-center text-${color}-600 dark:text-${color}-400 shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-black">{value}</div>
        <div className="text-xs opacity-60 font-medium">{label}</div>
        {sub && <div className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function occupancyColor(pct: number): string {
  if (pct >= 90) return 'bg-rose-500';
  if (pct >= 70) return 'bg-amber-500';
  return 'bg-emerald-500';
}

// ── Main Page ─────────────────────────────────────────────────────────────────
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
      setError(err.response?.data?.error ?? 'Failed to load admin data.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      // Only allow admin roles
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
          <p className="text-sm opacity-60">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl border border-rose-500/20 p-8 text-center space-y-3 max-w-sm">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="font-bold text-rose-600">{error}</p>
          <button onClick={() => router.push('/auth')} className="px-6 py-2 bg-teal-700 text-white rounded-xl font-bold text-sm">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-20">
      <div className="bg-mesh" />

      {/* Nav */}
      <header className="sticky top-0 z-30 glass-card border-b border-slate-200/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base bg-gradient-to-r from-teal-700 to-cyan-600 bg-clip-text text-transparent">
                MediLink Admin
              </span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 font-bold border border-teal-500/20">
                {user?.role}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">

        {/* Active Emergencies Banner */}
        {metrics && metrics.activeEmergencies > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-600">
            <Siren className="w-5 h-5 animate-pulse" />
            <span className="font-bold">
              {metrics.activeEmergencies} active emergency alert{metrics.activeEmergencies > 1 ? 's' : ''} in the system right now.
            </span>
          </div>
        )}

        {/* ── KPI Stats ── */}
        {metrics && (
          <section>
            <h2 className="text-xl font-extrabold mb-5 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" /> National Health Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard icon={Users} label="Patients" value={metrics.patients.toLocaleString()} color="teal" />
              <StatCard icon={Stethoscope} label="Doctors" value={metrics.doctors} color="cyan" />
              <StatCard icon={Building2} label="Hospitals" value={metrics.hospitals} color="blue" />
              <StatCard icon={CreditCard} label="Revenue (ETB)" value={`${(metrics.totalRevenue / 1000).toFixed(1)}K`} color="emerald" sub="Verified payments" />
              <StatCard icon={Siren} label="SOS Alerts" value={metrics.emergencyAlerts} color="amber" />
              <StatCard icon={Activity} label="Active Emergencies" value={metrics.activeEmergencies} color="rose" />
            </div>
          </section>
        )}

        {/* ── Outbreak Monitoring ── */}
        <section>
          <h2 className="text-xl font-extrabold mb-5 flex items-center gap-2">
            <Globe className="w-5 h-5 text-rose-500" /> Epidemic / Outbreak Monitor
          </h2>
          {outbreaks.length === 0 ? (
            <div className="glass-card rounded-2xl border border-white/20 p-8 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-emerald-600">No active outbreak indicators detected.</p>
              <p className="text-xs opacity-60 mt-1">System is scanning medical records for malaria, cholera, measles and dengue patterns.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {outbreaks.map((ob) => {
                const severity = ob.count > 100 ? 'HIGH' : ob.count > 30 ? 'MEDIUM' : 'LOW';
                const colorMap = { HIGH: 'rose', MEDIUM: 'amber', LOW: 'teal' };
                const c = colorMap[severity];
                return (
                  <div key={ob.disease} className={`glass-card rounded-2xl border border-${c}-500/20 p-5`}>
                    <div className={`text-xs font-bold px-2 py-0.5 rounded-full bg-${c}-500/10 text-${c}-600 border border-${c}-500/20 inline-block mb-3`}>
                      {severity} RISK
                    </div>
                    <div className="font-bold text-base">{ob.disease}</div>
                    <div className={`text-3xl font-black text-${c}-600 mt-1`}>{ob.count} <span className="text-sm font-normal opacity-60">cases</span></div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Hospital Capacity ── */}
        <section>
          <h2 className="text-xl font-extrabold mb-5 flex items-center gap-2">
            <Bed className="w-5 h-5 text-blue-500" /> Hospital Capacity Telemetry
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.length === 0 ? (
              <div className="col-span-3 glass-card rounded-2xl border border-white/20 p-8 text-center opacity-60 text-sm">
                No hospitals found.
              </div>
            ) : (
              hospitals.map((h) => {
                const bedPct = h.totalBeds > 0 ? Math.round((h.occupiedBeds / h.totalBeds) * 100) : 0;
                const icuPct = h.totalICUBeds > 0 ? Math.round((h.occupiedICUBeds / h.totalICUBeds) * 100) : 0;
                return (
                  <div key={h.id} className="glass-card rounded-2xl border border-white/20 p-5 space-y-4 hover-scale">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-sm leading-tight">{h.name}</div>
                        <div className="text-xs opacity-60 mt-0.5">{h.city}</div>
                      </div>
                      {h.isEmergencyAvailable && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
                          EMERGENCY
                        </span>
                      )}
                    </div>

                    {/* Bed occupancy */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="opacity-60 flex items-center gap-1"><Bed className="w-3 h-3" /> Beds</span>
                        <span className="font-bold">{h.occupiedBeds}/{h.totalBeds} ({bedPct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200/40 dark:bg-slate-700/40 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${occupancyColor(bedPct)}`} style={{ width: `${bedPct}%` }} />
                      </div>
                    </div>

                    {/* ICU occupancy */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="opacity-60 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> ICU</span>
                        <span className="font-bold">{h.occupiedICUBeds}/{h.totalICUBeds} ({icuPct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200/40 dark:bg-slate-700/40 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${occupancyColor(icuPct)}`} style={{ width: `${icuPct}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-slate-200/20 pt-3">
                      <span className="opacity-60">Queue: <strong>{h.queueLength} min est.</strong></span>
                      <span className="opacity-60">★ {h.rating.toFixed(1)}</span>
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
