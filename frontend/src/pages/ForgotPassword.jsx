import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconMail,
  IconLock,
  IconShieldLock,
  IconAlertCircle,
  IconCircleCheck,
  IconArrowLeft,
  IconArrowRight,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react';
import { forgotPassword as apiForgotPassword, resetPassword as apiResetPassword } from '../api/auth';

const STEPS = [
  { key: 'email', label: 'Email', num: 1 },
  { key: 'otp', label: 'Verify', num: 2 },
  { key: 'password', label: 'Reset', num: 3 },
];

function StepIndicator({ current }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center justify-center">
      {STEPS.map((s, i) => {
        const done = currentIdx > i;
        const active = s.key === current;
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div className={`relative flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-all duration-500 ${
                done
                  ? 'bg-emerald-500/15 text-emerald-400 ring-2 ring-emerald-500/25'
                  : active
                    ? 'bg-military-base/20 text-military-pale ring-2 ring-military-base/30 shadow-[0_0_20px_rgba(74,93,46,0.2)]'
                    : 'bg-slate-800/40 text-slate-600 ring-1 ring-slate-700/30'
              }`}>
                {active && <div className="absolute inset-0 rounded-full border border-military-base/30" style={{ animation: 'auth-pulse-ring 2.5s ease-out infinite' }} />}
                {done ? <IconCircleCheck className="h-5 w-5" /> : s.num}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 ${active ? 'text-slate-300' : done ? 'text-emerald-400/50' : 'text-slate-700'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-4 mb-5 h-[2px] w-12 rounded-full transition-all duration-500 ${done ? 'bg-gradient-to-r from-emerald-500/40 to-emerald-500/20' : 'bg-slate-800/60'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FloatingBinary({ className, style }) {
  return <span className={`pointer-events-none absolute select-none font-mono text-[10px] font-bold text-military-base/[0.08] ${className}`} style={style}>10110101</span>;
}

function OrbitRing({ size, duration, opacity, delay = '0s' }) {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed" style={{ width: size, height: size, borderColor: `rgba(107,124,66,${opacity})`, animation: `auth-orbit ${duration} linear infinite`, animationDelay: delay }}>
      <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-military-base/60" />
    </div>
  );
}

export function ForgotPassword() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [focused, setFocused] = useState(null);

  async function handleSendOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try { await apiForgotPassword(email.trim()); setStep('otp'); }
    catch (err) { setError(err.response?.data?.error || 'Failed to send OTP'); }
    finally { setLoading(false); }
  }

  function handleOtpSubmit(e) {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Please enter a valid 6-digit OTP'); return; }
    setStep('password');
  }

  async function handleReset(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try { await apiResetPassword(email.trim(), otp.trim(), newPassword); setDone(true); setTimeout(() => { window.location.href = '/login?reset=success'; }, 2500); }
    catch (err) { setError(err.response?.data?.error || 'Failed to reset password'); }
    finally { setLoading(false); }
  }

  const inputWrap = (name) => `relative rounded-xl transition-all duration-300 ${focused === name ? 'ring-2 ring-military-base/25' : ''}`;
  const iconClass = (name) => `absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused === name ? 'text-military-pale/80' : 'text-slate-600'}`;
  const inputCls = 'auth-input w-full rounded-xl border border-slate-700/40 bg-slate-800/30 py-3.5 pl-12 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-military-base/40 focus:bg-slate-800/50';

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 auth-bg-grid" />
      <div className="pointer-events-none absolute inset-0">
        <div className="auth-float-slow absolute -left-32 top-1/4 h-[600px] w-[600px] rounded-full bg-military-base/[0.04] blur-[100px]" />
        <div className="auth-float-reverse absolute -right-32 bottom-1/4 h-[500px] w-[500px] rounded-full bg-emerald-800/[0.04] blur-[100px]" />
      </div>

      {/* Left panel */}
      <div className="relative hidden w-[55%] flex-col items-center justify-center overflow-hidden lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-military-dark/30 via-slate-950 to-slate-950" />
        <div className="auth-scan-line pointer-events-none absolute inset-0" />
        <FloatingBinary className="auth-float" style={{ top: '10%', left: '8%', fontSize: '14px' }} />
        <FloatingBinary className="auth-float-reverse" style={{ top: '25%', right: '12%', fontSize: '11px' }} />
        <FloatingBinary className="auth-float-slow" style={{ bottom: '20%', left: '15%', fontSize: '12px' }} />
        <FloatingBinary className="auth-float" style={{ bottom: '35%', right: '8%', fontSize: '13px' }} />

        <div className="relative z-10 flex flex-col items-center px-16">
          <div className="relative mb-12" style={{ animation: 'auth-fade-up 0.8s ease-out both' }}>
            <OrbitRing size="280px" duration="20s" opacity={0.15} />
            <OrbitRing size="340px" duration="30s" opacity={0.08} delay="2s" />
            <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-military-base/20" style={{ animation: 'auth-pulse-ring 3s ease-out infinite' }} />
            <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-military-base/15 blur-3xl" />
            <img src="/webapplogo.png" alt="101 Cyber Division" className="relative z-10 h-48 w-48 drop-shadow-[0_0_60px_rgba(74,93,46,0.35)]" />
          </div>
          <div className="text-center" style={{ animation: 'auth-fade-up 0.8s ease-out 0.15s both' }}>
            <h2 className="mb-2 bg-gradient-to-r from-military-pale via-slate-50 to-military-pale bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">Account Recovery</h2>
            <div className="mx-auto mb-6 h-0.5 w-20 rounded-full bg-gradient-to-r from-transparent via-military-base/60 to-transparent" />
            <p className="max-w-sm text-sm leading-relaxed text-slate-400/80">
              Verify your identity through a secure OTP process to reset your credentials.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3" style={{ animation: 'auth-fade-up 0.8s ease-out 0.3s both' }}>
            {[{ icon: '✉️', label: 'Email Verified' }, { icon: '🔑', label: 'OTP Protected' }, { icon: '🛡️', label: 'Secure Reset' }].map((f) => (
              <div key={f.label} className="flex items-center gap-2 rounded-full border border-military-base/15 bg-military-base/[0.06] px-4 py-2 backdrop-blur-sm">
                <span className="text-sm">{f.icon}</span>
                <span className="text-[11px] font-semibold tracking-wide text-military-pale/70">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-700">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-slate-800" />
          CLASSIFIED // AUTHORIZED PERSONNEL ONLY
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-slate-800" />
        </div>
      </div>

      {/* Right panel */}
      <div className="relative flex w-full flex-col items-center justify-center px-6 py-10 lg:w-[45%]">
        <div className="w-full max-w-[420px]" style={{ animation: 'auth-fade-up 0.6s ease-out both' }}>
          {/* Mobile logo */}
          <div className="mb-6 flex flex-col items-center lg:hidden">
            <div className="relative mb-3">
              <div className="absolute inset-0 scale-125 rounded-full bg-military-base/15 blur-2xl" />
              <img src="/webapplogo.png" alt="101 Cyber Division" className="relative h-24 w-24" />
            </div>
            <h2 className="bg-gradient-to-r from-military-pale to-slate-50 bg-clip-text text-lg font-bold text-transparent">101 Cyber Division</h2>
          </div>

          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-military-base/15">
                <IconShieldLock className="h-4 w-4 text-military-pale/80" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-military-pale/50">Recovery</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-50">Reset Password</h1>
            <p className="mt-2 text-sm text-slate-500">
              {step === 'email' && 'Enter your email to receive a verification code'}
              {step === 'otp' && 'Enter the 6-digit code sent to your inbox'}
              {step === 'password' && 'Choose a new secure password for your account'}
            </p>
          </div>

          <div className="mb-6">
            <StepIndicator current={step} />
          </div>

          <div className="auth-card rounded-2xl p-8">
            {done ? (
              <div className="flex flex-col items-center py-8 text-center" style={{ animation: 'auth-fade-up 0.5s ease-out both' }}>
                <div className="relative">
                  <div className="absolute inset-0 scale-150 rounded-full bg-emerald-500/10 blur-2xl" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 ring-2 ring-emerald-500/20">
                    <IconCircleCheck className="h-14 w-14 text-emerald-400" strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-50">Password Reset Complete</h3>
                <p className="mt-2 text-sm text-slate-500">Redirecting to sign in...</p>
                <div className="mt-5 h-1.5 w-32 overflow-hidden rounded-full bg-slate-800/60">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ animation: 'progress 2.5s ease-in-out forwards' }} />
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-700/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                    <IconAlertCircle className="h-5 w-5 shrink-0" />{error}
                  </div>
                )}

                {step === 'email' && (
                  <form onSubmit={handleSendOtp} className="space-y-5" style={{ animation: 'auth-fade-up 0.4s ease-out both' }}>
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Email address</label>
                      <div className={inputWrap('email')}>
                        <div className={iconClass('email')}><IconMail className="h-[18px] w-[18px]" /></div>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} className={inputCls} placeholder="you@unit.mil" required autoComplete="email" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="auth-btn flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-military-base via-military-dark to-military-base bg-[length:200%_auto] py-3.5 font-bold text-white disabled:opacity-40" style={{ animation: loading ? 'auth-gradient 2s linear infinite' : undefined }}>
                      {loading ? 'Sending...' : 'Send Verification Code'}
                      {!loading && <IconArrowRight className="h-4 w-4" />}
                    </button>
                  </form>
                )}

                {step === 'otp' && (
                  <form onSubmit={handleOtpSubmit} className="space-y-5" style={{ animation: 'auth-fade-up 0.4s ease-out both' }}>
                    <div className="rounded-xl border border-military-base/15 bg-military-base/[0.06] px-4 py-3 text-center backdrop-blur-sm">
                      <p className="text-sm text-military-pale/80">Code sent to <span className="font-bold">{email}</span></p>
                      <p className="mt-1 text-[11px] text-military-pale/40">Valid for 5 minutes</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">6-Digit OTP</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="auth-input w-full rounded-xl border border-slate-700/40 bg-slate-800/30 px-4 py-4 text-center text-3xl font-extrabold tracking-[0.6em] text-slate-50 placeholder:text-slate-700 outline-none focus:border-military-base/40 focus:bg-slate-800/50 focus:ring-2 focus:ring-military-base/25"
                        placeholder="------"
                        required
                        autoComplete="one-time-code"
                        autoFocus
                      />
                    </div>
                    <button type="submit" className="auth-btn flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-military-base via-military-dark to-military-base bg-[length:200%_auto] py-3.5 font-bold text-white">
                      Verify Code <IconArrowRight className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => { setOtp(''); setError(''); setStep('email'); }} className="w-full text-sm text-slate-600 transition hover:text-military-pale">
                      Didn&apos;t receive it? <span className="font-semibold text-slate-400">Resend</span>
                    </button>
                  </form>
                )}

                {step === 'password' && (
                  <form onSubmit={handleReset} className="space-y-5" style={{ animation: 'auth-fade-up 0.4s ease-out both' }}>
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">New Password</label>
                      <div className={inputWrap('newpw')}>
                        <div className={iconClass('newpw')}><IconLock className="h-[18px] w-[18px]" /></div>
                        <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} onFocus={() => setFocused('newpw')} onBlur={() => setFocused(null)} className="auth-input w-full rounded-xl border border-slate-700/40 bg-slate-800/30 py-3.5 pl-12 pr-12 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-military-base/40 focus:bg-slate-800/50" placeholder="At least 6 characters" required minLength={6} autoComplete="new-password" autoFocus />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-400" tabIndex={-1}>
                          {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Confirm Password</label>
                      <div className={inputWrap('confirmpw')}>
                        <div className={iconClass('confirmpw')}><IconLock className="h-[18px] w-[18px]" /></div>
                        <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onFocus={() => setFocused('confirmpw')} onBlur={() => setFocused(null)} className={inputCls} placeholder="Repeat new password" required minLength={6} autoComplete="new-password" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="auth-btn flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-military-base via-military-dark to-military-base bg-[length:200%_auto] py-3.5 font-bold text-white disabled:opacity-40" style={{ animation: loading ? 'auth-gradient 2s linear infinite' : undefined }}>
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                    <button type="button" onClick={() => setStep('otp')} className="flex w-full items-center justify-center gap-1.5 text-sm text-slate-600 transition hover:text-military-pale">
                      <IconArrowLeft className="h-3.5 w-3.5" /> Back to verification
                    </button>
                  </form>
                )}

                <div className="mt-6 text-center">
                  <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-military-pale/70 transition hover:text-military-pale">
                    <IconArrowLeft className="h-4 w-4" />
                    Back to Sign In
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="h-1 w-1 rounded-full bg-slate-800" />
            <span className="text-[10px] font-medium tracking-wider text-slate-800">101HRMgmt v1.0</span>
            <div className="h-1 w-1 rounded-full bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
