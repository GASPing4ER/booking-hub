'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

/**
 * Canonical App Router paths for admin (must match folders under src/app/).
 */
const ADMIN_BASE = '/admin-dashboard';

interface AdminSidebarProps {
  isCollapsed?: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const AdminSidebar = ({
  isCollapsed = false,
}: AdminSidebarProps) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      label: 'Nadzorna plošča',
      path: ADMIN_BASE,
      icon: 'ChartBarIcon',
    },
    {
      label: 'Upravljanje rezervacij',
      path: `${ADMIN_BASE}/bookings`,
      icon: 'CalendarIcon',
    },
    {
      label: 'Nepremičnine',
      path: `${ADMIN_BASE}/properties`,
      icon: 'HomeIcon',
    },
    {
      label: 'Koledar',
      path: `${ADMIN_BASE}/calendar-management-page`,
      icon: 'CalendarDaysIcon',
    },
    {
      label: 'Poročila',
      path: `${ADMIN_BASE}/reports`,
      icon: 'ChartPieIcon',
    },
    {
      label: 'Nastavitve',
      path: `${ADMIN_BASE}/settings`,
      icon: 'CogIcon',
    },
  ];

  const isActiveRoute = (path: string) => {
    if (path === ADMIN_BASE) {
      return pathname === ADMIN_BASE || pathname === `${ADMIN_BASE}/`;
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <div className="flex-shrink-0">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-200 w-10 h-10 bg-card rounded-md shadow-hospitality flex items-center justify-center transition-smooth hover:bg-muted"
        aria-label="Preklopi meni"
      >
        <Icon
          name={mobileOpen ? 'XMarkIcon' : 'Bars3Icon'}
          variant="outline"
          size={24}
          className="text-text-primary"
        />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[90] bg-background/80 backdrop-blur-sm"
          aria-hidden="true"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Spacer BEFORE fixed aside so it can't stack on top of nav and block clicks */}
      <div
        className={`pointer-events-none hidden shrink-0 transition-all duration-250 ease-smooth lg:block ${
          collapsed ? 'w-20 min-h-screen' : 'w-64 min-h-screen'
        }`}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-[110] flex h-full flex-col bg-card border-r border-border
          transition-all duration-250 ease-smooth
          ${collapsed ? 'w-20' : 'w-64'}
          ${
            mobileOpen
              ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }
        `}
      >
          {/* Logo Section */}
          <div className="border-b border-border p-6">
            <Link
              href={ADMIN_BASE}
              className="group flex items-center gap-3"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary">
                <Icon
                  name="BuildingOfficeIcon"
                  variant="solid"
                  size={24}
                  className="text-primary-foreground"
                />
              </div>
              {!collapsed && (
                <span className="font-heading text-lg font-semibold text-text-primary transition-smooth group-hover:text-primary">
                  BookingHub
                </span>
              )}
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-3 py-6">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = isActiveRoute(item.path);

                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      prefetch={true}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex items-center gap-3 rounded-md px-3 py-3 transition-smooth group
                        ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-text-secondary hover:bg-muted hover:text-text-primary'
                        }
                      `}
                    >
                      <Icon
                        name={item.icon as any}
                        variant={isActive ? 'solid' : 'outline'}
                        size={24}
                        className={`flex-shrink-0 ${
                          isActive
                            ? 'text-primary-foreground'
                            : 'text-text-secondary group-hover:text-text-primary'
                        }`}
                      />
                      {!collapsed && (
                        <span className="font-caption font-medium">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Collapse Toggle - Desktop Only */}
          <div className="hidden border-t border-border p-3 lg:block">
            <button
              type="button"
              onClick={toggleCollapse}
              className="flex w-full items-center justify-center gap-3 rounded-md px-3 py-3 text-text-secondary transition-smooth hover:bg-muted hover:text-text-primary"
              aria-label={collapsed ? 'Razširi stransko vrstico' : 'Strni stransko vrstico'}
            >
              <Icon
                name={collapsed ? 'ChevronRightIcon' : 'ChevronLeftIcon'}
                variant="outline"
                size={24}
                className="text-text-secondary"
              />
              {!collapsed && (
                <span className="font-caption font-medium">Strni</span>
              )}
            </button>
          </div>
      </aside>
    </div>
  );
};

export default AdminSidebar;