import { useState } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { IconMail, IconLock, IconLogin, IconEye, IconEyeOff, IconShieldCheck } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { login as apiLogin } from '../api/auth';

function OrbitRing({ size, duration, opacity, delay = '0s' }) {
  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
      style={{
        width: size,
        height: size,
        borderColor: `rgba(107,124,66,${opacity})`,
        animation: `auth-orbit ${duration} linear infinite`,
        animationDelay: delay,
      }}
    >
      <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-military-base/60" />
    </div>
  );
}

function FloatingBinary({ className, style }) {
  return (
    <span className={`pointer-events-none absolute select-none font-mono text-[10px] font-bold text-military-base/[0.08] ${className}`} style={style}>
      10110101
    </span>
  );
}

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const defaultPath = '/dashboard';
  const from = location.state?.from?.pathname || defaultPath;
  const resetSuccess = searchParams.get('reset') === 'success';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-slate-950">
      {/* Animated mesh background */}
      <div className="pointer-events-none absolute inset-0 auth-bg-grid" />
      <div className="pointer-events-none absolute inset-0">
        <div className="auth-float-slow absolute -left-32 top-1/4 h-[600px] w-[600px] rounded-full bg-military-base/[0.04] blur-[100px]" />
        <div className="auth-float-reverse absolute -right-32 bottom-1/4 h-[500px] w-[500px] rounded-full bg-emerald-800/[0.04] blur-[100px]" />
        <div className="auth-float absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-military-dark/[0.06] blur-[120px]" />
      </div>

      {/* Left immersive panel */}
      <div className="relative hidden w-[55%] flex-col items-center justify-center overflow-hidden lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-military-dark/30 via-slate-950 to-slate-950" />

        {/* Scan line effect */}
        <div className="auth-scan-line pointer-events-none absolute inset-0" />

        {/* Floating binary decorations */}
        <FloatingBinary className="auth-float" style={{ top: '10%', left: '8%', fontSize: '14px' }} />
        <FloatingBinary className="auth-float-reverse" style={{ top: '25%', right: '12%', fontSize: '11px' }} />
        <FloatingBinary className="auth-float-slow" style={{ bottom: '20%', left: '15%', fontSize: '12px' }} />
        <FloatingBinary className="auth-float" style={{ bottom: '35%', right: '8%', fontSize: '13px' }} />
        <FloatingBinary className="auth-float-reverse" style={{ top: '60%', left: '5%', fontSize: '10px' }} />

        <div className="relative z-10 flex flex-col items-center px-16">
          {/* Logo with animated orbit rings */}
          <div className="relative mb-12" style={{ animation: 'auth-fade-up 0.8s ease-out both' }}>
            <OrbitRing size="280px" duration="20s" opacity={0.15} />
            <OrbitRing size="340px" duration="30s" opacity={0.08} delay="2s" />
            <OrbitRing size="400px" duration="40s" opacity={0.04} delay="5s" />

            {/* Pulse rings */}
            <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-military-base/20" style={{ animation: 'auth-pulse-ring 3s ease-out infinite' }} />
            <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-military-base/15" style={{ animation: 'auth-pulse-ring 3s ease-out 1.5s infinite' }} />

            {/* Logo glow layers */}
            <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-military-base/15 blur-3xl" />
            <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-military-base/20 blur-2xl" />

            <img
              src="/webapplogo.png"
              alt="101 Cyber Division"
              className="relative z-10 h-48 w-48 drop-shadow-[0_0_60px_rgba(74,93,46,0.35)]"
            />
          </div>

          {/* Title with gradient */}
          <div className="text-center" style={{ animation: 'auth-fade-up 0.8s ease-out 0.15s both' }}>
            <h2 className="mb-2 bg-gradient-to-r from-military-pale via-slate-50 to-military-pale bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
              101 Cyber Division
            </h2>
            <div className="mx-auto mb-6 h-0.5 w-20 rounded-full bg-gradient-to-r from-transparent via-military-base/60 to-transparent" />
            <p className="max-w-sm text-sm leading-relaxed text-slate-400/80">
              Secure Military HR Management System for personnel operations, intelligence administration, and command coordination.
            </p>
          </div>

          {/* Feature badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-3" style={{ animation: 'auth-fade-up 0.8s ease-out 0.3s both' }}>
            {[
              { icon: '🔐', label: 'E2E Encrypted' },
              { icon: '⚡', label: 'Real-Time Ops' },
              { icon: '🛡️', label: 'Role-Based Access' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 rounded-full border border-military-base/15 bg-military-base/[0.06] px-4 py-2 backdrop-blur-sm">
                <span className="text-sm">{f.icon}</span>
                <span className="text-[11px] font-semibold tracking-wide text-military-pale/70">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-700">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-slate-800" />
          CLASSIFIED // AUTHORIZED PERSONNEL ONLY
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-slate-800" />
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex w-full flex-col items-center justify-center px-6 lg:w-[45%]">
        <div className="w-full max-w-[420px]" style={{ animation: 'auth-fade-up 0.6s ease-out both' }}>
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div className="relative mb-4">
              <div className="absolute inset-0 scale-125 rounded-full bg-military-base/15 blur-2xl" />
              <img src="/webapplogo.png" alt="101 Cyber Division" className="relative h-28 w-28 drop-shadow-[0_0_30px_rgba(74,93,46,0.3)]" />
            </div>
            <h2 className="bg-gradient-to-r from-military-pale to-slate-50 bg-clip-text text-xl font-bold text-transparent">101 Cyber Division</h2>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-military-base/15">
                <IconShieldCheck className="h-4 w-4 text-military-pale/80" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-military-pale/50">Secure Access</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-50">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-500">Enter your credentials to access the command panel</p>
          </div>

          {/* Glass card */}
          <div className="auth-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {(location.state?.message || resetSuccess) && (
                <div className="rounded-xl border border-emerald-700/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300 backdrop-blur-sm">
                  {location.state?.message || 'Password reset successfully. You can now sign in.'}
                </div>
              )}
              {error && (
                <div className="rounded-xl border border-red-700/30 bg-red-950/40 px-4 py-3 text-sm text-red-300 backdrop-blur-sm">
                  {error}
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Email address
                </label>
                <div className={`relative rounded-xl transition-all duration-300 ${focused === 'email' ? 'ring-2 ring-military-base/25' : ''}`}>
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused === 'email' ? 'text-military-pale/80' : 'text-slate-600'}`}>
                    <IconMail className="h-[18px] w-[18px]" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    className="auth-input w-full rounded-xl border border-slate-700/40 bg-slate-800/30 py-3.5 pl-12 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-military-base/40 focus:bg-slate-800/50"
                    placeholder="you@unit.mil"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Password</label>
                  <Link to="/forgot-password" className="text-[11px] font-medium text-slate-600 transition hover:text-military-pale">Forgot?</Link>
                </div>
                <div className={`relative rounded-xl transition-all duration-300 ${focused === 'password' ? 'ring-2 ring-military-base/25' : ''}`}>
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused === 'password' ? 'text-military-pale/80' : 'text-slate-600'}`}>
                    <IconLock className="h-[18px] w-[18px]" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    className="auth-input w-full rounded-xl border border-slate-700/40 bg-slate-800/30 py-3.5 pl-12 pr-12 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-military-base/40 focus:bg-slate-800/50"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-400" tabIndex={-1}>
                    {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="auth-btn mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-military-base via-military-dark to-military-base bg-[length:200%_auto] py-3.5 font-bold text-white disabled:opacity-40"
                style={{ animation: loading ? 'auth-gradient 2s linear infinite' : undefined }}
              >
                <IconLogin className="h-5 w-5" />
                {loading ? 'Authenticating...' : 'Sign in'}
              </button>
            </form>
          </div>

          {/* Bottom links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-semibold text-military-pale/80 transition hover:text-military-pale">
                Create account
              </Link>
            </p>
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
