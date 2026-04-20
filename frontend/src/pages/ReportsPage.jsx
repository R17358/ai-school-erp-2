// frontend/src/pages/ReportsPage.jsx
import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, BarChart3, Users, DollarSign, BookOpen, TrendingUp, Filter, Printer } from 'lucide-react';
import api from '../services/api';
import Tabs from '../components/ui/Tabs';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const TABS = [
  { id:'attendance', label:'Attendance', icon: Users },
  { id:'fees',       label:'Fees',       icon: DollarSign },
  { id:'results',    label:'Results',    icon: BookOpen },
  { id:'staff',      label:'HR/Staff',   icon: TrendingUp },
];
const COLORS = ['#6366f1','#22c55e','#f97316','#eab308','#ef4444','#8b5cf6'];

// Mock data
const attendanceMonthly = [
  {month:'Apr',pct:92},{month:'May',pct:88},{month:'Jun',pct:78},{month:'Jul',pct:91},
  {month:'Aug',pct:94},{month:'Sep',pct:90},{month:'Oct',pct:87},{month:'Nov',pct:0},
];
const classAttendance = [
  {class:'9-A',pct:93},{class:'9-B',pct:89},{class:'10-A',pct:95},{class:'10-B',pct:87},
  {class:'11-Sci',pct:91},{class:'11-Com',pct:86},{class:'12-Sci',pct:92},{class:'12-Com',pct:88},
];
const feeMonthly = [
  {month:'Apr',collected:420000,pending:80000},{month:'May',collected:380000,pending:120000},
  {month:'Jun',collected:450000,pending:50000},{month:'Jul',collected:410000,pending:90000},
  {month:'Aug',collected:460000,pending:40000},{month:'Sep',collected:390000,pending:110000},
  {month:'Oct',collected:440000,pending:60000},
];
const feeByType = [{name:'Tuition',value:72},{name:'Transport',value:15},{name:'Library',value:5},{name:'Sports',value:5},{name:'Other',value:3}];
const resultsBySubject = [
  {subject:'Math',classAvg:74,highest:98,lowest:32},{subject:'Science',classAvg:79,highest:97,lowest:41},
  {subject:'English',classAvg:82,highest:99,lowest:45},{subject:'Hindi',classAvg:76,highest:96,lowest:38},
  {subject:'SST',classAvg:81,highest:98,lowest:42},
];
const gradeDistribution = [{grade:'A+',count:38},{grade:'A',count:52},{grade:'B+',count:43},{grade:'B',count:28},{grade:'C',count:15},{grade:'D',count:8},{grade:'F',count:4}];
const staffLeaveData = [{dept:'Science',used:24,balance:48},{dept:'Languages',used:18,balance:54},{dept:'Math',used:32,balance:40},{dept:'Admin',used:12,balance:60}];
const lowAttendance = [
  {name:'Rahul Gupta',class:'10-A',pct:68},{name:'Priti Shah',class:'11-Sci',pct:71},
  {name:'Ankit Das',class:'10-B',pct:62},{name:'Sonam Lama',class:'12-Com',pct:74},
  {name:'Jay Mehta',class:'9-A',pct:70},
];
const feeDefaulters = [
  {name:'Arjun Singh',class:'10-A',due:18000,months:3},{name:'Kavya Nair',class:'11-Sci',due:15000,months:3},
  {name:'Rohan Das',class:'9-B',due:12000,months:2},{name:'Priya Sharma',class:'12-Com',due:16500,months:3},
];

