import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  IconCalendarStats,
  IconAlertCircle,
  IconSend,
  IconArrowRight,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { getMyLeaveBalance } from '../api/leaveBalance';

function StatCard({ label, value, sub, color = 'text-slate-50', spotlight, ring }) {
  return (
    <CardSpotlight className={`p-5 ${ring || ''}`} spotlightColor={spotlight}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold tabular-nums ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </CardSpotlight>
  );
}

export function LeaveBalance() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      try {
        const data = await getMyLeaveBalance();
        if (!cancelled) setBalance(data);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || 'Failed to load leave balance');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-military-base border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Loading balance\u2026</p>
        </div>
      </SidebarLayout>
    );
  }

  const total = balance?.totalDays ?? 30;
  const used = balance?.usedDays ?? 0;
  const pending = balance?.pendingDays ?? 0;
  const remaining = balance?.remainingDays ?? total - used - pending;
  const year = balance?.year ?? new Date().getFullYear();
  const usedPct = total > 0 ? (used / total) * 100 : 0;
  const pendingPct = total > 0 ? (pending / total) * 100 : 0;
  const remainingPct = total > 0 ? (remaining / total) * 100 : 0;

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-military-pale/60">Leave Ledger</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-50">Leave Balance</h2>
            <p className="mt-1 text-sm text-slate-400">Annual allocation for <span className="font-medium text-slate-300">{year}</span>.</p>
          </div>
          <Link
            to="/leaves/apply"
            className="group flex items-center gap-2 rounded-xl bg-military-base px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-military-dark/30 transition hover:bg-military-dark"
          >
            <IconSend className="h-4 w-4" />
            Apply for Leave
            <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            <IconAlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Allocation"
            value={total}
            sub="days for the year"
            spotlight="rgba(148,163,184,0.08)"
          />
          <StatCard
            label="Used"
            value={used}
            sub="approved leave"
            color="text-military-pale"
            spotlight="rgba(106,124,66,0.12)"
          />
          <StatCard
            label="Pending"
            value={pending}
            sub="awaiting approval"
            color="text-amber-300"
            spotlight="rgba(245,158,11,0.1)"
          />
          <StatCard
            label="Remaining"
            value={remaining}
            sub="available to use"
            color="text-emerald-400"
            spotlight="rgba(16,185,129,0.12)"
            ring="ring-1 ring-emerald-500/20"
          />
        </div>

        {/* Progress bar */}
        <CardSpotlight className="p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Balance Breakdown</h3>

          <div className="mt-5 h-4 w-full overflow-hidden rounded-full bg-slate-800/80">
            <div className="flex h-full">
              <div
                className="rounded-l-full bg-gradient-to-r from-military-base to-military-light transition-all duration-700"
                style={{ width: `${usedPct}%` }}
                title={`Used: ${used} days`}
              />
              <div
                className="bg-gradient-to-r from-amber-600 to-amber-500 transition-all duration-700"
                style={{ width: `${pendingPct}%` }}
                title={`Pending: ${pending} days`}
              />
              <div
                className="bg-slate-700/60 transition-all duration-700"
                style={{ width: `${remainingPct}%` }}
                title={`Remaining: ${remaining} days`}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
            <span className="flex items-center gap-2 text-sm">
              <span className="h-3 w-5 rounded-sm bg-gradient-to-r from-military-base to-military-light" />
              <span className="text-slate-400">Used <span className="font-semibold text-slate-300">({used})</span></span>
            </span>
            <span className="flex items-center gap-2 text-sm">
              <span className="h-3 w-5 rounded-sm bg-gradient-to-r from-amber-600 to-amber-500" />
              <span className="text-slate-400">Pending <span className="font-semibold text-slate-300">({pending})</span></span>
            </span>
            <span className="flex items-center gap-2 text-sm">
              <span className="h-3 w-5 rounded-sm bg-slate-700/60" />
              <span className="text-slate-400">Remaining <span className="font-semibold text-slate-300">({remaining})</span></span>
            </span>
          </div>

          {/* Donut-style visual */}
          <div className="mt-6 flex items-center justify-center">
            <div className="relative h-40 w-40">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgb(51,65,85)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="rgb(74,93,46)"
                  strokeWidth="3"
                  strokeDasharray={`${usedPct} ${100 - usedPct}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="rgb(217,119,6)"
                  strokeWidth="3"
                  strokeDasharray={`${pendingPct} ${100 - pendingPct}`}
                  strokeDashoffset={`${-usedPct}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-slate-50">{remaining}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">remaining</span>
              </div>
            </div>
          </div>
        </CardSpotlight>
      </div>
    </SidebarLayout>
  );
}
