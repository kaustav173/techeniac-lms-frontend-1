import Link from 'next/link';
import React from 'react';

import { AuthIllustration } from '@/components/app/auth/AuthIllustration';
import { Logo } from '@/components/ui/Logo';
import { H1, H2, Span } from '@/components/ui/Typography';

export interface AuthShellProps {
  readonly children: React.ReactNode;
  readonly title: string;
  readonly subtitle?: string;
  readonly footerContent?: React.ReactNode;
}

export function AuthShell({ children, title, subtitle, footerContent }: Readonly<AuthShellProps>) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white selection:bg-blue-100 selection:text-[#0044D3] md:h-screen md:p-6 lg:p-8">
      {/* Mobile-Only Top Brand Bar (< md) */}
      <div className="flex w-full items-center justify-center border-b border-blue-600 bg-[#0044D3] px-6 py-4 text-white md:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs">
            <Logo size="xs" variant="blue" priority />
          </div>
          <Span className="text-xl font-bold tracking-tight text-white">TechEniac LMS</Span>
        </Link>
      </div>

      {/* Main Container: Full-Screen Left Card + Right Form on Desktop */}
      <div className="flex h-full w-full flex-1 flex-col md:flex-row md:items-center md:gap-8 lg:gap-12">
        {/* Left Card: Full-Height Cobalt Blue Card (#0044D3) with rounded-[36px] */}
        <div className="relative hidden h-full w-full flex-col justify-between overflow-hidden rounded-[36px] bg-[#0044D3] p-8 text-white md:flex md:w-1/2 md:p-10 lg:p-12">
          {/* Subtle Ambient Decorative Highlights & Bottom-Right Curves */}
          <div
            className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-28 -bottom-28 h-96 w-96 rounded-full bg-blue-400/25 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-blue-500/30"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-12 -bottom-12 h-56 w-56 rounded-full bg-blue-400/20"
            aria-hidden="true"
          />

          {/* Top-Left Brand Logo Badge */}
          <div className="relative z-10">
            <Link
              href="/"
              className="inline-flex items-center gap-3 transition-transform hover:opacity-95"
              title="TechEniac LMS Home"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md">
                <Logo size="xs" variant="blue" priority />
              </div>
              <Span className="text-xl font-bold tracking-tight text-white">TechEniac LMS</Span>
            </Link>
          </div>

          {/* Center Group: Illustration + Headline */}
          <div className="relative z-10 my-auto flex w-full flex-col items-center justify-center py-4">
            <AuthIllustration className="h-auto w-full max-w-[380px] lg:max-w-[440px]" />
            <div className="mt-4 text-center">
              <H2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Empower Learning,
                <br />
                Mentorship & Growth
              </H2>
            </div>
          </div>

          {/* Bottom Balanced Anchor */}
          <div className="relative z-10 h-6" aria-hidden="true" />
        </div>

        {/* Right 50%: Form Workspace Container */}
        <div className="flex h-full flex-1 flex-col items-center justify-center bg-white px-4 py-10 sm:px-8 md:w-1/2 md:p-12 lg:p-16">
          <div className="w-full max-w-[440px] p-2 sm:p-4 lg:max-w-[480px]">
            {/* Form Title */}
            <div className="mb-6 text-center sm:text-left">
              <H1 className="text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
                {title}
              </H1>
              {subtitle ? <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p> : null}
            </div>

            {/* Main Form Body */}
            <div className="w-full">{children}</div>

            {/* Optional Footer Content (below the form) */}
            {footerContent ? <div className="w-full pt-6">{footerContent}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