function AttendanceReport() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{l:'Avg Attendance',v:'89.6%',c:'bg-primary-600'},{l:'Students Below 75%',v:'18',c:'bg-red-500'},{l:'Perfect Attendance',v:'42',c:'bg-green-500'},{l:'Working Days',v:'132',c:'bg-blue-500'}].map(s=>(
          <div key={s.l} className="card p-4"><div className={clsx('w-10 h-10 rounded-xl mb-2 flex items-center justify-center text-white text-xs font-bold',s.c)}><Users className="w-5 h-5"/></div><p className="text-xl font-bold text-slate-800 dark:text-white">{s.v}</p><p className="text-xs text-slate-400 mt-0.5">{s.l}</p></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <p className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">Monthly Attendance %</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={attendanceMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false} domain={[70,100]}/>
              <Tooltip formatter={v=>[`${v}%`,'Attendance']} contentStyle={{borderRadius:10,border:'none',fontSize:12}}/>
              <Line type="monotone" dataKey="pct" stroke="#6366f1" strokeWidth={2.5} dot={{r:4,fill:'#6366f1'}} activeDot={{r:6}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <p className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">Class-wise Attendance %</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={classAttendance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
              <XAxis type="number" tick={{fontSize:11,fill:'#94a3b8'}} domain={[70,100]} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="class" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={55}/>
              <Tooltip formatter={v=>[`${v}%`,'Attendance']} contentStyle={{borderRadius:10,border:'none',fontSize:12}}/>
              <Bar dataKey="pct" radius={[0,4,4,0]}>
                {classAttendance.map((d,i)=><Cell key={i} fill={d.pct>=90?'#22c55e':d.pct>=80?'#6366f1':'#eab308'}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <p className="font-semibold text-sm text-red-600 dark:text-red-400">⚠ Students Below 75% Attendance</p>
          <span className="badge-danger">{lowAttendance.length} students</span>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Student</th><th>Class</th><th>Attendance %</th><th>Status</th></tr></thead>
            <tbody>
              {lowAttendance.map((s,i)=>(
                <tr key={i}>
                  <td className="font-medium text-slate-800 dark:text-slate-200">{s.name}</td>
                  <td><span className="badge-primary text-xs">{s.class}</span></td>
                  <td><span className="font-bold text-red-500">{s.pct}%</span></td>
                  <td><span className="badge-danger text-xs">Needs Attention</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FeesReport() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{l:'Total Collected',v:'₹31,50,000',c:'bg-green-500'},{l:'Total Pending',v:'₹5,50,000',c:'bg-yellow-500'},{l:'Total Overdue',v:'₹1,20,000',c:'bg-red-500'},{l:'Collection Rate',v:'85.1%',c:'bg-primary-600'}].map(s=>(
          <div key={s.l} className="card p-4"><div className={clsx('w-10 h-10 rounded-xl mb-2 flex items-center justify-center',s.c)}><DollarSign className="w-5 h-5 text-white"/></div><p className="text-xl font-bold text-slate-800 dark:text-white">{s.v}</p><p className="text-xs text-slate-400 mt-0.5">{s.l}</p></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-2">
          <p className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">Monthly Collection vs Pending</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={feeMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`}/>
              <Tooltip formatter={v=>[`₹${v.toLocaleString()}`]} contentStyle={{borderRadius:10,border:'none',fontSize:12}}/>
              <Legend wrapperStyle={{fontSize:12}}/>
              <Bar dataKey="collected" fill="#22c55e" radius={[4,4,0,0]} name="Collected"/>
              <Bar dataKey="pending" fill="#fbbf24" radius={[4,4,0,0]} name="Pending"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <p className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">Fee by Type</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart><Pie data={feeByType} cx="50%" cy="50%" outerRadius={65} dataKey="value">
              {feeByType.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
            </Pie><Tooltip formatter={v=>`${v}%`} contentStyle={{borderRadius:10,border:'none',fontSize:11}}/></PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-1">{feeByType.map((f,i)=>(
            <div key={f.name} className="flex items-center justify-between text-xs"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{background:COLORS[i%COLORS.length]}}/><span className="text-slate-500">{f.name}</span></div><span className="font-semibold text-slate-700 dark:text-slate-300">{f.value}%</span></div>
          ))}</div>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <p className="font-semibold text-sm text-red-600 dark:text-red-400">⚠ Fee Defaulters (3+ months)</p>
          <span className="badge-danger">{feeDefaulters.length} students</span>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Student</th><th>Class</th><th>Months Due</th><th>Total Due</th><th>Action</th></tr></thead>
            <tbody>{feeDefaulters.map((d,i)=>(
              <tr key={i}>
                <td className="font-medium text-slate-800 dark:text-slate-200">{d.name}</td>
                <td><span className="badge-primary text-xs">{d.class}</span></td>
                <td><span className="badge-danger text-xs">{d.months} months</span></td>
                <td className="font-mono font-bold text-red-500">₹{d.due.toLocaleString()}</td>
                <td><button className="btn-ghost text-xs text-primary-600">Send Reminder</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ResultsReport() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{l:'Class Average',v:'78.4%',c:'bg-primary-600'},{l:'Pass Rate',v:'94.2%',c:'bg-green-500'},{l:'A+ Grade',v:'38',c:'bg-violet-500'},{l:'Failed',c:'bg-red-500',v:'11'}].map(s=>(
          <div key={s.l} className="card p-4"><div className={clsx('w-10 h-10 rounded-xl mb-2 flex items-center justify-center',s.c)}><BookOpen className="w-5 h-5 text-white"/></div><p className="text-xl font-bold text-slate-800 dark:text-white">{s.v}</p><p className="text-xs text-slate-400 mt-0.5">{s.l}</p></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <p className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">Subject-wise Performance</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={resultsBySubject}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="subject" tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false} domain={[0,100]}/>
              <Tooltip contentStyle={{borderRadius:10,border:'none',fontSize:12}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="classAvg" fill="#6366f1" radius={[4,4,0,0]} name="Class Avg"/>
              <Bar dataKey="highest" fill="#22c55e" radius={[4,4,0,0]} name="Highest"/>
              <Bar dataKey="lowest" fill="#ef4444" radius={[4,4,0,0]} name="Lowest"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <p className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">Grade Distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={gradeDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="grade" tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{borderRadius:10,border:'none',fontSize:12}}/>
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {gradeDistribution.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StaffReport() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{l:'Total Employees',v:'40',c:'bg-primary-600'},{l:'Teachers',v:'28',c:'bg-blue-500'},{l:'Non-Teaching',v:'12',c:'bg-slate-500'},{l:'Avg Salary',c:'bg-green-500',v:'₹34,500'}].map(s=>(
          <div key={s.l} className="card p-4"><div className={clsx('w-10 h-10 rounded-xl mb-2 flex items-center justify-center',s.c)}><Users className="w-5 h-5 text-white"/></div><p className="text-xl font-bold text-slate-800 dark:text-white">{s.v}</p><p className="text-xs text-slate-400 mt-0.5">{s.l}</p></div>
        ))}
      </div>
      <div className="card p-5">
        <p className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">Department-wise Leave Usage</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={staffLeaveData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
            <XAxis dataKey="dept" tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{borderRadius:10,border:'none',fontSize:12}}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="used" fill="#ef4444" radius={[4,4,0,0]} name="Used"/>
            <Bar dataKey="balance" fill="#22c55e" radius={[4,4,0,0]} name="Balance"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState('attendance');
  const [dateRange, setDateRange] = useState({ from:'2024-04-01', to:'2024-10-31' });

  const exportCSV = () => { toast.success('Exporting report...'); };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="section-header">
        <div><h1 className="section-title">Reports & Analytics</h1><p className="text-sm text-slate-400">Comprehensive school performance insights</p></div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={()=>window.print()}><Printer className="w-4 h-4"/>Print</button>
          <button className="btn-secondary" onClick={exportCSV}><Download className="w-4 h-4"/>Export</button>
        </div>
      </div>

      {/* Date range filter */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-slate-400"/>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">From</label>
          <input type="date" className="input w-36 text-sm py-1.5" value={dateRange.from} onChange={e=>setDateRange({...dateRange,from:e.target.value})}/>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">To</label>
          <input type="date" className="input w-36 text-sm py-1.5" value={dateRange.to} onChange={e=>setDateRange({...dateRange,to:e.target.value})}/>
        </div>
        <button className="btn-primary text-sm py-1.5">Apply</button>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab}/>

      <div className="animate-fade-in">
        {tab==='attendance' && <AttendanceReport/>}
        {tab==='fees'       && <FeesReport/>}
        {tab==='results'    && <ResultsReport/>}
        {tab==='staff'      && <StaffReport/>}
      </div>
    </div>
  );
}
