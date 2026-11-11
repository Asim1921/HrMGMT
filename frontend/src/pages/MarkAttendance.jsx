import { useState, useEffect, useCallback } from 'react';
import { IconClock, IconCircleCheck, IconAlertCircle, IconMapPin } from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { markAttendance, getTodayAttendance } from '../api/attendance';

const WINDOW_START = 8;
const WINDOW_END = 10;

function isWithinWindow() {
  const hour = new Date().getHours();
  return hour >= WINDOW_START && hour <= WINDOW_END;
}

function formatTime(dateStr) {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function MarkAttendance() {
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [geoStatus, setGeoStatus] = useState(null);

  const withinWindow = isWithinWindow();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      try {
        const res = await getTodayAttendance();
        if (!cancelled && res.record) {
          setTodayRecord(res.record);
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || 'Failed to load today\u2019s attendance');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const getLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  async function handleMark() {
    setError('');
    setMarking(true);
    try {
      const location = await getLocation();
      const payload = location ? { latitude: location.latitude, longitude: location.longitude } : {};
      const result = await markAttendance(payload);
      setTodayRecord({
        date: result.date,
        markedAt: result.markedAt,
        status: result.status || 'present',
      });
      setGeoStatus(location ? 'captured' : 'unavailable');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to mark attendance');
    } finally {
      setMarking(false);
    }
  }

  const alreadyMarked = !!todayRecord;
  // DEV: allow marking any time for testing \u2014 use (withinWindow && \u2026) for production
  const canMark = !alreadyMarked && !marking;

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Status card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-lg shadow-black/30 ring-1 ring-slate-800/40">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-military-pale/80">
                Daily Check-In
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-50">Mark Attendance</h2>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-2">
              <IconClock className="h-5 w-5 text-military-pale/80" />
              <span className="text-sm font-medium tabular-nums text-slate-50">
                {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-sm text-slate-400">
                {currentTime.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Authorized window: <span className="font-medium text-military-pale">{String(WINDOW_START).padStart(2, '0')}00\u2013{String(WINDOW_END).padStart(2, '0')}00 hrs</span>. You may mark present once per day within this window.
          </p>
        </div>

        {/* Main action */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-8 shadow-lg shadow-black/30 ring-1 ring-slate-800/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-military-base border-t-transparent" />
              <p className="mt-4 text-sm text-slate-400">Loading today&apos;s status\u2026</p>
            </div>
          ) : alreadyMarked ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-military-base/20 text-military-pale">
                <IconCircleCheck className="h-10 w-10" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-50">Attendance Already Marked for Today</h3>
              <p className="mt-2 text-sm text-slate-400">
                Marked at{' '}
                <span className="font-medium text-military-pale">{formatTime(todayRecord.markedAt)}</span>
                {' '}on{' '}
                <span className="font-medium text-military-pale">{formatDate(todayRecord.markedAt)}</span>
              </p>
              <span className="mt-3 inline-block rounded-full bg-emerald-900/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-700/50">
                {todayRecord.status}
              </span>
              {geoStatus && (
                <div className={`mt-3 flex items-center gap-1.5 text-xs ${geoStatus === 'captured' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  <IconMapPin className="h-3.5 w-3.5" />
                  <span>{geoStatus === 'captured' ? 'Location captured' : 'Location not available'}</span>
                </div>
              )}
              <p className="mt-5 text-xs text-slate-500">
                Only one check-in per day is allowed. See Attendance History for your full record.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 text-center">
              {/* DEV: time-window warning disabled for testing \u2014 uncomment for production
              {!withinWindow && (
                <div className="mb-6 flex w-full max-w-md items-center gap-3 rounded-xl border border-amber-800/60 bg-amber-950/40 px-4 py-3 text-left text-sm text-amber-200">
                  <IconAlertCircle className="h-5 w-5 shrink-0" />
                  <span>Outside the authorized window. Marking is allowed between 0800 and 1000 hrs.</span>
                </div>
              )}
              */}
              <button
                type="button"
                onClick={handleMark}
                disabled={!canMark}
                className="rounded-xl bg-military-base px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-military-dark/40 transition hover:bg-military-dark focus:ring-2 focus:ring-military-light focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {marking ? 'Marking\u2026' : 'Mark Present'}
              </button>
              {withinWindow && !alreadyMarked && (
                <p className="mt-4 text-sm text-slate-400">One tap to record your presence for today.</p>
              )}
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-red-800/60 bg-red-950/50 px-4 py-3 text-sm text-red-200">
              <IconAlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
