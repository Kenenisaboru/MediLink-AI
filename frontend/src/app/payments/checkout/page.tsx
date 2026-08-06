'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../../../lib/api';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gateway = searchParams.get('gateway')?.toUpperCase() || 'TELEBIRR';
  const reference = searchParams.get('reference') || '';
  const amount = searchParams.get('amount') || '';

  const [status, setStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!reference || !amount) {
      setMessage('Invalid payment link. Please go back and try again.');
    }
  }, [reference, amount]);

  const handleResult = async (result: 'SUCCESS' | 'FAILED') => {
    if (!reference) return;
    setSubmitting(true);
    setMessage('Processing payment result...');

    try {
      const response = await axios.post(`${API_BASE_URL}/payments/callback`, {
        reference,
        status: result,
      });

      setStatus(result);
      setMessage(response.data?.message || `Payment ${result.toLowerCase()} processed.`);
    } catch (error: any) {
      setStatus('FAILED');
      setMessage(error.response?.data?.error || 'Payment callback failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    router.push('/dashboard/patient');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-3 sm:p-4 lg:p-6">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-700/70 bg-slate-900/95 shadow-2xl p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{gateway} Payment Checkout</h1>
            <p className="mt-1 text-sm text-slate-400">Simulated local payment portal for MediLink AI.</p>
          </div>
          <div className="text-left sm:text-right text-xs uppercase tracking-[0.25em] text-slate-500">Mock Gateway</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-300">
          <div className="rounded-2xl bg-slate-800/80 p-3 sm:p-4">
            <div className="text-[11px] uppercase text-slate-500 font-bold">Reference</div>
            <div className="mt-2 font-semibold break-all">{reference || '-'}</div>
          </div>
          <div className="rounded-2xl bg-slate-800/80 p-3 sm:p-4">
            <div className="text-[11px] uppercase text-slate-500 font-bold">Amount</div>
            <div className="mt-2 font-semibold">{amount ? `${amount} ETB` : '-'}</div>
          </div>
          <div className="rounded-2xl bg-slate-800/80 p-3 sm:p-4">
            <div className="text-[11px] uppercase text-slate-500 font-bold">Gateway</div>
            <div className="mt-2 font-semibold">{gateway}</div>
          </div>
        </div>

        {message && (
          <div className={`rounded-2xl p-3 sm:p-4 text-sm ${status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-200 border border-rose-500/20'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => handleResult('SUCCESS')}
            disabled={submitting || !reference || !amount}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-slate-950 font-bold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-5 h-5" /> Simulate Success
          </button>
          <button
            onClick={() => handleResult('FAILED')}
            disabled={submitting || !reference || !amount}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-500 text-white font-bold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="w-5 h-5" /> Simulate Failure
          </button>
        </div>

        <div className="pt-3 sm:pt-4 border-t border-slate-800 text-left sm:text-right">
          <button
            onClick={handleContinue}
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-teal-400 hover:text-teal-200"
          >
            Continue to Patient Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-3 py-6 text-slate-100">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-6 text-center text-sm text-slate-300">
          Preparing your payment checkout...
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
