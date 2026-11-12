import React from 'react';

import { Alert } from '@/components/ui/Alert';
import { Code, H3, H4, P, Span } from '@/components/ui/Typography';
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
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
      <Span className="block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</Span>
      {isSafe ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block truncate text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          {url}
        </a>
      ) : (
        <Span className="mt-1 block truncate font-mono text-xs text-slate-600 dark:text-slate-400">
          {url}
        </Span>
      )}
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <H3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Submission History
        </H3>
        <Span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {versions.length} {versions.length === 1 ? 'version' : 'versions'} submitted
        </Span>
      </div>

      <div className="space-y-4">
        {sortedVersions.map((versionItem) => (
          <div
            key={versionItem.id}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            {/* Header: Version number, IST Timestamp, Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Span className="inline-flex items-center rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  Version {versionItem.version}
                </Span>
                <Span className="text-xs text-slate-500 dark:text-slate-400">
                  Submitted at:{' '}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {formatDateTimeIST(versionItem.submittedAt)}
                  </strong>
                </Span>
              </div>

              <div className="flex items-center gap-2">
                {versionItem.isLate ? (
                  <Span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                    Late Submission
                  </Span>
                ) : (
                  <Span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    On Time
                  </Span>
                )}

                <Span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {versionItem.status}
                </Span>
              </div>
            </div>

            {/* Submitted Artifacts/Links */}
            <div className="space-y-2">
              <H4 className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Submitted Resources
              </H4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              <div className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between">
                  <H4 className="text-xs font-bold tracking-wider text-indigo-900 uppercase dark:text-indigo-300">
                    Evaluation & Feedback
                  </H4>
                  {versionItem.gradedAt ? (
                    <Span className="text-xs text-indigo-600 dark:text-indigo-400">
                      Graded on: {formatDateTimeIST(versionItem.gradedAt)}
                    </Span>
                  ) : null}
                </div>

                <div className="flex items-center gap-4">
                  {versionItem.marks !== null ? (
                    <P className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Score:{' '}
                      <Code className="text-base text-indigo-700 dark:text-indigo-300">
                        {versionItem.marks}
                      </Code>
                      {maxMarks ? ` / ${maxMarks}` : ''}
                    </P>
                  ) : null}
                </div>

                {versionItem.feedback ? (
                  <div className="mt-2 text-xs text-slate-700 dark:text-slate-300">
                    <P className="mb-1 font-medium text-slate-900 dark:text-slate-200">
                      Mentor Feedback:
                    </P>
                    <P className="whitespace-pre-wrap italic">{versionItem.feedback}</P>
                  </div>
                ) : null}
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
