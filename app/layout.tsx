import './globals.css';

import type { Metadata } from 'next';
import localFont from 'next/font/local';

import { AgentationToolbar } from '@/components/layout/AgentationToolbar';
import { ToastContainer } from '@/components/patterns/ToastContainer';
import { AuthProvider } from '@/context/AuthContext';
import { QueryProvider } from '@/context/QueryProvider';
import { SidebarProvider } from '@/context/SidebarContext';
import { ToastProvider } from '@/context/ToastContext';

const plusJakartaSans = localFont({
  src: [
    {
      path: '../public/fonts/plus-jakarta-sans-latin.woff2',
      weight: '200 800',
      style: 'normal',
    },
  ],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TechEniac LMS',
  description: 'TechEniac Learning Management System',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${plusJakartaSans.className} light h-full font-sans antialiased`}
      style={{ colorScheme: 'light' }}
    >
      <body
        suppressHydrationWarning
        className={`${plusJakartaSans.className} flex min-h-full flex-col bg-white font-sans text-slate-900`}
      >
        <QueryProvider>
          <ToastProvider>
            <AuthProvider>
              <SidebarProvider>{children}</SidebarProvider>
              <AgentationToolbar />
            </AuthProvider>
            <ToastContainer />
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
