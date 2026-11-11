import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { SidebarLayout } from '../components/SidebarLayout';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { getMyLeaveBalance } from '../api/leaveBalance';
import {
  IconFingerprint,
  IconCalendarStats,
  IconSend,
  IconListCheck,
  IconCalendarCheck,
  IconUsersGroup,
  IconClipboardCheck,
  IconUsers,
  IconChartBar,
  IconAdjustments,
} from '@tabler/icons-react';

const DASH_PREFS_KEY = '101hrmgmt-dash-prefs';
const DEFAULT_PREFS = { attendance: true, leave: true, quickAccess: true, command: true };

function loadDashPrefs() {
  try {
    const raw = localStorage.getItem(DASH_PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function saveDashPrefs(prefs) {
  localStorage.setItem(DASH_PREFS_KEY, JSON.stringify(prefs));
}

function SpotlightCard({ to, icon: Icon, tag, title, description, footer, accent = false }) {
  const { theme } = useTheme();
  const light = theme === 'light';

  return (
    <Link to={to} className="block">
      <CardSpotlight
        className={`flex h-full flex-col justify-between p-5 transition-transform duration-300 hover:-translate-y-1 ${accent ? (light ? 'border-amber-500/35 shadow-amber-500/10' : 'border-amber-500/30 shadow-amber-950/30') : ''}`}
        spotlightColor={accent ? 'rgba(245,158,11,0.12)' : 'rgba(106,124,66,0.15)'}
      >
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent ? (light ? 'bg-amber-500/20 text-amber-700' : 'bg-amber-500/15 text-amber-400') : 'bg-military-base/20 text-military-pale'}`}>
              <Icon className="h-5 w-5" strokeWidth={1.6} />
            </div>
            {tag && (
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${accent ? (light ? 'bg-amber-500/20 text-amber-800 ring-1 ring-amber-500/35' : 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30') : 'bg-military-base/15 text-military-pale/80 ring-1 ring-military-base/30'}`}>
                {tag}
              </span>
            )}
          </div>
          <h3 className={`text-lg font-semibold ${accent ? (light ? 'text-amber-950' : 'text-amber-50') : 'text-slate-50'}`}>{title}</h3>
          <p className={`mt-1.5 text-sm leading-relaxed ${accent ? (light ? 'text-amber-900/75' : 'text-amber-200/70') : 'text-slate-400'}`}>
            {description}
          </p>
        </div>
        {footer && <div className="mt-4">{footer}</div>}
      </CardSpotlight>
    </Link>
  );
}

