// frontend/src/pages/StaffPage.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Search, Edit, Trash2, Phone, Mail, UserCog, Filter } from 'lucide-react';
import api from '../services/api';
import { selectUserRole } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Avatar from '../components/ui/Avatar';
import clsx from 'clsx';

const STAFF_TYPES = ['ADMIN','LIBRARIAN','LAB_ASSISTANT','ACCOUNTANT','CLERK','WATCHMAN','PEON','DRIVER','GARDENER','COOK','OTHER'];
const TYPE_COLORS = {
  ADMIN:'badge-primary', LIBRARIAN:'badge-success', LAB_ASSISTANT:'badge-blue',
  ACCOUNTANT:'badge-warning', CLERK:'badge-gray', WATCHMAN:'badge-gray',
  PEON:'badge-gray', DRIVER:'badge-gray', GARDENER:'badge-gray', COOK:'badge-gray', OTHER:'badge-gray',
};

const MOCK_STAFF = [
  { id:'1', firstName:'Sanjay', lastName:'Bhosale', staffType:'ACCOUNTANT', salary:25000, employeeCode:'EMP101', user:{ email:'accountant@demo.school', phone:'9812340001', isActive:true }, department:{ name:'Administration' } },
  { id:'2', firstName:'Ravi',   lastName:'Khote',   staffType:'WATCHMAN',   salary:15000, employeeCode:'EMP102', user:{ email:'watchman@demo.school',   phone:'9812340002', isActive:true }, department:null },
  { id:'3', firstName:'Geeta',  lastName:'More',    staffType:'LIBRARIAN',  salary:22000, employeeCode:'EMP103', user:{ email:'librarian@demo.school',  phone:'9812340003', isActive:true }, department:{ name:'Administration' } },
  { id:'4', firstName:'Anand',  lastName:'Kulkarni',staffType:'PEON',       salary:12000, employeeCode:'EMP104', user:{ email:'peon@demo.school',       phone:'9812340004', isActive:true }, department:null },
  { id:'5', firstName:'Sunita', lastName:'Jadhav',  staffType:'CLERK',      salary:18000, employeeCode:'EMP105', user:{ email:'clerk@demo.school',      phone:'9812340005', isActive:false }, department:{ name:'Administration' } },
];

const EMPTY_FORM = { firstName:'', lastName:'', email:'', phone:'', password:'', staffType:'ACCOUNTANT', salary:'', employeeCode:'', gender:'', dob:'', address:'', aadharNo:'' };

