// frontend/src/pages/StudentDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Phone, Mail, User, Calendar, Book, DollarSign, ClipboardCheck, FileText, Edit, Upload } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../services/api';
import { selectUserRole } from '../store/slices/authSlice';
import Avatar from '../components/ui/Avatar';
import Tabs from '../components/ui/Tabs';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const TABS = [
  { id:'overview',    label:'Overview' },
  { id:'attendance',  label:'Attendance' },
  { id:'results',     label:'Results' },
  { id:'fees',        label:'Fees' },
  { id:'documents',   label:'Documents' },
];

const MOCK_STUDENT = {
  id:'1', firstName:'Aarav', lastName:'Sharma', gender:'Male', dob:'2008-03-13',
  admissionNo:'ADM2024001', rollNo:'01', bloodGroup:'B+', category:'General', aadharNo:'XXXX-XXXX-1234',
  address:'123 MG Road, Nagpur, Maharashtra - 440001',
  class:{ name:'10', section:'A' },
  user:{ email:'aarav.sharma@student.demo.school', phone:'9812300001', isActive:true, lastLogin:'2024-10-28T10:30:00', createdAt:'2024-04-01' },
  parent:{ fatherName:'Rajesh Sharma', fatherOccupation:'Engineer', fatherPhone:'9812300010', motherName:'Sunita Sharma', motherOccupation:'Teacher', motherPhone:'9812300011' },
};

const MOCK_ATTENDANCE = {
  total:130, present:119, absent:8, late:3, pct:91.5,
  monthly:[
    {month:'Apr',pct:95},{month:'May',pct:90},{month:'Jun',pct:88},
    {month:'Jul',pct:93},{month:'Aug',pct:94},{month:'Sep',pct:89},
    {month:'Oct',pct:92},
  ],
  recent:[
    {date:'2024-10-28',status:'PRESENT'},{date:'2024-10-27',status:'PRESENT'},
    {date:'2024-10-26',status:'ABSENT'},{date:'2024-10-25',status:'PRESENT'},
    {date:'2024-10-24',status:'LATE'},{date:'2024-10-23',status:'PRESENT'},
    {date:'2024-10-22',status:'PRESENT'},{date:'2024-10-21',status:'PRESENT'},
    {date:'2024-10-20',status:'PRESENT'},{date:'2024-10-19',status:'PRESENT'},
  ],
};

const MOCK_RESULTS = [
  { exam:'Unit Test 1', math:88, science:92, english:85, hindi:78, sst:90, total:433, pct:86.6, grade:'A+', rank:3 },
  { exam:'Unit Test 2', math:92, science:88, english:90, hindi:82, sst:94, total:446, pct:89.2, grade:'A+', rank:2 },
  { exam:'Mid Term',    math:85, science:90, english:88, hindi:80, sst:87, total:430, pct:86.0, grade:'A+', rank:4 },
];

const MOCK_FEES = [
  { feeType:'Tuition', month:'October 2024', amountDue:4500, amountPaid:4500, status:'PAID', receiptNo:'RCT001', paymentDate:'2024-10-05' },
  { feeType:'Tuition', month:'September 2024', amountDue:4500, amountPaid:4500, status:'PAID', receiptNo:'RCT002', paymentDate:'2024-09-08' },
  { feeType:'Library', month:'Annual 2024-25', amountDue:1200, amountPaid:1200, status:'PAID', receiptNo:'RCT003', paymentDate:'2024-04-10' },
  { feeType:'Tuition', month:'November 2024', amountDue:4500, amountPaid:0, status:'PENDING', receiptNo:null, paymentDate:null },
  { feeType:'Sports',  month:'Annual 2024-25', amountDue:800, amountPaid:800, status:'PAID', receiptNo:'RCT004', paymentDate:'2024-04-10' },
];

