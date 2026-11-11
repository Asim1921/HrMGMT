import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  IconMail,
  IconLock,
  IconUser,
  IconId,
  IconAlertCircle,
  IconEye,
  IconEyeOff,
  IconChevronDown,
  IconUserPlus,
  IconShieldCheck,
} from '@tabler/icons-react';
import { signup as apiSignup } from '../api/auth';

const DESIGNATIONS = [
  { value: 'INTERNEE', label: 'Internee', desc: 'Intern personnel' },
  { value: 'WCF', label: 'WCF', desc: 'Workforce civilian' },
  { value: 'OFFICER', label: 'Offr', desc: 'Commissioned officer' },
];

const RANK_OPTIONS = [
  { value: 'MAJOR', label: 'Major (G-2)' },
  { value: 'LT_COL', label: 'Lt Col (G-1)' },
  { value: 'COL_BRIG', label: 'Col/Brig (Comdt)' },
];

const UNIT_OPTIONS = [
  { value: '804 Grp', label: '804 Grp' },
  { value: '803 Grp', label: '803 Grp' },
  { value: '802 Grp', label: '802 Grp' },
];

function FloatingBinary({ className, style }) {
  return (
    <span className={`pointer-events-none absolute select-none font-mono text-[10px] font-bold text-military-base/[0.08] ${className}`} style={style}>
      10110101
    </span>
  );
}

function OrbitRing({ size, duration, opacity, delay = '0s' }) {
  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed"
      style={{ width: size, height: size, borderColor: `rgba(107,124,66,${opacity})`, animation: `auth-orbit ${duration} linear infinite`, animationDelay: delay }}
    >
      <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-military-base/60" />
    </div>
  );
}

