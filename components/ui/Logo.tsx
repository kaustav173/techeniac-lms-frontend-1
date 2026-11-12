import Image from 'next/image';
import React from 'react';

import { cn } from '@/lib/cn';

export interface LogoProps {
  readonly size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  readonly variant?: 'blue' | 'white';
  readonly className?: string;
  readonly alt?: string;
  readonly priority?: boolean;
}

const SIZE_MAP = {
  xs: 20,
  sm: 26,
  md: 32,
  lg: 44,
  xl: 56,
} as const;

export function Logo({
  size = 'md',
  variant = 'blue',
  className,
  alt = 'TechEniac LMS Logo',
  priority = false,
}: Readonly<LogoProps>) {
  const pixelSize = SIZE_MAP[size];
  const src = variant === 'white' ? '/logo-white.png' : '/logo.png';

  return (
    <Image
      src={src}
      alt={alt}
      width={pixelSize}
      height={pixelSize}
      priority={priority}
      className={cn('shrink-0 object-contain select-none', className)}
    />
  );
}
