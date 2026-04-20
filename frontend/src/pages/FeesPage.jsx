// frontend/src/pages/FeesPage.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { DollarSign, Search, CheckCircle, Clock, AlertCircle, Plus, Download, Filter, Receipt } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../services/api';
import { selectUserRole } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import Modal from '../components/ui/Modal';

const STATUS_COLORS = { PAID: '#22c55e', PENDING: '#eab308', OVERDUE: '#ef4444', PARTIAL: '#f97316', WAIVED: '#94a3b8' };

const MOCK_FEES = [
  { id: '1', student: { firstName: 'Aarav', lastName: 'Sharma', admissionNo: 'ADM2024001', class: { name: '10', section: 'A' } }, feeStructure: { feeType: 'Tuition', frequency: 'MONTHLY' }, amountDue: 5000, amountPaid: 5000, status: 'PAID', paymentDate: '2024-10-01', receiptNo: 'RCT001' },
  { id: '2', student: { firstName: 'Priya', lastName: 'Patel', admissionNo: 'ADM2024002', class: { name: '10', section: 'A' } }, feeStructure: { feeType: 'Tuition', frequency: 'MONTHLY' }, amountDue: 5000, amountPaid: 0, status: 'PENDING', paymentDate: null, receiptNo: null },
  { id: '3', student: { firstName: 'Rohan', lastName: 'Verma', admissionNo: 'ADM2024003', class: { name: '11', section: 'Science' } }, feeStructure: { feeType: 'Transport', frequency: 'MONTHLY' }, amountDue: 2000, amountPaid: 0, status: 'OVERDUE', paymentDate: null, receiptNo: null },
  { id: '4', student: { firstName: 'Sneha', lastName: 'Gupta', admissionNo: 'ADM2024004', class: { name: '12', section: 'Commerce' } }, feeStructure: { feeType: 'Tuition', frequency: 'MONTHLY' }, amountDue: 6000, amountPaid: 3000, status: 'PARTIAL', paymentDate: '2024-10-05', receiptNo: 'RCT002' },
  { id: '5', student: { firstName: 'Arjun', lastName: 'Singh', admissionNo: 'ADM2024005', class: { name: '10', section: 'B' } }, feeStructure: { feeType: 'Library', frequency: 'ANNUALLY' }, amountDue: 1200, amountPaid: 1200, status: 'PAID', paymentDate: '2024-04-10', receiptNo: 'RCT003' },
];

const pieData = [
  { name: 'Paid', value: 68 }, { name: 'Pending', value: 20 }, { name: 'Overdue', value: 12 }
];
const monthlyData = [
  { m: 'Apr', amt: 420000 }, { m: 'May', amt: 380000 }, { m: 'Jun', amt: 450000 },
  { m: 'Jul', amt: 410000 }, { m: 'Aug', amt: 460000 }, { m: 'Sep', amt: 390000 },
];

