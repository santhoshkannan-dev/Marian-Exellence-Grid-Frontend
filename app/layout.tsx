import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppContextProvider } from '@/context/AppContext';
import { NavSidebar } from '@/components/NavSidebar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Marian Excellence Grid — Marian College Kuttikkanam',
  description: 'Marian Excellence Grid Evaluation System - Marian College Kuttikkanam. Track, verify and celebrate class achievements.',
  icons: {
    icon: '/Assets/Images/hands_logo_zoomed.png',
    shortcut: '/Assets/Images/hands_logo_zoomed.png',
    apple: '/Assets/Images/hands_logo_zoomed.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

import { ToastProvider } from '@/components/ToastProvider';
import { ChatBotBugReporter } from '@/components/ChatBotBugReporter';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/Assets/Images/hands_logo_zoomed.png" />
        <link rel="shortcut icon" href="/Assets/Images/hands_logo_zoomed.png" />
        <link rel="apple-touch-icon" href="/Assets/Images/hands_logo_zoomed.png" />
      </head>
      <body>
        <AppContextProvider>
          <ToastProvider />
          <NavSidebar />
          {children}
          <ChatBotBugReporter />
          <Footer />
        </AppContextProvider>
      </body>
    </html>
  );
}


