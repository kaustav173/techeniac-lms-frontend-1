import Link from 'next/link';
import React from 'react';

import { H1, P, Span } from '@/components/ui/Typography';

export interface AuthShellProps {
  readonly children: React.ReactNode;
  readonly title: string;
  readonly subtitle?: string;
  readonly footerContent?: React.ReactNode;
}

export function AuthShell({ children, title, footerContent }: Readonly<AuthShellProps>) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white selection:bg-blue-100 selection:text-[#0044D3] md:flex-row">
      {/* Mobile-Only Top Brand Bar (< md) */}
      <div className="flex w-full items-center justify-center border-b border-blue-600 bg-[#0044D3] px-6 py-4 text-white md:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-black text-[#0044D3] shadow-sm">
            TL
          </div>
          <Span className="text-xl font-bold tracking-tight text-white">TechEniac LMS</Span>
        </Link>
      </div>

      {/* Left 50%: Solid Cobalt Blue Full-Height Panel (#0044D3) for Tablet, Laptop, Desktop (>= md) */}
      <div className="relative hidden w-full flex-col justify-center overflow-hidden bg-[#0044D3] p-8 text-white shadow-xl md:flex md:min-h-screen md:w-1/2 md:p-12 lg:p-16">
        {/* Ambient Subtle Depth Highlights */}
        <div className="animate-glow pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 animate-pulse rounded-full bg-blue-900/40 blur-2xl" />

        {/* Top-Left Brand Logo "TL" */}
        <div className="absolute top-8 left-8 z-20 sm:top-12 sm:left-12 lg:top-14 lg:left-14">
          <Link
            href="/"
            className="group flex items-center transition-transform hover:scale-105"
            title="TechEniac LMS Home"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-black text-[#0044D3] shadow-lg transition-shadow group-hover:shadow-blue-900/30 sm:h-16 sm:w-16 sm:text-3xl">
              TL
            </div>
          </Link>
        </div>

        {/* Left-Aligned Brand Content & Project Description */}
        <div className="relative z-10 flex max-w-lg flex-col items-start text-left">
          <H1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            TechEniac LMS
          </H1>
          <Span className="mt-3 block text-lg font-medium text-blue-100 sm:text-xl">
            Empower Learning, Mentorship & Growth
          </Span>
          <P className="mt-5 text-sm leading-relaxed font-normal text-blue-100/85 sm:text-base">
            An enterprise-grade learning and mentorship system to manage courses, streamline
            submissions, track student progress, and foster collaborative engineering growth.
          </P>
        </div>
      </div>

      {/* Right 50%: Form Workspace Container with Rounded Card Border */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#F8FAFC] px-4 py-10 sm:px-8 md:min-h-screen md:w-1/2 md:p-12 lg:p-16">
        <div className="w-full max-w-[440px] rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-9 lg:max-w-[480px]">
          {/* Form Title */}
          <div className="mb-6 text-center sm:text-left">
            <H1 className="text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
              {title}
            </H1>
          </div>

          {/* Main Form Body */}
          <div className="w-full">{children}</div>

          {/* Optional Footer Content (below the form) */}
          {footerContent ? <div className="w-full pt-6">{footerContent}</div> : null}
        </div>
      </div>
    </div>
  );
}
