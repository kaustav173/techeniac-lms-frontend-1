'use client';

import dynamic from 'next/dynamic';

const Agentation = dynamic(() => import('agentation').then((mod) => mod.Agentation), {
  ssr: false,
});

export function AgentationToolbar() {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const endpoint = process.env.NEXT_PUBLIC_AGENTATION_ENDPOINT;

  if (endpoint) {
    return <Agentation endpoint={endpoint} />;
  }

  return <Agentation />;
}
