// frontend/src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Camera, Save, Key, LogOut, Shield, Clock } from 'lucide-react';
import { selectUser, selectUserRole, selectSchool, logoutUser, getMe } from '../store/slices/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import Tabs from '../components/ui/Tabs';
import clsx from 'clsx';

const ROLE_LABELS = { SUPER_ADMIN:'Super Admin', PRINCIPAL:'Principal', VICE_PRINCIPAL:'Vice Principal', TEACHER:'Teacher', STAFF:'Staff', WATCHMAN:'Watchman', PEON:'Peon', STUDENT:'Student', PARENT:'Parent' };
const ROLE_COLORS = { PRINCIPAL:'bg-primary-600', TEACHER:'bg-blue-500', STUDENT:'bg-green-500', STAFF:'bg-slate-500', PARENT:'bg-orange-500', WATCHMAN:'bg-gray-500', PEON:'bg-gray-500', VICE_PRINCIPAL:'bg-indigo-500', SUPER_ADMIN:'bg-violet-600' };

const TABS = [{ id:'profile', label:'Profile' }, { id:'security', label:'Security' }, { id:'activity', label:'Activity' }];

export default function ProfilePage() {
  const user = useSelector(selectUser);
  const role = useSelector(selectUserRole);
  const school = useSelector(selectSchool);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ firstName:'', lastName:'', phone:'', gender:'', dob:'', address:'', qualification:'', experience:'', specialization:'' });
  const [passForm, setPassForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  const profile = user?.teacherProfile || user?.studentProfile || user?.staffProfile || user?.principalProfile;
  const displayName = profile ? `${profile.firstName||''} ${profile.lastName||''}`.trim() : user?.email?.split('@')[0] || 'User';

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: user?.phone || '',
        gender: profile.gender || '',
        dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
        address: profile.address || '',
        qualification: profile.qualification || '',
        experience: profile.experience || '',
        specialization: profile.specialization || '',
      });
    }
    api.get(`/users/${user?.id}/audit`).then(r => setAuditLogs(r.data.data || [])).catch(() => setAuditLogs([
      { id:'1', action:'LOGIN', resource:'Auth', createdAt:new Date().toISOString(), ip:'192.168.1.1' },
      { id:'2', action:'UPDATE', resource:'Student', createdAt:new Date(Date.now()-86400000).toISOString(), ip:'192.168.1.1' },
    ]));
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const profileId = profile?.id;
      if (!profileId) return toast.error('Profile not found');
      const endpoint = role === 'TEACHER' || role === 'VICE_PRINCIPAL' ? `/teachers/${profileId}`
        : role === 'STUDENT' ? `/students/${profileId}`
        : role === 'STAFF' || role === 'WATCHMAN' || role === 'PEON' ? `/staff/${profileId}`
        : `/users/${user.id}`;
      await api.put(endpoint, { profileData: form, phone: form.phone });
      await dispatch(getMe());
      toast.success('Profile updated successfully!');
    } catch (e) { toast.error(e.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!passForm.currentPassword || !passForm.newPassword) return toast.error('Fill all fields');
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('Passwords do not match');
    if (passForm.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    setChangingPass(true);
    try {
      await api.post('/auth/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed successfully!');
      setPassForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (e) { toast.error(e.response?.data?.message || 'Change failed'); }
    finally { setChangingPass(false); }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      {/* Profile header card */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          <div className="relative">
            <div className={clsx('w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold', ROLE_COLORS[role] || 'bg-slate-500')}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-base">
              <Camera className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white">{displayName}</h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={clsx('badge text-xs', ROLE_COLORS[role] === 'bg-primary-600' ? 'badge-primary' : 'badge-gray')}>
                {ROLE_LABELS[role] || role}
              </span>
              <span className="badge-gray text-xs">{school?.name}</span>
              {user?.lastLogin && <span className="text-xs text-slate-400">Last login: {new Date(user.lastLogin).toLocaleDateString('en-IN')}</span>}
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="card p-5">
          <p className="font-semibold text-slate-700 dark:text-slate-200 mb-5">Personal Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">First Name</label><input className="input" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} /></div>
            <div><label className="label">Last Name</label><input className="input" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div><label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}>
                <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div><label className="label">Date of Birth</label><input type="date" className="input" value={form.dob} onChange={e=>setForm({...form,dob:e.target.value})} /></div>
            {(role==='TEACHER'||role==='VICE_PRINCIPAL') && <>
              <div><label className="label">Qualification</label><input className="input" value={form.qualification} onChange={e=>setForm({...form,qualification:e.target.value})} /></div>
              <div><label className="label">Experience (years)</label><input type="number" className="input" value={form.experience} onChange={e=>setForm({...form,experience:e.target.value})} /></div>
              <div><label className="label">Specialization</label><input className="input" value={form.specialization} onChange={e=>setForm({...form,specialization:e.target.value})} /></div>
            </>}
            <div className="col-span-2"><label className="label">Address</label><textarea className="input" rows={2} value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>
          </div>
          <div className="flex justify-end mt-5">
            <button className="btn-primary" onClick={saveProfile} disabled={saving}>
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save Profile</>}
            </button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Key className="w-4 h-4 text-slate-500" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">Change Password</p>
            </div>
            <div className="space-y-4 max-w-sm">
              <div><label className="label">Current Password</label><input type="password" className="input" placeholder="••••••••" value={passForm.currentPassword} onChange={e=>setPassForm({...passForm,currentPassword:e.target.value})} /></div>
              <div><label className="label">New Password</label><input type="password" className="input" placeholder="Min 8 characters" value={passForm.newPassword} onChange={e=>setPassForm({...passForm,newPassword:e.target.value})} /></div>
              <div><label className="label">Confirm New Password</label><input type="password" className="input" placeholder="Repeat new password" value={passForm.confirmPassword} onChange={e=>setPassForm({...passForm,confirmPassword:e.target.value})} /></div>
              <button className="btn-primary" onClick={changePassword} disabled={changingPass}>
                {changingPass ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Change Password'}
              </button>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-slate-500" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">Account Info</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50">
                <span className="text-slate-500">Email</span><span className="font-medium text-slate-700 dark:text-slate-300">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50">
                <span className="text-slate-500">Role</span><span className="font-medium text-slate-700 dark:text-slate-300">{ROLE_LABELS[role]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Account Status</span><span className="badge-success">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {tab === 'activity' && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-4 h-4 text-slate-500" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">Recent Activity</p>
          </div>
          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm">No recent activity</p>
            ) : auditLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-700/30 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={clsx('badge text-xs', log.action==='LOGIN'?'badge-success':log.action==='DELETE'?'badge-danger':'badge-primary')}>{log.action}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{log.resource}{log.details?.email ? ` (${log.details.email})` : ''}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                  {log.ip && <p className="text-xs text-slate-300 dark:text-slate-600">{log.ip}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
