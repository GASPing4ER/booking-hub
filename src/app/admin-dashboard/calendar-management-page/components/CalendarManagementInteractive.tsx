'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import RecurringPatternModal from './RecurringPatternModal';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Property {
  id: string;
  name: string;
  type: string;
}

interface DateAvailability {
  date: string;
  propertyId: string;
  status: 'available' | 'unavailable' | 'booked';
}

const CalendarManagementInteractive = () => {
  const { user } = useAuth();
  const supabase = createClient();
  const [isHydrated, setIsHydrated] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availabilityData, setAvailabilityData] = useState<DateAvailability[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [undoStack, setUndoStack] = useState<DateAvailability[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || !user) return;
    fetchProperties();
    fetchAvailability();
  }, [isHydrated, user]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, type')
        .eq('owner_id', user?.id)
        .order('name');

      if (error) throw error;

      setProperties(data || []);
    } catch (error: any) {
      console.error('Error fetching properties:', error.message);
    }
  };

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const { data: propData } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user?.id);

      const propertyIds = propData?.map((p) => p.id) || [];

      if (propertyIds.length === 0) {
        setAvailabilityData([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .in('property_id', propertyIds)
        .gte('date', new Date().toISOString().split('T')[0]);

      if (error) throw error;

      const formattedData: DateAvailability[] = (data || []).map((item: any) => ({
        date: item.date,
        propertyId: item.property_id,
        status: item.status,
      }));

      setAvailabilityData(formattedData);
    } catch (error: any) {
      console.error('Error fetching availability:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getDateStatus = (dateStr: string, propertyId: string) => {
    const availability = availabilityData.find(
      (a) => a.date === dateStr && a.propertyId === propertyId
    );
    return availability?.status || 'available';
  };

  const getDateStatusForAll = (dateStr: string) => {
    const statuses = properties.map((p) => getDateStatus(dateStr, p.id));
    if (statuses.every((s) => s === 'available')) return 'available';
    if (statuses.every((s) => s === 'unavailable')) return 'unavailable';
    if (statuses.some((s) => s === 'booked')) return 'booked';
    return 'partial';
  };

  const handleDateClick = (dateStr: string) => {
    if (!isSelectionMode) {
      toggleDateAvailability(dateStr);
    } else {
      // In selection mode, toggle date selection (but not if it's booked)
      const targetProperties =
        selectedProperty === 'all' ? properties.map((p) => p.id) : [selectedProperty];
      
      // Check if any of the target properties have this date as booked
      const isBooked = targetProperties.some(
        (propId) => getDateStatus(dateStr, propId) === 'booked'
      );
      
      if (isBooked) return; // Don't allow selecting booked dates
      
      setSelectedDates((prev) => {
        if (prev.includes(dateStr)) {
          return prev.filter((d) => d !== dateStr);
        } else {
          return [...prev, dateStr];
        }
      });
    }
  };

  const toggleDateAvailability = async (dateStr: string) => {
    setUndoStack((prev) => [...prev, [...availabilityData]]);

    const targetProperties =
      selectedProperty === 'all' ? properties.map((p) => p.id) : [selectedProperty];

    try {
      for (const propId of targetProperties) {
        const currentStatus = getDateStatus(dateStr, propId);
        if (currentStatus === 'booked') continue;

        const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';

        const { error } = await supabase
          .from('availability')
          .upsert(
            {
              property_id: propId,
              date: dateStr,
              status: newStatus,
            },
            { onConflict: 'property_id,date' }
          );

        if (error) throw error;
      }

      await fetchAvailability();
    } catch (error: any) {
      console.error('Error updating availability:', error.message);
    }
  };

  const getDatesBetween = (start: string, end: string): string[] => {
    const dates: string[] = [];
    const currentDate = new Date(start);
    const endDateObj = new Date(end);

    while (currentDate <= endDateObj) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  const handleBulkSetAvailability = async (status: 'available' | 'unavailable') => {
    if (selectedDates.length === 0) return;

    setUndoStack((prev) => [...prev, [...availabilityData]]);

    const targetProperties =
      selectedProperty === 'all' ? properties.map((p) => p.id) : [selectedProperty];

    try {
      const updates = [];
      for (const date of selectedDates) {
        for (const propId of targetProperties) {
          // Skip if date is booked for this property
          if (getDateStatus(date, propId) === 'booked') continue;
          
          updates.push({
            property_id: propId,
            date,
            status,
          });
        }
      }

      const { error } = await supabase
        .from('availability')
        .upsert(updates, { onConflict: 'property_id,date' });

      if (error) throw error;

      await fetchAvailability();
      setSelectedDates([]);
      setIsSelectionMode(false);
    } catch (error: any) {
      console.error('Error bulk updating availability:', error.message);
    }
  };

  const handleApplyRecurringPattern = async (pattern: any) => {
    const targetProperties =
      selectedProperty === 'all' ? properties.map((p) => p.id) : [selectedProperty];

    try {
      const updates = [];
      const startDate = new Date(pattern.startDate);
      const endDate = new Date(pattern.endDate);
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        const dayName = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ][dayOfWeek];

        if (pattern.daysOfWeek[dayName]) {
          const dateStr = currentDate.toISOString().split('T')[0];
          for (const propId of targetProperties) {
            updates.push({
              property_id: propId,
              date: dateStr,
              status: pattern.status,
            });
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      const { error } = await supabase
        .from('availability')
        .upsert(updates, { onConflict: 'property_id,date' });

      if (error) throw error;

      await fetchAvailability();
      setShowRecurringModal(false);
    } catch (error: any) {
      console.error('Error applying recurring pattern:', error.message);
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setAvailabilityData(previousState);
    setUndoStack((prev) => prev.slice(0, -1));
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isDateInRange = (dateStr: string): boolean => {
    return selectedDates.includes(dateStr);
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const days = [];
    const today = new Date().toISOString().split('T')[0];

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isPast = dateStr < today;
      const isInRange = isDateInRange(dateStr);
      
      let status = selectedProperty === 'all' ? getDateStatusForAll(dateStr) : getDateStatus(dateStr, selectedProperty);

      let bgColor = 'bg-white';
      let borderColor = 'border-border';
      let textColor = 'text-text-primary';

      if (isPast) {
        bgColor = 'bg-muted';
        textColor = 'text-text-secondary';
      } else if (status === 'available') {
        bgColor = 'bg-success/10';
        borderColor = 'border-success';
      } else if (status === 'unavailable') {
        bgColor = 'bg-error/10';
        borderColor = 'border-error';
      } else if (status === 'booked') {
        bgColor = 'bg-warning/10';
        borderColor = 'border-warning';
      } else if (status === 'partial') {
        bgColor = 'bg-accent/10';
        borderColor = 'border-accent';
      }

      if (isInRange) {
        bgColor = 'bg-primary/20';
        borderColor = 'border-primary';
      }

      days.push(
        <div
          key={dateStr}
          className={`aspect-square border ${borderColor} ${bgColor} rounded-md p-2 cursor-pointer transition-smooth hover:shadow-md ${isPast ? 'cursor-not-allowed opacity-60' : ''}`}
          onClick={() => !isPast && handleDateClick(dateStr)}
        >
          <div className={`text-sm font-caption font-medium ${textColor}`}>{day}</div>
          {!isPast && status === 'booked' && (
            <div className="mt-1">
              <Icon name="LockClosedIcon" variant="solid" size={12} className="text-warning" />
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading calendar...</div>
      </div>
    );
  }

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Property Selection and Controls */}
      <div className="bg-card rounded-lg border border-border shadow-hospitality-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-caption font-medium text-text-secondary mb-2">
              Select Property
            </label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full lg:w-auto px-4 py-2 border border-input rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) {
                  setSelectedDates([]);
                }
              }}
              className={`px-4 py-2 rounded-md font-caption font-medium transition-smooth ${
                isSelectionMode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-text-primary hover:bg-muted/80'
              }`}
            >
              <Icon name="CalendarIcon" variant="outline" size={16} className="inline mr-2" />
              {isSelectionMode ? 'Exit Selection' : 'Bulk Select'}
            </button>

            <button
              onClick={() => setShowRecurringModal(true)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-caption font-medium hover:bg-secondary/90 transition-smooth"
            >
              <Icon name="ArrowPathIcon" variant="outline" size={16} className="inline mr-2" />
              Recurring Pattern
            </button>

            {undoStack.length > 0 && (
              <button
                onClick={handleUndo}
                className="px-4 py-2 bg-muted text-text-primary rounded-md font-caption font-medium hover:bg-muted/80 transition-smooth"
              >
                <Icon name="ArrowUturnLeftIcon" variant="outline" size={16} className="inline mr-2" />
                Undo
              </button>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-success/10 border border-success rounded" />
            <span className="text-text-secondary">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-error/10 border border-error rounded" />
            <span className="text-text-secondary">Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-warning/10 border border-warning rounded flex items-center justify-center">
              <Icon name="LockClosedIcon" variant="solid" size={10} className="text-warning" />
            </div>
            <span className="text-text-secondary">Booked (locked - cannot be changed)</span>
          </div>
          {selectedProperty === 'all' && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-accent/10 border border-accent rounded" />
              <span className="text-text-secondary">Partial (mixed availability across properties)</span>
            </div>
          )}
        </div>
      </div>

      {/* Date Selection Panel */}
      {isSelectionMode && (
        <div className="bg-primary/5 border border-primary rounded-lg p-4">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-caption font-semibold text-text-primary mb-2">
                Click on days to select them
              </h3>
              <p className="text-sm text-text-secondary">
                Click individual days on the calendar to select them. Booked days cannot be selected.
              </p>
            </div>

            {selectedDates.length > 0 && (
              <div>
                <p className="text-sm text-text-secondary mb-3">
                  {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkSetAvailability('available')}
                    className="px-4 py-2 bg-success text-success-foreground rounded-md font-caption font-medium hover:bg-success/90 transition-smooth"
                  >
                    <Icon name="CheckCircleIcon" variant="solid" size={16} className="inline mr-2" />
                    Set Available
                  </button>
                  <button
                    onClick={() => handleBulkSetAvailability('unavailable')}
                    className="px-4 py-2 bg-error text-error-foreground rounded-md font-caption font-medium hover:bg-error/90 transition-smooth"
                  >
                    <Icon name="XCircleIcon" variant="solid" size={16} className="inline mr-2" />
                    Set Unavailable
                  </button>
                  <button
                    onClick={() => setSelectedDates([])}
                    className="px-4 py-2 bg-muted text-text-primary rounded-md font-caption font-medium hover:bg-muted/80 transition-smooth"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-card rounded-lg border border-border shadow-hospitality-md p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousMonth}
            className="p-2 rounded-md hover:bg-muted transition-smooth"
            aria-label="Previous month"
          >
            <Icon name="ChevronLeftIcon" variant="outline" size={24} className="text-text-primary" />
          </button>
          <h2 className="font-heading font-semibold text-2xl text-text-primary">{monthName}</h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-md hover:bg-muted transition-smooth"
            aria-label="Next month"
          >
            <Icon name="ChevronRightIcon" variant="outline" size={24} className="text-text-primary" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-caption font-medium text-text-secondary text-sm py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {renderCalendar()}
        </div>
      </div>

      {/* Recurring Pattern Modal */}
      {showRecurringModal && (
        <RecurringPatternModal
          onClose={() => setShowRecurringModal(false)}
          onApply={handleApplyRecurringPattern}
        />
      )}
    </div>
  );
};

export default CalendarManagementInteractive;