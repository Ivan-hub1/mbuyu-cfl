import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import Navbar from '../../components/layout/Navbar';
import SEO from '../../components/seo/SEO';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  createdAt: string;
}

export default function Profile() {
  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileMsg, setProfileMsg] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/profile');
        setProfile(data.user);
        setName(data.user.name);
        setPhone(data.user.phone || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    try {
      const { data } = await api.patch('/profile', { name, phone });
      const updated = data.user;
      setProfile(updated);
      if (user) {
        setUser({ ...user, name: updated.name });
      }
      setProfileMsg({ type: 'ok', text: 'Profile updated successfully' });
    } catch (err: any) {
      setProfileMsg({
        type: 'err',
        text: err?.response?.data?.error || 'Failed to update profile',
      });
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'err', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({
        type: 'err',
        text: 'Password must be at least 6 characters',
      });
      return;
    }

    try {
      await api.post('/profile/password', { currentPassword, newPassword });
      setPasswordMsg({ type: 'ok', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({
        type: 'err',
        text: err?.response?.data?.error || 'Failed to change password',
      });
    }
  };

  if (loading) {
    return (
      <>
        <SEO title="My Profile" description="Manage your Mbuyu CFL account." />
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-12">
          <p className="text-gray-400">Loading profile…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="My Profile" description="Manage your Mbuyu CFL account." />

      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-gray-400 mb-8">
            Manage your account details and password.
          </p>

          <section className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Account Details</h2>

            <div className="mb-4 text-sm">
              <p className="text-gray-500">Email</p>
              <p className="text-gray-200">{profile?.email}</p>
            </div>

            <div className="mb-4 text-sm">
              <p className="text-gray-500">Role</p>
              <p className="text-gray-200">{profile?.role}</p>
            </div>

            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Full Name
                </label>
                <input
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Phone
                </label>
                <input
                  className="input-field"
                  placeholder="+256 700 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {profileMsg && (
                <p
                  className={`text-sm ${
                    profileMsg.type === 'ok'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {profileMsg.text}
                </p>
              )}

              <button type="submit" className="btn-primary text-sm">
                Save Changes
              </button>
            </form>
          </section>

          <section className="card mb-6">
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>

            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              {passwordMsg && (
                <p
                  className={`text-sm ${
                    passwordMsg.type === 'ok'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {passwordMsg.text}
                </p>
              )}

              <button type="submit" className="btn-primary text-sm">
                Change Password
              </button>
            </form>
          </section>

          <section className="card">
            <h2 className="text-lg font-semibold mb-4">Sign Out</h2>
            <p className="text-sm text-gray-400 mb-4">
              Log out of this device.
            </p>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="btn-outline text-sm"
            >
              Sign Out
            </button>
          </section>
        </div>
      </div>
    </>
  );
}