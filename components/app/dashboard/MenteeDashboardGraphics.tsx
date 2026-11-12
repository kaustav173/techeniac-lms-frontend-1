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

export * from '@/components/ui/Icons';
