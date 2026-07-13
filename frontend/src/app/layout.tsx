import React from 'react';
import '../styles/globals.css';
import { LanguageProvider } from '../components/LanguageContext';

export const metadata = {
  title: 'MediLink AI - Smart Healthcare Platform for Ethiopia',
  description: 'Digital Health Transformation Ecosystem: 24/7 AI Triage, GPS Ambulance SOS, Live Bed Search, Telebirr & Chapa payments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
