import { useState, useEffect, useMemo } from 'react';
import {
  IconSearch,
  IconFilter,
  IconCalendarEvent,
  IconClock,
  IconUsers,
  IconCheck,
  IconAlertCircle,
  IconUser,
  IconBuildingFortress,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { getTeamAttendance } from '../api/attendance';
import { useAuth } from '../hooks/useAuth';

const STATUS_BADGE = {
  present: { label: 'Present', cls: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30' },
  absent:  { label: 'Absent',  cls: 'bg-red-500/15 text-red-400 ring-red-500/30' },
  leave:   { label: 'On Leave', cls: 'bg-amber-500/15 text-amber-400 ring-amber-500/30' },
  holiday: { label: 'Holiday', cls: 'bg-sky-500/15 text-sky-400 ring-sky-500/30' },
};

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(d) {
  return new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function TeamAttendance() {
  const { isSuperAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [dateRange, setDateRange] = useState(defaultRange);
  const [expandedDate, setExpandedDate] = useState(null);
  const [viewMode, setViewMode] = useState('byDate'); // 'byDate' | 'byUser'

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = { start: dateRange.start, end: dateRange.end };
      if (unitFilter) params.unit = unitFilter;
      const res = await getTeamAttendance(params);
      setRecords(res.items || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load team attendance');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [dateRange.start, dateRange.end, unitFilter]);

  const filtered = useMemo(() => {
    if (!search) return records;
    const q = search.toLowerCase();
    return records.filter((r) =>
      r.user?.fullName?.toLowerCase().includes(q) ||
      r.user?.employeeId?.toLowerCase().includes(q)
    );
  }, [records, search]);

  const stats = useMemo(() => {
    const uniqueUsers = new Set(filtered.map((r) => r.userId));
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRecords = filtered.filter((r) => r.date?.slice(0, 10) === todayStr);
    return {
      totalRecords: filtered.length,
      uniqueUsers: uniqueUsers.size,
      presentToday: todayRecords.filter((r) => r.status === 'present').length,
      absentToday: todayRecords.filter((r) => r.status !== 'present').length,
    };
  }, [filtered]);

  // Group by date
  const byDate = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      const d = r.date?.slice(0, 10) || 'unknown';
      if (!map[d]) map[d] = [];
      map[d].push(r);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  // Group by user
  const byUser = useMemo(() => {
    const map = {};
    filtered.forEach((r) => {
      const uid = r.userId;
      if (!map[uid]) map[uid] = { user: r.user, records: [] };
      map[uid].records.push(r);
    });
    return Object.values(map).sort((a, b) => a.user?.fullName?.localeCompare(b.user?.fullName || '') || 0);
  }, [filtered]);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-military-pale/60">Administration</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-50">Team Attendance</h2>
          <p className="mt-1 text-sm text-slate-400">Monitor attendance records across your personnel.</p>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Records', value: stats.totalRecords, color: 'text-slate-50' },
              { label: 'Personnel', value: stats.uniqueUsers, color: 'text-sky-400' },
              { label: 'Present Today', value: stats.presentToday, color: 'text-emerald-400' },
              { label: 'Absent Today', value: stats.absentToday, color: 'text-red-400' },
            ].map((s) => (
              <CardSpotlight key={s.label} className="px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{s.label}</p>
                <p className={`mt-0.5 text-xl font-extrabold ${s.color}`}>{s.value}</p>
              </CardSpotlight>
            ))}
          </div>
        )}

        {/* Filters row */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[180px] flex-1">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or ID\u2026"
              className="w-full rounded-xl border border-slate-700/60 bg-slate-800/40 py-2.5 pl-10 pr-4 text-sm text-slate-50 placeholder:text-slate-600 focus:border-military-base focus:outline-none focus:ring-1 focus:ring-military-base/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-600">From</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
                className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-xs text-slate-300 focus:border-military-base focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-600">To</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
                className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-xs text-slate-300 focus:border-military-base focus:outline-none"
              />
            </div>
            {isSuperAdmin && (
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-600">Unit</label>
                <select
                  value={unitFilter}
                  onChange={(e) => setUnitFilter(e.target.value)}
                  className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-xs text-slate-300 focus:border-military-base focus:outline-none"
                >
                  <option value="">All Units</option>
                  <option value="802 Grp">802 Grp</option>
                  <option value="803 Grp">803 Grp</option>
                  <option value="804 Grp">804 Grp</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-800/50 p-1 w-fit">
          {[
            { key: 'byDate', label: 'By Date', icon: IconCalendarEvent },
            { key: 'byUser', label: 'By Person', icon: IconUser },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                viewMode === key
                  ? 'bg-military-base text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
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
            <p className="mt-4 text-sm text-slate-500">Loading attendance\u2026</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <IconUsers className="h-14 w-14 text-slate-700" strokeWidth={1.2} />
            <p className="mt-4 text-base font-medium text-slate-400">No attendance records found</p>
            <p className="mt-1 text-sm text-slate-600">Try adjusting the date range or filters.</p>
          </div>
        ) : viewMode === 'byDate' ? (
          <div className="space-y-3">
            {byDate.map(([date, recs]) => {
              const isExpanded = expandedDate === date;
              const presentCount = recs.filter((r) => r.status === 'present').length;
              return (
                <CardSpotlight key={date} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedDate(isExpanded ? null : date)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-military-base/15">
                        <IconCalendarEvent className="h-5 w-5 text-military-pale" strokeWidth={1.6} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{formatDate(date)}</p>
                        <p className="text-xs text-slate-500">{recs.length} record{recs.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden items-center gap-3 sm:flex">
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                          <IconCheck className="h-3.5 w-3.5" /> {presentCount} present
                        </span>
                        {recs.length - presentCount > 0 && (
                          <span className="text-xs text-red-400">{recs.length - presentCount} other</span>
                        )}
                      </div>
                      {isExpanded ? <IconChevronUp className="h-4 w-4 text-slate-500" /> : <IconChevronDown className="h-4 w-4 text-slate-500" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-slate-800/40 px-5 pb-4 pt-3">
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {recs.map((r) => {
                          const badge = STATUS_BADGE[r.status] || STATUS_BADGE.present;
                          return (
                            <div key={r.id} className="flex items-center justify-between rounded-xl bg-slate-800/30 px-3 py-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-military-base to-military-light text-xs font-bold text-military-pale">
                                  {r.user?.fullName?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-slate-200">{r.user?.fullName}</p>
                                  <p className="truncate text-[10px] text-slate-600">
                                    {r.user?.unit || '\u2014'}{r.user?.employeeId ? ` \u00b7 ${r.user.employeeId}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-0.5 shrink-0 ml-2">
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ring-1 ${badge.cls}`}>
                                  {badge.label}
                                </span>
                                <span className="flex items-center gap-1 text-[10px] text-slate-600">
                                  <IconClock className="h-3 w-3" /> {formatTime(r.markedAt)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardSpotlight>
              );
            })}
          </div>
        ) : (
          /* By User view */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byUser.map(({ user, records: userRecords }) => {
              const working = userRecords.filter((r) => r.status !== 'holiday');
              const present = working.filter((r) => r.status === 'present').length;
              const pct = working.length ? Math.round((present / working.length) * 100) : 0;
              return (
                <CardSpotlight key={user?.id || Math.random()} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-military-base to-military-light text-sm font-bold text-military-pale ring-2 ring-slate-700/50">
                      {user?.fullName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">{user?.fullName}</p>
                      <p className="truncate text-[11px] text-slate-500">
                        {user?.unit || '\u2014'}{user?.employeeId ? ` \u00b7 ${user.employeeId}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Attendance bar */}
                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Attendance Rate</span>
                      <span className="text-xs font-bold text-slate-300">{pct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <span className="text-emerald-400">{present} present</span>
                    <span className="text-slate-600">{userRecords.length - present} other</span>
                    <span className="ml-auto text-slate-600">{userRecords.length} total</span>
                  </div>

                  {/* Last 7 records mini timeline */}
                  <div className="mt-3 flex items-center gap-1">
                    {userRecords.slice(0, 7).map((r) => (
                      <div
                        key={r.id}
                        title={`${formatDate(r.date)} — ${r.status}`}
                        className={`h-3 flex-1 rounded-sm ${
                          r.status === 'present' ? 'bg-emerald-500/60' :
                          r.status === 'leave' ? 'bg-amber-500/60' :
                          r.status === 'holiday' ? 'bg-sky-500/60' :
                          'bg-red-500/40'
                        }`}
                      />
                    ))}
                    {userRecords.length < 7 && Array.from({ length: 7 - Math.min(userRecords.length, 7) }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-3 flex-1 rounded-sm bg-slate-800/40" />
                    ))}
                  </div>
                </CardSpotlight>
              );
            })}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
