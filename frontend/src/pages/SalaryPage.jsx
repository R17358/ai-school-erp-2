// frontend/src/pages/SalaryPage.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Wallet, Download, CheckCircle, Clock, Filter, Search, Printer, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { selectUserRole } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import clsx from 'clsx';

const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
const STATUS_CONFIG = { PAID:{ color:'badge-success', label:'Paid' }, PENDING:{ color:'badge-warning', label:'Pending' }, PROCESSING:{ color:'badge-primary', label:'Processing' }, HOLD:{ color:'badge-danger', label:'On Hold' } };

const MOCK_SLIPS = [
  { id:'s1', employeeType:'TEACHER', month:10, year:2024, basicSalary:45000, hra:9000, da:5400, ta:2000, otherAllowances:0, pf:5400, pt:200, tds:0, otherDeductions:0, grossSalary:61400, netSalary:55800, status:'PAID', paidDate:'2024-10-31', paymentMode:'Bank Transfer', teacher:{ firstName:'Sunita', lastName:'Kulkarni' }, staff:null },
  { id:'s2', employeeType:'TEACHER', month:10, year:2024, basicSalary:38000, hra:7600, da:4560, ta:1500, otherAllowances:0, pf:4560, pt:200, tds:0, otherDeductions:0, grossSalary:51660, netSalary:46900, status:'PAID', paidDate:'2024-10-31', paymentMode:'Bank Transfer', teacher:{ firstName:'Rajesh', lastName:'Mehta' }, staff:null },
  { id:'s3', employeeType:'TEACHER', month:10, year:2024, basicSalary:32000, hra:6400, da:3840, ta:1500, otherAllowances:0, pf:3840, pt:200, tds:0, otherDeductions:0, grossSalary:43740, netSalary:39700, status:'PENDING', paidDate:null, paymentMode:null, teacher:{ firstName:'Priya', lastName:'Joshi' }, staff:null },
  { id:'s4', employeeType:'STAFF',   month:10, year:2024, basicSalary:25000, hra:2500, da:3000, ta:0, otherAllowances:0, pf:3000, pt:200, tds:0, otherDeductions:0, grossSalary:30500, netSalary:27300, status:'PENDING', paidDate:null, paymentMode:null, teacher:null, staff:{ firstName:'Sanjay', lastName:'Bhosale' } },
  { id:'s5', employeeType:'STAFF',   month:10, year:2024, basicSalary:15000, hra:1500, da:1800, ta:0, otherAllowances:0, pf:1800, pt:200, tds:0, otherDeductions:0, grossSalary:18300, netSalary:16300, status:'PAID', paidDate:'2024-10-31', paymentMode:'Cash', teacher:null, staff:{ firstName:'Ravi', lastName:'Khote' } },
];

const chartData = [
  { month:'Jun', amount:380000 }, { month:'Jul', amount:385000 }, { month:'Aug', amount:382000 },
  { month:'Sep', amount:390000 }, { month:'Oct', amount:395000 }, { month:'Nov', amount:0 },
];

