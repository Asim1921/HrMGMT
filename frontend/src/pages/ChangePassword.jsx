import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconLock,
  IconShieldLock,
  IconAlertCircle,
  IconCircleCheck,
  IconArrowLeft,
  IconArrowRight,
  IconMail,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { sendChangePasswordOtp, changePassword as apiChangePassword } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

const STEPS = [
  { key: 'send', label: 'Send Code' },
  { key: 'otp', label: 'Verify OTP' },
  { key: 'password', label: 'New Password' },
];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((s, i) => {
        const done = STEPS.findIndex((x) => x.key === current) > i;
        const active = s.key === current;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
              done ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
              : active ? 'bg-military-base/30 text-military-pale ring-1 ring-military-base/50'
              : 'bg-slate-800/60 text-slate-600 ring-1 ring-slate-700/40'
            }`}>
              {done ? <IconCircleCheck className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`hidden text-xs font-medium sm:inline ${active ? 'text-slate-200' : done ? 'text-emerald-400/70' : 'text-slate-600'}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <div className={`h-px w-6 ${done ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />}
          </div>
        );
      })}
    </div>
  );
}

export function ChangePassword() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState('send');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user?.email) {
      const [local, domain] = user.email.split('@');
      setMaskedEmail(`${local.slice(0, 2)}${'*'.repeat(Math.max(local.length - 2, 2))}@${domain}`);
    }
  }, [user]);

  async function handleSendOtp() {
    setError('');
    setLoading(true);
    try {
      await sendChangePasswordOtp();
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  }

  function handleOtpSubmit(e) {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setStep('password');
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await apiChangePassword(otp.trim(), newPassword);
      setDone(true);
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SidebarLayout>
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-800/50 text-slate-400 transition hover:border-military-base/50 hover:text-military-pale"
          >
            <IconArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-military-pale/60">Security</p>
            <h2 className="text-xl font-bold text-slate-50">Change Password</h2>
          </div>
        </div>

        <div className="mb-2">
          <StepIndicator current={done ? 'done' : step} />
        </div>

        <CardSpotlight className="p-6 sm:p-8">
          {done ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <IconCircleCheck className="h-10 w-10" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-50">Password Changed</h3>
              <p className="mt-2 text-sm text-slate-400">Your password has been updated. Redirecting to profile\u2026</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                  <IconAlertCircle className="h-5 w-5 shrink-0" />
                  {error}
                </div>
              )}

              {step === 'send' && (
                <div className="space-y-5 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-military-base/20 text-military-pale">
                    <IconShieldLock className="h-8 w-8" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-300">
                      We will send a 6-digit verification code to your registered email:
                    </p>
                    <p className="mt-2 flex items-center justify-center gap-2 text-base font-semibold text-slate-50">
                      <IconMail className="h-4 w-4 text-military-pale/70" />
                      {maskedEmail}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-military-base py-3.5 font-semibold text-white shadow-lg shadow-military-dark/40 transition hover:bg-military-dark disabled:opacity-50"
                  >
                    {loading ? 'Sending\u2026' : 'Send Verification Code'}
                    {!loading && <IconArrowRight className="h-4 w-4" />}
                  </button>
                </div>
              )}

              {step === 'otp' && (
                <form onSubmit={handleOtpSubmit} className="space-y-5">
                  <div className="rounded-xl border border-military-base/30 bg-military-base/10 px-4 py-3 text-center text-sm text-military-pale">
                    Code sent to <span className="font-semibold">{maskedEmail}</span>. Valid for 5 minutes.
                  </div>
                  <div>
                    <label htmlFor="otp" className="mb-1.5 block text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                      6-Digit Verification Code
                    </label>
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-slate-50 placeholder:text-slate-700 focus:border-military-base focus:ring-2 focus:ring-military-base/40 focus:outline-none"
                      placeholder="\u2022\u2022\u2022\u2022\u2022\u2022"
                      required
                      autoComplete="one-time-code"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-military-base py-3.5 font-semibold text-white shadow-lg shadow-military-dark/40 transition hover:bg-military-dark"
                  >
                    Verify Code
                    <IconArrowRight className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => { setStep('send'); setOtp(''); setError(''); }} className="w-full text-sm text-slate-500 hover:text-military-pale">
                    Resend code
                  </button>
                </form>
              )}

              {step === 'password' && (
                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div>
                    <label htmlFor="newPassword" className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <IconLock className="h-4 w-4 text-military-pale/80" />
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:border-military-base focus:ring-2 focus:ring-military-base/40 focus:outline-none"
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:border-military-base focus:ring-2 focus:ring-military-base/40 focus:outline-none"
                      placeholder="Repeat new password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-military-base py-3.5 font-semibold text-white shadow-lg shadow-military-dark/40 transition hover:bg-military-dark disabled:opacity-50"
                  >
                    {loading ? 'Updating\u2026' : 'Update Password'}
                  </button>
                  <button type="button" onClick={() => setStep('otp')} className="flex w-full items-center justify-center gap-1 text-sm text-slate-500 hover:text-military-pale">
                    <IconArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                </form>
              )}
            </>
          )}
        </CardSpotlight>
      </div>
    </SidebarLayout>
  );
}
