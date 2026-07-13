'use strict';
'use client';

import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { Activity, AlertTriangle, X, ShieldAlert, Sparkles } from 'lucide-react';
import axios from 'axios';

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
      // Direct call to local express server (default localhost:5000 in dev)
      const res = await axios.post('http://localhost:5000/api/patient/symptom-check', {
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
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl glass-card border border-white/20 p-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/30 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-pulse" />
            <h2 className="text-xl font-bold font-sans">{t('symptomCheckerBtn')}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200/30 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="text-sm opacity-80 mb-2">
            Write down your current physical symptoms (e.g. fever, headache, dry cough) in <strong>English, Amharic (አማርኛ), or Afaan Oromo</strong>.
          </div>

          <textarea
            className="w-full h-32 p-3 text-sm rounded-xl border border-slate-200/50 bg-white/20 dark:bg-slate-800/40 focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none font-sans"
            placeholder={language === 'am' ? 'ለምሳሌ: ትኩሳት እና ሳል አለኝ...' : language === 'om' ? 'Fakkeenyaaf: Ho’aa fi qufaa qaba...' : 'Describe your symptoms...'}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            disabled={loading}
          />

          <button
            onClick={handleAnalyze}
            disabled={loading || !symptoms.trim()}
            className="w-full py-3 bg-teal-700 hover:bg-teal-600 disabled:bg-slate-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition hover-scale"
          >
            {loading ? (
              <>
                <Activity className="w-5 h-5 animate-spin" />
                Analyzing with Gemini...
              </>
            ) : (
              'Analyze Symptoms'
            )}
          </button>

          {/* Loader skeleton */}
          {loading && (
            <div className="space-y-3 mt-4">
              <div className="h-6 w-2/3 skeleton rounded"></div>
              <div className="h-4 w-full skeleton rounded"></div>
              <div className="h-20 w-full skeleton rounded"></div>
            </div>
          )}

          {/* Error Message banner */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Response Panel */}
          {result && (
            <div className="space-y-4 mt-4 p-4 rounded-xl bg-slate-500/5 border border-slate-200/20 animate-slideUp">
              {/* Urgency Badge */}
              <div className={`p-3 rounded-lg border flex items-center gap-2 text-sm font-semibold ${getUrgencyColor(result.urgencyLevel)}`}>
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>Urgency level: {result.urgencyLevel}</span>
              </div>

              {/* Conditions estimated */}
              <div>
                <h4 className="text-xs uppercase font-bold tracking-wider opacity-60 mb-1">Possible Conditions:</h4>
                <ul className="list-disc pl-4 text-sm font-medium space-y-1">
                  {result.conditions?.map((cond: string, idx: number) => (
                    <li key={idx}>{cond}</li>
                  ))}
                </ul>
              </div>

              {/* Departments recommended */}
              {result.recommendedDepartment && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-500/5">
                    <span className="opacity-60 block">Department:</span>
                    <strong className="text-sm text-teal-600 dark:text-teal-400">{result.recommendedDepartment}</strong>
                  </div>
                  {result.specialistType && (
                    <div className="p-2 rounded bg-slate-500/5">
                      <span className="opacity-60 block">Specialist:</span>
                      <strong className="text-sm text-teal-600 dark:text-teal-400">{result.specialistType}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Advice */}
              <div className="p-3 rounded-lg bg-teal-500/5 text-sm italic font-sans">
                &ldquo;{result.advice}&rdquo;
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer footer */}
        <div className="mt-4 pt-3 border-t border-slate-200/30 text-[10px] text-slate-500 text-center leading-relaxed">
          {t('aiDisclaimer')}
        </div>
      </div>
    </div>
  );
};