export default function StaffPage() {
  const role = useSelector(selectUserRole);
  const canManage = ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL'].includes(role);

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    api.get('/staff').then(r => setStaff(r.data.data || [])).catch(() => setStaff(MOCK_STAFF)).finally(() => setLoading(false));
  };

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (s) => {
    setEditItem(s);
    setForm({ firstName:s.firstName, lastName:s.lastName, email:s.user?.email||'', phone:s.user?.phone||'', password:'', staffType:s.staffType, salary:s.salary||'', employeeCode:s.employeeCode||'', gender:s.gender||'', dob:s.dob?new Date(s.dob).toISOString().split('T')[0]:'', address:s.address||'', aadharNo:s.aadharNo||'' });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.firstName || !form.lastName || !form.email) return toast.error('Name and email required');
    setSaving(true);
    try {
      const payload = { email:form.email, phone:form.phone, password:form.password||undefined, profileData:{ firstName:form.firstName, lastName:form.lastName, staffType:form.staffType, salary:Number(form.salary)||undefined, employeeCode:form.employeeCode, gender:form.gender, dob:form.dob||undefined, address:form.address, aadharNo:form.aadharNo } };
      if (editItem) { await api.put(`/staff/${editItem.id}`, payload); toast.success('Staff updated'); }
      else { await api.post('/staff', payload); toast.success('Staff member added'); }
      setShowModal(false); load();
    } catch(e) { toast.error(e.response?.data?.message || 'Save failed'); } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try { await api.delete(`/staff/${deleteItem.id}`); toast.success('Staff member deactivated'); setDeleteItem(null); load(); }
    catch(e) { toast.error(e.response?.data?.message||'Delete failed'); } finally { setDeleting(false); }
  };

  const filtered = staff.filter(s => {
    const name = `${s.firstName} ${s.lastName} ${s.user?.email} ${s.employeeCode}`.toLowerCase();
    return (!search || name.includes(search.toLowerCase())) && (!typeFilter || s.staffType === typeFilter);
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="section-header">
        <div><h1 className="section-title">Staff</h1><p className="text-sm text-slate-400">{staff.length} staff members</p></div>
        {canManage && <button className="btn-primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Staff</button>}
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {['ALL',...new Set(staff.map(s=>s.staffType))].map(type => (
          <button key={type} onClick={() => setTypeFilter(type==='ALL'?'':type)}
            className={clsx('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-base',
              (type==='ALL'?!typeFilter:typeFilter===type) ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-300')}>
            {type}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search by name, email, employee code..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
      </div>

      {/* Staff grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({length:6}).map((_,i)=><div key={i} className="shimmer h-44 rounded-2xl"/>)
        : filtered.length === 0 ? (
          <div className="col-span-full card p-12 text-center">
            <UserCog className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
            <p className="text-slate-400">No staff found</p>
            {canManage && <button className="btn-primary mt-4" onClick={openAdd}><Plus className="w-4 h-4"/>Add Staff</button>}
          </div>
        ) : filtered.map(s => (
          <div key={s.id} className="card p-5 hover:shadow-card-md transition-shadow">
            <div className="flex items-start gap-3 mb-4">
              <Avatar name={`${s.firstName} ${s.lastName}`} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-slate-800 dark:text-slate-100 truncate">{s.firstName} {s.lastName}</p>
                <span className={clsx('badge text-xs mt-1', TYPE_COLORS[s.staffType]||'badge-gray')}>{s.staffType.replace('_',' ')}</span>
                <span className={clsx('badge text-xs ml-1', s.user?.isActive!==false?'badge-success':'badge-danger')}>{s.user?.isActive!==false?'Active':'Inactive'}</span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              {s.employeeCode && <p className="text-slate-500 font-mono"><span className="font-semibold not-italic">ID:</span> {s.employeeCode}</p>}
              {s.department && <p className="text-slate-500"><span className="font-semibold">Dept:</span> {s.department.name}</p>}
              {s.salary && <p className="text-slate-500"><span className="font-semibold">Salary:</span> ₹{Number(s.salary).toLocaleString()}/mo</p>}
              {s.user?.email && <p className="flex items-center gap-1 text-slate-400"><Mail className="w-3 h-3"/>{s.user.email}</p>}
              {s.user?.phone && <p className="flex items-center gap-1 text-slate-400"><Phone className="w-3 h-3"/>{s.user.phone}</p>}
            </div>
            {canManage && (
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <button className="btn-secondary text-xs flex-1" onClick={()=>openEdit(s)}><Edit className="w-3.5 h-3.5"/>Edit</button>
                <button className="btn-ghost text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={()=>setDeleteItem(s)}><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title={editItem?'Edit Staff':'Add Staff Member'} size="lg">
        <div className="grid grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto pr-1">
          {[
            {label:'First Name',id:'firstName',req:true},{label:'Last Name',id:'lastName',req:true},
            {label:'Email',id:'email',type:'email',req:true},{label:'Phone',id:'phone',type:'tel'},
            ...(!editItem?[{label:'Password (default: Welcome@123)',id:'password',type:'password',col2:true}]:[]),
            {label:'Staff Type',id:'staffType',type:'select',opts:STAFF_TYPES},
            {label:'Employee Code',id:'employeeCode'},
            {label:'Salary (monthly)',id:'salary',type:'number'},
            {label:'Gender',id:'gender',type:'select',opts:['','Male','Female','Other']},
            {label:'Date of Birth',id:'dob',type:'date'},
            {label:'Aadhaar No',id:'aadharNo'},
            {label:'Address',id:'address',col2:true},
          ].map(f=>(
            <div key={f.id} className={f.col2?'col-span-2':''}>
              <label className="label">{f.label}{f.req&&<span className="text-red-400 ml-0.5">*</span>}</label>
              {f.type==='select'?(
                <select className="input" value={form[f.id]} onChange={e=>setForm({...form,[f.id]:e.target.value})}>
                  {f.opts.map(o=><option key={o} value={o}>{o||'Select'}</option>)}
                </select>
              ):(
                <input type={f.type||'text'} className="input" value={form[f.id]} onChange={e=>setForm({...form,[f.id]:e.target.value})} placeholder={f.id==='password'?'Leave blank for Welcome@123':''} />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/50">
          <button className="btn-secondary flex-1" onClick={()=>setShowModal(false)}>Cancel</button>
          <button className="btn-primary flex-1" onClick={save} disabled={saving}>
            {saving?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:(editItem?'Update Staff':'Add Staff')}
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteItem} onClose={()=>setDeleteItem(null)} onConfirm={confirmDelete}
        title="Deactivate Staff" message={`Deactivate ${deleteItem?.firstName} ${deleteItem?.lastName}? They will lose system access.`}
        confirmLabel="Deactivate" loading={deleting} />
    </div>
  );
}
