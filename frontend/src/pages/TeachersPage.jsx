// frontend/src/pages/TeachersPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Search, Phone, Mail, Edit, Trash2, Eye } from 'lucide-react';
import api from '../services/api';
import { useSelector } from 'react-redux';
import { selectUserRole } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import Modal from '../components/ui/Modal';

const MOCK = [
  { id:'1', firstName:'Sunita', lastName:'Kulkarni', departmentId:'sci', designation:{title:'HOD Science'}, experience:12, salary:45000, specialization:'Physics, Math', user:{email:'s.kulkarni@school.edu', phone:'9812345670', isActive:true} },
  { id:'2', firstName:'Rajesh', lastName:'Mehta', departmentId:'eng', designation:{title:'Senior Teacher'}, experience:8, salary:38000, specialization:'English Literature', user:{email:'r.mehta@school.edu', phone:'9812345671', isActive:true} },
  { id:'3', firstName:'Priya', lastName:'Joshi', departmentId:'sci', designation:{title:'Teacher'}, experience:5, salary:32000, specialization:'Chemistry, Biology', user:{email:'p.joshi@school.edu', phone:'9812345672', isActive:true} },
  { id:'4', firstName:'Anil', lastName:'Rao', departmentId:'sst', designation:{title:'Teacher'}, experience:10, salary:36000, specialization:'History, Geography', user:{email:'a.rao@school.edu', phone:'9812345673', isActive:true} },
  { id:'5', firstName:'Neha', lastName:'Sharma', departmentId:'lang', designation:{title:'Teacher'}, experience:6, salary:30000, specialization:'Hindi, Sanskrit', user:{email:'n.sharma@school.edu', phone:'9812345674', isActive:false} },
];

export default function TeachersPage() {
  const role = useSelector(selectUserRole);
  const canManage = ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL'].includes(role);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/teachers').then(r => setTeachers(r.data.data.teachers || []))
      .catch(() => setTeachers(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const filtered = teachers.filter(t =>
    `${t.firstName} ${t.lastName} ${t.specialization} ${t.user?.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="section-header">
        <div><h1 className="section-title">Teachers</h1><p className="text-sm text-slate-400">{teachers.length} teachers</p></div>
        <div className="flex gap-2">
          {canManage && <button className="btn-primary"><Plus className="w-4 h-4" /> Add Teacher</button>}
        </div>
      </div>
      <div className="card p-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search teachers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({length:6}).map((_,i) => <div key={i} className="shimmer h-44 rounded-2xl" />)
        : filtered.map(t => (
          <div key={t.id} className="card p-5 hover:shadow-card-md transition-shadow">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {t.firstName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-slate-800 dark:text-slate-100">{t.firstName} {t.lastName}</p>
                <p className="text-xs text-slate-400">{t.designation?.title || 'Teacher'}</p>
                <span className={clsx('badge text-xs mt-1', t.user?.isActive !== false ? 'badge-success' : 'badge-danger')}>
                  {t.user?.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              {t.specialization && <p className="text-slate-500"><span className="font-semibold">Subjects:</span> {t.specialization}</p>}
              <p className="text-slate-500"><span className="font-semibold">Experience:</span> {t.experience} yrs</p>
              {t.user?.email && <p className="flex items-center gap-1 text-slate-400"><Mail className="w-3 h-3" /> {t.user.email}</p>}
              {t.user?.phone && <p className="flex items-center gap-1 text-slate-400"><Phone className="w-3 h-3" /> {t.user.phone}</p>}
            </div>
            {canManage && (
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <button className="btn-secondary text-xs flex-1"><Eye className="w-3.5 h-3.5" /> View</button>
                <button className="btn-ghost text-xs flex-1"><Edit className="w-3.5 h-3.5" /> Edit</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
