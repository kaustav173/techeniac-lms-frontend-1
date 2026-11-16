'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { DatePicker } from '@/components/ui/DatePicker';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { FieldError } from '@/components/ui/FieldError';
import { CheckIcon } from '@/components/ui/Icons';
import { Label } from '@/components/ui/Label';
import { MultiSelectDropdown, type MultiSelectOption } from '@/components/ui/MultiSelectDropdown';
import { H3, P, Span } from '@/components/ui/Typography';
import {
  type AllocationTargetType,
  type CreateAllocationsResponse,
  useCreateAllocationsMutation,
} from '@/hooks/useAllocations';
import { type ApiBatchSummary, useBatchDetail, useInfiniteBatches } from '@/hooks/useBatches';
import { useCourseDetail, useInfiniteCourses } from '@/hooks/useCourses';
import { useToast } from '@/hooks/useToast';
import { useUsers } from '@/hooks/useUsers';
import { cn } from '@/lib/cn';
import { toISTDateInputValue } from '@/lib/date';

export interface AssignCourseModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly initialCourseId?: string | undefined;
  readonly initialBatchId?: string | undefined;
  readonly userRole?: 'SUPER_ADMIN' | 'MENTOR' | undefined;
  readonly onSuccess?: (() => void) | undefined;
}

export function AssignCourseModal(props: AssignCourseModalProps) {
  if (!props.isOpen) return null;
  return <AssignCourseModalDialog {...props} />;
}

