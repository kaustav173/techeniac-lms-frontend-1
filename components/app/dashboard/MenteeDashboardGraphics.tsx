import React from 'react';

export function StudentIllustration() {
  return (
    <svg
      className="h-28 w-36 select-none sm:h-32 sm:w-44"
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Background Soft Floating Pastel Shapes */}
      <circle cx="160" cy="40" r="28" fill="#DBEAFE" fillOpacity="0.6" />
      <circle cx="50" cy="50" r="18" fill="#E0E7FF" fillOpacity="0.6" />
      <polygon points="175,90 185,105 165,105" fill="#BFDBFE" fillOpacity="0.5" />

      {/* Floating Graduation Cap */}
      <g transform="translate(18, 25) scale(0.85)">
        <polygon points="25,5 50,15 25,25 0,15" fill="#1E293B" />
        <path d="M12 20V32C12 36 38 36 38 32V20" stroke="#1E293B" strokeWidth="2" fill="#1E293B" />
        <path d="M42 16V30" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        <circle cx="42" cy="30" r="2" fill="#F59E0B" />
      </g>

      {/* Floating Books Stack */}
      <g transform="translate(148, 20) scale(0.8)">
        <rect x="0" y="16" width="34" height="6" rx="2" fill="#818CF8" />
        <rect x="3" y="10" width="30" height="6" rx="2" fill="#6366F1" />
        <rect x="6" y="4" width="26" height="6" rx="2" fill="#4F46E5" />
      </g>

      {/* Desk Surface */}
      <rect x="25" y="115" width="150" height="6" rx="3" fill="#1E293B" />

      {/* Student Figure */}
      <path
        d="M90 40C85 45 80 58 84 75C88 65 94 62 100 62C106 62 112 65 116 75C120 58 115 45 110 40C104 36 96 36 90 40Z"
        fill="#1E293B"
      />
      <circle cx="100" cy="48" r="12" fill="#FCD34D" />
      <path d="M89 44C93 40 102 38 108 42C108 45 104 46 100 46C96 46 91 46 89 44Z" fill="#1E293B" />
      <path
        d="M86 66C82 72 80 88 80 115H120C120 88 118 72 114 66C110 63 90 63 86 66Z"
        fill="#2563EB"
      />

      {/* Laptop & Workspace */}
      <path d="M82 92L118 92L124 115H76L82 92Z" fill="#93C5FD" />
      <rect x="85" y="74" width="30" height="20" rx="3" fill="#1E3A8A" />
      <rect x="88" y="77" width="24" height="14" rx="1.5" fill="#60A5FA" />

      {/* Accent Sparkle */}
      <path
        d="M170 120L172 115L177 113L172 111L170 106L168 111L163 113L168 115L170 120Z"
        fill="#10B981"
      />
    </svg>
  );
}

export function LaptopCodeIllustration() {
  return (
    <svg
      className="h-16 w-20 select-none"
      viewBox="0 0 100 75"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="18" y="10" width="64" height="42" rx="4" fill="#1E293B" />
      <rect x="22" y="14" width="56" height="34" rx="2" fill="#0F172A" />
      <circle cx="26" cy="18" r="1.5" fill="#EF4444" />
      <circle cx="31" cy="18" r="1.5" fill="#F59E0B" />
      <circle cx="36" cy="18" r="1.5" fill="#10B981" />
      <rect x="26" y="24" width="22" height="2" rx="1" fill="#38BDF8" />
      <rect x="26" y="29" width="34" height="2" rx="1" fill="#818CF8" />
      <rect x="30" y="34" width="28" height="2" rx="1" fill="#34D399" />
      <rect x="26" y="39" width="18" height="2" rx="1" fill="#F472B6" />
      <path d="M10 52H90L84 58H16L10 52Z" fill="#94A3B8" />
    </svg>
  );
}

export function DataScienceIllustration() {
  return (
    <svg
      className="h-16 w-20 select-none"
      viewBox="0 0 100 75"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="20" y="34" width="8" height="26" rx="2" fill="#60A5FA" />
      <rect x="32" y="22" width="8" height="38" rx="2" fill="#3B82F6" />
      <rect x="44" y="14" width="8" height="46" rx="2" fill="#1D4ED8" />
      <g transform="translate(62, 20)">
        <ellipse cx="14" cy="7" rx="14" ry="7" fill="#60A5FA" />
        <path d="M0 7V22C0 26 6 29 14 29C22 29 28 26 28 22V7" fill="#3B82F6" />
        <ellipse cx="14" cy="7" rx="14" ry="7" fill="#93C5FD" />
        <path d="M0 16C0 20 6 23 14 23C22 23 28 20 28 16" stroke="#DBEAFE" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

export function ReactAtomIllustration() {
  return (
    <svg
      className="h-16 w-16 select-none"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="8" fill="#0284C7" />
      <ellipse
        cx="50"
        cy="50"
        rx="36"
        ry="14"
        stroke="#0EA5E9"
        strokeWidth="3"
        transform="rotate(0 50 50)"
      />
      <ellipse
        cx="50"
        cy="50"
        rx="36"
        ry="14"
        stroke="#0EA5E9"
        strokeWidth="3"
        transform="rotate(60 50 50)"
      />
      <ellipse
        cx="50"
        cy="50"
        rx="36"
        ry="14"
        stroke="#0EA5E9"
        strokeWidth="3"
        transform="rotate(120 50 50)"
      />
    </svg>
  );
}

export function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

export function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

export function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

export function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

export function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

export function LightningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

export function DocumentTextIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

export function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

export function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
