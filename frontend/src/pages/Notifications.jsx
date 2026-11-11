import { useState, useEffect } from 'react';
import {
  IconBell,
  IconCheck,
  IconChecklist,
  IconCalendarCheck,
  IconCalendarX,
  IconCalendarEvent,
  IconClock,
  IconAlertCircle,
  IconInfoCircle,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications';
import { useAuth } from '../hooks/useAuth';

const NOTIFICATION_ICONS = {
  leave_approved: IconCalendarCheck,
  leave_rejected: IconCalendarX,
  leave_request: IconCalendarEvent,
  attendance_reminder: IconClock,
  general: IconInfoCircle,
};

function getNotificationIcon(type) {
  return NOTIFICATION_ICONS[type] || IconBell;
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const sec = Math.floor((now - d) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [markingAll, setMarkingAll] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await listNotifications({
        unreadOnly: filter === 'unread',
      });
      setItems(res.items || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function handleMarkRead(id) {
    try {
      await markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (_e) {
      // ignore
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (_e) {
      setError('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-military-pale/60">
            Command
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-50">Notifications</h2>
          <p className="mt-1 text-sm text-slate-400">
            Stay updated with leave approvals, reminders, and more.
          </p>
        </div>

        {/* Actions + Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-slate-800/50 p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  filter === key
                    ? 'bg-military-base text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-2.5 text-xs font-semibold text-military-pale transition hover:border-military-base/50 hover:bg-slate-800/70 disabled:opacity-50"
            >
              {markingAll ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-military-pale border-t-transparent" />
              ) : (
                <IconChecklist className="h-4 w-4" />
              )}
              Mark all read
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            <IconAlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-military-base border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500">Loading notifications…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <IconBell className="h-14 w-14 text-slate-700" strokeWidth={1.2} />
            <p className="mt-4 text-base font-medium text-slate-400">
              No notifications
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {filter === 'unread'
                ? 'You have no unread notifications.'
                : 'You are all caught up.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((n) => {
              const Icon = getNotificationIcon(n.type);
              const Wrapper = n.isRead ? 'div' : CardSpotlight;
              const wrapperProps = n.isRead ? {} : { spotlightColor: 'rgba(59,130,246,0.12)' };

              return (
                <Wrapper
                  key={n.id}
                  className={
                    n.isRead
                      ? 'rounded-2xl border border-slate-800/80 bg-slate-900/50 px-5 py-4'
                      : 'cursor-pointer px-5 py-4'
                  }
                  {...wrapperProps}
                >
                  <button
                    type="button"
                    onClick={() => !n.isRead && handleMarkRead(n.id)}
                    className="flex w-full items-start gap-4 text-left"
                  >
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800/80">
                      <Icon className="h-5 w-5 text-military-pale" strokeWidth={1.6} />
                      {!n.isRead && (
                        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-slate-900" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-100">{n.title}</p>
                      <p className="mt-0.5 text-sm text-slate-400 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="mt-2 text-xs text-slate-600">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <IconCheck className="h-4 w-4 shrink-0 text-slate-500" />
                    )}
                  </button>
                </Wrapper>
              );
            })}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