function AssignCourseModalDialog({
  isOpen,
  onClose,
  initialCourseId,
  initialBatchId,
  userRole = 'MENTOR',
  onSuccess,
}: AssignCourseModalProps) {
  // Wizard step: 1 = Course, 2 = Targets, 3 = Schedule & Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(initialCourseId ? 2 : 1);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId ?? '');
  const [targetType, setTargetType] = useState<AllocationTargetType>('BATCH');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatchId ?? '');
  const [selectedMenteeIds, setSelectedMenteeIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<unknown>(null);
  const [result, setResult] = useState<CreateAllocationsResponse | null>(null);

  const today = toISTDateInputValue(new Date());

  const [prevBatchId, setPrevBatchId] = useState(initialBatchId);
  if (prevBatchId !== initialBatchId) {
    setPrevBatchId(initialBatchId);
    setSelectedBatchId(initialBatchId ?? '');
  }

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setStartDate((prev) => prev || today);
    });
    return () => cancelAnimationFrame(frameId);
  }, [today]);

  // Queries
  const [courseSearch, setCourseSearch] = useState('');
  const {
    data: coursesInfiniteData,
    fetchNextPage: fetchNextCourses,
    hasNextPage: hasNextCourses,
    isFetching: isFetchingCourses,
    isFetchingNextPage: isFetchingNextCourses,
  } = useInfiniteCourses(10, courseSearch, { isActive: true });

  const infiniteCourses = useMemo(
    () => coursesInfiniteData?.pages.flatMap((p) => p.courses) ?? [],
    [coursesInfiniteData],
  );

  const { data: courseDetail } = useCourseDetail(selectedCourseId, {
    enabled: Boolean(selectedCourseId) && !infiniteCourses.some((c) => c.id === selectedCourseId),
  });

  const isMentor = userRole === 'MENTOR';
  const [batchSearch, setBatchSearch] = useState('');
  const {
    data: batchesInfiniteData,
    fetchNextPage: fetchNextBatches,
    hasNextPage: hasNextBatches,
    isFetching: isFetchingBatches,
    isFetchingNextPage: isFetchingNextBatches,
  } = useInfiniteBatches(10, batchSearch, isMentor ? 'mentor' : 'admin', {
    status: 'LIVE,DRAFT',
  });

  const infiniteBatches = useMemo<ApiBatchSummary[]>(() => {
    return batchesInfiniteData?.pages.flatMap((p) => p.items) ?? [];
  }, [batchesInfiniteData]);

  const { data: batchDetailData } = useBatchDetail(selectedBatchId, undefined, {
    enabled:
      Boolean(selectedBatchId) &&
      (targetType === 'SELECTED_MENTEES' || !infiniteBatches.some((b) => b.id === selectedBatchId)),
  });
  const canTargetIndividualMentees = userRole === 'SUPER_ADMIN' && !initialBatchId;
  const { users: allUsers, isLoading: isLoadingUsers } = useUsers(
    targetType === 'INDIVIDUAL_MENTEES' ? { role: 'MENTEE', status: 'ACTIVE', limit: 100 } : {},
    { enabled: targetType === 'INDIVIDUAL_MENTEES' && canTargetIndividualMentees },
  );

  const createMutation = useCreateAllocationsMutation();
  const { toastSuccess, toastError } = useToast();

  const activeBatches = useMemo(() => {
    const list = infiniteBatches.filter((b) => b.status === 'LIVE' || b.status === 'DRAFT');
    if (batchDetailData && !list.some((b) => b.id === batchDetailData.id)) {
      list.unshift({
        id: batchDetailData.id,
        name: batchDetailData.name,
        code: batchDetailData.code,
        status: batchDetailData.status,
      } as ApiBatchSummary);
    }
    return list;
  }, [infiniteBatches, batchDetailData]);

  const selectedCourse = useMemo(() => {
    if (!selectedCourseId) return null;
    return infiniteCourses.find((c) => c.id === selectedCourseId) ?? courseDetail ?? null;
  }, [infiniteCourses, selectedCourseId, courseDetail]);

  const courseOptions: readonly MultiSelectOption[] = useMemo(() => {
    const optionsMap = new Map<string, MultiSelectOption>();
    for (const c of infiniteCourses) {
      optionsMap.set(c.id, {
        value: c.id,
        label: `${c.title} ${
          c.estimatedMinutes
            ? `(${Math.floor(c.estimatedMinutes / 60)}h ${c.estimatedMinutes % 60}m)`
            : '(No duration estimate)'
        }`,
      });
    }
    if (selectedCourse && !optionsMap.has(selectedCourse.id)) {
      optionsMap.set(selectedCourse.id, {
        value: selectedCourse.id,
        label: `${selectedCourse.title} ${
          selectedCourse.estimatedMinutes
            ? `(${Math.floor(selectedCourse.estimatedMinutes / 60)}h ${selectedCourse.estimatedMinutes % 60}m)`
            : '(No duration estimate)'
        }`,
      });
    }
    return Array.from(optionsMap.values());
  }, [infiniteCourses, selectedCourse]);

  const handleCourseScrollEnd = useCallback(() => {
    if (hasNextCourses && !isFetchingNextCourses) {
      void fetchNextCourses();
    }
  }, [hasNextCourses, isFetchingNextCourses, fetchNextCourses]);

  const selectedBatch = useMemo(() => {
    const found = infiniteBatches.find((b) => b.id === selectedBatchId);
    if (found) return found;
    if (batchDetailData && batchDetailData.id === selectedBatchId) {
      return {
        id: batchDetailData.id,
        name: batchDetailData.name,
        code: batchDetailData.code,
        status: batchDetailData.status,
      } as ApiBatchSummary;
    }
    return undefined;
  }, [infiniteBatches, selectedBatchId, batchDetailData]);

  const batchOptions: readonly MultiSelectOption[] = useMemo(() => {
    const optionsMap = new Map<string, MultiSelectOption>();
    for (const b of activeBatches) {
      optionsMap.set(b.id, {
        value: b.id,
        label: `${b.name} (${b.code}) — ${b.status}`,
      });
    }
    if (selectedBatch && !optionsMap.has(selectedBatch.id)) {
      optionsMap.set(selectedBatch.id, {
        value: selectedBatch.id,
        label: `${selectedBatch.name} (${selectedBatch.code}) — ${selectedBatch.status}`,
      });
    }
    return Array.from(optionsMap.values());
  }, [activeBatches, selectedBatch]);

  const handleBatchScrollEnd = useCallback(() => {
    if (hasNextBatches && !isFetchingNextBatches) {
      void fetchNextBatches();
    }
  }, [hasNextBatches, isFetchingNextBatches, fetchNextBatches]);

  // Update calculated due date preview if course has estimated minutes
  const estimatedDueDateText = useMemo(() => {
    if (!startDate || !selectedCourse?.estimatedMinutes) return null;
    const start = new Date(startDate);
    const due = new Date(start.getTime() + selectedCourse.estimatedMinutes * 60 * 1000);
    return due.toISOString().split('T')[0];
  }, [startDate, selectedCourse]);

  const startDateError = useMemo(() => {
    if (!dateError) return null;
    return dateError.toLowerCase().startsWith('start date') ? dateError : null;
  }, [dateError]);

  const dueDateError = useMemo(() => {
    if (!dateError) return null;
    return !dateError.toLowerCase().startsWith('start date') ? dateError : null;
  }, [dateError]);

  const availableBatchMentees = useMemo(() => {
    if (!batchDetailData?.members) return [];
    return batchDetailData.members
      .filter((m) => m.memberRole === 'MENTEE')
      .map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
      }));
  }, [batchDetailData]);

  const toggleMentee = (userId: string) => {
    setSelectedMenteeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const selectAllMentees = () => {
    if (targetType === 'SELECTED_MENTEES') {
      setSelectedMenteeIds(availableBatchMentees.map((m) => m.id));
    } else if (targetType === 'INDIVIDUAL_MENTEES') {
      setSelectedMenteeIds(allUsers.map((u) => u.id));
    }
  };

  const deselectAllMentees = () => {
    setSelectedMenteeIds([]);
  };

  const handleReset = () => {
    setCurrentStep(initialCourseId ? 2 : 1);
    setSelectedCourseId(initialCourseId ?? '');
    setTargetType('BATCH');
    setSelectedBatchId(initialBatchId ?? '');
    setSelectedMenteeIds([]);
    setDueDate('');
    setErrorMsg(null);
    setResult(null);
    setCourseSearch('');
    setBatchSearch('');
  };

  const handleNext = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!selectedCourseId) {
        setErrorMsg('Please select an active course to allocate.');
        return;
      }
      if (!startDate) {
        setStartDate(today);
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (targetType !== 'INDIVIDUAL_MENTEES' && !selectedBatchId) {
        setErrorMsg('Please select a target batch.');
        return;
      }
      if (
        (targetType === 'SELECTED_MENTEES' || targetType === 'INDIVIDUAL_MENTEES') &&
        selectedMenteeIds.length === 0
      ) {
        setErrorMsg('Please select at least one mentee.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setDateError(null);
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2 && !initialCourseId) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setDateError(null);

    if (!selectedCourseId) {
      setErrorMsg('Please select a course to allocate.');
      return;
    }

    if (!startDate) {
      setDateError('Start date is required.');
      return;
    }

    if (startDate < today) {
      setDateError('Start date cannot be earlier than today.');
      return;
    }

    if (!dueDate && (!selectedCourse?.estimatedMinutes || selectedCourse.estimatedMinutes <= 0)) {
      setDateError('Due date is required because this course has no estimated duration.');
      return;
    }

    if (dueDate && new Date(dueDate).getTime() < new Date(startDate).getTime()) {
      setDateError('Due date cannot be earlier than start date.');
      return;
    }

    try {
      const res = await createMutation.mutateAsync({
        courseId: selectedCourseId,
        targetType,
        batchId: targetType !== 'INDIVIDUAL_MENTEES' ? selectedBatchId : undefined,
        menteeIds: targetType !== 'BATCH' ? selectedMenteeIds : undefined,
        startDate: new Date(startDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });

      const count = res.created.length;
      toastSuccess(
        `Course successfully assigned to ${count} mentee${count === 1 ? '' : 's'}.`,
        'Course Allocated',
      );
      setResult(res);
      onSuccess?.();
    } catch (err: unknown) {
      setErrorMsg(err);
      const errMsg = err instanceof Error ? err.message : 'Failed to allocate course.';
      toastError(errMsg, 'Allocation Failed');
    }
  };

  if (result) {
    const createdAllocations = result.created;
    const skippedAllocations = result.skipped;

    return (
      <Modal
        isOpen={isOpen}
        onClose={() => {
          handleReset();
          onClose();
        }}
        title="Course Allocation Completed"
        description="The course allocation request was successfully processed."
        size="md"
        footer={
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              handleReset();
              onClose();
            }}
          >
            Done
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <P className="text-sm font-semibold text-emerald-900">
              Successfully Created: {createdAllocations.length} allocation(s)
            </P>
            <P className="mt-1 text-xs text-emerald-700">
              Course is now available for the allocated mentees.
            </P>
          </div>

          {skippedAllocations.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <P className="text-sm font-semibold text-amber-900">
                Skipped Mentees: {skippedAllocations.length}
              </P>
              <P className="mt-0.5 text-xs text-amber-700">
                These mentees already hold an open allocation of this course and were safely
                skipped.
              </P>
              <ul className="mt-2 max-h-32 divide-y divide-amber-100 overflow-y-auto rounded-lg border border-amber-200/60 bg-white/70 text-xs text-amber-900">
                {skippedAllocations.map((s, idx) => (
                  <li key={idx} className="flex items-center justify-between p-2">
                    <Span className="truncate text-[11px]">{s.menteeId}</Span>
                    <Span className="text-[10px] font-medium text-amber-700">{s.reason}</Span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isSubmitting={createMutation.isPending}
      title="Assign Course Deployment"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div>
            {currentStep > 1 && (!initialCourseId || currentStep === 3) ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBack}
                disabled={createMutation.isPending}
              >
                ← Back
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>

            {currentStep < 3 ? (
              <Button type="button" variant="primary" size="sm" onClick={handleNext}>
                Next Step →
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => void handleSubmit()}
                isLoading={createMutation.isPending}
              >
                Confirm & Deploy Course
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 3-Step Wizard Indicator */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                1
              </div>
              <Span
                className={`font-semibold ${
                  currentStep === 1 ? 'text-blue-600' : 'text-slate-600'
                }`}
              >
                Select Course
              </Span>
            </div>

            <div className="mx-3 h-0.5 flex-1 bg-slate-200">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                2
              </div>
              <Span
                className={`font-semibold ${
                  currentStep === 2 ? 'text-blue-600' : 'text-slate-600'
                }`}
              >
                Targets
              </Span>
            </div>

            <div className="mx-3 h-0.5 flex-1 bg-slate-200">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: currentStep === 3 ? '100%' : '0%',
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                3
              </div>
              <Span
                className={`font-semibold ${
                  currentStep === 3 ? 'text-blue-600' : 'text-slate-600'
                }`}
              >
                Schedule & Review
              </Span>
            </div>
          </div>
        </div>

        {errorMsg ? (
          <ErrorMessage
            error={errorMsg}
            title="Allocation Request Failed"
            onDismiss={() => setErrorMsg(null)}
          />
        ) : null}

        {/* STEP 1: Select Course */}
        {currentStep === 1 ? (
          <div className="min-h-[280px] space-y-4">
            <div>
              <Label htmlFor="assign-course-select" required>
                Select Active Course
              </Label>
              <MultiSelectDropdown
                id="assign-course-select"
                label="Select active curriculum"
                placeholder="-- Choose active curriculum --"
                options={courseOptions}
                selectedValues={selectedCourseId ? [selectedCourseId] : []}
                onChange={(vals) => setSelectedCourseId(vals[0] ?? '')}
                singleSelect={true}
                align="left"
                className="w-full"
                onScrollEnd={handleCourseScrollEnd}
                onSearch={setCourseSearch}
                isSearching={isFetchingCourses && !isFetchingNextCourses}
                isLoadingMore={isFetchingNextCourses}
                disabled={Boolean(initialCourseId)}
                usePortal={true}
              />
            </div>

            {selectedCourse ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <H3 className="text-sm font-bold text-slate-900">{selectedCourse.title}</H3>
                <P className="mt-1 text-xs text-slate-600">
                  {selectedCourse.description || 'Enterprise curriculum module.'}
                </P>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
                  <Span>
                    Duration:{' '}
                    {selectedCourse.estimatedMinutes
                      ? `${Math.floor(selectedCourse.estimatedMinutes / 60)}h ${selectedCourse.estimatedMinutes % 60}m`
                      : 'Unspecified'}
                  </Span>
                  <Span>•</Span>
                  <Span>Status: Active</Span>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* STEP 2: Targets Selection */}
        {currentStep === 2 ? (
          <div className="space-y-4">
            <div>
              <Label required>Target Scope</Label>
              <div
                className={cn(
                  'grid grid-cols-1 gap-2.5',
                  canTargetIndividualMentees ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
                )}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTargetType('BATCH');
                    if (initialBatchId) {
                      setSelectedBatchId(initialBatchId);
                    }
                    setSelectedMenteeIds([]);
                  }}
                  className={`h-auto flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                    targetType === 'BATCH'
                      ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-2 ring-blue-500 hover:bg-blue-50/70'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <P className="text-sm font-semibold text-slate-900">Whole Batch</P>
                  <Span className="mt-0.5 block text-xs text-slate-500">
                    All active mentees enrolled in batch
                  </Span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTargetType('SELECTED_MENTEES');
                    if (initialBatchId) {
                      setSelectedBatchId(initialBatchId);
                    }
                    setSelectedMenteeIds([]);
                  }}
                  className={`h-auto flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                    targetType === 'SELECTED_MENTEES'
                      ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-2 ring-blue-500 hover:bg-blue-50/70'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <P className="text-sm font-semibold text-slate-900">Selected Mentees</P>
                  <Span className="mt-0.5 block text-xs text-slate-500">
                    Specific mentees inside a batch
                  </Span>
                </Button>

                {canTargetIndividualMentees ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setTargetType('INDIVIDUAL_MENTEES');
                      setSelectedBatchId('');
                      setSelectedMenteeIds([]);
                    }}
                    className={`h-auto flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                      targetType === 'INDIVIDUAL_MENTEES'
                        ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-2 ring-blue-500 hover:bg-blue-50/70'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <P className="text-sm font-semibold text-slate-900">Individual Mentees</P>
                    <Span className="mt-0.5 block text-xs text-slate-500">
                      Outside any batch (Admin only)
                    </Span>
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Target Batch Select */}
            {targetType !== 'INDIVIDUAL_MENTEES' ? (
              <div>
                <Label htmlFor="assign-batch-select" required>
                  Select Target Batch
                </Label>
                <MultiSelectDropdown
                  id="assign-batch-select"
                  label="Select target batch"
                  placeholder="-- Choose active or draft batch --"
                  options={batchOptions}
                  selectedValues={selectedBatchId ? [selectedBatchId] : []}
                  onChange={(vals) => {
                    if (!initialBatchId) {
                      setSelectedBatchId(vals[0] ?? '');
                      setSelectedMenteeIds([]);
                    }
                  }}
                  singleSelect={true}
                  align="left"
                  className="w-full"
                  onScrollEnd={handleBatchScrollEnd}
                  onSearch={setBatchSearch}
                  isSearching={isFetchingBatches && !isFetchingNextBatches}
                  isLoadingMore={isFetchingNextBatches}
                  disabled={Boolean(initialBatchId)}
                  usePortal={true}
                />
                {initialBatchId ? (
                  <Span className="mt-1 block text-xs text-slate-500">
                    Target batch is locked to the current batch.
                  </Span>
                ) : null}
              </div>
            ) : null}

            {/* Checkbox list for SELECTED_MENTEES */}
            {targetType === 'SELECTED_MENTEES' && selectedBatchId ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label required>Pick Mentees ({selectedMenteeIds.length} selected)</Label>
                  <div className="space-x-2 text-xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={selectAllMentees}
                      className="h-auto p-0 font-semibold text-blue-600 hover:bg-transparent hover:underline"
                    >
                      Select all
                    </Button>
                    <Span className="text-slate-300">|</Span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={deselectAllMentees}
                      className="h-auto p-0 text-slate-500 hover:bg-transparent hover:underline"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  {availableBatchMentees.length === 0 ? (
                    <P className="text-xs text-slate-400">No active mentees found in this batch.</P>
                  ) : (
                    availableBatchMentees.map((mentee) => (
                      <div key={mentee.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`batch-m-${mentee.id}`}
                          checked={selectedMenteeIds.includes(mentee.id)}
                          onChange={() => toggleMentee(mentee.id)}
                        />
                        <Label
                          htmlFor={`batch-m-${mentee.id}`}
                          className="cursor-pointer text-xs font-normal text-slate-800"
                        >
                          {mentee.name} <Span className="text-slate-400">({mentee.email})</Span>
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {/* Checkbox list for INDIVIDUAL_MENTEES */}
            {targetType === 'INDIVIDUAL_MENTEES' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label required>
                    Pick Independent Mentees ({selectedMenteeIds.length} selected)
                  </Label>
                  <div className="space-x-2 text-xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={selectAllMentees}
                      className="h-auto p-0 font-semibold text-blue-600 hover:bg-transparent hover:underline"
                    >
                      Select all
                    </Button>
                    <Span className="text-slate-300">|</Span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={deselectAllMentees}
                      className="h-auto p-0 text-slate-500 hover:bg-transparent hover:underline"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  {isLoadingUsers ? (
                    <P className="text-xs text-slate-400">Loading mentees...</P>
                  ) : allUsers.length === 0 ? (
                    <P className="text-xs text-slate-400">No active mentees available.</P>
                  ) : (
                    allUsers.map((mentee) => (
                      <div key={mentee.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`ind-m-${mentee.id}`}
                          checked={selectedMenteeIds.includes(mentee.id)}
                          onChange={() => toggleMentee(mentee.id)}
                        />
                        <Label
                          htmlFor={`ind-m-${mentee.id}`}
                          className="cursor-pointer text-xs font-normal text-slate-800"
                        >
                          {mentee.name} <Span className="text-slate-400">({mentee.email})</Span>
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* STEP 3: Schedule & Review */}
        {currentStep === 3 ? (
          <div className="space-y-5">
            {/* Selected Course & Target Summary Card */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                      Course Name
                    </Span>
                    {selectedCourse?.estimatedMinutes ? (
                      <Span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                        {Math.floor(selectedCourse.estimatedMinutes / 60)}h{' '}
                        {selectedCourse.estimatedMinutes % 60}m
                      </Span>
                    ) : null}
                  </div>
                  <H3 className="mt-1 truncate text-base font-bold text-slate-900">
                    {selectedCourse?.title ?? 'Selected Course'}
                  </H3>
                  {selectedBatch ? (
                    <P className="mt-0.5 truncate text-xs text-slate-500">
                      Target Batch:{' '}
                      <Span className="font-medium text-slate-700">{selectedBatch.name}</Span>{' '}
                      <Span className="text-slate-400">({selectedBatch.code})</Span>
                    </P>
                  ) : null}
                </div>

                <div className="shrink-0">
                  <Span className="inline-flex items-center rounded-full border border-blue-200/80 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 shadow-2xs">
                    {targetType === 'BATCH'
                      ? 'Whole Batch'
                      : targetType === 'SELECTED_MENTEES'
                        ? `${selectedMenteeIds.length} Mentees in Batch`
                        : `${selectedMenteeIds.length} Independent Mentees`}
                  </Span>
                </div>
              </div>
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="assign-start-date" required>
                  Start Date
                </Label>
                <DatePicker
                  id="assign-start-date"
                  value={startDate}
                  onChange={(val) => {
                    setStartDate(val);
                    if (dateError) setDateError(null);
                  }}
                  rangeStart={startDate}
                  rangeEnd={dueDate || estimatedDueDateText || undefined}
                  minDate={today}
                  maxDate={dueDate || undefined}
                  hasError={Boolean(startDateError)}
                  placement="auto"
                  placeholder="Select start date"
                />
                <FieldError id="assign-start-date-error" error={startDateError} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="assign-due-date">
                  Due Date {selectedCourse?.estimatedMinutes ? '(Auto-prefilled)' : '(Required)'}
                </Label>
                <DatePicker
                  id="assign-due-date"
                  value={dueDate || (estimatedDueDateText ?? '')}
                  onChange={(val) => {
                    setDueDate(val);
                    if (dateError) setDateError(null);
                  }}
                  rangeStart={startDate}
                  rangeEnd={dueDate || estimatedDueDateText || undefined}
                  minDate={startDate && startDate > today ? startDate : today}
                  hasError={Boolean(dueDateError)}
                  placement="auto"
                  placeholder="Select due date"
                />
                <FieldError id="assign-due-date-error" error={dueDateError} />
                {estimatedDueDateText && !dueDate ? (
                  <P className="mt-1 text-xs text-slate-500">
                    Prefilled with start + estimated duration ({estimatedDueDateText})
                  </P>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <Span className="text-xs font-semibold text-slate-800">
                  Deployment Policy Notice
                </Span>
              </div>

              <div className="mt-2.5 space-y-2 border-t border-slate-200/60 pt-2.5 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <Span className="leading-relaxed">
                    Mentees who already hold an active allocation of this course will be safely
                    skipped.
                  </Span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <Span className="leading-relaxed">
                    Automatically initializes topic progress tracking for all active course topics.
                  </Span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <Span className="leading-relaxed">
                    Enrolled mentees will receive an email notification with their assigned schedule
                    and due date.
                  </Span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
