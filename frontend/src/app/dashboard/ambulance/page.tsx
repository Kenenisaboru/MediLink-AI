'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Loader2
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
    setLogs(prev => [log, ...prev].slice(0, 5));
  };

  useEffect(() => {
    if (authLoading || !user) return;

    // Connect to websocket gateway
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    addLog('Connected to Real-time Emergency Gateway.');

    const name = (user.profile as any)?.driverName || 'Ambulance Unit';
    const vehicle = (user.profile as any)?.vehicleNumber || 'CODE-3';

    // Register as driver
    newSocket.emit('register-driver', {
      driverId: user.id,
      fullName: name,
      vehicleNumber: vehicle,
      latitude: driverCoords.latitude,
      longitude: driverCoords.longitude
    });

    // Listen for new emergency SOS broadcasts
    newSocket.on('new-sos-alert', (alert: ActiveSOS) => {
      setSosAlerts(prev => {
        if (prev.some(a => a.sosId === alert.sosId)) return prev;
        return [alert, ...prev];
      });
      addLog(`🚨 EMERGENCY SOS! Incoming patient: ${alert.patientName}`);
    });

    // Listen if someone else claimed it
    newSocket.on('sos-claimed', (data: { sosId: string }) => {
      setSosAlerts(prev => prev.filter(a => a.sosId !== data.sosId));
      addLog(`SOS Alert ${data.sosId.substring(0, 8)} claimed by another crew.`);
    });

    return () => {
      newSocket.close();
    };
  }, [authLoading, user]);

  // Periodic coordinates streaming
  useEffect(() => {
    if (!socket || !user) return;

    const interval = setInterval(() => {
      // Simulate slight driver motion
      const newLat = driverCoords.latitude + (Math.random() - 0.5) * 0.0005;
      const newLng = driverCoords.longitude + (Math.random() - 0.5) * 0.0005;
      const updatedCoords = { latitude: newLat, longitude: newLng };
      setDriverCoords(updatedCoords);

      socket.emit('driver-location-update', {
        driverId: user.id,
        latitude: newLat,
        longitude: newLng,
        activeSOSId: activeSOS?.sosId
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [socket, user, driverCoords, activeSOS]);

  const handleAcceptSOS = (alert: ActiveSOS) => {
    if (!socket || !user) return;
    socket.emit('accept-sos', {
      sosId: alert.sosId,
      driverId: user.id
    });
    setActiveSOS(alert);
    setSosAlerts(prev => prev.filter(a => a.sosId !== alert.sosId));
    addLog(`Claimed emergency route for ${alert.patientName}. Proceeding to target...`);
  };

  const handleResolveSOS = () => {
    if (!socket || !user || !activeSOS) return;
    socket.emit('resolve-sos', {
      sosId: activeSOS.sosId,
      driverId: user.id
    });
    addLog(`Emergency route for ${activeSOS.patientName} resolved and cleared.`);
    setActiveSOS(null);
  };

  const handleLogout = () => {
    clearTokens();
    router.push('/auth');
  };

  if (authLoading) {
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
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Ambulance Emergency Dispatch</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Mobile Unit Workspace</h1>
          <p className="text-xs opacity-70 mt-1">Vehicle: {(user?.profile as any)?.vehicleNumber} · Status: Active responder</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: incoming broadcasts */}
        <div className="lg:col-span-8 space-y-6">
          {activeSOS ? (
            <div className="p-6 rounded-2xl glass-card border border-rose-500/30 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded animate-pulse">ACTIVE MISSION</span>
                <span className="text-xs opacity-60">Route details</span>
              </div>
              <h3 className="text-xl font-extrabold">{activeSOS.patientName}</h3>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-white/10 rounded-xl">
                  <span className="opacity-60 block">Blood Group</span>
                  <strong className="text-sm text-rose-500 font-bold">{activeSOS.bloodGroup || 'Unknown'}</strong>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <span className="opacity-60 block">Allergies</span>
                  <strong className="text-sm font-semibold">{activeSOS.allergies?.join(', ') || 'None'}</strong>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <span className="opacity-60 block">GPS Coordinates</span>
                  <strong>{activeSOS.latitude.toFixed(5)}, {activeSOS.longitude.toFixed(5)}</strong>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <span className="opacity-60 block">Your GPS Coordinates</span>
                  <strong>{driverCoords.latitude.toFixed(5)}, {driverCoords.longitude.toFixed(5)}</strong>
                </div>
              </div>

              <button
                onClick={handleResolveSOS}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
              >
                Complete & Resolve Emergency Mission
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                Active Broadcast Beacons ({sosAlerts.length})
              </h3>
              {sosAlerts.length === 0 ? (
                <div className="p-8 text-center glass-card rounded-2xl border border-white/20 opacity-60 text-xs font-semibold">
                  Waiting for emergency SOS signals from patients...
                </div>
              ) : (
                sosAlerts.map(alert => (
                  <div key={alert.sosId} className="p-5 rounded-2xl glass-card border border-rose-500/20 hover-scale space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-sm">{alert.patientName}</h4>
                        <span className="text-[10px] opacity-60">GPS: {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}</span>
                      </div>
                      <button
                        onClick={() => handleAcceptSOS(alert)}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition"
                      >
                        Claim Emergency Route
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right column: console/telemetry logs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl glass-card border border-white/20 space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2 text-rose-500">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
              Emergency Console Log
            </h3>
            <div className="bg-black/30 rounded-xl p-3 border border-white/5 font-mono text-[10px] text-slate-300 space-y-2 h-44 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-1.5">
                  <span className="text-teal-500">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
