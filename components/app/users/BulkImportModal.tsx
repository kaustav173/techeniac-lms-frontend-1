'use client';

import React, { useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { P, Span } from '@/components/ui/Typography';
import { type CsvUserRow, csvUserRowSchema } from '@/lib/validation';

export type CsvUserRowWithLine = CsvUserRow & { rowNumber?: number };

export interface BulkImportFailure {
  row: CsvUserRowWithLine;
  error: string;
}

export interface BulkImportResult {
  successCount: number;
  failures: BulkImportFailure[];
}

export interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    validRows: CsvUserRowWithLine[],
    onProgress?: (progress: { current: number; total: number }) => void,
  ) => Promise<BulkImportResult>;
}

interface ParsedRowResult {
  rowNumber: number;
  data: { name?: string; email?: string; role?: string };
  isValid: boolean;
  errors: string[];
}

/**
 * Tokenize a CSV line according to RFC 4180.
 * Handles commas inside quotes and escaped double quotes ("").
 */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ',') {
        fields.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

export function BulkImportModal({ isOpen, onClose, onImport }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRowResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

  const handleClose = () => {
    if (isImporting) return;
    setFile(null);
    setParsedRows([]);
    setIsProcessing(false);
    setIsImporting(false);
    setImportProgress(null);
    setImportResult(null);
    onClose();
  };

  if (!isOpen) return null;

  const handleDownloadSample = () => {
    const csvContent =
      'name,email,role\n"Devon Vance",devon@company.internal,SUPER_ADMIN\n"Chen, Alex",alex.chen@enterprise.internal,MENTOR\n"Priya Patel",priya@enterprise.internal,MENTEE';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'techeniac_users_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setImportResult(null);
    setImportProgress(null);
    parseCsv(selected);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing && !isImporting) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isProcessing || isImporting) return;
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const selected = droppedFiles[0];
      if (selected && selected.name.toLowerCase().endsWith('.csv')) {
        setFile(selected);
        setImportResult(null);
        setImportProgress(null);
        parseCsv(selected);
      }
    }
  };

  const parseCsv = (csvFile: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length <= 1) {
        setParsedRows([]);
        setIsProcessing(false);
        return;
      }

      const results: ParsedRowResult[] = [];
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const parts = parseCsvLine(line);
        const rawRow = {
          name: parts[0] ?? '',
          email: parts[1] ?? '',
          role: parts[2] ?? '',
        };

        const validateResult = csvUserRowSchema.safeParse(rawRow);
        if (validateResult.success) {
          results.push({
            rowNumber: i + 1,
            data: validateResult.data,
            isValid: true,
            errors: [],
          });
        } else {
          results.push({
            rowNumber: i + 1,
            data: rawRow,
            isValid: false,
            errors: validateResult.error.issues.map(
              (err) => `${err.path.join('.')}: ${err.message}`,
            ),
          });
        }
      }

      setParsedRows(results);
      setIsProcessing(false);
    };
    reader.readAsText(csvFile);
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  const handleImport = async () => {
    const validData: CsvUserRowWithLine[] = parsedRows
      .filter((r) => r.isValid)
      .map((r) => ({ ...(r.data as CsvUserRow), rowNumber: r.rowNumber }));

    if (validData.length === 0) return;

    setIsImporting(true);
    setImportProgress({ current: 0, total: validData.length });
    setImportResult(null);

    try {
      const result = await onImport(validData, ({ current, total }) => {
        setImportProgress({ current, total });
      });
      setImportResult(result);
      if (result.failures.length === 0) {
        setTimeout(() => {
          handleClose();
        }, 1200);
      }
    } catch {
      setImportResult({
        successCount: 0,
        failures: validData.map((r) => ({ row: r, error: 'Unexpected error during import' })),
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isSubmitting={isImporting}
      title="Import CSV"
      size="xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isImporting}>
            {importResult ? 'Close' : 'Cancel'}
          </Button>
          {!importResult ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                void handleImport();
              }}
              isLoading={isImporting}
              disabled={validCount === 0 || isProcessing || isImporting}
            >
              {isImporting
                ? `Importing (${importProgress?.current ?? 0}/${importProgress?.total ?? validCount})...`
                : `Import ${validCount} Users`}
            </Button>
          ) : null}
        </>
      }
    >
      {/* Progress State */}
      {isImporting && importProgress ? (
        <div
          role="status"
          aria-live="polite"
          className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/60 p-5"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
            <Span>Importing Users into LMS...</Span>
            <Span>
              {importProgress.current} / {importProgress.total} (
              {Math.round((importProgress.current / (importProgress.total || 1)) * 100)}%)
            </Span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200/60">
            <div
              className="h-full bg-blue-600 transition-all duration-150"
              style={{
                width: `${Math.round((importProgress.current / (importProgress.total || 1)) * 100)}%`,
              }}
            />
          </div>
          <P className="text-[11px] text-blue-700">
            Please keep this window open while accounts and invitation emails are dispatched.
          </P>
        </div>
      ) : null}

      {/* Results State (Failures or Success) */}
      {importResult ? (
        <div role="status" aria-live="polite" className="space-y-4">
          {importResult.failures.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
              <Span className="text-base">✅</Span>
              <Span>
                Successfully imported all {importResult.successCount} users! Closing window...
              </Span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
                <P className="font-semibold text-amber-900">
                  Import completed with partial errors:
                </P>
                <P className="mt-0.5 text-slate-700">
                  {importResult.successCount} users created successfully.{' '}
                  <Span className="font-semibold text-red-600">
                    {importResult.failures.length} user(s) failed.
                  </Span>
                </P>
              </div>

              <div className="max-h-60 overflow-x-auto overflow-y-auto rounded-2xl border border-red-200">
                <Table className="w-full min-w-[620px] text-xs">
                  <TableHeader className="sticky top-0 bg-red-100/90 text-red-900 shadow-xs">
                    <TableRow>
                      <TableHead className="w-16 p-2.5 text-xs font-semibold whitespace-nowrap">
                        Line
                      </TableHead>
                      <TableHead className="w-32 p-2.5 text-xs font-semibold whitespace-nowrap">
                        Name
                      </TableHead>
                      <TableHead className="w-48 p-2.5 text-xs font-semibold whitespace-nowrap">
                        Email
                      </TableHead>
                      <TableHead className="w-24 p-2.5 text-xs font-semibold whitespace-nowrap">
                        Role
                      </TableHead>
                      <TableHead className="min-w-[200px] p-2.5 text-xs font-semibold">
                        Failure Reason
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-red-100 bg-white">
                    {importResult.failures.map((f, idx) => (
                      <TableRow
                        key={`${f.row.email}-${idx}`}
                        className="bg-red-50/30 hover:bg-red-50/60"
                      >
                        <TableCell className="w-16 p-2.5 text-xs whitespace-nowrap text-slate-500">
                          {f.row.rowNumber ? `Line ${f.row.rowNumber}` : `—`}
                        </TableCell>
                        <TableCell className="w-32 p-2.5 text-xs font-medium whitespace-nowrap text-slate-900">
                          {f.row.name}
                        </TableCell>
                        <TableCell className="w-48 p-2.5 text-xs break-all text-slate-600">
                          {f.row.email}
                        </TableCell>
                        <TableCell className="w-24 p-2.5 text-xs whitespace-nowrap text-slate-700">
                          {f.row.role}
                        </TableCell>
                        <TableCell className="min-w-[200px] p-2.5 text-xs leading-relaxed font-medium break-words text-red-600">
                          {f.error}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Upload and Sample Actions (visible when not importing) */}
      {!isImporting && !importResult ? (
        <div className="space-y-4">
          {/* Upper Section: Drag and Drop CSV Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              isDragging
                ? 'scale-[1.01] border-[#0044D3] bg-blue-50/70'
                : 'border-slate-300 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-[#0044D3]">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <P className="mt-3 text-sm font-semibold text-slate-800">
              Drag and drop your CSV file here, or{' '}
              <Label className="cursor-pointer font-bold text-[#0044D3] hover:underline">
                browse files
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isProcessing}
                />
              </Label>
            </P>
            <P className="mt-1 text-xs text-slate-500">
              Supported format: UTF-8 CSV with header row (name, email, role)
            </P>
          </div>

          {/* Down Section: Download Sample Button (Primary) */}
          <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:flex-row">
            <div>
              <P className="text-xs font-semibold text-slate-800">
                Need the correct column format?
              </P>
              <P className="text-xs text-slate-600">
                Download the pre-formatted CSV template with sample users
              </P>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDownloadSample}
              className="rounded-xl bg-[#0044D3] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0039B3]"
            >
              Download Sample CSV
            </Button>
          </div>

          {file ? (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs">
              <div className="flex items-center gap-2">
                <Span className="text-base">📄</Span>
                <div>
                  <P className="font-semibold text-slate-900">{file.name}</P>
                  <P className="text-[11px] text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} data rows found
                  </P>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  {validCount} valid
                </Span>
                {invalidCount > 0 ? (
                  <Span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                    {invalidCount} invalid
                  </Span>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <Span>CSV Verification Preview (first 10 rows)</Span>
                <Span>
                  {validCount} of {parsedRows.length} ready to import
                </Span>
              </div>
              <div className="max-h-56 overflow-hidden overflow-y-auto rounded-2xl border border-slate-200">
                <Table className="w-full text-xs">
                  <TableHeader className="sticky top-0 bg-slate-100 text-slate-700">
                    <TableRow>
                      <TableHead className="p-2.5 text-xs">Row</TableHead>
                      <TableHead className="p-2.5 text-xs">Name</TableHead>
                      <TableHead className="p-2.5 text-xs">Email</TableHead>
                      <TableHead className="p-2.5 text-xs">Role</TableHead>
                      <TableHead className="p-2.5 text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {parsedRows.map((row) => (
                      <TableRow
                        key={row.rowNumber}
                        className={row.isValid ? 'bg-white' : 'bg-red-50/50'}
                      >
                        <TableCell className="p-2.5 text-xs text-slate-500">
                          {row.rowNumber}
                        </TableCell>
                        <TableCell className="p-2.5 text-xs font-medium text-slate-900">
                          {row.data.name || '—'}
                        </TableCell>
                        <TableCell className="p-2.5 text-xs text-slate-600">
                          {row.data.email || '—'}
                        </TableCell>
                        <TableCell className="p-2.5">
                          <Span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-800">
                            {row.data.role || '—'}
                          </Span>
                        </TableCell>
                        <TableCell className="p-2.5">
                          {row.isValid ? (
                            <Span className="font-semibold text-emerald-600">Ready</Span>
                          ) : (
                            <Span
                              className="text-[11px] text-red-500"
                              title={row.errors.join(', ')}
                            >
                              {row.errors[0]}
                            </Span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : isProcessing ? (
            <P className="py-4 text-center text-xs text-slate-500">Parsing CSV contents...</P>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
