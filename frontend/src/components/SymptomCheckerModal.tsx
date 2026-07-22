'use strict';
'use client';

import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { Activity, AlertTriangle, X, ShieldAlert, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import api from '../lib/api';

interface SymptomCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SymptomCheckerModal: React.FC<SymptomCheckerModalProps> = ({ isOpen, onClose }) => {
  const { language, t } = useLanguage();
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post('/patient/symptom-check', {
        symptoms,
        language: language === 'am' ? 'Amharic' : language === 'om' ? 'Afaan Oromo' : 'English',
      });
      setResult(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Connection to AI Triaging Engine failed. Displaying simulated result.');
      // Fail-safe simulation for showcase purposes
      setTimeout(() => {
        const sym = symptoms.toLowerCase();
        let simulated = {
          conditions: ['Common Respiratory Triage (ቀላል የጉንፋን ምልክት)', 'Acute Pharyngitis'],
          urgencyLevel: 'LOW',
          recommendedDepartment: 'General Practitioner',
          advice: 'Rest, stay hydrated, and monitor temperature.',
          disclaimer: 'This AI provides health information only and does not replace diagnosis or treatment by a licensed healthcare professional. (Simulated fallback)',
        };
        if (sym.includes('chest') || sym.includes('ልብ') || sym.includes('dada')) {
          simulated = {
            conditions: ['Possible Cardiovascular Triage (የልብ ህመም ምልክት)', 'Angina Symptoms'],
            urgencyLevel: 'EMERGENCY',
            recommendedDepartment: 'Cardiology',
            advice: 'Seek urgent medical attention at Black Lion or St. Paul Specialized Emergency units immediately.',
            disclaimer: 'This AI provides health information only and does not replace diagnosis or treatment by a licensed healthcare professional. (Simulated fallback)',
          };
        }
        setResult(simulated);
        setLoading(false);
      }, 1000);
    } finally {
      if (!error) setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'EMERGENCY':
      case 'HIGH':
        return 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400';
      case 'MEDIUM':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400';
      default:
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl glass-card-pro border border-white/20 p-6 flex flex-col max-h-[90vh] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/20 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="text-lg font-black tracking-tight">{t('symptomCheckerBtn')}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200/30 transition text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="text-xs opacity-75 mb-2 font-medium leading-relaxed">
            Write down your current physical symptoms (e.g. fever, headache, dry cough) in <strong>English, Amharic (አማርኛ), or Afaan Oromo</strong>.
          </div>

          <textarea
            className="w-full h-32 p-3 text-xs rounded-xl border border-slate-200/40 bg-white/20 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-teal-700 resize-none font-medium"
            placeholder={language === 'am' ? 'ለምሳሌ: ትኩሳት እና ሳል አለኝ...' : language === 'om' ? 'Fakkeenyaaf: Ho’aa fi qufaa qaba...' : 'Describe your symptoms...'}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />

          <button
            onClick={handleAnalyze}
            disabled={loading || !symptoms.trim()}
            className="w-full py-3 bg-teal-700 hover:bg-teal-600 disabled:bg-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2 transition hover-scale text-xs uppercase tracking-wider"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Triage Status...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                Analyze Health Symptoms
              </>
            )}
          </button>

          {/* Results Display */}
          {result && (
            <div className="space-y-4 border-t border-slate-200/20 pt-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-wider opacity-60 font-bold">Triage Verdict</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase ${getUrgencyColor(result.urgencyLevel)}`}>
                  {result.urgencyLevel}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/30 dark:bg-slate-850/40 border border-white/20 space-y-2 text-xs">
                <div>
                  <span className="opacity-60 block font-bold text-[10px]">Identified Conditions</span>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                    {result.conditions?.join(', ') || 'General Symptoms'}
                  </span>
                </div>
                <div>
                  <span className="opacity-60 block font-bold text-[10px]">Home Care Advice</span>
                  <p className="font-medium opacity-90 leading-relaxed">{result.advice}</p>
                </div>
                <div>
                  <span className="opacity-60 block font-bold text-[10px]">Recommended Specialist</span>
                  <span className="font-black text-teal-600 dark:text-teal-400">{result.recommendedDepartment}</span>
                </div>
              </div>

              <div className="flex gap-2 p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 text-[10px] text-rose-600 leading-normal font-semibold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <p>{result.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
