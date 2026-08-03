'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Activity,
  ShieldAlert,
  Stethoscope,
  Building2,
  Pill,
  FlaskConical,
  Siren,
  User,
  LogOut,
  ChevronDown,
  Globe,
  Radio,
  Bell,
  Sparkles,
} from 'lucide-react';
import { clearTokens } from '../lib/auth';
import { useLanguage } from './LanguageContext';

interface DashboardHeaderProps {
  userRole?: string;
  userName?: string;
  title?: string;
}

export default function DashboardHeader({ userRole = 'USER', userName, title }: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const handleLogout = () => {
    clearTokens();
    router.push('/auth');
  };

  const workspaces = [
    { label: 'National Admin Command', path: '/dashboard/admin', icon: ShieldAlert, role: 'SUPER_ADMIN', color: 'text-indigo-500 bg-indigo-500/10' },
    { label: 'Doctor Workspace', path: '/dashboard/doctor', icon: Stethoscope, role: 'DOCTOR', color: 'text-teal-500 bg-teal-500/10' },
    { label: 'Hospital Command', path: '/dashboard/hospital-admin', icon: Building2, role: 'HOSPITAL_ADMIN', color: 'text-cyan-500 bg-cyan-500/10' },
    { label: 'Pharmacy Inventory', path: '/dashboard/pharmacy', icon: Pill, role: 'PHARMACY', color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Diagnostic Lab', path: '/dashboard/laboratory', icon: FlaskConical, role: 'LABORATORY', color: 'text-purple-500 bg-purple-500/10' },
    { label: 'Ambulance Dispatch', path: '/dashboard/ambulance', icon: Siren, role: 'AMBULANCE', color: 'text-rose-500 bg-rose-500/10' },
    { label: 'Patient Portal', path: '/dashboard/patient', icon: User, role: 'PATIENT', color: 'text-sky-500 bg-sky-500/10' },
  ];

  const currentWorkspace = workspaces.find((w) => pathname?.startsWith(w.path)) || workspaces[0];

  return (
    <header className="sticky top-0 z-40 glass-card-pro border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Workspace Name */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => router.push('/dashboard/admin')}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20 cursor-pointer hover:scale-105 transition"
          >
            <Activity className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-teal-600 via-cyan-500 to-indigo-500 bg-clip-text text-transparent">
                MediLink AI
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Telemetry
              </span>
            </div>
            <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-0.5">
              {title || currentWorkspace.label}
            </p>
          </div>
        </div>

        {/* Workspace Switcher Selector & Actions */}
        <div className="flex items-center gap-3">
          
          {/* Workspace Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-xs font-black shadow-sm"
            >
              <currentWorkspace.icon className={`w-4 h-4 ${currentWorkspace.color.split(' ')[0]}`} />
              <span className="hidden md:inline">{currentWorkspace.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 glass-card-pro rounded-2xl p-2 border border-slate-200/60 dark:border-slate-800/80 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="text-[10px] font-black uppercase text-slate-400 px-3 py-1.5 tracking-wider">
                  Switch Dashboard View
                </div>
                <div className="space-y-1">
                  {workspaces.map((ws) => {
                    const isActive = pathname?.startsWith(ws.path);
                    const Icon = ws.icon;
                    return (
                      <button
                        key={ws.path}
                        onClick={() => router.push(ws.path)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                          isActive
                            ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1 rounded-lg ${ws.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span>{ws.label}</span>
                        </div>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Language Selector */}
          <div className="relative flex items-center pr-2">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700"
            >
              <Globe className="w-3.5 h-3.5 text-teal-500" />
              <span className="uppercase">{language}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {langDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-32 glass-card-pro rounded-2xl p-1.5 shadow-xl z-50">
                {[
                  { code: 'en', name: 'English' },
                  { code: 'am', name: 'አማርኛ' },
                  { code: 'om', name: 'Oromoo' },
                  { code: 'ti', name: 'ትግርኛ' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as any);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                      language === lang.code ? 'bg-teal-500/10 text-teal-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile / Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200/50 dark:border-slate-800/50">
            {userName && (
              <span className="hidden lg:inline text-xs font-extrabold text-slate-700 dark:text-slate-300">
                {userName}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold text-xs transition border border-rose-500/20"
              title="Logout Account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