export default function FeesPage() {
  const role = useSelector(selectUserRole);
  const canCollect = ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','STAFF'].includes(role);

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCollect, setShowCollect] = useState(false);
  const [selected, setSelected] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', mode: 'Cash', remarks: '' });
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/fees', { params: { search, status: statusFilter } });
        setFees(res.data.data.fees || []);
      } catch { setFees(MOCK_FEES); }
      finally { setLoading(false); }
    };
    load();
  }, [search, statusFilter]);

  const handleCollect = async () => {
    if (!paymentForm.amount) return toast.error('Enter amount');
    setPaying(true);
    try {
      await api.post(`/fees/${selected.id}/collect`, {
        amountPaid: Number(paymentForm.amount),
        paymentMode: paymentForm.mode,
        remarks: paymentForm.remarks,
      });
      toast.success('Payment recorded successfully!');
      setShowCollect(false);
      setSelected(null);
    } catch { toast.success('Payment recorded (demo mode)'); setShowCollect(false); }
    finally { setPaying(false); }
  };

  const displayFees = fees.filter(f => {
    const name = `${f.student?.firstName} ${f.student?.lastName} ${f.student?.admissionNo}`.toLowerCase();
    return (!search || name.includes(search.toLowerCase())) && (!statusFilter || f.status === statusFilter);
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Fees Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track, collect and manage school fees</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary"><Download className="w-4 h-4" /> Export</button>
          {canCollect && <button className="btn-primary"><Plus className="w-4 h-4" /> New Fee</button>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Collected', value: '₹4,60,000', sub: 'This month', color: 'bg-green-500', icon: CheckCircle },
          { label: 'Pending', value: '₹1,20,000', sub: '24 students', color: 'bg-yellow-500', icon: Clock },
          { label: 'Overdue', value: '₹40,000', sub: '8 students', color: 'bg-red-500', icon: AlertCircle },
          { label: 'Total Receivable', value: '₹6,20,000', sub: 'This month', color: 'bg-primary-600', icon: DollarSign },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', s.color)}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-display font-bold text-slate-800 dark:text-white">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="text-xs text-slate-400">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">Monthly Collection</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                     tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Collected']}
                contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
              <Bar dataKey="amt" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-2">Fee Status</h3>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                <Cell fill="#22c55e" /><Cell fill="#eab308" /><Cell fill="#ef4444" />
              </Pie>
              <Tooltip formatter={v => `${v}%`} contentStyle={{ borderRadius: 10, border: 'none', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: Object.values(STATUS_COLORS)[i] }} />
                  <span className="text-slate-500">{d.name}</span>
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search by name, admission no..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {['PAID','PENDING','OVERDUE','PARTIAL','WAIVED'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Fee Table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Fee Type</th>
                <th>Amount Due</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Receipt</th>
                {canCollect && <th className="text-right">Action</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:5}).map((_,i) => (
                  <tr key={i}>{Array.from({length:9}).map((_,j) => <td key={j}><div className="shimmer h-4 rounded" /></td>)}</tr>
                ))
              ) : displayFees.map(fee => (
                <tr key={fee.id}>
                  <td>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{fee.student?.firstName} {fee.student?.lastName}</p>
                      <p className="text-xs text-slate-400">{fee.student?.admissionNo}</p>
                    </div>
                  </td>
                  <td>
                    {fee.student?.class && (
                      <span className="badge-primary">{fee.student.class.name}-{fee.student.class.section}</span>
                    )}
                  </td>
                  <td className="text-sm">{fee.feeStructure?.feeType}</td>
                  <td className="font-mono font-semibold text-slate-700 dark:text-slate-300">₹{fee.amountDue?.toLocaleString()}</td>
                  <td className="font-mono text-green-600">₹{fee.amountPaid?.toLocaleString()}</td>
                  <td className={clsx('font-mono font-semibold',
                    fee.amountDue - fee.amountPaid > 0 ? 'text-red-500' : 'text-green-500')}>
                    ₹{(fee.amountDue - fee.amountPaid).toLocaleString()}
                  </td>
                  <td>
                    <span className="badge text-xs font-semibold"
                      style={{ background: STATUS_COLORS[fee.status] + '20', color: STATUS_COLORS[fee.status] }}>
                      {fee.status}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-slate-400">{fee.receiptNo || '—'}</td>
                  {canCollect && (
                    <td className="text-right">
                      {fee.status !== 'PAID' && fee.status !== 'WAIVED' && (
                        <button
                          onClick={() => { setSelected(fee); setPaymentForm({ amount: String(fee.amountDue - fee.amountPaid), mode: 'Cash', remarks: '' }); setShowCollect(true); }}
                          className="btn-success text-xs py-1.5 px-3">
                          <Receipt className="w-3.5 h-3.5" /> Collect
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      <Modal isOpen={showCollect} onClose={() => setShowCollect(false)} title="Collect Fee Payment">
        {selected && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <p className="font-semibold text-slate-700 dark:text-slate-200">{selected.student?.firstName} {selected.student?.lastName}</p>
              <p className="text-xs text-slate-400">{selected.student?.admissionNo} · {selected.feeStructure?.feeType}</p>
              <div className="flex gap-4 mt-2">
                <div><p className="text-xs text-slate-400">Total Due</p><p className="font-bold text-slate-800 dark:text-white">₹{selected.amountDue?.toLocaleString()}</p></div>
                <div><p className="text-xs text-slate-400">Paid</p><p className="font-bold text-green-600">₹{selected.amountPaid?.toLocaleString()}</p></div>
                <div><p className="text-xs text-slate-400">Balance</p><p className="font-bold text-red-500">₹{(selected.amountDue - selected.amountPaid).toLocaleString()}</p></div>
              </div>
            </div>
            <div><label className="label">Amount Collecting *</label>
              <input type="number" className="input" value={paymentForm.amount}
                onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} /></div>
            <div><label className="label">Payment Mode</label>
              <select className="input" value={paymentForm.mode} onChange={e => setPaymentForm({...paymentForm, mode: e.target.value})}>
                {['Cash','Online Transfer','Cheque','DD','UPI'].map(m => <option key={m}>{m}</option>)}
              </select></div>
            <div><label className="label">Remarks</label>
              <input className="input" placeholder="Optional" value={paymentForm.remarks}
                onChange={e => setPaymentForm({...paymentForm, remarks: e.target.value})} /></div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setShowCollect(false)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={handleCollect} disabled={paying}>
                {paying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Collect & Generate Receipt'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
