// frontend/src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Users, GraduationCap, UserCheck, DollarSign, TrendingUp,
  CalendarCheck, AlertCircle, Bot, ArrowRight, BookOpen,
  ClipboardCheck, Zap
} from 'lucide-react';
import api from '../services/api';
import { selectUserRole, selectUser } from '../store/slices/authSlice';
import clsx from 'clsx';

const COLORS = ['#6366f1', '#f97316', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];

const attendanceData = [
  { day: 'Mon', present: 92, absent: 8 },
  { day: 'Tue', present: 88, absent: 12 },
  { day: 'Wed', present: 95, absent: 5 },
  { day: 'Thu', present: 90, absent: 10 },
  { day: 'Fri', present: 85, absent: 15 },
];

const feeCollectionData = [
  { month: 'Apr', collected: 420000, pending: 80000 },
  { month: 'May', collected: 380000, pending: 120000 },
  { month: 'Jun', collected: 450000, pending: 50000 },
  { month: 'Jul', collected: 410000, pending: 90000 },
  { month: 'Aug', collected: 460000, pending: 40000 },
  { month: 'Sep', collected: 390000, pending: 110000 },
];

const subjectPerformance = [
  { subject: 'Math', avg: 72 },
  { subject: 'Science', avg: 78 },
  { subject: 'English', avg: 82 },
  { subject: 'Hindi', avg: 75 },
  { subject: 'SST', avg: 80 },
];

const feeStatusData = [
  { name: 'Paid', value: 68 },
  { name: 'Pending', value: 20 },
  { name: 'Overdue', value: 12 },
];

function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div className="stat-card hover:shadow-card-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <span className={clsx('flex items-center gap-1 text-xs font-semibold',
            trend >= 0 ? 'text-green-600' : 'text-red-500')}>
            <TrendingUp className="w-3 h-3" style={{ transform: trend < 0 ? 'scaleY(-1)' : 'none' }} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-slate-800 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, to, color }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-base group">
      <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 text-center">{label}</span>
    </Link>
  );
}

