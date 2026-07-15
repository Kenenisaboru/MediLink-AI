'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Phone,
  Sparkles,
  User,
  UserPlus,
} from 'lucide-react';
import { saveTokens, saveUser, getDashboardForRole, isAuthenticated } from '../../lib/auth';
import { API_BASE_URL } from '../../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────
type TabMode = 'login' | 'register';
type Step = 'form' | 'otp';

const ROLES = [
  { value: 'PATIENT', label: 'Patient' },
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'PHARMACY', label: 'Pharmacy Staff' },
  { value: 'LAB_STAFF', label: 'Lab Technician' },
  { value: 'AMBULANCE_DRIVER', label: 'Ambulance Driver' },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
}

// ─── OTP Input Component ─────────────────────────────────────────────────────
function OTPInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const next = digits.map((d, i) => (i === idx ? '' : d));
      onChange(next.join(''));
      if (idx > 0) refs[idx - 1].current?.focus();
    }
  };

  const handleChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const next = digits.map((d, i) => (i === idx ? char : d));
    onChange(next.join(''));
    if (char && idx < 5) refs[idx + 1].current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(paste.padEnd(6, '').slice(0, 6));
    refs[Math.min(paste.length, 5)].current?.focus();
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-slate-200/60 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
        />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabMode>('login');
  const [step, setStep] = useState<Step>('form');

  // Shared fields
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register-only fields
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<string>('PATIENT');
  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState('1995-01-01');
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  // OTP state
  const [otp, setOtp] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/dashboard/patient');
    }
  }, [router]);

  const resetState = () => {
    setError(null);
    setSuccessMsg(null);
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    if (!phone || !password) {
      setError('Phone number and password are required.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/login`, {
        phone,
        password,
      });

      saveTokens(data.accessToken, data.refreshToken);
      saveUser(data.user);

      const destination = getDashboardForRole(data.user.role);
      router.push(destination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    if (!phone || !password || !fullName) {
      setError('Full name, phone, and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    const payload: Record<string, unknown> = {
      phone,
      password,
      fullName,
      role,
      gender,
      dateOfBirth,
    };
    if (role === 'DOCTOR') {
      payload.specialty = specialty || 'General Medicine';
      payload.licenseNumber = licenseNumber;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, payload);
      setRegisteredPhone(phone);
      setSuccessMsg(`OTP sent to ${phone}. Please enter it below.`);
      setStep('otp');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    if (otp.length !== 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        phone: registeredPhone,
        code: otp,
      });

      setSuccessMsg('Phone verified! Logging you in...');

      // Auto-login after successful OTP verification
      const { data } = await axios.post(`${API_BASE_URL}/auth/login`, {
        phone: registeredPhone,
        password,
      });

      saveTokens(data.accessToken, data.refreshToken);
      saveUser(data.user);

      const destination = getDashboardForRole(data.user.role);
      router.push(destination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    'w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200/50 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition placeholder:opacity-50';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated mesh background */}
      <div className="bg-mesh" />

      {/* Decorative blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo / brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-700 shadow-2xl shadow-teal-700/30 mb-4">
            <Activity className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-teal-700 to-cyan-600 bg-clip-text text-transparent">
            MediLink AI
          </h1>
          <p className="text-sm opacity-60 mt-1">Smart Healthcare Platform for Ethiopia</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl border border-white/20 p-8 shadow-2xl">
          {/* ── OTP Step ── */}
          {step === 'otp' ? (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-500/10 mb-2">
                  <Phone className="w-6 h-6 text-teal-600" />
                </div>
                <h2 className="text-xl font-bold">Verify Your Phone</h2>
                <p className="text-sm opacity-70">
                  Enter the 6-digit code sent to <strong>{registeredPhone}</strong>
                </p>
              </div>

              {successMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 text-sm">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <OTPInput value={otp} onChange={setOtp} />

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-3.5 font-bold bg-teal-700 hover:bg-teal-600 disabled:bg-slate-400 text-white rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-teal-700/20"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verify & Continue
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep('form'); setError(null); setOtp(''); }}
                className="w-full text-sm text-slate-500 hover:text-teal-700 transition"
              >
                ← Back to registration
              </button>
            </form>
          ) : (
            <>
              {/* ── Tab Switcher ── */}
              <div className="flex bg-slate-100/60 dark:bg-slate-800/60 rounded-xl p-1 mb-6">
                {(['login', 'register'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); resetState(); }}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${
                      tab === t
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-700 dark:text-teal-400'
                        : 'opacity-60 hover:opacity-80'
                    }`}
                  >
                    {t === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>

              {/* ── Error / Success Banners ── */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 text-sm mb-4">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* ── LOGIN FORM ── */}
              {tab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 opacity-50" />
                    <input
                      type="tel"
                      className={inputBase}
                      placeholder="+251911234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 opacity-50" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`${inputBase} pr-11`}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 opacity-50 hover:opacity-80 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 font-bold bg-teal-700 hover:bg-teal-600 disabled:bg-slate-400 text-white rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-teal-700/20 mt-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <div className="pt-3 border-t border-slate-200/30">
                    <p className="text-xs text-center opacity-60 mb-2">Demo credentials</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {[
                        { role: 'Patient', phone: '+251911999999' },
                        { role: 'Doctor', phone: '+251911222222' },
                        { role: 'Admin', phone: '+251911000000' },
                        { role: 'Pharmacy', phone: '+251911666666' },
                      ].map((d) => (
                        <button
                          key={d.role}
                          type="button"
                          onClick={() => { setPhone(d.phone); setPassword('Password123!'); }}
                          className="p-1.5 rounded-lg bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/30 hover:border-teal-500/40 hover:bg-teal-500/5 transition text-left"
                        >
                          <span className="font-bold block text-teal-700 dark:text-teal-400">{d.role}</span>
                          <span className="opacity-60">{d.phone}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-center opacity-40 mt-2">All passwords: Password123!</p>
                  </div>
                </form>
              )}

              {/* ── REGISTER FORM ── */}
              {tab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3">
                  {/* Full name */}
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 opacity-50" />
                    <input
                      type="text"
                      className={inputBase}
                      placeholder="Full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>

                  {/* Phone */}
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 opacity-50" />
                    <input
                      type="tel"
                      className={inputBase}
                      placeholder="Phone (+251...)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 opacity-50" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`${inputBase} pr-11`}
                      placeholder="Password (min 8 chars)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 opacity-50 hover:opacity-80 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Role + Gender row */}
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      className={`${inputBase} pl-4`}
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>

                    <select
                      className={`${inputBase} pl-4`}
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="text-xs opacity-60 font-semibold block mb-1 pl-1">Date of Birth</label>
                    <input
                      type="date"
                      className={`${inputBase} pl-4`}
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>

                  {/* Doctor-specific fields */}
                  {role === 'DOCTOR' && (
                    <div className="space-y-3 p-3 rounded-xl bg-teal-500/5 border border-teal-500/20">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        Doctor Details
                      </div>
                      <input
                        type="text"
                        className={`${inputBase} pl-4`}
                        placeholder="Specialty (e.g. Cardiology)"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                      />
                      <input
                        type="text"
                        className={`${inputBase} pl-4`}
                        placeholder="License number"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 font-bold bg-teal-700 hover:bg-teal-600 disabled:bg-slate-400 text-white rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-teal-700/20"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Create Account
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] opacity-40 mt-6">
          MediLink AI — Ethiopia Digital Health Transformation Strategy
        </p>
      </div>
    </div>
  );
}
