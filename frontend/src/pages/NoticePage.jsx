// frontend/src/pages/NoticePage.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Bell, Plus, Trash2, AlertCircle, Clock, Search, Filter } from 'lucide-react';
import api from '../services/api';
import { selectUserRole } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import clsx from 'clsx';

const AUDIENCE_OPTS = ['ALL','TEACHER','STUDENT','PARENT','STAFF','WATCHMAN','PEON'];

const MOCK_NOTICES = [
  { id:'1', title:'Annual Day Celebration', content:'Annual Day will be celebrated on 20th December 2024. All students, parents and staff are cordially invited. Cultural programs, prize distribution and dinner will follow.', audience:['ALL'], isUrgent:false, publishedAt:'2024-10-28T09:00:00', postedBy:'Principal' },
  { id:'2', title:'Unit Test 3 Schedule Released', content:'Unit Test 3 will be conducted from 15th–20th November 2024. The detailed timetable has been shared with class teachers. Students must carry their admit cards.', audience:['STUDENT','PARENT','TEACHER'], isUrgent:true, publishedAt:'2024-10-27T14:30:00', postedBy:'Vice Principal' },
  { id:'3', title:'Staff Meeting — Saturday', content:'All teaching and non-teaching staff are required to attend a mandatory staff meeting this Saturday at 10:00 AM in the conference hall. Attendance is compulsory.', audience:['TEACHER','STAFF'], isUrgent:false, publishedAt:'2024-10-26T11:00:00', postedBy:'Principal' },
  { id:'4', title:'Fee Payment Reminder', content:'October month fees are due by 10th November 2024. A late fine of ₹100 per day will be charged after the due date. Please pay through the school office or online portal.', audience:['STUDENT','PARENT'], isUrgent:true, publishedAt:'2024-10-25T10:00:00', postedBy:'Accountant' },
  { id:'5', title:'Winter Uniform from December', content:'All students are instructed to switch to winter uniform from 1st December 2024. Blazer and tie are mandatory during winter months.', audience:['STUDENT','PARENT'], isUrgent:false, publishedAt:'2024-10-22T09:00:00', postedBy:'Principal' },
];

export default function NoticePage() {
  const role = useSelector(selectUserRole);
  const canPost = ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','TEACHER'].includes(role);

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:'', content:'', audience:['ALL'], isUrgent:false, expiresAt:'' });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    api.get('/notices').then(r => setNotices(r.data.data || [])).catch(() => setNotices(MOCK_NOTICES)).finally(() => setLoading(false));
  };

  const save = async () => {
    if (!form.title || !form.content) return toast.error('Title and content required');
    if (form.audience.length === 0) return toast.error('Select at least one audience');
    setSaving(true);
    try {
      await api.post('/notices', { ...form, expiresAt: form.expiresAt || undefined });
      toast.success('Notice posted successfully!');
      setShowModal(false);
      setForm({ title:'', content:'', audience:['ALL'], isUrgent:false, expiresAt:'' });
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to post'); } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this notice?')) return;
    try { await api.delete(`/notices/${id}`); toast.success('Notice deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const toggleAudience = (aud) => {
    setForm(f => ({
      ...f,
      audience: f.audience.includes(aud) ? f.audience.filter(a => a !== aud) : [...f.audience, aud]
    }));
  };

  const filtered = notices.filter(n => {
    const matchSearch = !search || `${n.title} ${n.content}`.toLowerCase().includes(search.toLowerCase());
    const matchAud = !audienceFilter || n.audience?.includes(audienceFilter);
    return matchSearch && matchAud;
  });

  const urgentCount = notices.filter(n => n.isUrgent).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Notice Board</h1>
          <p className="text-sm text-slate-400">{notices.length} notices · {urgentCount} urgent</p>
        </div>
        {canPost && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Post Notice
          </button>
        )}
      </div>

      {/* Urgent notices banner */}
      {notices.filter(n => n.isUrgent).length > 0 && (
        <div className="card p-4 border-l-4 border-red-500 bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="font-semibold text-red-600 dark:text-red-400 text-sm">Urgent Notices</p>
          </div>
          <div className="space-y-2">
            {notices.filter(n => n.isUrgent).map(n => (
              <div key={n.id} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{n.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search notices..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-40" value={audienceFilter} onChange={e => setAudienceFilter(e.target.value)}>
          <option value="">All Audience</option>
          {AUDIENCE_OPTS.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>

      {/* Notice cards */}
      <div className="space-y-3">
        {loading ? (
          Array.from({length:4}).map((_,i) => <div key={i} className="shimmer h-28 rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">No notices found</p>
          </div>
        ) : filtered.map(notice => {
          const isExp = expanded === notice.id;
          return (
            <div key={notice.id} className={clsx('card p-5 transition-all', notice.isUrgent && 'border-l-4 border-l-red-400')}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {notice.isUrgent && (
                      <span className="badge-danger flex items-center gap-1 text-xs">
                        <AlertCircle className="w-3 h-3" /> Urgent
                      </span>
                    )}
                    <h3 className="font-display font-bold text-slate-800 dark:text-slate-100">{notice.title}</h3>
                  </div>
                  <p className={clsx('text-sm text-slate-600 dark:text-slate-400 leading-relaxed', !isExp && 'line-clamp-2')}>
                    {notice.content}
                  </p>
                  {notice.content?.length > 150 && (
                    <button onClick={() => setExpanded(isExp ? null : notice.id)}
                      className="text-xs text-primary-600 dark:text-primary-400 font-semibold mt-1 hover:underline">
                      {isExp ? 'Show less' : 'Read more'}
                    </button>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {notice.audience?.map(a => (
                      <span key={a} className={clsx('badge text-xs', a==='ALL'?'badge-primary':'badge-gray')}>{a}</span>
                    ))}
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {new Date(notice.publishedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                    </span>
                    {notice.postedBy && <span className="text-xs text-slate-400">by {notice.postedBy}</span>}
                  </div>
                </div>
                {canPost && (
                  <button onClick={() => del(notice.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-base shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Post Notice Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Post New Notice" size="lg">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <input type="checkbox" id="urgent" checked={form.isUrgent} onChange={e=>setForm({...form,isUrgent:e.target.checked})} className="w-4 h-4" />
            <label htmlFor="urgent" className="text-sm font-semibold text-red-600 dark:text-red-400 cursor-pointer flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Mark as Urgent
            </label>
          </div>
          <div><label className="label">Title *</label><input className="input" placeholder="Notice title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></div>
          <div><label className="label">Content *</label><textarea className="input" rows={5} placeholder="Type the notice content here..." value={form.content} onChange={e=>setForm({...form,content:e.target.value})} /></div>
          <div>
            <label className="label">Send To *</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {AUDIENCE_OPTS.map(a => (
                <button key={a} type="button" onClick={() => toggleAudience(a)}
                  className={clsx('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-base',
                    form.audience.includes(a) ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-400')}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div><label className="label">Expires On (optional)</label><input type="date" className="input" value={form.expiresAt} onChange={e=>setForm({...form,expiresAt:e.target.value})} /></div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={save} disabled={saving}>
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Bell className="w-4 h-4" /> Post Notice</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