export default function DashboardPage() {
  const user = useSelector(selectUser);
  const role = useSelector(selectUserRole);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setStats(res.data.data);
      } catch {
        // Use mock data for demo
        setStats({
          totalStudents: 1248,
          totalTeachers: 64,
          totalStaff: 28,
          presentToday: 1142,
          feeCollected: '₹4,60,000',
          feePending: '₹40,000',
          upcomingExams: 3,
          pendingLeaves: 5,
        });
      } finally {
        setLoading(false);
      }

      setRecentActivities([
        { id: 1, type: 'attendance', text: 'Attendance marked for Class 10-A', time: '10 min ago', color: 'bg-green-100 text-green-700' },
        { id: 2, type: 'fee', text: 'Fee payment received from Rohan Sharma', time: '25 min ago', color: 'bg-blue-100 text-blue-700' },
        { id: 3, type: 'leave', text: 'Leave request from Mr. Patil (Teacher)', time: '1 hr ago', color: 'bg-yellow-100 text-yellow-700' },
        { id: 4, type: 'result', text: 'Results published for Unit Test 2', time: '2 hr ago', color: 'bg-purple-100 text-purple-700' },
        { id: 5, type: 'notice', text: 'Annual Day notice posted', time: '3 hr ago', color: 'bg-pink-100 text-pink-700' },
      ]);
    };
    fetchDashboard();
  }, []);

  const profile = user?.teacherProfile || user?.studentProfile || user?.staffProfile || user?.principalProfile;
  const displayName = profile
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    : user?.email?.split('@')[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="shimmer h-20 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="shimmer h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="shimmer h-72 rounded-2xl" />
          <div className="shimmer h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden card p-6 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 border-0">
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white" />
          <div className="absolute bottom-4 right-20 w-20 h-20 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-primary-200 text-sm font-medium">{greeting},</p>
            <h1 className="font-display text-2xl font-bold text-white mt-0.5">{displayName} 👋</h1>
            <p className="text-primary-200 text-sm mt-1">
              {role === 'STUDENT' ? "Here's your academic overview for today"
               : role === 'PARENT' ? "Your child's school summary"
               : "Here's what's happening at school today"}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-primary-200 text-xs">Today</p>
              <p className="text-white font-semibold text-sm">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
            </div>
            <Link to="/ai-assistant" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-base backdrop-blur-sm">
              <Bot className="w-4 h-4" /> AI Assistant
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {(role === 'PRINCIPAL' || role === 'VICE_PRINCIPAL' || role === 'SUPER_ADMIN') && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={GraduationCap} label="Total Students" value={stats?.totalStudents?.toLocaleString() || '1,248'}
            sub="+12 this month" color="bg-primary-600" trend={2.4} />
          <StatCard icon={Users} label="Teachers" value={stats?.totalTeachers || '64'}
            sub={`${stats?.totalStaff || 28} staff`} color="bg-blue-500" trend={0} />
          <StatCard icon={UserCheck} label="Present Today" value={stats?.presentToday || '1,142'}
            sub="91.5% attendance" color="bg-green-500" trend={3.1} />
          <StatCard icon={DollarSign} label="Fees Collected" value={stats?.feeCollected || '₹4,60,000'}
            sub={`${stats?.feePending || '₹40,000'} pending`} color="bg-orange-500" trend={5.2} />
        </div>
      )}

      {(role === 'TEACHER') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={GraduationCap} label="My Students" value="186" sub="3 classes" color="bg-primary-600" />
          <StatCard icon={ClipboardCheck} label="Attendance Today" value="94%" sub="176/186 present" color="bg-green-500" />
          <StatCard icon={BookOpen} label="Periods Today" value="6" sub="Next: 11:00 AM" color="bg-blue-500" />
          <StatCard icon={CalendarCheck} label="Exams This Week" value="2" sub="Results due: 3" color="bg-orange-500" />
        </div>
      )}

      {(role === 'STUDENT') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ClipboardCheck} label="Attendance" value="92%" sub="138/150 days" color="bg-green-500" />
          <StatCard icon={BookOpen} label="Upcoming Exams" value="2" sub="Next: Unit Test 3" color="bg-orange-500" />
          <StatCard icon={TrendingUp} label="Last Result" value="78.4%" sub="Rank 8 in class" color="bg-primary-600" />
          <StatCard icon={DollarSign} label="Fee Status" value="Paid" sub="Next due: Oct 10" color="bg-blue-500" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-primary-500" />
          <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1">
          <QuickAction icon={ClipboardCheck} label="Mark Attendance" to="/attendance" color="bg-green-500" />
          <QuickAction icon={GraduationCap} label="Add Student" to="/students" color="bg-primary-600" />
          <QuickAction icon={BookOpen} label="View Results" to="/results" color="bg-orange-500" />
          <QuickAction icon={CalendarCheck} label="Timetable" to="/timetable" color="bg-blue-500" />
          <QuickAction icon={DollarSign} label="Collect Fee" to="/fees" color="bg-emerald-500" />
          <QuickAction icon={Users} label="Teachers" to="/teachers" color="bg-violet-500" />
          <QuickAction icon={Bot} label="AI Tools" to="/ai-assistant" color="bg-gradient-to-br from-violet-500 to-indigo-600" />
          <QuickAction icon={AlertCircle} label="Notices" to="/notices" color="bg-rose-500" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Weekly Attendance</h3>
            <span className="badge-success">This Week</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={attendanceData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
              />
              <Area type="monotone" dataKey="present" stroke="#6366f1" strokeWidth={2} fill="url(#presentGrad)" name="Present %" />
              <Area type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} fill="url(#absentGrad)" name="Absent %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Fee Status Pie */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">Fee Status</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={feeStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                   paddingAngle={3} dataKey="value">
                {feeStatusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`}
                contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {feeStatusData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-xs text-slate-600 dark:text-slate-400">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subject Performance + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Subject Bar Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Subject Performance</h3>
            <Link to="/results" className="text-xs text-primary-600 dark:text-primary-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subjectPerformance} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="subject" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                formatter={(v) => [`${v}%`, 'Class Average']}
              />
              <Bar dataKey="avg" radius={[6,6,0,0]}>
                {subjectPerformance.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivities.map(act => (
              <div key={act.id} className="flex items-start gap-3">
                <div className={clsx('w-2 h-2 rounded-full mt-2 shrink-0',
                  act.type === 'attendance' ? 'bg-green-500'
                  : act.type === 'fee' ? 'bg-blue-500'
                  : act.type === 'leave' ? 'bg-yellow-500'
                  : act.type === 'result' ? 'bg-purple-500'
                  : 'bg-pink-500'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug">{act.text}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/notices" className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 font-semibold mt-4 hover:gap-2 transition-all">
            View all activity <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Fee Collection Trend */}
      {(role === 'PRINCIPAL' || role === 'VICE_PRINCIPAL' || role === 'SUPER_ADMIN') && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Fee Collection Trend</h3>
            <Link to="/fees" className="text-xs text-primary-600 dark:text-primary-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              Manage Fees <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={feeCollectionData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                     tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                formatter={(v) => [`₹${v.toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="collected" fill="#6366f1" radius={[4,4,0,0]} name="Collected" />
              <Bar dataKey="pending" fill="#fbbf24" radius={[4,4,0,0]} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
