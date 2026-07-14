'use strict';
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'am' | 'om';

interface TranslationKeys {
  [key: string]: {
    [lang in Language]: string;
  };
}

const translations: TranslationKeys = {
  // Navigation
  appName: { en: 'MediLink AI', am: 'ሜዲሊንክ AI', om: 'MediLink AI' },
  tagline: { en: 'Smart Healthcare Platform for Ethiopia', am: 'የኢትዮጵያ ስማርት የጤና ጥበቃ መድረክ', om: 'Ibsituu Fayyaa Dijitaalaa Itoophiyaa' },
  home: { en: 'Home', am: 'መነሻ', om: 'Mana' },
  hospitals: { en: 'Hospitals', am: 'ሆስፒታሎች', om: 'Hospitaalota' },
  doctors: { en: 'Doctors', am: 'ዶክተሮች', om: 'Ogeeyyii Fayyaa' },
  pharmacies: { en: 'Pharmacies', am: 'ፋርማሲዎች', om: 'Faarmasii' },
  login: { en: 'Login / Register', am: 'ግባ / ተመዝገብ', om: 'Seeni / Galmaahi' },
  dashboard: { en: 'Dashboard', am: 'ዳሽቦርድ', om: 'Daashboordii' },
  logout: { en: 'Logout', am: 'ውጣ', om: 'Baahi' },
  
  // Hero section
  heroTitle: {
    en: 'Connecting Ethiopia’s Healthcare, Intelligently',
    am: 'የኢትዮጵያን የጤና ዘርፍ በብልሃት እናስተሳስራለን',
    om: 'Hawaasa Yaalaa Itoophiyaa Walitti Hidhuu',
  },
  heroSubtitle: {
    en: 'Get 24/7 AI-powered triage support, search live hospital bed occupancies, book consultations, and trigger immediate GPS emergency dispatches instantly.',
    am: 'የ 24/7 የ AI የህክምና ምክር ያግኙ፣ የሆስፒታል ክፍት አልጋዎችን ይፈልጉ፣ ቀጠሮ ይያዙ እና ፈጣን የጂፒኤስ ድንገተኛ አምቡላንስ ጥሪ ያድርጉ።',
    om: 'Gargaarsa gorfannoo AI sa\'aatii 24/7 argadhu, siree hospitaalaa bilisaa barbaadi, fi tajaajila hatattamaa bilisaan waami.',
  },
  symptomCheckerBtn: { en: 'AI Symptom Checker', am: 'የ AI ምልክት መመርመሪያ', om: 'AI Ilaaltu Mallattolee' },
  emergencySOSBtn: { en: 'Emergency SOS', am: 'የድንገተኛ ጊዜ SOS', om: 'SOS Dhiphuu' },
  
  // Features
  digitalRecordsTitle: { en: 'Digital Health Records', am: 'ዲጂታል የጤና ማህደር', om: 'Galmee Fayyaa Dijitaalaa' },
  digitalRecordsDesc: {
    en: 'Say goodbye to paper files. Securely access your diagnostic reports, lab sheets, and histories anytime.',
    am: 'የወረቀት ፋይሎችን ያስወግዱ። የላብራቶሪ ውጤቶችን፣ መድኃኒቶችንና የህክምና ታሪክን ደህንነቱ በተጠበቀ ሁኔታ ይመልከቱ።',
    om: 'Galmee waraqaa irra boqodhaa. Gabaasa fayyaa keessan sa\'aatii kamiyyuu haala amansiisaan argadhaa.',
  },
  aiTriageTitle: { en: 'Multilingual AI Symptom Check', am: 'ባለብዙ ቋንቋ የ AI ምልክት መመርመሪያ', om: 'Symptom Check AI Afaan Adda Addaa' },
  aiTriageDesc: {
    en: 'Input symptoms in English, Amharic, or Afaan Oromo for instantaneous clinical triage recommendations.',
    am: 'ምልክቶችን በእንግሊዘኛ፣ በአማርኛ ወይም በአፋን ኦሮሞ በማስገባት ፈጣን የህክምና ቅድመ-ምርመራ ምክር ያግኙ።',
    om: 'Mallattoolee dhukkubbii keessanii Afaan Oromoo, Amaaraa ykn Ingiliffaan galchuun gorsa yaalaa hatattamaa argadhaa.',
  },
  bloodTitle: { en: 'Smart Blood Bank System', am: 'ብልጥ የደም ባንክ ስርዓት', om: 'Sirna Opphiseensaa Dhiigaa' },
  bloodDesc: {
    en: 'Real-time blood group availability tracking, and quick registration for voluntary blood donors.',
    am: 'የደም አይነቶችን በቅጽበት መፈለግ እና በፈቃደኝነት ደም ለመለገስ ፈጣን ምዝገባ ማካሄድ።',
    om: 'Haala dhiigaa hospitaalota keessaa ilaaluufi namoota dhiiga arjoomaniif galmee salphaa dhiyeessu.',
  },
  
  // Disclaimer
  aiDisclaimer: {
    en: 'This AI provides health information only and does not replace diagnosis or treatment by a licensed healthcare professional.',
    am: 'ይህ AI የጤና መረጃን ብቻ የሚሰጥ ሲሆን በህክምና ፈቃድ ባለው ባለሙያ የሚደረግን ምርመራ ወይም ህክምና አይተካም።',
    om: 'AI\'n kun gorsa fayyaa qofa kenna, ogeessa fayyaa eeyyamameefii yaalu bakka hin bu\'u.',
  },
  
  // Search placeholders
  searchHospitals: { en: 'Search hospitals by city or name...', am: 'ሆስፒታሎችን በከተማ ወይም በስም ይፈልጉ...', om: 'Hospitaalota maqaan ykn magalaan barbaadi...' },
  searchDoctors: { en: 'Search doctors by specialty or name...', am: 'ዶክተሮችን በስም ወይም በክህሎት ይፈልጉ...', om: 'Doktoroota ogummaan ykn maqaan barbaadi...' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  // Load saved preference
  useEffect(() => {
    const savedLang = localStorage.getItem('medilink_lang') as Language;
    if (savedLang && ['en', 'am', 'om'].includes(savedLang)) {
      setLanguage(savedLang);
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('medilink_lang', lang);
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation['en'] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