export default function SalaryPage() {
  const role = useSelector(selectUserRole);
  const isAdmin = ['SUPER_ADMIN','PRINCIPAL'].includes(role);

  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [generating, setGenerating] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [showSlip, setShowSlip] = useState(null);

  useEffect(() => { load(); }, [month, year]);

  const load = () => {
    setLoading(true);
    api.get('/salary', { params:{ month, year } }).then(r=>setSlips(r.data.data||[])).catch(()=>setSlips(MOCK_SLIPS)).finally(()=>setLoading(false));
  };

  const generateAll = async () => {
    setGenerating(true);
    try { await api.post('/salary/generate', { month, year, academicYearId:'current' }); toast.success('Salary slips generated!'); load(); }
    catch { toast.success('Generated (demo mode)'); setSlips(MOCK_SLIPS); } finally { setGenerating(false); }
  };

  const markPaid = async (slip) => {
    setPayingId(slip.id);
    try { await api.patch(`/salary/${slip.id}/pay`, { paymentMode:'Bank Transfer' }); toast.success('Marked as paid'); load(); }
    catch { toast.success('Marked paid (demo)'); setSlips(prev=>prev.map(s=>s.id===slip.id?{...s,status:'PAID',paidDate:new Date().toISOString()}:s)); }
    finally { setPayingId(null); }
  };

  const getName = (s) => {
    const p = s.teacher || s.staff;
    return p ? `${p.firstName} ${p.lastName}` : 'Unknown';
  };

  const filtered = slips.filter(s => {
    const name = getName(s).toLowerCase();
    return (!search || name.includes(search.toLowerCase())) && (!statusFilter || s.status===statusFilter);
  });

  const totalPayroll = slips.reduce((a,s)=>a+s.netSalary,0);
  const totalPaid = slips.filter(s=>s.status==='PAID').reduce((a,s)=>a+s.netSalary,0);
  const pendingCount = slips.filter(s=>s.status!=='PAID').length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="section-header">
        <div><h1 className="section-title">Salary & Payroll</h1><p className="text-sm text-slate-400">{MONTHS[month]} {year}</p></div>
        {isAdmin && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={()=>window.print()}><Printer className="w-4 h-4"/>Print</button>
            <button className="btn-primary" onClick={generateAll} disabled={generating}>
              {generating?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<><Zap className="w-4 h-4"/>Generate Slips</>}
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label:'Total Payroll', value:`₹${totalPayroll.toLocaleString()}`, color:'bg-primary-600' },
              { label:'Disbursed', value:`₹${totalPaid.toLocaleString()}`, color:'bg-green-500' },
              { label:'Pending Payments', value:pendingCount, color:'bg-yellow-500' },
              { label:'Employees', value:slips.length, color:'bg-blue-500' },
            ].map(s=>(
              <div key={s.label} className="stat-card">
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', s.color)}>
                  <Wallet className="w-5 h-5 text-white"/>
                </div>
                <div><p className="text-xl font-display font-bold text-slate-800 dark:text-white">{s.value}</p><p className="text-sm text-slate-500">{s.label}</p></div>
              </div>
            ))}
          </div>

          {/* Payroll trend */}
          <div className="card p-5">
            <p className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">Monthly Payroll Trend</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`}/>
                <Tooltip formatter={v=>[`₹${v.toLocaleString()}`,'Payroll']} contentStyle={{borderRadius:10,border:'none',fontSize:12}}/>
                <Bar dataKey="amount" fill="#6366f1" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input className="input pl-9" placeholder="Search employee..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="input w-32" value={month} onChange={e=>setMonth(Number(e.target.value))}>
          {MONTHS.slice(1).map((m,i)=><option key={m} value={i+1}>{m}</option>)}
        </select>
        <select className="input w-28" value={year} onChange={e=>setYear(Number(e.target.value))}>
          {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
        </select>
        <select className="input w-36" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {['PAID','PENDING','HOLD'].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Salary slips table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th><th>Type</th>
                <th>Basic</th><th>HRA</th><th>DA</th>
                <th>Gross</th><th>Deductions</th><th>Net Pay</th>
                <th>Status</th>
                {isAdmin && <th className="text-right">Action</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:5}).map((_,i)=>(
                <tr key={i}>{Array.from({length:10}).map((_,j)=><td key={j}><div className="shimmer h-4 rounded"/></td>)}</tr>
              )) : filtered.length===0 ? (
                <tr><td colSpan={10} className="text-center py-12">
                  <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2"/>
                  <p className="text-slate-400 text-sm">No salary slips. {isAdmin&&'Click "Generate Slips" to create them.'}</p>
                </td></tr>
              ) : filtered.map(slip=>{
                const sConfig = STATUS_CONFIG[slip.status]||STATUS_CONFIG.PENDING;
                const deductions = (slip.pf||0)+(slip.pt||0)+(slip.tds||0)+(slip.otherDeductions||0);
                return (
                  <tr key={slip.id}>
                    <td>
                      <button onClick={()=>setShowSlip(slip)} className="text-left hover:text-primary-600 dark:hover:text-primary-400 transition-base">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{getName(slip)}</p>
                        <p className="text-xs text-slate-400">{slip.employeeType}</p>
                      </button>
                    </td>
                    <td><span className={clsx('badge text-xs', slip.employeeType==='TEACHER'?'badge-blue':'badge-gray')}>{slip.employeeType}</span></td>
                    <td className="font-mono text-sm">₹{slip.basicSalary?.toLocaleString()}</td>
                    <td className="font-mono text-sm text-slate-500">₹{slip.hra?.toLocaleString()}</td>
                    <td className="font-mono text-sm text-slate-500">₹{slip.da?.toLocaleString()}</td>
                    <td className="font-mono text-sm font-semibold">₹{slip.grossSalary?.toLocaleString()}</td>
                    <td className="font-mono text-sm text-red-500">-₹{deductions.toLocaleString()}</td>
                    <td className="font-mono text-sm font-bold text-green-600">₹{slip.netSalary?.toLocaleString()}</td>
                    <td><span className={clsx('badge text-xs', sConfig.color)}>{sConfig.label}</span></td>
                    {isAdmin && (
                      <td className="text-right">
                        {slip.status!=='PAID'?(
                          <button onClick={()=>markPaid(slip)} disabled={payingId===slip.id} className="btn-success text-xs py-1.5 px-3">
                            {payingId===slip.id?<div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<><CheckCircle className="w-3.5 h-3.5"/>Pay</>}
                          </button>
                        ):(
                          <span className="text-xs text-slate-400">{slip.paidDate?new Date(slip.paidDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):''}</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Slip Detail Modal */}
      <Modal isOpen={!!showSlip} onClose={()=>setShowSlip(null)} title="Salary Slip" size="md">
        {showSlip && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/50">
              <div>
                <p className="font-display font-bold text-lg text-slate-800 dark:text-white">{getName(showSlip)}</p>
                <p className="text-sm text-slate-400">{showSlip.employeeType} · {MONTHS[showSlip.month]} {showSlip.year}</p>
              </div>
              <span className={clsx('badge', STATUS_CONFIG[showSlip.status]?.color||'badge-gray')}>{showSlip.status}</span>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wide">Earnings</p>
              {[['Basic Salary',showSlip.basicSalary],['HRA',showSlip.hra],['DA',showSlip.da],['TA',showSlip.ta],['Other Allowances',showSlip.otherAllowances]].map(([l,v])=>v?(
                <div key={l} className="flex justify-between"><span className="text-slate-500">{l}</span><span className="font-mono font-medium">₹{v.toLocaleString()}</span></div>
              ):null)}
              <div className="flex justify-between font-semibold border-t border-slate-100 dark:border-slate-700/50 pt-2"><span>Gross Salary</span><span className="font-mono">₹{showSlip.grossSalary?.toLocaleString()}</span></div>
              <p className="font-semibold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wide mt-3">Deductions</p>
              {[['PF',showSlip.pf],['Professional Tax',showSlip.pt],['TDS',showSlip.tds],['Other',showSlip.otherDeductions]].map(([l,v])=>v?(
                <div key={l} className="flex justify-between"><span className="text-slate-500">{l}</span><span className="font-mono text-red-500">-₹{v.toLocaleString()}</span></div>
              ):null)}
              <div className="flex justify-between font-bold text-green-600 border-t border-slate-100 dark:border-slate-700/50 pt-2 text-base">
                <span>Net Salary</span><span className="font-mono">₹{showSlip.netSalary?.toLocaleString()}</span>
              </div>
            </div>
            <button className="btn-secondary w-full justify-center" onClick={()=>window.print()}>
              <Printer className="w-4 h-4"/>Print Slip
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
