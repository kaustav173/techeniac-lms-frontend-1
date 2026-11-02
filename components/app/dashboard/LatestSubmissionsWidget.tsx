'use client';

import Link from 'next/link';
import React, { useState } from 'react';

import { SubmissionReviewModal } from '@/components/app/submissions/SubmissionReviewModal';
import { SubmissionStatusBadge } from '@/components/app/submissions/SubmissionStatusBadge';
import { Button } from '@/components/ui/Button';
import { H2, Muted, P, Span } from '@/components/ui/Typography';
import { usePrefetchSubmissionReview, useSubmissionQueue } from '@/hooks/useGrading';
import { useHoverPrefetch } from '@/hooks/useHoverPrefetch';
import { formatDateIST } from '@/lib/date';

export function LatestSubmissionsWidget() {
  const prefetchReview = usePrefetchSubmissionReview();
  const { getHoverHandlers } = useHoverPrefetch();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // Top 10 newest first submissions (FR-10.1, REV-01)
  const { submissions, isLoading } = useSubmissionQueue({
    limit: 10,
    sort: 'latest',
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <div>
          <H2 className="text-base font-bold text-slate-900">Submissions Awaiting Review</H2>
          <Muted className="text-xs">
            Pending submissions awaiting review across your mapped mentees
          </Muted>
        </div>
        <Link
          href="/mentor/submissions"
          className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          View Full Queue →
        </Link>
      </div>

      {/* Content */}
      <div className="divide-y divide-slate-100">
        {isLoading && (
          <div className="p-8 text-center text-xs text-slate-400">
            Loading latest submissions...
          </div>
        )}

        {!isLoading && submissions.length === 0 && (
          <div className="p-8 text-center">
            <P className="text-xs font-semibold text-slate-700">No submissions pending review</P>
            <P className="mt-1 text-[11px] text-slate-400">
              When your assigned mentees submit their coursework, they will appear here.
            </P>
          </div>
        )}

        {!isLoading &&
          submissions.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-slate-50/70"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <P className="truncate text-xs font-bold text-slate-900">{sub.assignmentTitle}</P>
                  <Span className="py-0.2 rounded bg-slate-100 px-1.5 font-mono text-[10px] font-semibold text-slate-600">
                    v{sub.version}
                  </Span>
                </div>
                <P className="truncate text-[11px] text-slate-500">
                  {sub.mentee.name} • {sub.courseTitle}
                </P>
              </div>

              <div className="flex flex-shrink-0 items-center gap-3">
                <div className="text-right">
                  <SubmissionStatusBadge status={sub.status} isLate={sub.isLate} />
                  <Muted className="mt-0.5 block font-mono text-[10px]">
                    {formatDateIST(sub.submittedAt)}
                  </Muted>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  {...getHoverHandlers(() => prefetchReview(sub.id))}
                  onClick={() => setSelectedSubmissionId(sub.id)}
                  className="border-slate-200 px-2.5 text-xs text-slate-700 hover:bg-slate-100"
                >
                  Review
                </Button>
              </div>
            </div>
          ))}
      </div>

      {/* Review Modal */}
      <SubmissionReviewModal
        submissionId={selectedSubmissionId}
        isOpen={Boolean(selectedSubmissionId)}
        onClose={() => setSelectedSubmissionId(null)}
      />
    </section>
  );
}
