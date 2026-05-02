'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface RecurringPattern {
  type: 'daily' | 'weekly';
  startDate: string;
  endDate: string;
  status: 'available' | 'unavailable';
  selectedDays: number[]; // 0-6 for Sunday-Saturday
}

interface RecurringPatternModalProps {
  onClose: () => void;
  onApply: (pattern: RecurringPattern) => void;
}

const RecurringPatternModal = ({ onClose, onApply }: RecurringPatternModalProps) => {
  const today = new Date().toISOString().split('T')[0];
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
  const oneMonthLaterStr = oneMonthLater.toISOString().split('T')[0];

  const [pattern, setPattern] = useState<RecurringPattern>({
    type: 'weekly',
    startDate: today,
    endDate: oneMonthLaterStr,
    status: 'available',
    selectedDays: [],
  });

  const [errors, setErrors] = useState<{ startDate?: string; endDate?: string; days?: string }>(
    {}
  );

  const daysOfWeek = [
    { label: 'Sun', value: 0 },
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
  ];

  const toggleDay = (day: number) => {
    setPattern((prev) => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter((d) => d !== day)
        : [...prev.selectedDays, day],
    }));
    setErrors((prev) => ({ ...prev, days: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { startDate?: string; endDate?: string; days?: string } = {};

    if (!pattern.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!pattern.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (pattern.startDate && pattern.endDate && pattern.startDate >= pattern.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (pattern.type === 'weekly' && pattern.selectedDays.length === 0) {
      newErrors.days = 'Please select at least one day';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onApply(pattern);
  };

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg border border-border shadow-hospitality-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-heading font-semibold text-2xl text-text-primary">
            Set Recurring Availability Pattern
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth"
            aria-label="Close modal"
          >
            <Icon name="XMarkIcon" variant="outline" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Pattern Type */}
          <div>
            <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
              Pattern Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="patternType"
                  value="daily"
                  checked={pattern.type === 'daily'}
                  onChange={(e) => setPattern({ ...pattern, type: 'daily' })}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-text-primary">Daily</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="patternType"
                  value="weekly"
                  checked={pattern.type === 'weekly'}
                  onChange={(e) => setPattern({ ...pattern, type: 'weekly' })}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-text-primary">Weekly</span>
              </label>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={pattern.startDate}
                onChange={(e) => {
                  setPattern({ ...pattern, startDate: e.target.value });
                  setErrors((prev) => ({ ...prev, startDate: undefined }));
                }}
                min={today}
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.startDate && (
                <p className="text-error text-sm mt-1">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={pattern.endDate}
                onChange={(e) => {
                  setPattern({ ...pattern, endDate: e.target.value });
                  setErrors((prev) => ({ ...prev, endDate: undefined }));
                }}
                min={pattern.startDate || today}
                className="w-full px-4 py-2 border border-input rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.endDate && <p className="text-error text-sm mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Days of Week (for weekly pattern) */}
          {pattern.type === 'weekly' && (
            <div>
              <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
                Select Days *
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-4 py-2 rounded-md font-caption font-medium transition-smooth ${
                      pattern.selectedDays.includes(day.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-text-primary hover:bg-muted/80'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              {errors.days && <p className="text-error text-sm mt-1">{errors.days}</p>}
            </div>
          )}

          {/* Availability Status */}
          <div>
            <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
              Set As
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="available"
                  checked={pattern.status === 'available'}
                  onChange={(e) => setPattern({ ...pattern, status: 'available' })}
                  className="w-4 h-4 text-success focus:ring-success"
                />
                <span className="text-text-primary flex items-center gap-2">
                  <Icon name="CheckCircleIcon" variant="solid" size={16} className="text-success" />
                  Available
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="unavailable"
                  checked={pattern.status === 'unavailable'}
                  onChange={(e) => setPattern({ ...pattern, status: 'unavailable' })}
                  className="w-4 h-4 text-error focus:ring-error"
                />
                <span className="text-text-primary flex items-center gap-2">
                  <Icon name="XCircleIcon" variant="solid" size={16} className="text-error" />
                  Unavailable
                </span>
              </label>
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-muted rounded-md p-4">
            <h3 className="font-caption font-semibold text-text-primary mb-2 flex items-center gap-2">
              <Icon name="InformationCircleIcon" variant="outline" size={20} className="text-primary" />
              Pattern Preview
            </h3>
            <p className="text-sm text-text-secondary">
              {pattern.type === 'daily' ? (
                <>
                  This will set <strong>every day</strong> from {pattern.startDate} to{' '}
                  {pattern.endDate} as <strong>{pattern.status}</strong>.
                </>
              ) : (
                <>
                  This will set{' '}
                  <strong>
                    {pattern.selectedDays.length > 0
                      ? pattern.selectedDays
                          .sort((a, b) => a - b)
                          .map((d) => daysOfWeek.find((day) => day.value === d)?.label)
                          .join(', ')
                      : 'no days'}
                  </strong>{' '}
                  from {pattern.startDate} to {pattern.endDate} as <strong>{pattern.status}</strong>.
                </>
              )}
            </p>
            <p className="text-xs text-text-secondary mt-2">
              Note: Dates with existing bookings will not be affected.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-muted text-text-primary rounded-md font-caption font-medium hover:bg-muted/80 transition-smooth"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-caption font-medium hover:bg-primary/90 transition-smooth"
            >
              Apply Pattern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringPatternModal;