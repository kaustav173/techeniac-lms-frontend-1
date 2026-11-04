'use client';

import React from 'react';

import { Modal } from '@/components/patterns/Modal';
import { Button } from '@/components/ui/Button';
import { P, Span } from '@/components/ui/Typography';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onStay: () => void;
  onDiscard: () => void;
}

export function UnsavedChangesModal({
  isOpen,
  onStay,
  onDiscard,
}: Readonly<UnsavedChangesModalProps>) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onStay}
      title="Unsaved Changes Guard"
      size="sm"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onStay} size="sm">
            Stay & Keep Editing
          </Button>
          <Button type="button" variant="danger" onClick={onDiscard} size="sm">
            Discard Changes
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
        <Span className="font-bold">Notice:</Span>
        <P className="text-xs leading-relaxed text-amber-900">
          Unsaved modifications on this outline node will be permanently lost if you discard.
        </P>
      </div>
    </Modal>
  );
}
