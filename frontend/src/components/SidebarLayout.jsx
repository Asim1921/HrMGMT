import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Sidebar, SidebarBody, SidebarLink, SidebarNavContext } from './ui/sidebar';
import { useAuth } from '../hooks/useAuth';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { getUnreadCount } from '../api/notifications';
import {
  IconLayoutDashboard,
  IconCalendarCheck,
  IconCalendarStats,
  IconUsersGroup,
  IconReportAnalytics,
  IconFlag3,
  IconLogout,
  IconBell,
  IconSpeakerphone,
  IconCalendarEvent,
  IconShieldLock,
  IconFileText,
  IconChecklist,
  IconCalendar,
  IconSun,
  IconMoon,
  IconMessageCircle,
  IconMenu2,
} from '@tabler/icons-react';
import { useTheme } from '../contexts/ThemeContext';
import { getChatUnreadCount } from '../api/chat';

const SIDEBAR_STORAGE_KEY = '101hrmgmt-sidebar-open';

function getInitialSidebarOpen() {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) !== 'false';
  } catch {
    return true;
  }
}

function UserAvatar({ user, size = 'h-9 w-9', textSize = 'text-sm' }) {
  if (user?.profilePicture) {
    return (
      <img
        src={`${user.profilePicture}?v=${user.updatedAt || ''}`}
        alt={user.fullName}
        className={`${size} rounded-full object-cover ring-2 ring-military-base/50`}
      />
    );
  }
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-military-base to-military-light flex items-center justify-center ${textSize} font-semibold text-military-pale shadow-lg ring-2 ring-military-base/50`}>
      {user?.fullName?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800/70 hover:text-slate-200"
    >
      {theme === 'dark' ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
      <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  );
}

export function SidebarLayout({ children }) {
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [desktopOpen, setDesktopOpenState] = useState(getInitialSidebarOpen);
  const [mobileOpen, setMobileOpen] = useState(false);

  const setDesktopOpen = (value) => {
    setDesktopOpenState(value);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value));
    } catch (_) {}
  };

  const { user, isAdmin, isSuperAdmin, isFieldUser } = useAuth();
  const location = useLocation();

  const sidebarOpen = isMobile ? mobileOpen : desktopOpen;
  const setSidebarOpen = isMobile ? setMobileOpen : setDesktopOpen;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobile && mobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isMobile, mobileOpen]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  useEffect(() => {
    let mounted = true;
    async function poll() {
      try { const d = await getUnreadCount(); if (mounted) setUnreadCount(d.count || 0); } catch (_) {}
      try { const c = await getChatUnreadCount(); if (mounted) setChatUnread(c.count || 0); } catch (_) {}
    }
    poll();
    const iv = setInterval(poll, 30000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  const baseLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: <IconLayoutDashboard className="h-4 w-4" /> },
    { label: 'Announcements', href: '/announcements', icon: <IconSpeakerphone className="h-4 w-4" /> },
    ...(isFieldUser ? [
      { label: 'Mark Attendance', href: '/attendance/mark', icon: <IconFlag3 className="h-4 w-4" /> },
      { label: 'My Attendance', href: '/attendance/history', icon: <IconCalendarCheck className="h-4 w-4" /> },
      { label: 'My Leave', href: '/leaves/my-requests', icon: <IconCalendarStats className="h-4 w-4" /> },
    ] : []),
    { label: 'Leave Calendar', href: '/leave-calendar', icon: <IconCalendar className="h-4 w-4" /> },
    { label: 'Documents', href: '/documents', icon: <IconFileText className="h-4 w-4" /> },
    { label: 'Tasks', href: '/tasks', icon: <IconChecklist className="h-4 w-4" /> },
    { label: 'Chat', href: '/chat', icon: <IconMessageCircle className="h-4 w-4" />, badge: chatUnread },
  ];

  const adminLinks = [
    { label: 'Approvals', href: '/leaves/approvals', icon: <IconFlag3 className="h-4 w-4" /> },
    { label: 'Team Attendance', href: '/attendance/team', icon: <IconUsersGroup className="h-4 w-4" /> },
    { label: 'Reports', href: '/reports', icon: <IconReportAnalytics className="h-4 w-4" /> },
    { label: 'Holidays', href: '/holidays', icon: <IconCalendarEvent className="h-4 w-4" /> },
  ];

  const superAdminLinks = [
    { label: 'Users', href: '/users/list', icon: <IconUsersGroup className="h-4 w-4" /> },
    { label: 'Audit Log', href: '/audit', icon: <IconShieldLock className="h-4 w-4" /> },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      {isMobile && mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}

      <SidebarNavContext.Provider value={isMobile ? () => setMobileOpen(false) : null}>
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} isMobile={isMobile}>
          <SidebarBody>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden sidebar-scroll">
            <div className="mt-2 flex flex-col gap-1">
              {baseLinks.map((link) => (
                <SidebarLink key={link.href} link={link} />
              ))}
            </div>
            {(isAdmin || isSuperAdmin) && (
              <div className="mt-6 border-t border-slate-800/80 pt-4">
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Command
                </p>
                <div className="flex flex-col gap-1">
                  {adminLinks.map((link) => (
                    <SidebarLink key={link.href} link={link} />
                  ))}
                  {isSuperAdmin &&
                    superAdminLinks.map((link) => <SidebarLink key={link.href} link={link} />)}
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 space-y-2 border-t border-slate-800/80 pt-3">
            <Link
              to="/profile"
              onClick={() => isMobile && setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-800/70"
            >
              <UserAvatar user={user} />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-slate-50 truncate">
                  {user?.fullName || 'Officer'}
                </span>
                <span className="text-[11px] uppercase tracking-wide text-military-pale/80">
                  {user?.role} &middot; {user?.unit || 'HQ'}
                </span>
              </div>
            </Link>
            <ThemeToggle />
            <SidebarLink
              link={{
                label: 'Logout',
                href: '/logout',
                icon: <IconLogout className="h-4 w-4" />,
              }}
            />
          </div>
        </SidebarBody>
        </Sidebar>
      </SidebarNavContext.Provider>

      <div
        className={`relative flex min-h-screen flex-1 flex-col ml-0 transition-[margin] duration-300 ${desktopOpen ? 'lg:ml-64' : 'lg:ml-20'}`}
        style={{ background: 'var(--th-gradient-page)' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at top, var(--th-gradient-glow-top), transparent 55%), radial-gradient(circle at bottom, var(--th-gradient-glow-bot), transparent 55%)`,
          }}
        />
        <div className="relative flex-1 px-4 py-5 sm:px-6 sm:py-6 md:px-10 md:py-8">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800/80 bg-slate-900/70 text-slate-300 transition hover:border-military-base/50 hover:bg-slate-800/70 lg:hidden"
                aria-label="Open menu"
              >
                <IconMenu2 className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-military-pale/70">
                  101 Cyber Div
                </p>
                <h1 className="mt-1 text-xl font-semibold text-slate-50 sm:mt-2 sm:text-2xl">
                  {location.pathname === '/dashboard' ? 'Operations Overview' : location.pathname === '/profile' ? 'My Profile' : 'Command Panel'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/notifications" className="relative rounded-xl border border-slate-800/80 bg-slate-900/70 p-2.5 transition hover:border-military-base/50 hover:bg-slate-800/70 sm:p-3">
              <IconBell className="h-5 w-5 text-slate-400" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <Link to="/profile" className="flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/70 px-2.5 py-2 transition hover:border-military-base/50 hover:bg-slate-800/70 sm:gap-4 sm:px-4 sm:py-3">
              <div className="hidden flex-col text-right sm:flex">
                <span className="text-xs uppercase tracking-wide text-slate-400">Signed in as</span>
                <span className="text-sm font-medium text-slate-50">
                  {user?.fullName || 'Officer'}
                </span>
              </div>
              <div className="hidden h-9 w-px bg-slate-800 sm:block" />
              <UserAvatar user={user} />
            </Link>
            </div>
          </header>

          <div className="relative">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