export function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [designation, setDesignation] = useState('INTERNEE');
  const [cnic, setCnic] = useState('');
  const [paNumber, setPaNumber] = useState('');
  const [rank, setRank] = useState('');
  const [unit, setUnit] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const needsUnit = designation === 'WCF' || designation === 'OFFICER';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if ((designation === 'INTERNEE' || designation === 'WCF') && !cnic.trim()) { setError('CNIC number is required.'); return; }
    if (designation === 'OFFICER' && (!paNumber.trim() || !rank.trim())) { setError('PA Number and Rank are required for Offr.'); return; }
    if (needsUnit && !unit) { setError('Unit selection is required.'); return; }

    setLoading(true);
    try {
      const employeeId = designation === 'OFFICER' ? paNumber.trim() || undefined : cnic.trim() || undefined;
      await apiSignup({ fullName, email, password, designation, employeeId, rank: designation === 'WCF' ? 'WCF' : (rank || undefined), unit: needsUnit ? unit : undefined });
      navigate('/login', { state: { message: 'Account created successfully. You can now sign in.' }, replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  const inputWrap = (name) => `relative rounded-xl transition-all duration-300 ${focused === name ? 'ring-2 ring-military-base/25' : ''}`;
  const iconClass = (name) => `absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused === name ? 'text-military-pale/80' : 'text-slate-600'}`;
  const inputClass = 'auth-input w-full rounded-xl border border-slate-700/40 bg-slate-800/30 py-3.5 pl-12 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-military-base/40 focus:bg-slate-800/50';
  const selectWrap = 'relative rounded-xl';
  const selectClass = 'auth-input w-full appearance-none rounded-xl border border-slate-700/40 bg-slate-800/30 py-3.5 pl-4 pr-10 text-sm text-slate-100 outline-none focus:border-military-base/40 focus:bg-slate-800/50 focus:ring-2 focus:ring-military-base/25';

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
        <FloatingBinary className="auth-float" style={{ top: '12%', left: '10%', fontSize: '14px' }} />
        <FloatingBinary className="auth-float-reverse" style={{ top: '28%', right: '14%', fontSize: '11px' }} />
        <FloatingBinary className="auth-float-slow" style={{ bottom: '22%', left: '18%', fontSize: '12px' }} />
        <FloatingBinary className="auth-float" style={{ bottom: '38%', right: '10%', fontSize: '13px' }} />

        <div className="relative z-10 flex flex-col items-center px-16">
          <div className="relative mb-12" style={{ animation: 'auth-fade-up 0.8s ease-out both' }}>
            <OrbitRing size="280px" duration="20s" opacity={0.15} />
            <OrbitRing size="340px" duration="30s" opacity={0.08} delay="2s" />
            <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-military-base/20" style={{ animation: 'auth-pulse-ring 3s ease-out infinite' }} />
            <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-military-base/15 blur-3xl" />
            <img src="/webapplogo.png" alt="101 Cyber Division" className="relative z-10 h-48 w-48 drop-shadow-[0_0_60px_rgba(74,93,46,0.35)]" />
          </div>
          <div className="text-center" style={{ animation: 'auth-fade-up 0.8s ease-out 0.15s both' }}>
            <h2 className="mb-2 bg-gradient-to-r from-military-pale via-slate-50 to-military-pale bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
              Join the Division
            </h2>
            <div className="mx-auto mb-6 h-0.5 w-20 rounded-full bg-gradient-to-r from-transparent via-military-base/60 to-transparent" />
            <p className="max-w-sm text-sm leading-relaxed text-slate-400/80">
              Register your credentials to gain access to the classified HR Management System.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3" style={{ animation: 'auth-fade-up 0.8s ease-out 0.3s both' }}>
            {['Internee', 'WCF', 'Officer'].map((f) => (
              <div key={f} className="flex items-center gap-2 rounded-full border border-military-base/15 bg-military-base/[0.06] px-4 py-2 backdrop-blur-sm">
                <span className="text-[11px] font-semibold tracking-wide text-military-pale/70">{f}</span>
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

      {/* Right form panel */}
      <div className="relative flex w-full flex-col items-center justify-center overflow-y-auto px-6 py-10 lg:w-[45%]">
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
                <IconShieldCheck className="h-4 w-4 text-military-pale/80" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-military-pale/50">Registration</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-50">Create account</h1>
            <p className="mt-2 text-sm text-slate-500">Register as Internee, WCF, or Officer</p>
          </div>

          <div className="auth-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-700/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                  <IconAlertCircle className="h-5 w-5 shrink-0" />{error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Full name</label>
                <div className={inputWrap('name')}>
                  <div className={iconClass('name')}><IconUser className="h-[18px] w-[18px]" /></div>
                  <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} className={inputClass} placeholder="Your full name" required autoComplete="name" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Email address</label>
                <div className={inputWrap('email')}>
                  <div className={iconClass('email')}><IconMail className="h-[18px] w-[18px]" /></div>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} className={inputClass} placeholder="you@unit.mil" required autoComplete="email" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Password</label>
                <div className={inputWrap('password')}>
                  <div className={iconClass('password')}><IconLock className="h-[18px] w-[18px]" /></div>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} className="auth-input w-full rounded-xl border border-slate-700/40 bg-slate-800/30 py-3.5 pl-12 pr-12 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-military-base/40 focus:bg-slate-800/50" placeholder="At least 6 characters" required minLength={6} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-400" tabIndex={-1}>
                    {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Designation cards */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Account type</label>
                <div className="grid grid-cols-3 gap-2">
                  {DESIGNATIONS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => { setDesignation(d.value); setCnic(''); setPaNumber(''); setRank(''); setUnit(''); }}
                      className={`group relative overflow-hidden rounded-xl border py-3 text-center transition-all duration-300 ${
                        designation === d.value
                          ? 'border-military-base/50 bg-military-base/15 shadow-[0_0_20px_rgba(74,93,46,0.15)]'
                          : 'border-slate-700/30 bg-slate-800/20 hover:border-slate-600/50 hover:bg-slate-800/40'
                      }`}
                    >
                      {designation === d.value && <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-military-base to-transparent" />}
                      <span className={`block text-sm font-bold ${designation === d.value ? 'text-military-pale' : 'text-slate-400'}`}>{d.label}</span>
                      <span className={`mt-0.5 block text-[9px] ${designation === d.value ? 'text-military-pale/50' : 'text-slate-600'}`}>{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(designation === 'INTERNEE' || designation === 'WCF') && (
                <div className="space-y-2" style={{ animation: 'auth-fade-up 0.3s ease-out both' }}>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">CNIC Number</label>
                  <div className={inputWrap('cnic')}>
                    <div className={iconClass('cnic')}><IconId className="h-[18px] w-[18px]" /></div>
                    <input type="text" value={cnic} onChange={(e) => setCnic(e.target.value)} onFocus={() => setFocused('cnic')} onBlur={() => setFocused(null)} className={inputClass} placeholder="e.g. 12345-1234567-1" autoComplete="off" required />
                  </div>
                </div>
              )}

              {designation === 'OFFICER' && (
                <div className="space-y-4" style={{ animation: 'auth-fade-up 0.3s ease-out both' }}>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">PA Number</label>
                    <div className={inputWrap('pa')}>
                      <div className={iconClass('pa')}><IconId className="h-[18px] w-[18px]" /></div>
                      <input type="text" value={paNumber} onChange={(e) => setPaNumber(e.target.value)} onFocus={() => setFocused('pa')} onBlur={() => setFocused(null)} className={inputClass} placeholder="e.g. PA-12345" autoComplete="off" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Rank</label>
                    <div className={selectWrap}>
                      <select value={rank} onChange={(e) => setRank(e.target.value)} className={selectClass} required>
                        <option value="">Select rank</option>
                        {RANK_OPTIONS.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
                      </select>
                      <IconChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                    </div>
                  </div>
                </div>
              )}

              {needsUnit && (
                <div className="space-y-2" style={{ animation: 'auth-fade-up 0.3s ease-out both' }}>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Unit</label>
                  <div className={selectWrap}>
                    <select value={unit} onChange={(e) => setUnit(e.target.value)} className={selectClass} required>
                      <option value="">Select unit</option>
                      {UNIT_OPTIONS.map((u) => (<option key={u.value} value={u.value}>{u.label}</option>))}
                    </select>
                    <IconChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="auth-btn mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-military-base via-military-dark to-military-base bg-[length:200%_auto] py-3.5 font-bold text-white disabled:opacity-40"
                style={{ animation: loading ? 'auth-gradient 2s linear infinite' : undefined }}
              >
                <IconUserPlus className="h-5 w-5" />
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-military-pale/80 transition hover:text-military-pale">Sign in</Link>
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
