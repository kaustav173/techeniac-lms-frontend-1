import React from 'react';

import { cn } from '@/lib/cn';

export type TypographyVariant =
  'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'lead' | 'large' | 'small' | 'muted' | 'code';

export type TypographyElement =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'span'
  | 'div'
  | 'small'
  | 'code'
  | 'blockquote'
  | 'label';

const defaultElementMap: Record<TypographyVariant, TypographyElement> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  p: 'p',
  lead: 'p',
  large: 'div',
  small: 'small',
  muted: 'p',
  code: 'code',
};

export function getTypographyClassName(
  variant: TypographyVariant = 'p',
  className?: string,
): string {
  const variants: Record<TypographyVariant, string> = {
    h1: 'text-3xl font-bold tracking-tight text-foreground sm:text-4xl',
    h2: 'text-2xl font-semibold tracking-tight text-foreground',
    h3: 'text-xl font-semibold tracking-tight text-foreground',
    h4: 'text-lg font-semibold tracking-tight text-foreground',
    p: 'text-base leading-7 text-foreground',
    lead: 'text-lg leading-8 text-zinc-600 dark:text-zinc-400',
    large: 'text-lg font-semibold text-foreground',
    small: 'text-sm font-medium leading-none text-foreground',
    muted: 'text-sm text-zinc-600 dark:text-zinc-400',
    code: 'rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] font-semibold text-foreground dark:bg-white/[.08]',
  };

  return cn(variants[variant], className);
}

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  as?: TypographyElement;
}

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className = '', variant = 'p', as, children, ...props }, ref) => {
    const Component = (as ?? defaultElementMap[variant]) as React.ElementType;

    return (
      <Component ref={ref} className={getTypographyClassName(variant, className)} {...props}>
        {children}
      </Component>
    );
  },
);

Typography.displayName = 'Typography';

export const H1 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'as'>>(
  ({ variant = 'h1', ...props }, ref) => (
    <Typography ref={ref} as="h1" variant={variant} {...props} />
  ),
);
H1.displayName = 'H1';

export const PageTitle = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'as'>>(
  ({ className, children, ...props }, ref) => (
    <h1 ref={ref} className={cn('page-title', className)} {...props}>
      {children}
    </h1>
  ),
);
PageTitle.displayName = 'PageTitle';

export const Title = PageTitle;

export const SectionTitle = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'as'>>(
  ({ className, children, ...props }, ref) => (
    <h2 ref={ref} className={cn('section-title', className)} {...props}>
      {children}
    </h2>
  ),
);
SectionTitle.displayName = 'SectionTitle';

export const CardTitle = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'as'>>(
  ({ className, children, ...props }, ref) => (
    <h3 ref={ref} className={cn('card-title', className)} {...props}>
      {children}
    </h3>
  ),
);
CardTitle.displayName = 'CardTitle';

export const BodyText = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'as'>>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn('normal-text', className)} {...props}>
      {children}
    </p>
  ),
);
BodyText.displayName = 'BodyText';

export const SubText = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'as'>>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn('sub-text', className)} {...props}>
      {children}
    </p>
  ),
);
SubText.displayName = 'SubText';

export const LabelText = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, children, ...props }, ref) => (
  <label ref={ref} className={cn('label-text', className)} {...props}>
    {children}
  </label>
));
LabelText.displayName = 'LabelText';

export const H2 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'as'>>(
  ({ variant = 'h2', ...props }, ref) => (
    <Typography ref={ref} as="h2" variant={variant} {...props} />
  ),
);
H2.displayName = 'H2';

export const H3 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'as'>>(
  ({ variant = 'h3', ...props }, ref) => (
    <Typography ref={ref} as="h3" variant={variant} {...props} />
  ),
);
H3.displayName = 'H3';

export const H4 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'as'>>(
  ({ variant = 'h4', ...props }, ref) => (
    <Typography ref={ref} as="h4" variant={variant} {...props} />
  ),
);
H4.displayName = 'H4';

export const P = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'as'>>(
  ({ variant = 'p', ...props }, ref) => (
    <Typography ref={ref} as="p" variant={variant} {...props} />
  ),
);
P.displayName = 'P';

export const Span = React.forwardRef<HTMLSpanElement, Omit<TypographyProps, 'as'>>(
  ({ className, children, ...props }, ref) => (
    <span ref={ref} className={className} {...props}>
      {children}
    </span>
  ),
);
Span.displayName = 'Span';

export const Large = React.forwardRef<HTMLDivElement, Omit<TypographyProps, 'as'>>(
  ({ variant = 'large', ...props }, ref) => (
    <Typography ref={ref} as="div" variant={variant} {...props} />
  ),
);
Large.displayName = 'Large';

export const Small = React.forwardRef<HTMLElement, Omit<TypographyProps, 'as'>>(
  ({ variant = 'small', ...props }, ref) => (
    <Typography ref={ref} as="small" variant={variant} {...props} />
  ),
);
Small.displayName = 'Small';

export const Lead = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'as'>>(
  ({ variant = 'lead', ...props }, ref) => (
    <Typography ref={ref} as="p" variant={variant} {...props} />
  ),
);
Lead.displayName = 'Lead';

export const Muted = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'as'>>(
  ({ variant = 'muted', ...props }, ref) => (
    <Typography ref={ref} as="p" variant={variant} {...props} />
  ),
);
Muted.displayName = 'Muted';

export const Code = React.forwardRef<HTMLElement, Omit<TypographyProps, 'as'>>(
  ({ variant = 'code', ...props }, ref) => (
    <Typography ref={ref} as="code" variant={variant} {...props} />
  ),
);
Code.displayName = 'Code';