function LeaveBalanceFooter({ balance, loading, light }) {
  const total = balance?.totalDays ?? 30;
  const used = balance?.usedDays ?? 0;
  const remaining = balance?.remainingDays ?? total - used - (balance?.pendingDays ?? 0);
  const usedPct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const trackCls = light ? 'bg-slate-200' : 'bg-slate-800';

  if (loading) {
    return (
      <div className="space-y-2">
        <div className={`h-3 w-24 animate-pulse rounded ${light ? 'bg-slate-200' : 'bg-slate-800'}`} />
        <div className={`h-1.5 w-full animate-pulse rounded-full ${trackCls}`} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className={light ? 'font-semibold text-slate-700' : 'font-semibold text-slate-300'}>
          {remaining} {remaining === 1 ? 'day' : 'days'} left
        </span>
        <span className={light ? 'text-slate-500' : 'text-slate-500'}>of {total}</span>
      </div>
      <div className={`h-1.5 w-full overflow-hidden rounded-full ${trackCls}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-military-base to-military-light transition-all duration-500"
          style={{ width: `${usedPct}%` }}
          title={`${used} approved day${used === 1 ? '' : 's'} used`}
        />
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user, isAdmin, isSuperAdmin, isFieldUser } = useAuth();
  const { theme } = useTheme();
  const light = theme === 'light';
  const [customizing, setCustomizing] = useState(false);
  const [prefs, setPrefs] = useState(loadDashPrefs);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [leaveBalanceLoading, setLeaveBalanceLoading] = useState(isFieldUser);

  useEffect(() => {
    if (!isFieldUser) return;
    let cancelled = false;
    (async () => {
      setLeaveBalanceLoading(true);
      try {
        const data = await getMyLeaveBalance();
        if (!cancelled) setLeaveBalance(data);
      } catch {
        if (!cancelled) setLeaveBalance(null);
      } finally {
        if (!cancelled) setLeaveBalanceLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isFieldUser]);

  function togglePref(key) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    saveDashPrefs(next);
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  return (
    <SidebarLayout>
      {/* Welcome banner */}
      <div className="mb-8 rounded-2xl border border-slate-800/60 bg-gradient-to-r from-slate-900/90 via-military-dark/20 to-slate-900/90 p-6 shadow-lg shadow-black/20 ring-1 ring-slate-800/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-military-pale/70">{greeting},</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-50">
              {user?.fullName || 'Officer'}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Here is your operations overview for today. Select a module to proceed.
            </p>
          </div>
          <button
            onClick={() => setCustomizing((c) => !c)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${customizing ? 'bg-military-base text-white' : 'border border-slate-700/80 bg-slate-800/50 text-slate-400 hover:text-slate-200'}`}
          >
            <IconAdjustments className="h-3.5 w-3.5" />
            {customizing ? 'Done' : 'Customize'}
          </button>
        </div>

        {customizing && (
          <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-800/60 pt-4">
            {[
              { key: 'attendance', label: 'Attendance & Leave' },
              { key: 'leave', label: 'Leave Balance' },
              { key: 'quickAccess', label: 'Quick Access' },
              { key: 'command', label: 'Command Operations' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={prefs[key]}
                  onChange={() => togglePref(key)}
                  className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-military-base focus:ring-military-base"
                />
                {label}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Primary actions — attendance & leave only for Internee/WCF */}
      {isFieldUser && prefs.attendance && (
        <div className="grid gap-5 md:grid-cols-3">
          <SpotlightCard
            to="/attendance/mark"
            icon={IconFingerprint}
            tag="Daily"
            title="Mark Attendance"
            description="One-tap check-in within the authorized window."
            footer={
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Window: 0800\u20131000 hrs</span>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30">
                  On Duty
                </span>
              </div>
            }
          />

          <SpotlightCard
            to="/leaves/balance"
            icon={IconCalendarStats}
            tag="Ledger"
            title="Leave Balance"
            description="Visual breakdown of annual, used, and pending leave days."
            footer={
              <LeaveBalanceFooter balance={leaveBalance} loading={leaveBalanceLoading} light={light} />
            }
          />

          <SpotlightCard
            to="/leaves/apply"
            icon={IconSend}
            tag="Request"
            title="Apply for Leave"
            description="Submit new leave requests with full justification."
            footer={
              <p className="text-xs text-slate-500">Routes to your reporting officer</p>
            }
          />
        </div>
      )}

      {/* Secondary actions */}
      {(isFieldUser || isAdmin || isSuperAdmin) && prefs.quickAccess && (
        <>
          <h3 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-widest text-slate-500">Quick Access</h3>
          <div className="grid gap-5 md:grid-cols-3">
            {isFieldUser && (
              <SpotlightCard
                to="/leaves/my-requests"
                icon={IconListCheck}
                title="My Leave Requests"
                description="Track pending, approved, and rejected missions."
              />
            )}

            {isFieldUser && (
              <SpotlightCard
                to="/attendance/history"
                icon={IconCalendarCheck}
                title="Attendance History"
                description="Calendar view of presence, leave, and duty."
              />
            )}

            {(isAdmin || isSuperAdmin) && (
              <SpotlightCard
                to="/users/list"
                icon={IconUsersGroup}
                title="Personnel Roster"
                description="Manage unit profiles, roles, and status."
              />
            )}
          </div>
        </>
      )}

      {/* Admin section */}
      {isAdmin && prefs.command && (
        <>
          <h3 className={`mb-3 mt-8 text-xs font-semibold uppercase tracking-widest ${light ? 'text-amber-700' : 'text-amber-400/70'}`}>Command Operations</h3>
          <div className="grid gap-5 md:grid-cols-3">
            <SpotlightCard
              to="/leaves/approvals"
              icon={IconClipboardCheck}
              title="Pending Approvals"
              description="Review and authorize leave requests in your chain of command."
              accent
            />

            <SpotlightCard
              to="/attendance/team"
              icon={IconUsers}
              title="Team Attendance"
              description="Unit-level presence matrix for your personnel."
              accent
            />

            <SpotlightCard
              to="/reports"
              icon={IconChartBar}
              title="Reports & Analytics"
              description="Generate attendance and leave intelligence for leadership."
              accent
            />
          </div>
        </>
      )}
    </SidebarLayout>
  );
}
