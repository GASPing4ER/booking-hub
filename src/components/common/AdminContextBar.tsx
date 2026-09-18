'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AdminContextBarProps {
  providerSlug: string;
  providerName: string;
  adminName: string;
  adminEmail: string;
  onLogout?: () => void;
  /** Matches `main` max-width below so vertical edges align (default dashboards). */
  contentMaxWidth?: '7xl' | '5xl';
}

interface Notification {
  id: string;
  type: 'new_booking' | 'cancellation';
  guestName: string;
  propertyName: string;
  createdAt: string;
  read: boolean;
}

const AdminContextBar = ({
  providerSlug,
  providerName,
  adminName,
  adminEmail,
  onLogout,
  contentMaxWidth = '7xl',
}: AdminContextBarProps) => {
  const { user } = useAuth();
  const supabase = createClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [propertyIds, setPropertyIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Load provider property IDs
  useEffect(() => {
    if (!user) return;
    const loadPropertyIds = async () => {
      const { data } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user.id);
      setPropertyIds((data || []).map((p: any) => p.id));
    };
    loadPropertyIds();
  }, [user]);

  // Load recent notifications (last 20 bookings/cancellations in past 7 days)
  const loadNotifications = useCallback(async () => {
    if (propertyIds.length === 0) return;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data } = await supabase
      .from('bookings')
      .select('id, guest_name, status, created_at, status_updated_at, properties(name)')
      .in('property_id', propertyIds)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (!data) return;

    const readIds: string[] = JSON.parse(
      typeof window !== 'undefined' ? localStorage.getItem('bh_read_notifs') || '[]' : '[]'
    );

    const notifs: Notification[] = data.map((b: any) => ({
      id: b.id,
      type: b.status === 'cancelled' ? 'cancellation' : 'new_booking',
      guestName: b.guest_name,
      propertyName: b.properties?.name || 'Neznano',
      createdAt: b.created_at,
      read: readIds.includes(b.id),
    }));

    setNotifications(notifs);
  }, [propertyIds]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Supabase Realtime subscription for new bookings
  useEffect(() => {
    if (propertyIds.length === 0) return;

    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          const booking = payload.new as any;
          if (!propertyIds.includes(booking.property_id)) return;
          // Reload to get property name
          loadNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          const booking = payload.new as any;
          if (!propertyIds.includes(booking.property_id)) return;
          if (booking.status === 'cancelled') {
            loadNotifications();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyIds, loadNotifications]);

  const markAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bh_read_notifs', JSON.stringify(allIds));
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    if (onLogout) onLogout();
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'pravkar';
    if (mins < 60) return `pred ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `pred ${hrs} h`;
    return `pred ${Math.floor(hrs / 24)} d`;
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const innerWidth =
    contentMaxWidth === '5xl' ? 'max-w-5xl' : 'max-w-7xl';

  return (
    <header className="w-full bg-card border-b border-border shadow-hospitality-sm">
      <div
        className={`mx-auto flex w-full ${innerWidth} items-center justify-between px-4 sm:px-6 lg:px-8 py-4`}
      >
        {/* Left Section - Provider Context */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
            <Icon name="BuildingOfficeIcon" variant="outline" size={20} className="text-primary" />
            <span className="font-caption font-medium text-text-primary">{providerName}</span>
          </div>
          <span className="sm:hidden font-caption font-medium text-text-primary">{providerName}</span>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                if (!isNotifOpen) markAllRead();
              }}
              className="relative w-10 h-10 rounded-md flex items-center justify-center text-text-secondary hover:bg-muted hover:text-primary transition-smooth"
              aria-label="Obvestila"
            >
              <Icon name="BellIcon" variant="outline" size={24} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-error rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-md shadow-hospitality-md z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="font-caption font-semibold text-text-primary text-sm">Obvestila</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary hover:underline font-caption"
                    >
                      Označi vse kot prebrano
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Icon name="BellSlashIcon" variant="outline" size={32} className="text-text-secondary mx-auto mb-2" />
                      <p className="text-sm text-text-secondary font-caption">Ni nedavnih obvestil</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 transition-smooth ${
                          !notif.read ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            notif.type === 'new_booking' ?'bg-success/10' :'bg-error/10'
                          }`}
                        >
                          <Icon
                            name={notif.type === 'new_booking' ? 'CalendarIcon' : 'XCircleIcon'}
                            variant="outline"
                            size={16}
                            className={notif.type === 'new_booking' ? 'text-success' : 'text-error'}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-caption font-medium text-text-primary leading-snug">
                            {notif.type === 'new_booking' ? 'Nova rezervacija' : 'Rezervacija preklicana'}
                          </p>
                          <p className="text-xs text-text-secondary font-caption truncate">
                            {notif.guestName} · {notif.propertyName}
                          </p>
                          <p className="text-xs text-text-secondary font-caption mt-0.5">
                            {formatRelativeTime(notif.createdAt)}
                          </p>
                        </div>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-3 border-t border-border">
                  <Link
                    href="/admin-dashboard/bookings"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-xs text-primary hover:underline font-caption"
                  >
                    Poglej vse rezervacije →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-smooth"
              aria-label="Uporabniški meni"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="font-caption font-medium text-primary-foreground text-sm">
                  {adminName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="font-caption font-medium text-text-primary text-sm">{adminName}</span>
                <span className="font-caption text-xs text-text-secondary">Skrbnik</span>
              </div>
              <Icon
                name="ChevronDownIcon"
                variant="outline"
                size={20}
                className={`text-text-secondary transition-smooth ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-popover border border-border rounded-md shadow-hospitality-md z-50 overflow-hidden">
                <div className="p-4 border-b border-border">
                  <p className="font-caption font-medium text-text-primary">{adminName}</p>
                  <p className="font-caption text-sm text-text-secondary mt-1">{adminEmail}</p>
                </div>

                <div className="py-2">
                  <Link
                    href="/admin-dashboard/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth"
                  >
                    <Icon name="UserIcon" variant="outline" size={20} />
                    <span className="font-caption font-medium">Profil</span>
                  </Link>

                  <Link
                    href="/admin-dashboard/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:bg-muted hover:text-text-primary transition-smooth"
                  >
                    <Icon name="CogIcon" variant="outline" size={20} />
                    <span className="font-caption font-medium">Nastavitve</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-muted transition-smooth"
                  >
                    <Icon name="ArrowRightOnRectangleIcon" variant="outline" size={20} />
                    <span className="font-caption font-medium">Odjava</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminContextBar;