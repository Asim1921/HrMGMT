import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  IconCamera,
  IconUser,
  IconMail,
  IconId,
  IconShieldChevron,
  IconBuildingFortress,
  IconMilitaryRank,
  IconCalendar,
  IconCheck,
  IconLoader2,
  IconLock,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { getProfile, updateProfile, uploadProfilePicture } from '../api/profile';
import { useAuthStore } from '../store/authStore';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-slate-800/60 bg-slate-800/30 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-military-base/20 text-military-pale">
        <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-slate-100">{value || '\u2014'}</p>
      </div>
    </div>
  );
}

export function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editing, setEditing] = useState(false);
  const fileRef = useRef(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        setProfile(data);
        setEditFullName(data.fullName || '');
      } catch (e) {
        setError(e.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handlePictureChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const updated = await uploadProfilePicture(file);
      setProfile(updated);
      setAuth({ ...updated, approvalLevel: updated.approvalLevel }, accessToken, null);
      setSuccess('Profile picture updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to upload picture');
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveName() {
    if (!editFullName.trim() || editFullName.trim() === profile.fullName) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await updateProfile({ fullName: editFullName.trim() });
      setProfile(updated);
      setAuth({ ...updated, approvalLevel: updated.approvalLevel }, accessToken, null);
      setEditing(false);
      setSuccess('Name updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to update name');
    } finally {
      setSaving(false);
    }
  }

  function formatDesignation(d) {
    if (!d) return '\u2014';
    const map = { INTERNEE: 'Internee', WCF: 'WCF', OFFICER: 'Officer', COMDT: 'Commandant' };
    return map[d] || d;
  }

  const avatarUrl = profile?.profilePicture ? `${profile.profilePicture}?t=${Date.now()}` : null;

  return (
    <SidebarLayout>
      <div className="flex min-h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-lg">
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-military-base border-t-transparent" />
            <p className="mt-4 text-sm text-slate-400">Loading profile…</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:gap-0">
            {/* Left — personnel & security */}
            <div className="order-2 flex min-w-0 flex-1 flex-col gap-6 lg:order-1 lg:overflow-y-auto lg:border-r lg:border-slate-800/80 lg:p-6 lg:pr-8 sidebar-scroll">
              {(success || error) && (
                <div
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${
                    success
                      ? 'border border-emerald-800/60 bg-emerald-950/40 text-emerald-300'
                      : 'border border-red-800/60 bg-red-950/50 text-red-200'
                  }`}
                >
                  {success ? <IconCheck className="h-4 w-4 shrink-0" /> : null}
                  {success || error}
                </div>
              )}

              <section className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 ring-1 ring-slate-800/40 sm:p-6">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Personnel Information
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow icon={IconUser} label="Full Name" value={profile?.fullName} />
                  <InfoRow icon={IconMail} label="Email" value={profile?.email} />
                  <InfoRow icon={IconId} label="Employee / CNIC / PA No." value={profile?.employeeId} />
                  <InfoRow icon={IconShieldChevron} label="Designation" value={formatDesignation(profile?.designation)} />
                  <InfoRow icon={IconMilitaryRank} label="Rank" value={profile?.rank} />
                  <InfoRow icon={IconBuildingFortress} label="Unit" value={profile?.unit || 'HQ'} />
                  <InfoRow icon={IconShieldChevron} label="Role" value={profile?.role?.replace('_', ' ')?.toUpperCase()} />
                  <InfoRow
                    icon={IconCalendar}
                    label="Joined"
                    value={
                      profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString(undefined, {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : null
                    }
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 ring-1 ring-slate-800/40 sm:p-6">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Security
                </h3>
                <div className="flex flex-col gap-4 rounded-xl border border-slate-800/60 bg-slate-800/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-military-base/20 text-military-pale">
                      <IconLock className="h-4 w-4" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-100">Password</p>
                      <p className="text-[11px] text-slate-500">
                        Change your account password via email verification
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/change-password"
                    className="shrink-0 rounded-lg bg-military-base/80 px-4 py-2 text-center text-xs font-semibold text-white transition hover:bg-military-base"
                  >
                    Change Password
                  </Link>
                </div>
              </section>
            </div>

            {/* Right — profile picture & identity */}
            <aside className="order-1 flex w-full shrink-0 flex-col items-center border-b border-slate-800/80 bg-slate-900/40 px-5 py-8 sm:px-8 lg:order-2 lg:w-[22rem] lg:border-b-0 lg:border-l lg:border-slate-800/80 xl:w-[26rem]">
              <div className="flex w-full max-w-sm flex-col items-center text-center lg:max-w-none">
                <div className="group relative">
                  <div className="h-36 w-36 overflow-hidden rounded-full border-4 border-military-base/50 bg-slate-800 shadow-xl shadow-military-dark/20 sm:h-44 sm:w-44 lg:h-52 lg:w-52">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-military-base to-military-light text-5xl font-bold text-military-pale sm:text-6xl lg:text-7xl">
                        {profile?.fullName?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-900 bg-military-base text-white shadow-lg transition hover:bg-military-dark disabled:opacity-50 sm:h-11 sm:w-11"
                    title="Change profile picture"
                  >
                    {uploading ? (
                      <IconLoader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <IconCamera className="h-5 w-5" />
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePictureChange}
                  />
                </div>

                <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  Profile Photo
                </p>
                <p className="mt-1 text-xs text-slate-500">JPG, PNG or WebP — max 5 MB</p>

                <div className="mt-8 w-full border-t border-slate-800/80 pt-8">
                  {editing ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-center text-lg font-semibold text-slate-50 outline-none focus:border-military-base focus:ring-1 focus:ring-military-base"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveName}
                          disabled={saving}
                          className="flex-1 rounded-lg bg-military-base px-3 py-2 text-sm font-medium text-white hover:bg-military-dark disabled:opacity-50"
                        >
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditing(false);
                            setEditFullName(profile.fullName);
                          }}
                          className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <h2
                      className="cursor-pointer text-xl font-bold text-slate-50 transition hover:text-military-pale sm:text-2xl"
                      onClick={() => setEditing(true)}
                      title="Click to edit name"
                    >
                      {profile?.fullName}
                    </h2>
                  )}

                  <p className="mt-2 text-sm text-slate-400">
                    <span className="font-semibold uppercase text-military-pale/80">{profile?.role}</span>
                    {profile?.designation && (
                      <span className="text-slate-500"> · {formatDesignation(profile.designation)}</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Member since{' '}
                    {new Date(profile?.createdAt).toLocaleDateString(undefined, {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
