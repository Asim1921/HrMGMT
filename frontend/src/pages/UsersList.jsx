import { useState, useEffect, useMemo } from 'react';
import {
  IconSearch,
  IconFilter,
  IconUser,
  IconEdit,
  IconTrash,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconUsers,
  IconChevronRight,
  IconMail,
  IconId,
  IconShieldChevron,
  IconBuildingFortress,
  IconMilitaryRank,
  IconCalendar,
  IconLoader2,
} from '@tabler/icons-react';
import { SidebarLayout } from '../components/SidebarLayout';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { listUsers, updateUser, deleteUser } from '../api/users';
import { useAuth } from '../hooks/useAuth';

const DESIGNATION_LABEL = { INTERNEE: 'Internee', WCF: 'WCF', OFFICER: 'Officer', COMDT: 'Commandant' };
const ROLE_LABEL = { super_admin: 'Super Admin', admin: 'Admin', user: 'User' };
const STATUS_CONFIG = {
  active:    { label: 'Active',    cls: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30' },
  inactive:  { label: 'Inactive',  cls: 'bg-slate-500/15 text-slate-400 ring-slate-500/30' },
  suspended: { label: 'Suspended', cls: 'bg-red-500/15 text-red-400 ring-red-500/30' },
};

function UserAvatar({ user, size = 'h-10 w-10' }) {
  if (user?.profilePicture) {
    return <img src={user.profilePicture} alt="" className={`${size} rounded-full object-cover ring-2 ring-slate-700/50`} />;
  }
  return (
    <div className={`${size} flex items-center justify-center rounded-full bg-gradient-to-br from-military-base to-military-light text-sm font-bold text-military-pale ring-2 ring-slate-700/50`}>
      {user?.fullName?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function isFieldPersonnel(u) {
  return u?.designation === 'INTERNEE' || u?.designation === 'WCF';
}

function isG2Officer(u) {
  return u?.approvalLevel === 1;
}

function isG1Officer(u) {
  return u?.approvalLevel === 2;
}

function EditModal({ user, onClose, onSave, isSuperAdmin, isG1, rosterUsers }) {
  const [form, setForm] = useState({
    fullName: user.fullName || '',
    role: user.role || 'user',
    designation: user.designation || '',
    rank: user.rank || '',
    unit: user.unit || '',
    status: user.status || 'active',
    approvalLevel: user.approvalLevel ?? '',
    employeeId: user.employeeId || '',
    reportingToId: user.reportingToId || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const g2Officers = useMemo(
    () => rosterUsers.filter((u) => isG2Officer(u) && u.id !== user.id),
    [rosterUsers, user.id],
  );
  const g1Officers = useMemo(
    () => rosterUsers.filter((u) => isG1Officer(u) && u.id !== user.id),
    [rosterUsers, user.id],
  );

  const showFieldAssignment = isFieldPersonnel(user) && (isSuperAdmin || isG1);
  const showG2Assignment = isG2Officer(user) && isSuperAdmin;

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        fullName: form.fullName,
        designation: form.designation || null,
        rank: form.rank || null,
        status: form.status,
      };
      if (showFieldAssignment || showG2Assignment) {
        payload.reportingToId = form.reportingToId || null;
      }
      if (isSuperAdmin) {
        payload.role = form.role;
        payload.unit = form.unit || null;
        payload.approvalLevel = form.approvalLevel !== '' ? Number(form.approvalLevel) : null;
      }
      const updated = await onSave(user.id, payload);
      onClose(updated);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-sm text-slate-50 focus:border-military-base focus:outline-none focus:ring-1 focus:ring-military-base/40';
  const labelCls = 'mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => onClose(null)}>
      <div className="relative mx-4 w-full max-w-lg rounded-2xl border border-slate-800/80 bg-slate-900 p-6 shadow-2xl ring-1 ring-slate-800/40" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => onClose(null)} className="absolute right-4 top-4 rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300">
          <IconX className="h-5 w-5" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <UserAvatar user={user} size="h-11 w-11" />
          <div>
            <h3 className="text-lg font-semibold text-slate-50">{user.fullName}</h3>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-xs text-red-200">
            <IconAlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Full Name</label>
              <input type="text" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Employee / CNIC / PA</label>
              <input type="text" value={form.employeeId} className={`${inputCls} cursor-not-allowed opacity-60`} disabled title="Cannot be changed" />
            </div>
            <div>
              <label className={labelCls}>Designation</label>
              <select value={form.designation} onChange={(e) => set('designation', e.target.value)} className={inputCls}>
                <option value="">None</option>
                <option value="INTERNEE">Internee</option>
                <option value="WCF">WCF</option>
                <option value="OFFICER">Officer</option>
                <option value="COMDT">Commandant</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Rank</label>
              <input type="text" value={form.rank} onChange={(e) => set('rank', e.target.value)} className={inputCls} placeholder="e.g. WCF, Major" />
            </div>
            <div>
              <label className={labelCls}>Unit</label>
              <select value={form.unit} onChange={(e) => set('unit', e.target.value)} className={inputCls}>
                <option value="">None</option>
                <option value="802 Grp">802 Grp</option>
                <option value="803 Grp">803 Grp</option>
                <option value="804 Grp">804 Grp</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            {isSuperAdmin && (
              <div>
                <label className={labelCls}>Role</label>
                <select value={form.role} onChange={(e) => set('role', e.target.value)} className={inputCls}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            )}
            {isSuperAdmin && (
              <div>
                <label className={labelCls}>Approval Level</label>
                <select value={form.approvalLevel} onChange={(e) => set('approvalLevel', e.target.value)} className={inputCls}>
                  <option value="">None</option>
                  <option value="1">1 — G-2 (Offr)</option>
                  <option value="2">2 — G-1</option>
                  <option value="3">3 — Comdt</option>
                </select>
              </div>
            )}
          </div>

          {(showFieldAssignment || showG2Assignment) && (
            <div className="rounded-xl border border-military-base/30 bg-military-base/5 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-military-pale/80">
                Chain of Command
              </p>
              {showFieldAssignment && (
                <div>
                  <label className={labelCls}>Assigned G-2 Officer</label>
                  <select
                    value={form.reportingToId}
                    onChange={(e) => set('reportingToId', e.target.value)}
                    className={inputCls}
                    required
                  >
                    <option value="">Select G-2 officer…</option>
                    {g2Officers.map((officer) => (
                      <option key={officer.id} value={officer.id}>
                        {officer.fullName}{officer.unit ? ` · ${officer.unit}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {isG1
                      ? 'Assign this personnel to a G-2 officer under your command.'
                      : 'Assign this Internee/WCF to a G-2 officer.'}
                  </p>
                </div>
              )}
              {showG2Assignment && (
                <div>
                  <label className={labelCls}>Reports To (G-1)</label>
                  <select
                    value={form.reportingToId}
                    onChange={(e) => set('reportingToId', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select G-1 officer…</option>
                    {g1Officers.map((officer) => (
                      <option key={officer.id} value={officer.id}>
                        {officer.fullName}{officer.unit ? ` · ${officer.unit}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Assign this G-2 officer to a G-1 command line.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => onClose(null)} className="rounded-lg border border-slate-700/80 bg-slate-800/50 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700/60">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-military-base px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-military-dark disabled:opacity-50">
              {saving ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconCheck className="h-4 w-4" />}
              {saving ? 'Saving\u2026' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailPanel({ user, onClose, rosterUsers }) {
  if (!user) return null;
  const statusConf = STATUS_CONFIG[user.status] || STATUS_CONFIG.active;
  const manager = user.reportingTo || rosterUsers.find((u) => u.id === user.reportingToId);

  const rows = [
    { icon: IconUser, label: 'Full Name', value: user.fullName },
    { icon: IconMail, label: 'Email', value: user.email },
    { icon: IconId, label: 'Employee ID', value: user.employeeId },
    { icon: IconShieldChevron, label: 'Designation', value: DESIGNATION_LABEL[user.designation] || user.designation },
    { icon: IconMilitaryRank, label: 'Rank', value: user.rank },
    { icon: IconBuildingFortress, label: 'Unit', value: user.unit },
    { icon: IconShieldChevron, label: 'Role', value: ROLE_LABEL[user.role] || user.role },
    ...(isFieldPersonnel(user)
      ? [{ icon: IconUsers, label: 'Assigned G-2', value: manager?.fullName }]
      : isG2Officer(user)
        ? [{ icon: IconUsers, label: 'Reports To (G-1)', value: manager?.fullName }]
        : []),
    { icon: IconShieldChevron, label: 'Approval Level', value: user.approvalLevel ? `Level ${user.approvalLevel}` : null },
    { icon: IconCalendar, label: 'Joined', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : null },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900 p-6 shadow-2xl ring-1 ring-slate-800/40" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300">
          <IconX className="h-5 w-5" />
        </button>

        <div className="mb-5 flex flex-col items-center text-center">
          <UserAvatar user={user} size="h-16 w-16" />
          <h3 className="mt-3 text-lg font-bold text-slate-50">{user.fullName}</h3>
          <p className="text-xs text-slate-500">{user.email}</p>
          <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 ${statusConf.cls}`}>
            {statusConf.label}
          </span>
        </div>

        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3 rounded-lg bg-slate-800/30 px-3 py-2">
              <r.icon className="h-4 w-4 shrink-0 text-military-pale/60" strokeWidth={1.6} />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-28 shrink-0">{r.label}</span>
              <span className="text-sm text-slate-200 truncate">{r.value || '\u2014'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function UsersList() {
  const { isSuperAdmin, user } = useAuth();
  const isG1 = user?.approvalLevel === 2;
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterDesignation, setFilterDesignation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setError('');
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (filterStatus) params.status = filterStatus;
      const res = await listUsers(params);
      setUsers(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filterStatus]);

  const filtered = useMemo(() => {
    let list = users;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.employeeId?.toLowerCase().includes(q)
      );
    }
    if (filterDesignation) {
      list = list.filter((u) => u.designation === filterDesignation);
    }
    return list;
  }, [users, search, filterDesignation]);

  async function handleSave(id, payload) {
    const updated = await updateUser(id, payload);
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    return updated;
  }

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setTotal((t) => t - 1);
      setDeleteConfirm(null);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  }

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    internees: users.filter((u) => u.designation === 'INTERNEE').length,
    wcf: users.filter((u) => u.designation === 'WCF').length,
    officers: users.filter((u) => u.designation === 'OFFICER' || u.designation === 'COMDT').length,
  }), [users]);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-military-pale/60">Administration</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-50">Personnel Roster</h2>
          <p className="mt-1 text-sm text-slate-400">
            {isSuperAdmin
              ? 'Manage all users, profiles, roles, and permissions.'
              : user?.approvalLevel === 2
                ? 'Personnel assigned to you — G-2 officers and their Internee/WCF personnel.'
                : 'Personnel assigned to you — Internee and WCF under your command.'}
          </p>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: 'Total', value: stats.total, color: 'text-slate-50' },
              { label: 'Active', value: stats.active, color: 'text-emerald-400' },
              { label: 'Internees', value: stats.internees, color: 'text-sky-400' },
              { label: 'WCF', value: stats.wcf, color: 'text-amber-400' },
              { label: 'Officers', value: stats.officers, color: 'text-violet-400' },
            ].map((s) => (
              <CardSpotlight key={s.label} className="px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{s.label}</p>
                <p className={`mt-0.5 text-xl font-extrabold ${s.color}`}>{s.value}</p>
              </CardSpotlight>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID\u2026"
              className="w-full rounded-xl border border-slate-700/60 bg-slate-800/40 py-2.5 pl-10 pr-4 text-sm text-slate-50 placeholder:text-slate-600 focus:border-military-base focus:outline-none focus:ring-1 focus:ring-military-base/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <IconFilter className="h-4 w-4 text-slate-600" />
            <select
              value={filterDesignation}
              onChange={(e) => setFilterDesignation(e.target.value)}
              className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-xs font-medium text-slate-300 focus:border-military-base focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="INTERNEE">Internee</option>
              <option value="WCF">WCF</option>
              <option value="OFFICER">Officer</option>
              <option value="COMDT">Commandant</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-xs font-medium text-slate-300 focus:border-military-base focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            <IconAlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}

        {/* Users grid */}
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-military-base border-t-transparent" />
            <p className="mt-4 text-sm text-slate-500">Loading personnel\u2026</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <IconUsers className="h-14 w-14 text-slate-700" strokeWidth={1.2} />
            <p className="mt-4 text-base font-medium text-slate-400">No users found</p>
            <p className="mt-1 text-sm text-slate-600">{search || filterDesignation ? 'Try adjusting your filters.' : 'No personnel records yet.'}</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((u) => {
                const statusConf = STATUS_CONFIG[u.status] || STATUS_CONFIG.active;
                const desLabel = DESIGNATION_LABEL[u.designation] || u.designation || '\u2014';
                const manager = u.reportingTo || users.find((x) => x.id === u.reportingToId);
                return (
                  <CardSpotlight key={u.id} className="group p-4">
                    <div className="flex items-start gap-3">
                      <UserAvatar user={u} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-100">{u.fullName}</p>
                        <p className="truncate text-xs text-slate-500">{u.email}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ring-1 ${statusConf.cls}`}>
                        {statusConf.label}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-800/60 px-2 py-0.5 text-[10px] font-semibold text-slate-400">{desLabel}</span>
                      {u.rank && <span className="rounded-md bg-slate-800/60 px-2 py-0.5 text-[10px] font-semibold text-slate-400">{u.rank}</span>}
                      {u.unit && <span className="rounded-md bg-slate-800/60 px-2 py-0.5 text-[10px] font-semibold text-slate-400">{u.unit}</span>}
                      <span className="rounded-md bg-military-base/15 px-2 py-0.5 text-[10px] font-bold text-military-pale/80">{ROLE_LABEL[u.role] || u.role}</span>
                    </div>

                    {u.employeeId && (
                      <p className="mt-2 text-[11px] text-slate-600">ID: {u.employeeId}</p>
                    )}
                    {isFieldPersonnel(u) && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        G-2: <span className={manager ? 'text-military-pale/90' : 'text-amber-400/90'}>{manager?.fullName || 'Unassigned'}</span>
                      </p>
                    )}
                    {isG2Officer(u) && manager && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        G-1: <span className="text-military-pale/90">{manager.fullName}</span>
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between border-t border-slate-800/40 pt-3">
                      <button type="button" onClick={() => setViewUser(u)} className="flex items-center gap-1 text-xs text-slate-500 transition hover:text-military-pale">
                        View Details <IconChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <div className="flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => setEditUser(u)}
                          className="rounded-lg bg-slate-800/60 p-1.5 text-slate-400 transition hover:bg-military-base/30 hover:text-military-pale"
                          title="Edit user"
                        >
                          <IconEdit className="h-4 w-4" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(u)}
                            className="rounded-lg bg-slate-800/60 p-1.5 text-slate-400 transition hover:bg-red-500/20 hover:text-red-400"
                            title="Delete user"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </CardSpotlight>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Edit modal */}
      {editUser && (
        <EditModal
          user={editUser}
          isSuperAdmin={isSuperAdmin}
          isG1={isG1}
          rosterUsers={users}
          onSave={handleSave}
          onClose={(updated) => {
            setEditUser(null);
            if (updated) setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
          }}
        />
      )}

      {/* View detail modal */}
      {viewUser && <DetailPanel user={viewUser} rosterUsers={users} onClose={() => setViewUser(null)} />}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-red-800/50 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                <IconTrash className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-50">Delete User</h3>
              <p className="mt-2 text-sm text-slate-400">
                Are you sure you want to permanently delete <span className="font-semibold text-slate-200">{deleteConfirm.fullName}</span>? This action cannot be undone.
              </p>
              <div className="mt-5 flex gap-3">
                <button type="button" onClick={() => setDeleteConfirm(null)} className="rounded-lg border border-slate-700/80 bg-slate-800/50 px-5 py-2 text-sm text-slate-300 hover:bg-slate-700/60">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirm.id)}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconTrash className="h-4 w-4" />}
                  {deleting ? 'Deleting\u2026' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
