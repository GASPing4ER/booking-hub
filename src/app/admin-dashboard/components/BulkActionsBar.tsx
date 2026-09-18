'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface BulkActionsBarProps {
  selectedCount: number;
  onConfirmSelected: () => void;
  onCancelSelected: () => void;
  onClearSelection: () => void;
}

const BulkActionsBar = ({
  selectedCount,
  onConfirmSelected,
  onCancelSelected,
  onClearSelection,
}: BulkActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-card border border-border rounded-lg shadow-hospitality-lg px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-caption font-semibold text-sm">
              {selectedCount}
            </span>
          </div>
          <span className="font-caption font-medium text-text-primary">
            {selectedCount} izbranih rezervacij
          </span>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <button
            onClick={onConfirmSelected}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-success text-success-foreground hover:bg-success/90 transition-smooth"
          >
            <Icon name="CheckIcon" variant="solid" size={16} />
            <span className="font-caption font-medium text-sm">Potrdi</span>
          </button>

          <button
            onClick={onCancelSelected}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-error text-error-foreground hover:bg-error/90 transition-smooth"
          >
            <Icon name="XMarkIcon" variant="solid" size={16} />
            <span className="font-caption font-medium text-sm">Prekliči</span>
          </button>

          <button
            onClick={onClearSelection}
            className="p-2 rounded-md text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth"
            aria-label="Počisti izbor"
          >
            <Icon name="XMarkIcon" variant="outline" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;