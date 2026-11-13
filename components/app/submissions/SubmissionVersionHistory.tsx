import React from 'react';

import { Alert } from '@/components/ui/Alert';
import { H3, H4, P, Span } from '@/components/ui/Typography';
import { formatDateTimeIST } from '@/lib/date';
import { isSafeHttpUrl } from '@/lib/url';
import { SubmissionStatus, type SubmissionVersion } from '@/types/submissions';

interface SubmissionVersionHistoryProps {
  versions: SubmissionVersion[];
  maxMarks?: number | undefined;
}

function SubmissionResourceLink({
  label,
  url,
}: Readonly<{
  label: string;
  url: string | null | undefined;
}>) {
  if (!url) return null;
  const isSafe = isSafeHttpUrl(url);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E1E6EC] bg-[#F8FAFC] p-3 text-xs">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0044D3]">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <div className="min-w-0">
        <Span className="block truncate font-semibold text-[#111827]">{label}</Span>
        {isSafe ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-[#0044D3] hover:underline"
          >
            {url}
          </a>
        ) : (
          <Span className="block truncate text-[#667085]">{url}</Span>
        )}
      </div>
    </div>
  );
}

export function SubmissionVersionHistory({
  versions,
  maxMarks,
}: Readonly<SubmissionVersionHistoryProps>) {
  if (!versions || versions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/30">
        <P className="text-sm text-slate-500 dark:text-slate-400">
          No submissions have been made yet for this assignment.
        </P>
      </div>
    );
  }

  // Sort versions descending (latest first)
  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  return (
    <div className="space-y-6 rounded-3xl border border-[#E1E6EC] bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-[#111827]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <H3 className="text-base font-bold text-[#111827]">Submission History</H3>
        </div>
        <Span className="text-xs font-medium text-[#667085]">
          {versions.length} {versions.length === 1 ? 'version' : 'versions'} submitted
        </Span>
      </div>

      <div className="space-y-6 divide-y divide-[#E1E6EC]/60">
        {sortedVersions.map((versionItem, index) => (
          <div key={versionItem.id} className={`space-y-4 ${index > 0 ? 'pt-6' : ''}`}>
            {/* Header: Version number, IST Timestamp, Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-[#0044D3]">
                  Version {versionItem.version}
                </Span>
                <Span className="text-xs text-[#667085]">
                  Submitted at: {formatDateTimeIST(versionItem.submittedAt)}
                </Span>
              </div>

              <div className="flex items-center gap-2">
                {versionItem.isLate ? (
                  <Span className="rounded-full bg-rose-50 px-3 py-0.5 text-xs font-semibold text-rose-600">
                    Late Submission
                  </Span>
                ) : (
                  <Span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-600">
                    On Time
                  </Span>
                )}

                <Span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-700 uppercase">
                  {versionItem.status}
                </Span>
              </div>
            </div>

            {/* Submitted Artifacts/Links */}
            <div className="space-y-2">
              <H4 className="text-xs font-bold text-[#111827]">Submitted Resources</H4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SubmissionResourceLink
                  label="PDF Document Link"
                  url={versionItem.submissionData.pdfUrl}
                />
                <SubmissionResourceLink
                  label="ZIP Archive Link"
                  url={versionItem.submissionData.zipUrl}
                />
                <SubmissionResourceLink
                  label="Project Repository / Live URL"
                  url={versionItem.submissionData.linkUrl}
                />
              </div>
            </div>

            {/* Grading & Feedback section if evaluated */}
            {versionItem.marks !== null || versionItem.feedback ? (
              <div className="space-y-3 rounded-2xl border border-indigo-100 bg-[#F8FAFC] p-4">
                <div className="flex items-center justify-between border-b border-[#E1E6EC]/60 pb-2">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 text-[#667085]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                    <H4 className="text-xs font-bold text-[#111827]">Evaluation &amp; Feedback</H4>
                  </div>
                  {versionItem.gradedAt ? (
                    <Span className="text-[11px] text-[#667085]">
                      Graded on: {formatDateTimeIST(versionItem.gradedAt)}
                    </Span>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#111827]">
                  {versionItem.marks !== null ? (
                    <div className="flex items-center gap-1.5">
                      <Span>Score:</Span>
                      <Span className="inline-flex items-center rounded-lg bg-blue-100 px-2 py-0.5 text-xs font-bold text-[#0044D3]">
                        {versionItem.marks}
                      </Span>
                      <Span>{maxMarks ? `/ ${maxMarks}` : ''}</Span>
                    </div>
                  ) : null}

                  {versionItem.feedback ? (
                    <div className="flex items-center gap-1.5 border-l border-[#E1E6EC] pl-4">
                      <Span className="text-[#667085]">Mentor Feedback:</Span>
                      <Span className="text-[#111827] italic">{versionItem.feedback}</Span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {versionItem.status === SubmissionStatus.RESUBMIT_REQUESTED && !versionItem.feedback ? (
              <Alert
                variant="warning"
                title="Resubmission Requested"
                message="Your mentor has requested changes for this submission. Please review any instructions and submit a new revision."
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
