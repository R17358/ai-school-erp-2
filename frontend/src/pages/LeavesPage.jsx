// frontend/src/pages/LeavesPage.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Check, X, Clock, Calendar } from 'lucide-react';
import api from '../services/api';
import { selectUserRole, selectUser } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import Modal from '../components/ui/Modal';

const STATUS_CONFIG = {
  PENDING:  { color: 'badge-warning', label: 'Pending' },
  APPROVED: { color: 'badge-success', label: 'Approved' },
  REJECTED: { color: 'badge-danger',  label: 'Rejected' },
  CANCELLED:{ color: 'badge-gray',    label: 'Cancelled' },
};

const MOCK_LEAVES = [
  { id:'1', leaveType:{name:'Casual Leave'}, startDate:'2024-10-15', endDate:'2024-10-16', days:2, reason:'Personal work', status:'PENDING', requester:{teacherProfile:{firstName:'Sunita', lastName:'Kulkarni'}}, aiSuggestion:'Recommend APPROVE — employee has sufficient CL balance (4 remaining) and low leave history this quarter.' },
  { id:'2', leaveType:{name:'Sick Leave'}, startDate:'2024-10-10', endDate:'2024-10-10', days:1, reason:'Fever and cold', status:'APPROVED', requester:{teacherProfile:{firstName:'Rajesh', lastName:'Mehta'}}, aiSuggestion:'APPROVE — medical reason, first SL this month.' },
  { id:'3', leaveType:{name:'Earned Leave'}, startDate:'2024-10-20', endDate:'2024-10-25', days:6, reason:'Family function', status:'REJECTED', requester:{teacherProfile:{firstName:'Priya', lastName:'Joshi'}}, aiSuggestion:'CAUTION — exam period, teacher absence may affect student preparation.' },
];

export default function LeavesPage() {
  const role = useSelector(selectUserRole);
  const user = useSelector(selectUser);
  const canApprove = ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL'].includes(role);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ leaveTypeId:'', startDate:'', endDate:'', reason:'' });
  const [applying, setApplying] = useState(false);
  const [tab, setTab] = useState(canApprove ? 'all' : 'mine');

  useEffect(() => {
    api.get('/leaves').then(r => setLeaves(r.data.data || []))
      .catch(() => setLeaves(MOCK_LEAVES))
      .finally(() => setLoading(false));
  }, []);

  const applyLeave = async () => {
    if (!form.leaveTypeId || !form.startDate || !form.endDate || !form.reason)
      return toast.error('Fill all fields');
    setApplying(true);
    try {
      await api.post('/leaves', form);
      toast.success('Leave application submitted!');
      setShowApply(false);
    } catch { toast.success('Leave applied (demo)'); setShowApply(false); }
    finally { setApplying(false); }
  };

  const handleAction = async (id, action, note) => {
    try {
      await api.patch(`/leaves/${id}/${action}`, { note });
      toast.success(`Leave ${action}d`);
      setLeaves(prev => prev.map(l => l.id === id ? {...l, status: action.toUpperCase()} : l));
    } catch { toast.success(`Leave ${action}d (demo)`); }
  };

  const leaveTypes = ['Casual Leave','Sick Leave','Earned Leave','Maternity Leave','Paternity Leave'];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="section-header">
        <div><h1 className="section-title">Leave Management</h1>
          <p className="text-sm text-slate-400">Apply, track and approve leaves</p>
        </div>
        <button className="btn-primary" onClick={() => setShowApply(true)}><Plus className="w-4 h-4" /> Apply Leave</button>
      </div>

      {/* Balance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[['Casual', 4, 12], ['Sick', 2, 12], ['Earned', 8, 18], ['Total Used', 14, 42]].map(([type, used, total]) => (
          <div key={type} className="card p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{type} Leave</p>
            <p className="text-2xl font-display font-bold text-slate-800 dark:text-white mt-1">{total - used}</p>
            <p className="text-xs text-slate-400">remaining of {total}</p>
            <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${((total-used)/total)*100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Tab toggle for admins */}
      {canApprove && (
        <div className="flex gap-2">
          {['all','mine'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={t === tab ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>
              {t === 'all' ? 'All Requests' : 'My Leaves'}
            </button>
          ))}
        </div>
      )}

      {/* Leave List */}
      <div className="space-y-3">
        {loading ? Array.from({length:3}).map((_,i) => <div key={i} className="shimmer h-28 rounded-2xl" />)
        : leaves.map(leave => {
          const sConfig = STATUS_CONFIG[leave.status] || STATUS_CONFIG.PENDING;
          const name = leave.requester?.teacherProfile
            ? `${leave.requester.teacherProfile.firstName} ${leave.requester.teacherProfile.lastName}`
            : leave.requester?.staffProfile
            ? `${leave.requester.staffProfile.firstName} ${leave.requester.staffProfile.lastName}`
            : 'Unknown';

          return (
            <div key={leave.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{name}</p>
                      <span className={clsx('badge text-xs', sConfig.color)}>{sConfig.label}</span>
                      <span className="badge-gray text-xs">{leave.leaveType?.name}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {new Date(leave.startDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                      {leave.startDate !== leave.endDate && ` – ${new Date(leave.endDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}`}
                      <span className="mx-2">·</span>{leave.days} day{leave.days > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 italic">"{leave.reason}"</p>
                    {leave.aiSuggestion && (
                      <div className="mt-2 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-700/50 text-xs text-violet-700 dark:text-violet-300 flex items-start gap-2">
                        <span className="shrink-0 font-bold">AI:</span>
                        <span>{leave.aiSuggestion}</span>
                      </div>
                    )}
                  </div>
                </div>

                {canApprove && leave.status === 'PENDING' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleAction(leave.id, 'approve', '')}
                      className="p-2 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 transition-base" title="Approve">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleAction(leave.id, 'reject', '')}
                      className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-base" title="Reject">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Apply Modal */}
      <Modal isOpen={showApply} onClose={() => setShowApply(false)} title="Apply for Leave">
        <div className="space-y-4">
          <div><label className="label">Leave Type *</label>
            <select className="input" value={form.leaveTypeId} onChange={e => setForm({...form, leaveTypeId: e.target.value})}>
              <option value="">Select Leave Type</option>
              {leaveTypes.map(lt => <option key={lt} value={lt}>{lt}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">From *</label>
              <input type="date" className="input" value={form.startDate}
                onChange={e => setForm({...form, startDate: e.target.value})} /></div>
            <div><label className="label">To *</label>
              <input type="date" className="input" value={form.endDate}
                onChange={e => setForm({...form, endDate: e.target.value})} /></div>
          </div>
          <div><label className="label">Reason *</label>
            <textarea className="input" rows={3} placeholder="Reason for leave..."
              value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} /></div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setShowApply(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={applyLeave} disabled={applying}>
              {applying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Application'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
