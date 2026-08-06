import React from 'react';
import '../styles/globals.css';
import { LanguageProvider } from '../components/LanguageContext';
import { ThemeProvider } from '../components/ThemeContext';

export const metadata = {
  title: 'MediLink AI - Smart Healthcare Platform for Ethiopia',
  description: 'Digital Health Transformation Ecosystem: 24/7 AI Triage, GPS Ambulance SOS, Live Bed Search, Telebirr & Chapa payments.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking inline script: sets dark class BEFORE first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('medilink_theme');if(t==='dark'){document.documentElement.classList.add('dark')}else if(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%230f766e%22/><path d=%22M20 50h20l10-25 15 50 10-25h25%22 fill=%22none%22 stroke=%22white%22 stroke-width=%228%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/></svg>" />
      </head>
      <body className="antialiased min-h-screen transition-colors duration-300">
        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
