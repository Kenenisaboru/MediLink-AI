'use strict';
'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { AlertOctagon, Ambulance, Compass, MapPin, Navigation, Siren } from 'lucide-react';

interface SOSWidgetProps {
  patientId: string;
}

export const SOSWidget: React.FC<SOSWidgetProps> = ({ patientId }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sosState, setSosState] = useState<'IDLE' | 'SENDING' | 'BROADCASTING' | 'ACCEPTED' | 'RESOLVED'>('IDLE');
  const [dispatchInfo, setDispatchInfo] = useState<any>(null);
  const [driverCoords, setDriverCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  const addLog = (log: string) => {
    setConsoleLogs((prev) => [log, ...prev].slice(0, 5));
  };

  useEffect(() => {
    // Connect to backend Socket.io server
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    addLog('Connected to SOS Gateway WebSocket.');

    newSocket.emit('join-room', `patient-sos-${patientId}`);

    // Socket events
    newSocket.on('sos-registered', (data: any) => {
      setSosState('BROADCASTING');
      addLog(`SOS Alert Registered (ID: ${data.sosId.substring(0, 8)}). Broadcasting to nearby ambulance units...`);
    });

    newSocket.on('sos-accepted', (data: any) => {
      setSosState('ACCEPTED');
      setDispatchInfo(data);
      setDriverCoords({ latitude: data.driverLatitude, longitude: data.driverLongitude });
      addLog(`Ambulance Dispatched! Vehicle: ${data.vehicleNumber}. Driver: ${data.driverName}`);
    });

    newSocket.on('driver-location', (coords: any) => {
      setDriverCoords(coords);
      addLog(`Live telemetry updated: Driver at [${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}]`);
    });

    newSocket.on('sos-resolved', () => {
      setSosState('RESOLVED');
      setDispatchInfo(null);
      setDriverCoords(null);
      addLog('Emergency SOS resolved by response team.');
      setTimeout(() => setSosState('IDLE'), 4000);
    });

    return () => {
      newSocket.close();
    };
  }, [patientId]);

  const triggerSOS = () => {
    if (!socket) return;

    setSosState('SENDING');
    addLog('Acquiring high-accuracy GPS coordinates...');

    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          addLog(`GPS coordinates acquired: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);
          socket.emit('trigger-sos', { patientId, latitude, longitude });
        },
        (error) => {
          console.warn('Geolocation access denied. Falling back to Addis Ababa center.');
          // Mock Addis Ababa central coordinates
          const mockLat = 9.02 + (Math.random() - 0.5) * 0.02;
          const mockLng = 38.74 + (Math.random() - 0.5) * 0.02;
          addLog(`GPS fallback (Addis Ababa): [${mockLat.toFixed(4)}, ${mockLng.toFixed(4)}]`);
          socket.emit('trigger-sos', { patientId, latitude: mockLat, longitude: mockLng });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  return (
    <div className="rounded-2xl glass-card border border-white/20 p-6 flex flex-col items-center relative overflow-hidden">
      {/* Background decoration */}
      <div className={`absolute inset-0 z-0 bg-red-600/5 transition-opacity duration-1000 ${sosState !== 'IDLE' ? 'opacity-100' : 'opacity-0'}`} />

      <div className="z-10 w-full flex flex-col items-center">
        {/* Large SOS Pulsing Button */}
        {sosState === 'IDLE' && (
          <button
            onClick={triggerSOS}
            className="w-32 h-32 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-2xl flex flex-col items-center justify-center border-8 border-red-950/20 shadow-2xl hover:scale-105 transition active:scale-95 group"
          >
            <Siren className="w-8 h-8 mb-1 group-hover:animate-bounce" />
            SOS
          </button>
        )}

        {sosState === 'SENDING' && (
          <div className="w-32 h-32 rounded-full bg-amber-500 text-white font-bold text-lg flex items-center justify-center border-8 border-amber-950/20 animate-pulse">
            GPS...
          </div>
        )}

        {(sosState === 'BROADCASTING' || sosState === 'ACCEPTED') && (
          <div className="relative">
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-25 scale-125" />
            <div className="w-32 h-32 rounded-full bg-red-700 text-white font-bold text-center flex flex-col items-center justify-center border-8 border-red-900/50 shadow-2xl">
              <Ambulance className="w-10 h-10 animate-bounce mb-1" />
              <span>ACTIVE</span>
            </div>
          </div>
        )}

        {sosState === 'RESOLVED' && (
          <div className="w-32 h-32 rounded-full bg-emerald-600 text-white font-bold text-center flex flex-col items-center justify-center border-8 border-emerald-950/20">
            <Compass className="w-10 h-10 animate-spin mb-1" />
            <span>CLEARED</span>
          </div>
        )}

        {/* State Information */}
        <div className="mt-6 text-center">
          <h3 className="text-lg font-bold">
            {sosState === 'IDLE' && 'Emergency SOS Assist'}
            {sosState === 'SENDING' && 'Acquiring GPS coordinates...'}
            {sosState === 'BROADCASTING' && 'Broadcasting Emergency Alert'}
            {sosState === 'ACCEPTED' && 'Ambulance En Route!'}
            {sosState === 'RESOLVED' && 'Emergency Services Resolved'}
          </h3>
          <p className="text-xs opacity-75 mt-1 max-w-xs mx-auto">
            {sosState === 'IDLE' && 'One-click SOS instantly shares your medical profile & live GPS with dispatchers, nearby ambulances, and hospitals.'}
            {sosState === 'SENDING' && 'Connecting to satellite telemetry systems...'}
            {sosState === 'BROADCASTING' && 'Waiting for nearest available driver to claim the emergency beacon.'}
            {sosState === 'ACCEPTED' && `Driver ${dispatchInfo?.driverName || ''} is on their way with vehicle ${dispatchInfo?.vehicleNumber || ''}.`}
            {sosState === 'RESOLVED' && 'Thank you. You are in safe hands. Status updated.'}
          </p>
        </div>

        {/* Telemetry Information (Drivers location details) */}
        {sosState === 'ACCEPTED' && driverCoords && (
          <div className="w-full mt-6 p-4 rounded-xl bg-slate-500/10 border border-white/10 text-xs space-y-2">
            <div className="flex justify-between items-center font-bold text-teal-600 dark:text-teal-400">
              <span className="flex items-center gap-1"><Navigation className="w-3.5 h-3.5 animate-spin" /> Ambulance Telemetry</span>
              <span>Active Dispatch</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <span className="opacity-60 block">Distance Estimate:</span>
                <strong>~1.4 km away</strong>
              </div>
              <div>
                <span className="opacity-60 block">ETA:</span>
                <strong className="text-rose-500">4 minutes</strong>
              </div>
              <div>
                <span className="opacity-60 block">Latitude:</span>
                <span>{driverCoords.latitude.toFixed(5)}</span>
              </div>
              <div>
                <span className="opacity-60 block">Longitude:</span>
                <span>{driverCoords.longitude.toFixed(5)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Console Log Log Widget */}
        <div className="w-full mt-6 bg-black/30 dark:bg-black/60 rounded-xl p-3 border border-white/5 font-mono text-[10px] text-slate-300">
          <div className="text-slate-400 font-bold border-b border-white/10 pb-1 mb-1.5 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
            <span>Emergency Live Logs</span>
          </div>
          <div className="space-y-1 divide-y divide-white/5">
            {consoleLogs.map((log, idx) => (
              <div key={idx} className="pt-1 select-none flex items-start gap-1">
                <span className="text-teal-500 shrink-0">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