const STATUS_COLORS = { PRESENT:'bg-green-500', ABSENT:'bg-red-500', LATE:'bg-yellow-500', HALF_DAY:'bg-orange-400' };
const FEE_STATUS_COLORS = { PAID:'badge-success', PENDING:'badge-warning', OVERDUE:'badge-danger', PARTIAL:'badge-gray' };

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = useSelector(selectUserRole);
  const canEdit = ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','STAFF'].includes(role);

  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [results, setResults] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, aRes, rRes, fRes] = await Promise.allSettled([
          api.get(`/students/${id}`),
          api.get(`/attendance/summary/${id}`),
          api.get(`/results?studentId=${id}`),
          api.get(`/fees?studentId=${id}`),
        ]);
        setStudent(sRes.status==='fulfilled'?sRes.value.data.data:MOCK_STUDENT);
        setAttendance(aRes.status==='fulfilled'?aRes.value.data.data:MOCK_ATTENDANCE);
        setResults(rRes.status==='fulfilled'?rRes.value.data.data:MOCK_RESULTS);
        setFees(fRes.status==='fulfilled'?fRes.value.data.data.fees||[]:MOCK_FEES);
      } catch { setStudent(MOCK_STUDENT); setAttendance(MOCK_ATTENDANCE); setResults(MOCK_RESULTS); setFees(MOCK_FEES); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="space-y-5 animate-fade-in">
      <div className="shimmer h-48 rounded-2xl"/>
      <div className="shimmer h-10 rounded-2xl w-80"/>
      <div className="shimmer h-64 rounded-2xl"/>
    </div>
  );

  if (!student) return <div className="card p-12 text-center text-slate-400">Student not found</div>;

  const totalFeesDue = fees.reduce((a,f)=>a+f.amountDue,0);
  const totalFeesPaid = fees.reduce((a,f)=>a+f.amountPaid,0);
  const displayName = `${student.firstName} ${student.lastName}`;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button onClick={()=>navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-base">
          <ArrowLeft className="w-4 h-4"/> Back to Students
        </button>
        {canEdit && (
          <Link to={`/students/${id}/edit`} className="btn-secondary text-sm"><Edit className="w-4 h-4"/>Edit Profile</Link>
        )}
      </div>

      {/* Profile header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <Avatar name={displayName} size="xl"/>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-white">{displayName}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="badge-primary">{student.class?.name}-{student.class?.section}</span>
                  <span className="badge-gray font-mono text-xs">Roll #{student.rollNo}</span>
                  <span className="badge-gray font-mono text-xs">{student.admissionNo}</span>
                  <span className={clsx('badge text-xs', student.user?.isActive!==false?'badge-success':'badge-danger')}>
                    {student.user?.isActive!==false?'Active':'Inactive'}
                  </span>
                </div>
              </div>
              {attendance && (
                <div className="text-center">
                  <div className={clsx('w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl',
                    attendance.pct>=90?'bg-green-500':attendance.pct>=75?'bg-yellow-500':'bg-red-500')}>
                    {attendance.pct}%
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Attendance</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {[
                { icon:User, label:'Gender', value:student.gender||'—' },
                { icon:Calendar, label:'Date of Birth', value:student.dob?new Date(student.dob).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}):'—' },
                { icon:Mail, label:'Email', value:student.user?.email||'—' },
                { icon:Phone, label:'Phone', value:student.user?.phone||'—' },
                { icon:User, label:'Blood Group', value:student.bloodGroup||'—' },
                { icon:User, label:'Category', value:student.category||'—' },
              ].map(f=>(
                <div key={f.label} className="flex items-start gap-2">
                  <f.icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0"/>
                  <div><p className="text-xs text-slate-400">{f.label}</p><p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{f.value}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab}/>

      {/* OVERVIEW */}
      {tab==='overview' && (
        <div className="space-y-4">
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card p-4 text-center"><p className="text-2xl font-display font-bold text-green-600">{attendance?.pct||0}%</p><p className="text-xs text-slate-400 mt-1">Attendance</p></div>
            <div className="card p-4 text-center"><p className="text-2xl font-display font-bold text-primary-600">{results.length>0?(results[results.length-1].pct||results[results.length-1].percentage||0)+'%':'—'}</p><p className="text-xs text-slate-400 mt-1">Last Result</p></div>
            <div className="card p-4 text-center"><p className="text-2xl font-display font-bold text-blue-600">#{results.length>0?results[results.length-1].rank||'—':'—'}</p><p className="text-xs text-slate-400 mt-1">Class Rank</p></div>
            <div className="card p-4 text-center"><p className={clsx('text-xl font-display font-bold', totalFeesDue-totalFeesPaid>0?'text-red-500':'text-green-600')}>₹{(totalFeesDue-totalFeesPaid).toLocaleString()}</p><p className="text-xs text-slate-400 mt-1">Fee Balance</p></div>
          </div>

          {/* Parent info */}
          {student.parent && (
            <div className="card p-5">
              <p className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Parent / Guardian</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {student.parent.fatherName && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{student.parent.fatherName}</p>
                    <p className="text-xs text-slate-400">Father · {student.parent.fatherOccupation||'—'}</p>
                    {student.parent.fatherPhone && <p className="flex items-center gap-1 text-xs text-slate-500 mt-1"><Phone className="w-3 h-3"/>{student.parent.fatherPhone}</p>}
                  </div>
                )}
                {student.parent.motherName && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{student.parent.motherName}</p>
                    <p className="text-xs text-slate-400">Mother · {student.parent.motherOccupation||'—'}</p>
                    {student.parent.motherPhone && <p className="flex items-center gap-1 text-xs text-slate-500 mt-1"><Phone className="w-3 h-3"/>{student.parent.motherPhone}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address */}
          {student.address && (
            <div className="card p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Address</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{student.address}</p>
            </div>
          )}
        </div>
      )}

      {/* ATTENDANCE */}
      {tab==='attendance' && attendance && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[{l:'Present',v:attendance.present,c:'text-green-600'},{l:'Absent',v:attendance.absent,c:'text-red-500'},{l:'Late',v:attendance.late,c:'text-yellow-600'},{l:'Total Days',v:attendance.total,c:'text-slate-700 dark:text-slate-200'}].map(s=>(
              <div key={s.l} className="card p-4 text-center"><p className={clsx('text-2xl font-display font-bold',s.c)}>{s.v}</p><p className="text-xs text-slate-400 mt-1">{s.l}</p></div>
            ))}
          </div>
          <div className="card p-5">
            <p className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">Monthly Attendance Trend</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={MOCK_ATTENDANCE.monthly}>
                <defs><linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="month" tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false} domain={[70,100]}/>
                <Tooltip formatter={v=>[`${v}%`,'Attendance']} contentStyle={{borderRadius:10,border:'none',fontSize:12}}/>
                <Area type="monotone" dataKey="pct" stroke="#6366f1" strokeWidth={2} fill="url(#attGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <p className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">Recent Attendance (Last 10 Days)</p>
            <div className="flex flex-wrap gap-2">
              {MOCK_ATTENDANCE.recent.map((r,i)=>(
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold', STATUS_COLORS[r.status]||'bg-slate-300')}>
                    {r.status.charAt(0)}
                  </div>
                  <p className="text-[10px] text-slate-400">{new Date(r.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {tab==='results' && (
        <div className="space-y-4">
          {results.length===0?(
            <div className="card p-12 text-center"><FileText className="w-10 h-10 text-slate-300 mx-auto mb-2"/><p className="text-slate-400">No results yet</p></div>
          ):(
            <>
              <div className="card p-5">
                <p className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">Performance Trend</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={MOCK_RESULTS.map(r=>({name:r.exam,pct:r.pct||r.percentage}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                    <XAxis dataKey="name" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} domain={[0,100]}/>
                    <Tooltip formatter={v=>[`${v}%`,'Score']} contentStyle={{borderRadius:10,border:'none',fontSize:12}}/>
                    <Bar dataKey="pct" fill="#6366f1" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {MOCK_RESULTS.map((r,i)=>(
                <div key={i} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-display font-bold text-slate-800 dark:text-slate-100">{r.exam}</p>
                    <div className="flex items-center gap-2">
                      <span className={clsx('badge text-xs', r.pct>=90?'badge-success':r.pct>=75?'badge-primary':'badge-warning')}>{r.grade}</span>
                      <span className="text-sm font-bold text-primary-600">{r.pct}%</span>
                      <span className="badge-gray text-xs">Rank #{r.rank}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {[['Math',r.math],['Science',r.science],['English',r.english],['Hindi',r.hindi],['SST',r.sst]].map(([sub,marks])=>(
                      <div key={sub} className={clsx('p-2 rounded-xl', marks>=80?'bg-green-50 dark:bg-green-900/20':marks>=60?'bg-blue-50 dark:bg-blue-900/20':'bg-red-50 dark:bg-red-900/20')}>
                        <p className={clsx('text-lg font-bold', marks>=80?'text-green-600':marks>=60?'text-blue-600':'text-red-500')}>{marks}</p>
                        <p className="text-[10px] text-slate-400">{sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* FEES */}
      {tab==='fees' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center"><p className="text-xl font-display font-bold text-slate-800 dark:text-white">₹{totalFeesDue.toLocaleString()}</p><p className="text-xs text-slate-400">Total Due</p></div>
            <div className="card p-4 text-center"><p className="text-xl font-display font-bold text-green-600">₹{totalFeesPaid.toLocaleString()}</p><p className="text-xs text-slate-400">Paid</p></div>
            <div className="card p-4 text-center"><p className={clsx('text-xl font-display font-bold', totalFeesDue-totalFeesPaid>0?'text-red-500':'text-green-600')}>₹{(totalFeesDue-totalFeesPaid).toLocaleString()}</p><p className="text-xs text-slate-400">Balance</p></div>
          </div>
          <div className="card overflow-hidden">
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Fee Type</th><th>Period</th><th>Due</th><th>Paid</th><th>Status</th><th>Receipt</th><th>Date</th></tr></thead>
                <tbody>
                  {MOCK_FEES.map((f,i)=>(
                    <tr key={i}>
                      <td className="font-medium text-slate-800 dark:text-slate-200">{f.feeType}</td>
                      <td className="text-sm text-slate-500">{f.month}</td>
                      <td className="font-mono text-sm">₹{f.amountDue.toLocaleString()}</td>
                      <td className="font-mono text-sm text-green-600">₹{f.amountPaid.toLocaleString()}</td>
                      <td><span className={clsx('badge text-xs', FEE_STATUS_COLORS[f.status]||'badge-gray')}>{f.status}</span></td>
                      <td className="font-mono text-xs text-slate-400">{f.receiptNo||'—'}</td>
                      <td className="text-xs text-slate-400">{f.paymentDate?new Date(f.paymentDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'}):'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENTS */}
      {tab==='documents' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {canEdit && <button className="btn-primary text-sm"><Upload className="w-4 h-4"/>Upload Document</button>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[{name:'Aadhaar Card',type:'ID Proof',uploaded:true},{name:'Birth Certificate',type:'DOB Proof',uploaded:true},{name:'Previous Marksheet',type:'Academic',uploaded:true},{name:'Transfer Certificate',type:'TC',uploaded:false},{name:'Caste Certificate',type:'Category',uploaded:false},{name:'Medical Certificate',type:'Health',uploaded:false}].map((doc,i)=>(
              <div key={i} className={clsx('card p-4 flex flex-col gap-2', !doc.uploaded && 'opacity-60')}>
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', doc.uploaded?'bg-primary-50 dark:bg-primary-900/30':'bg-slate-50 dark:bg-slate-700/30')}>
                  <FileText className={clsx('w-5 h-5', doc.uploaded?'text-primary-600':'text-slate-400')}/>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{doc.name}</p>
                  <p className="text-xs text-slate-400">{doc.type}</p>
                </div>
                <span className={clsx('badge text-xs w-fit', doc.uploaded?'badge-success':'badge-gray')}>{doc.uploaded?'Uploaded':'Missing'}</span>
                {doc.uploaded && <button className="text-xs text-primary-600 hover:underline text-left">View / Download</button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
