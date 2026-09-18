'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface BookingFiltersProps {
  statusFilter: string;
  accommodationFilter: string;
  searchQuery: string;
  dateFrom: string;
  dateTo: string;
  statusOptions: FilterOption[];
  accommodationOptions: FilterOption[];
  onStatusChange: (value: string) => void;
  onAccommodationChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClearFilters: () => void;
}

const BookingFilters = ({
  statusFilter,
  accommodationFilter,
  searchQuery,
  dateFrom,
  dateTo,
  statusOptions,
  accommodationOptions,
  onStatusChange,
  onAccommodationChange,
  onSearchChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
}: BookingFiltersProps) => {
  const hasActiveFilters =
    statusFilter !== 'all' ||
    accommodationFilter !== 'all' ||
    searchQuery !== '' ||
    dateFrom !== '' ||
    dateTo !== '';

  return (
    <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-hospitality-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-lg text-text-primary">
          Filtriraj rezervacije
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 px-3 py-2 text-sm font-caption font-medium text-text-secondary hover:text-primary transition-smooth"
          >
            <Icon name="XMarkIcon" variant="outline" size={16} />
            Počisti vse
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Search Input */}
        <div className="sm:col-span-2 lg:col-span-2 min-w-0">
          <label
            htmlFor="search"
            className="block text-sm font-caption font-medium text-text-secondary mb-2"
          >
            Iskanje gosta
          </label>
          <div className="relative">
            <Icon
              name="MagnifyingGlassIcon"
              variant="outline"
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Iščite po imenu ali e-pošti..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-md text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="min-w-0 lg:col-span-1">
          <label
            htmlFor="status"
            className="block text-sm font-caption font-medium text-text-secondary mb-2"
          >
            Status
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth appearance-none cursor-pointer"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
                {option.count !== undefined && ` (${option.count})`}
              </option>
            ))}
          </select>
        </div>

        {/* Accommodation Filter */}
        <div className="min-w-0 lg:col-span-1">
          <label
            htmlFor="accommodation"
            className="block text-sm font-caption font-medium text-text-secondary mb-2"
          >
            Nastanitev
          </label>
          <select
            id="accommodation"
            value={accommodationFilter}
            onChange={(e) => onAccommodationChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth appearance-none cursor-pointer"
          >
            {accommodationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range — 2 lg columns so native date pickers don’t clip the card */}
        <div className="sm:col-span-2 lg:col-span-2 min-w-0">
          <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
            Časovno obdobje
          </label>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="w-full min-w-0 shrink px-3 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth text-sm"
            />
            <span className="hidden text-text-secondary sm:inline shrink-0">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="w-full min-w-0 shrink px-3 py-2.5 bg-background border border-input rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-smooth text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingFilters;