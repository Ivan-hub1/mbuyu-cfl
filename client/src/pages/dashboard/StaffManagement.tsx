import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import LoadingOverlay from '../../components/splash/LoadingOverlay';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
  staffRole?: 'HEAD_OFFICE' | 'DRIVER' | 'OPERATIONS' | null;
  isActive: boolean;
  createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  CUSTOMER: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  STAFF: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  ADMIN: 'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
  SUPER_ADMIN: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const STAFF_ROLE_COLORS: Record<string, string> = {
  DRIVER: 'bg-brand-orange/15 text-brand-orange border-brand-orange/30',
  OPERATIONS: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  HEAD_OFFICE: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
};

export default function StaffManagement() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleResendInvite = async (id: string, name: string) => {
    if (
      !confirm(
        `Send ${name} a new temporary password by email?\n\nTheir current password will stop working.`
      )
    ) {
      return;
    }
    try {
      const { data } = await api.post(`/admin/users/${id}/resend-invite`);
      alert(
        data._emailSent
          ? `✅ Login details emailed to ${data.email}.`
          : `⚠ ${data._emailError}\n\nGive ${name} this temporary password yourself:\n\n${data.tempPassword}`
      );
    } catch (err) {
      console.error(err);
      alert('Failed to resend login details');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete user');
    }
  };

  return (
    <>
      <LoadingOverlay visible={showLoadingOverlay} message="Creating user…" />

      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold">Staff & Users</h2>
            <p className="text-gray-400 text-sm mt-1">
              {users.length} total users
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refresh}
              className="btn-outline text-sm px-4 py-2"
              disabled={loading}
            >
              {loading ? '↻ Loading…' : '↻ Refresh'}
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary text-sm px-4 py-2"
            >
              + Create User
            </button>
          </div>
        </div>

        {error && (
          <div className="card text-center py-8 text-red-400 mb-6">{error}</div>
        )}

        {!error && users.length === 0 && (
          <div className="card text-center py-16">
            <p className="text-gray-400">No users yet.</p>
          </div>
        )}

        {!error && users.length > 0 && (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-black-muted text-gray-400 text-left">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium hidden md:table-cell">Phone</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium hidden lg:table-cell">
                    Staff Role
                  </th>
                  <th className="p-4 font-medium hidden lg:table-cell">
                    Status
                  </th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-brand-black-muted last:border-0 hover:bg-brand-black/40"
                  >
                    <td className="p-4 font-medium">{u.name}</td>
                    <td className="p-4 text-gray-300">{u.email}</td>
                    <td className="p-4 hidden md:table-cell text-gray-400">
                      {u.phone || '—'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[u.role]}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {u.staffRole ? (
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${STAFF_ROLE_COLORS[u.staffRole]}`}
                        >
                          {u.staffRole.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {u.isActive ? (
                        <span className="text-green-400 text-xs">Active</span>
                      ) : (
                        <span className="text-red-400 text-xs">Disabled</span>
                      )}
                    </td>
                    <td className="p-4">
                      {u.id !== currentUser?.id ? (
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleResendInvite(u.id, u.name)}
                            className="text-brand-orange hover:underline text-xs"
                          >
                            Resend login
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">(You)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            refresh();
          }}
          setLoading={setShowLoadingOverlay}
        />
      )}
    </>
  );
}

// ─── Create User Modal ─────────────────────────────────────
function CreateUserModal({
  onClose,
  onSuccess,
  setLoading,
}: {
  onClose: () => void;
  onSuccess: () => void;
  setLoading: (v: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'STAFF' | 'ADMIN'>('STAFF');
  const [staffRole, setStaffRole] = useState<
    'HEAD_OFFICE' | 'DRIVER' | 'OPERATIONS' | ''
  >('DRIVER');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'STAFF' && !staffRole) {
      setError('Please select a staff role.');
      return;
    }

    setLoading(true);
    const minDuration = new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      await Promise.all([
        api.post('/admin/users', {
          name,
          email,
          phone: phone || undefined,
          password,
          role,
          staffRole: role === 'STAFF' ? staffRole : null,
        }),
        minDuration,
      ]);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error || 'Failed to create user. Try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="card w-full max-w-md my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Create User</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Full Name
            </label>
            <input
              className="input-field"
              placeholder="e.g. Daniel Okello"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="daniel@mbuyucfl.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Phone (optional)
            </label>
            <input
              className="input-field"
              placeholder="+256 700 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Account Role
            </label>
            <select
              className="input-field"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as 'CUSTOMER' | 'STAFF' | 'ADMIN')
              }
            >
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="STAFF">STAFF</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          {role === 'STAFF' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Staff Role
              </label>
              <select
                className="input-field"
                value={staffRole}
                onChange={(e) =>
                  setStaffRole(
                    e.target.value as
                      | 'HEAD_OFFICE'
                      | 'DRIVER'
                      | 'OPERATIONS'
                      | ''
                  )
                }
                required
              >
                <option value="DRIVER">
                  DRIVER — can do checklists & journeys
                </option>
                <option value="OPERATIONS">
                  OPERATIONS — maintenance queue
                </option>
                <option value="HEAD_OFFICE">
                  HEAD OFFICE — general staff
                </option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Drivers see the vehicle checklist and journey tracker.
                Operations see maintenance tickets.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Temporary Password
            </label>
            <input
              type="text"
              className="input-field font-mono"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Share this with the new user. They can change it after logging in.
            </p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline text-sm"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-sm">
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}