'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import {
  Activity,
  Ambulance,
  Compass,
  AlertOctagon,
  LogOut,
  MapPin,
  CheckCircle,
  Clock,
  Loader2,
  Siren,
  Navigation,
  Radio,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { clearTokens } from '../../../lib/auth';
import { useAuthGuard } from '../../../hooks/useAuthGuard';

interface ActiveSOS {
  sosId: string;
  patientId: string;
  patientName: string;
  bloodGroup: string;
  allergies: string[];
  latitude: number;
  longitude: number;
  createdAt: string;
}

export default function AmbulanceDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard('AMBULANCE_DRIVER');

  const [socket, setSocket] = useState<Socket | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [sosAlerts, setSosAlerts] = useState<ActiveSOS[]>([]);
  const [activeSOS, setActiveSOS] = useState<ActiveSOS | null>(null);
  const [driverCoords, setDriverCoords] = useState({ latitude: 9.0125, longitude: 38.7595 });

  const addLog = (log: string) => {
    setLogs((prev) => [log, ...prev].slice(0, 6));
  };

  useEffect(() => {
    if (authLoading || !user) return;

    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    addLog('Connected to Socket.io Real-time Emergency Dispatch Gateway.');

    const name = (user.profile as any)?.driverName || 'Ambulance Unit';
    const vehicle = (user.profile as any)?.vehicleNumber || 'CODE-3';

    newSocket.emit('register-driver', {
      driverId: user.id,
      fullName: name,
      vehicleNumber: vehicle,
      latitude: driverCoords.latitude,
      longitude: driverCoords.longitude
    });

    newSocket.on('new-sos-alert', (alert: ActiveSOS) => {
      setSosAlerts((prev) => {
        if (prev.some((a) => a.sosId === alert.sosId)) return prev;
        return [alert, ...prev];
      });
      addLog(`🚨 EMERGENCY SOS SIGNAL! Incoming patient: ${alert.patientName}`);
    });

    newSocket.on('sos-claimed', (data: { sosId: string }) => {
      setSosAlerts((prev) => prev.filter((a) => a.sosId !== data.sosId));
      addLog(`SOS Alert ${data.sosId.substring(0, 8)} claimed by another driver.`);
    });

    return () => {
      newSocket.close();
    };
  }, [authLoading, user]);

  // Periodic coordinates telemetry streaming
  useEffect(() => {
    if (!socket || !user) return;

    const interval = setInterval(() => {
      const newLat = driverCoords.latitude + (Math.random() - 0.5) * 0.0006;
      const newLng = driverCoords.longitude + (Math.random() - 0.5) * 0.0006;
      const updatedCoords = { latitude: newLat, longitude: newLng };
      setDriverCoords(updatedCoords);

      socket.emit('driver-location-update', {
        driverId: user.id,
        latitude: newLat,
        longitude: newLng,
        activeSOSId: activeSOS?.sosId
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [socket, user, driverCoords, activeSOS]);

  const handleAcceptSOS = (alert: ActiveSOS) => {
    if (!socket || !user) return;
    socket.emit('accept-sos', {
      sosId: alert.sosId,
      driverId: user.id
    });
    setActiveSOS(alert);
    setSosAlerts((prev) => prev.filter((a) => a.sosId !== alert.sosId));
    addLog(`Claimed emergency route for ${alert.patientName}. Proceeding to target...`);
  };

  const handleResolveSOS = () => {
    if (!socket || !user || !activeSOS) return;
    socket.emit('resolve-sos', {
      sosId: activeSOS.sosId,
      driverId: user.id
    });
    addLog(`Emergency mission for ${activeSOS.patientName} completed & resolved.`);
    setActiveSOS(null);
  };

  const handleLogout = () => {
    clearTokens();
    router.push('/auth');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
        <span className="text-xs text-rose-400 font-bold tracking-wider mt-4 uppercase animate-pulse">
          Connecting to Ambulance Dispatch Telemetry...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-24 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      <div className="fixed inset-0 bg-mesh -z-10 pointer-events-none" />
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-rose-500/10 blur-[120px] pointer-events-none animate-float" />

      {/* Header */}
      <header className="sticky top-0 z-30 glass-card-pro border-b border-rose-500/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30 animate-pulse">
              <Siren className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 bg-clip-text text-transparent">
                MediLink Ambulance Dispatch
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-rose-500 block mt-[-4px]">
                Unit: {(user?.profile as any)?.vehicleNumber || 'CODE-3'} · Active Responder
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Dispatch Online
            </span>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Active Rescue HUD & Signals (8/12) */}
          <div className="lg:col-span-8 space-y-8">
            
            {activeSOS ? (
              <div className="glass-card-pro rounded-3xl p-8 border border-rose-500/40 relative overflow-hidden shadow-2xl space-y-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none animate-radar" />
                
                <div className="flex justify-between items-center border-b border-rose-500/20 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-black text-xs uppercase tracking-wider animate-pulse">
                      MISSION IN PROGRESS
                    </span>
                    <span className="text-xs text-rose-400 font-bold">Emergency Dispatch Intercept</span>
                  </div>
                  <Navigation className="w-6 h-6 text-rose-500 animate-spin" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{activeSOS.patientName}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Target Patient Rescue Coordinates Locked</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-rose-500/20 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Blood Group</span>
                    <strong className="text-base text-rose-500 font-black">{activeSOS.bloodGroup || 'Unknown'}</strong>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-rose-500/20 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Known Allergies</span>
                    <strong className="text-xs text-purple-400 font-bold">{activeSOS.allergies?.join(', ') || 'None'}</strong>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-rose-500/20 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient GPS</span>
                    <strong className="text-xs font-mono">{activeSOS.latitude.toFixed(4)}, {activeSOS.longitude.toFixed(4)}</strong>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-900/40 border border-rose-500/20 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Unit GPS</span>
                    <strong className="text-xs font-mono text-teal-400">{driverCoords.latitude.toFixed(4)}, {driverCoords.longitude.toFixed(4)}</strong>
                  </div>
                </div>

                <button
                  onClick={handleResolveSOS}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-xl shadow-emerald-500/25"
                >
                  Complete Emergency Mission & Return to Ready Status
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <Radio className="w-5 h-5 text-rose-500 animate-pulse" /> Active Broadcast Beacons ({sosAlerts.length})
                  </h3>
                  <span className="text-xs font-bold text-slate-400">Scanning WebSocket Layer...</span>
                </div>

                {sosAlerts.length === 0 ? (
                  <div className="glass-card-pro rounded-3xl p-12 text-center space-y-3">
                    <Siren className="w-12 h-12 text-rose-500/40 mx-auto animate-pulse" />
                    <p className="font-extrabold text-sm text-slate-400">Monitoring regional frequency for emergency SOS signals...</p>
                    <p className="text-xs text-slate-500">Live Socket.io listener is listening on endpoint /sos-gateway</p>
                  </div>
                ) : (
                  sosAlerts.map((alert) => (
                    <div key={alert.sosId} className="glass-card-pro rounded-3xl p-6 border-l-4 border-rose-500 hover-scale flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-base">{alert.patientName}</h4>
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold text-[10px]">
                            {alert.bloodGroup || 'Blood: N/A'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">
                          Target Location: Lat {alert.latitude.toFixed(4)}, Lng {alert.longitude.toFixed(4)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAcceptSOS(alert)}
                        className="px-5 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-rose-500/25 transition shrink-0 uppercase tracking-wider"
                      >
                        Claim Emergency Route
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

          {/* Right Column: Console & Telemetry Stream (4/12) */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="glass-card-pro rounded-3xl p-6 border border-slate-200/40 dark:border-slate-800/40 space-y-4 shadow-xl">
              <h3 className="font-extrabold text-sm flex items-center gap-2 text-rose-500 tracking-tight uppercase">
                <AlertOctagon className="w-4 h-4 animate-pulse" /> Telemetry Console Log
              </h3>
              
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-2.5 h-64 overflow-y-auto shadow-inner">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 leading-relaxed">
                    <span className="text-rose-500 font-bold">&gt;</span>
                    <span className="opacity-90">{log}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* GPS Telemetry Tracker */}
            <div className="glass-card-pro rounded-3xl p-6 border border-teal-500/20 space-y-3">
              <span className="text-[10px] font-extrabold uppercase text-teal-400 tracking-wider flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" /> Unit GPS Telemetry Broadcast
              </span>
              <div className="text-xs font-mono bg-slate-900/40 p-3 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">Lat: {driverCoords.latitude.toFixed(5)}</span>
                <span className="text-slate-400">Lng: {driverCoords.longitude.toFixed(5)}</span>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}

