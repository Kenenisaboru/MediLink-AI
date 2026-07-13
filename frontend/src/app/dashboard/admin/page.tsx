'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Bed,
  Building2,
  CreditCard,
  Droplet,
  Heart,
  MapPin,
  ShieldCheck,
  Siren,
  TrendingUp,
  Users,
  UserPlus,
  Stethoscope,
  Pill,
  FlaskConical,
  BarChart3,
  Globe
} from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    patients: 2847,
    doctors: 186,
    hospitals: 24,
    totalRevenue: 1_245_800,
    emergencyAlerts: 312,
    activeEmergencies: 3,
  });

  const [outbreaks, setOutbreaks] = useState([
    { disease: 'Malaria (Southern Region)', count: 142, trend: 'rising', severity: 'HIGH' },
    { disease: 'Cholera (Oromia)', count: 38, trend: 'stable', severity: 'MEDIUM' },
    { disease: 'Measles (Amhara)', count: 17, trend: 'declining', severity: 'LOW' },
  ]);

  const [recentUsers, setRecentUsers] = useState([
    { name: 'Dr. Biruk Tadesse', role: 'DOCTOR', hospital: 'Yekatit 12 Hospital', verified: true },
    { name: 'Bethlehem Pharmacy', role: 'PHARMACY', hospital: 'Bole Rd, Addis Ababa', verified: false },
    { name: 'Selam Gebru', role: 'PATIENT', hospital: '—', verified: true },
    { name: 'Ambulance Unit 07-AA', role: 'AMBULANCE_DRIVER', hospital: 'Addis Ababa Fleet', verified: true },
  ]);

  const [hospitalPerformance, setHospitalPerformance] = useState([
    { name: 'Black Lion Hospital', city: 'Addis Ababa', beds: 800, occupied: 720, icu: 45, icuOccupied: 42, queue: 25, rating: 4.5 },
    { name: 'St. Paul Hospital', city: 'Addis Ababa', beds: 500, occupied: 450, icu: 30, icuOccupied: 28, queue: 18, rating: 4.3 },
    { name: 'Hawassa Referral', city: 'Hawassa', beds: 400, occupied: 310, icu: 20, icuOccupied: 15, queue: 12, rating: 4.2 },
    { name: 'Bahir Dar Felege Hiwot', city: 'Bahir Dar', beds: 350, occupied: 280, icu: 18, icuOccupied: 14, queue: 8, rating: 4.4 },
  ]);

  const formatCurrency = (val: number) => val.toLocaleString('en-US');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    }
  };

  const getOccupancyColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Super Admin Console</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">National Health Analytics</h1>
          <p className="text-xs opacity-70 mt-1">MediLink AI · Ethiopia Digital Health Transformation Dashboard</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono opacity-60">
          <Globe className="w-3.5 h-3.5" />
          <span>Last sync: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* ================= KPI STAT CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="p-4 rounded-2xl glass-card border border-white/20 hover-scale">
          <div className="flex items-center gap-2 mb-2 text-teal-600 dark:text-teal-400">
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Patients</span>
          </div>
          <span className="text-2xl font-black">{formatCurrency(metrics.patients)}</span>
        </div>
        <div className="p-4 rounded-2xl glass-card border border-white/20 hover-scale">
          <div className="flex items-center gap-2 mb-2 text-cyan-600 dark:text-cyan-400">
            <Stethoscope className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Doctors</span>
          </div>
          <span className="text-2xl font-black">{metrics.doctors}</span>
        </div>
        <div className="p-4 rounded-2xl glass-card border border-white/20 hover-scale">
          <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
            <Building2 className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Hospitals</span>
          </div>
          <span className="text-2xl font-black">{metrics.hospitals}</span>
        </div>
        <div className="p-4 rounded-2xl glass-card border border-white/20 hover-scale">
          <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Revenue (ETB)</span>
          </div>
          <span className="text-2xl font-black">{formatCurrency(metrics.totalRevenue)}</span>
        </div>
        <div className="p-4 rounded-2xl glass-card border border-white/20 hover-scale">
          <div className="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400">
            <Siren className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">SOS Alerts</span>
          </div>
          <span className="text-2xl font-black">{metrics.emergencyAlerts}</span>
        </div>
        <div className="p-4 rounded-2xl glass-card border border-white/20 hover-scale">
          <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Active SOS</span>
          </div>
          <span className="text-2xl font-black text-rose-500">{metrics.activeEmergencies}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ================= LEFT COLUMN: Outbreaks + Hospital Performance ================= */}
        <div className="lg:col-span-8 space-y-6">

          {/* Disease Outbreak Tracker */}
          <div className="p-6 rounded-2xl glass-card border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-extrabold text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                AI Disease Outbreak Monitor
              </h2>
              <span className="text-[9px] font-bold uppercase bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">Sentinel System</span>
            </div>

            <div className="space-y-4">
              {outbreaks.map((ob, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${getSeverityColor(ob.severity)} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm">{ob.disease}</h3>
                    <p className="text-xs opacity-80 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Trend: <strong className="capitalize">{ob.trend}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <span className="text-2xl font-black">{ob.count}</span>
                      <span className="text-[9px] block opacity-60 uppercase">Cases This Week</span>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getSeverityColor(ob.severity)}`}>
                      {ob.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Weekly bar chart mockup */}
            <div className="mt-6 p-4 bg-slate-900/10 dark:bg-black/20 rounded-xl border border-white/5">
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-3">Weekly Regional Case Distribution</div>
              <div className="h-28 flex items-end justify-between gap-2">
                {[
                  { label: 'Addis Ababa', height: 65, color: 'bg-teal-500' },
                  { label: 'Oromia', height: 85, color: 'bg-amber-500' },
                  { label: 'Amhara', height: 45, color: 'bg-cyan-500' },
                  { label: 'SNNPR', height: 95, color: 'bg-rose-500' },
                  { label: 'Tigray', height: 30, color: 'bg-indigo-500' },
                  { label: 'Sidama', height: 55, color: 'bg-emerald-500' },
                  { label: 'Somali', height: 40, color: 'bg-purple-500' },
                ].map((bar, i) => (
                  <div key={i} className="flex flex-col items-center w-full group">
                    <div className="relative w-full">
                      <div
                        className={`${bar.color} w-full rounded-t-sm transition-all group-hover:opacity-80`}
                        style={{ height: `${bar.height}px` }}
                      />
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold opacity-0 group-hover:opacity-100 transition">{bar.height}</span>
                    </div>
                    <span className="text-[7px] mt-1 opacity-60 truncate max-w-full">{bar.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hospital Performance Matrix */}
          <div className="p-6 rounded-2xl glass-card border border-white/20">
            <h2 className="font-extrabold text-lg flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              Hospital Performance Matrix
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b border-slate-200/20 text-[10px] uppercase tracking-wider opacity-60">
                    <th className="pb-3 pr-4">Hospital</th>
                    <th className="pb-3 pr-4">City</th>
                    <th className="pb-3 pr-4">Bed Occupancy</th>
                    <th className="pb-3 pr-4">ICU Status</th>
                    <th className="pb-3 pr-4">Queue</th>
                    <th className="pb-3">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/10">
                  {hospitalPerformance.map((h, idx) => {
                    const bedPercent = Math.round((h.occupied / h.beds) * 100);
                    const icuPercent = Math.round((h.icuOccupied / h.icu) * 100);
                    return (
                      <tr key={idx} className="hover:bg-slate-500/5 transition">
                        <td className="py-3.5 pr-4 font-semibold">{h.name}</td>
                        <td className="py-3.5 pr-4 opacity-75 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {h.city}
                        </td>
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-slate-200/30 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${getOccupancyColor(bedPercent)}`} style={{ width: `${bedPercent}%` }} />
                            </div>
                            <span className="font-bold">{bedPercent}%</span>
                          </div>
                          <span className="text-[9px] opacity-50">{h.occupied}/{h.beds}</span>
                        </td>
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-200/30 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${getOccupancyColor(icuPercent)}`} style={{ width: `${icuPercent}%` }} />
                            </div>
                            <span className="font-bold">{icuPercent}%</span>
                          </div>
                          <span className="text-[9px] opacity-50">{h.icuOccupied}/{h.icu}</span>
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className="font-bold">{h.queue}</span>
                          <span className="opacity-50"> patients</span>
                        </td>
                        <td className="py-3.5">
                          <span className="font-bold text-amber-500">★ {h.rating}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: User Management + Blood Bank ================= */}
        <div className="lg:col-span-4 space-y-6">

          {/* Recent user registrations */}
          <div className="p-6 rounded-2xl glass-card border border-white/20">
            <h2 className="font-extrabold text-base flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-teal-600" />
              Recent Registrations
            </h2>

            <div className="space-y-3">
              {recentUsers.map((u, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-500/5 border border-slate-200/10 flex items-center justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="font-bold text-sm truncate">{u.name}</h3>
                    <p className="text-[10px] opacity-60 truncate">{u.hospital}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-500/10">{u.role}</span>
                    {u.verified ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <button className="px-2 py-1 bg-teal-700 hover:bg-teal-600 text-white text-[9px] font-bold rounded transition">Verify</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Blood Bank Overview */}
          <div className="p-6 rounded-2xl glass-card border border-rose-500/10">
            <h2 className="font-extrabold text-base flex items-center gap-2 mb-4">
              <Droplet className="w-5 h-5 text-rose-500 fill-current" />
              Blood Bank Overview
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {[
                { group: 'A+', bags: 15, status: 'stable' },
                { group: 'O+', bags: 22, status: 'stable' },
                { group: 'B-', bags: 5, status: 'critical' },
                { group: 'AB+', bags: 8, status: 'low' },
                { group: 'O-', bags: 3, status: 'critical' },
                { group: 'A-', bags: 11, status: 'stable' },
              ].map((bs, idx) => (
                <div key={idx} className={`p-3 rounded-xl border text-center ${
                  bs.status === 'critical' ? 'bg-red-500/10 border-red-500/20' :
                  bs.status === 'low' ? 'bg-amber-500/10 border-amber-500/20' :
                  'bg-slate-500/5 border-slate-200/10'
                }`}>
                  <span className="text-lg font-black">{bs.group}</span>
                  <div className="text-sm font-bold mt-0.5">{bs.bags} bags</div>
                  <span className={`text-[9px] font-bold uppercase ${
                    bs.status === 'critical' ? 'text-red-500' :
                    bs.status === 'low' ? 'text-amber-500' :
                    'text-emerald-500'
                  }`}>{bs.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Service Stats */}
          <div className="p-6 rounded-2xl glass-card border border-white/20">
            <h2 className="font-extrabold text-base mb-4">Service Providers</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5 border border-slate-200/10">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold">Pharmacies</span>
                </div>
                <span className="font-black text-base">42</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5 border border-slate-200/10">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm font-semibold">Laboratories</span>
                </div>
                <span className="font-black text-base">18</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5 border border-slate-200/10">
                <div className="flex items-center gap-2">
                  <Siren className="w-4 h-4 text-rose-500" />
                  <span className="text-sm font-semibold">Ambulance Units</span>
                </div>
                <span className="font-black text-base">14</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
