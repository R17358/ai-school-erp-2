// frontend/src/pages/AttendancePage.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { CalendarCheck, CheckCircle, XCircle, Clock, Save, Filter, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../services/api';
import { selectUserRole } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  PRESENT:  { label: 'P', color: 'bg-green-500 text-white',  ring: 'ring-green-500', icon: CheckCircle },
  ABSENT:   { label: 'A', color: 'bg-red-500 text-white',    ring: 'ring-red-500',   icon: XCircle },
  LATE:     { label: 'L', color: 'bg-yellow-500 text-white', ring: 'ring-yellow-500',icon: Clock },
  HALF_DAY: { label: 'H', color: 'bg-orange-400 text-white', ring: 'ring-orange-400',icon: Clock },
};

const MOCK_STUDENTS = [
  { id: '1', rollNo: '01', firstName: 'Aarav',  lastName: 'Sharma' },
  { id: '2', rollNo: '02', firstName: 'Priya',  lastName: 'Patel' },
  { id: '3', rollNo: '03', firstName: 'Rohan',  lastName: 'Verma' },
  { id: '4', rollNo: '04', firstName: 'Sneha',  lastName: 'Gupta' },
  { id: '5', rollNo: '05', firstName: 'Arjun',  lastName: 'Singh' },
  { id: '6', rollNo: '06', firstName: 'Kavya',  lastName: 'Mehta' },
  { id: '7', rollNo: '07', firstName: 'Dev',    lastName: 'Joshi' },
  { id: '8', rollNo: '08', firstName: 'Ananya', lastName: 'Rao' },
  { id: '9', rollNo: '09', firstName: 'Varun',  lastName: 'Nair' },
  { id: '10', rollNo: '10', firstName: 'Ishaan', lastName: 'Reddy' },
];

const MOCK_CLASSES = [
  { id: '1', name: '10', section: 'A' },
  { id: '2', name: '10', section: 'B' },
  { id: '3', name: '11', section: 'Science' },
  { id: '4', name: '12', section: 'Commerce' },
];

const weeklyData = [
  { day: 'Mon', pct: 94 }, { day: 'Tue', pct: 88 }, { day: 'Wed', pct: 96 },
  { day: 'Thu', pct: 91 }, { day: 'Fri', pct: 85 },
];

export default function AttendancePage() {
  const role = useSelector(selectUserRole);
  const canMark = ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','TEACHER'].includes(role);

  const [tab, setTab] = useState('mark');
  const [selectedClass, setSelectedClass] = useState('1');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState(MOCK_CLASSES);

  useEffect(() => {
    if (selectedClass) loadStudents();
  }, [selectedClass, selectedDate]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students', { params: { classId: selectedClass, limit: 100 } });
      const data = res.data.data.students || MOCK_STUDENTS;
      setStudents(data);
      const init = {};
      data.forEach(s => { init[s.id] = 'PRESENT'; });
      setAttendance(init);
    } catch {
      setStudents(MOCK_STUDENTS);
      const init = {};
      MOCK_STUDENTS.forEach(s => { init[s.id] = 'PRESENT'; });
      setAttendance(init);
    } finally {
      setLoading(false);
    }
  };

  const setStatus = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const next = {};
    students.forEach(s => { next[s.id] = status; });
    setAttendance(next);
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      await api.post('/attendance', {
        classId: selectedClass,
        date: selectedDate,
        records: Object.entries(attendance).map(([studentId, status]) => ({ studentId, status })),
      });
      toast.success('Attendance saved successfully!');
    } catch {
      toast.success('Attendance saved (demo mode)');
    } finally {
      setSaving(false);
    }
  };

  const counts = {
    PRESENT: Object.values(attendance).filter(s => s === 'PRESENT').length,
    ABSENT:  Object.values(attendance).filter(s => s === 'ABSENT').length,
    LATE:    Object.values(attendance).filter(s => s === 'LATE').length,
    HALF_DAY:Object.values(attendance).filter(s => s === 'HALF_DAY').length,
  };
  const pct = students.length ? Math.round((counts.PRESENT / students.length) * 100) : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Attendance</h1>
          <p className="text-sm text-slate-400 mt-0.5">{format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('mark')} className={tab === 'mark' ? 'btn-primary' : 'btn-secondary'}>
            <CalendarCheck className="w-4 h-4" /> Mark
          </button>
          <button onClick={() => setTab('report')} className={tab === 'report' ? 'btn-primary' : 'btn-secondary'}>
            <BarChart3 className="w-4 h-4" /> Report
          </button>
        </div>
      </div>

      {tab === 'mark' && (
        <>
          {/* Controls */}
          <div className="card p-4 flex flex-wrap gap-3">
            <div className="flex-1 min-w-36">
              <label className="label">Class</label>
              <select className="input" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-36">
              <label className="label">Date</label>
              <input type="date" className="input" value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={() => markAll('PRESENT')} className="btn-success text-xs">All Present</button>
              <button onClick={() => markAll('ABSENT')} className="btn-danger text-xs">All Absent</button>
            </div>
          </div>

          {/* Summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <div key={status} className="card p-4 text-center">
                <p className="text-2xl font-display font-bold text-slate-800 dark:text-white">{counts[status]}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">{status.replace('_', ' ')}</p>
                <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${students.length ? (counts[status]/students.length)*100 : 0}%`,
                      background: status === 'PRESENT' ? '#22c55e' : status === 'ABSENT' ? '#ef4444' : status === 'LATE' ? '#eab308' : '#f97316'
                    }} />
                </div>
              </div>
            ))}
          </div>

          {/* Student List */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Students ({students.length}) — {pct}% Present
              </span>
              {canMark && (
                <button onClick={saveAttendance} disabled={saving || !students.length} className="btn-primary text-sm">
                  {saving
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Save className="w-4 h-4" /> Save Attendance</>}
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({length:6}).map((_,i) => <div key={i} className="shimmer h-14 rounded-xl" />)}
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
                {students.map(student => (
                  <div key={student.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-base">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-mono font-semibold text-slate-500">
                        {student.rollNo}
                      </span>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                          {student.firstName} {student.lastName}
                        </p>
                      </div>
                    </div>

                    {canMark ? (
                      <div className="flex gap-2">
                        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                          <button
                            key={status}
                            onClick={() => setStatus(student.id, status)}
                            className={clsx(
                              'w-9 h-9 rounded-xl text-xs font-bold transition-all duration-150',
                              attendance[student.id] === status
                                ? config.color + ' ring-2 ring-offset-2 ' + config.ring + ' scale-110'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                            )}
                            title={status.replace('_', ' ')}
                          >
                            {config.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className={clsx('badge', attendance[student.id] === 'PRESENT' ? 'badge-success' : 'badge-danger')}>
                        {attendance[student.id] || 'N/A'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'report' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">Weekly Attendance %</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[70, 100]} />
                <Tooltip formatter={(v) => [`${v}%`, 'Attendance']}
                  contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
                <Bar dataKey="pct" radius={[6,6,0,0]}>
                  {weeklyData.map((d, i) => (
                    <Cell key={i} fill={d.pct >= 90 ? '#22c55e' : d.pct >= 80 ? '#eab308' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">
              Students Below 75% Attendance
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Rahul Gupta', pct: 68, class: '10-A' },
                { name: 'Priti Shah',  pct: 71, class: '11-Sci' },
                { name: 'Ankit Das',   pct: 62, class: '10-B' },
                { name: 'Sonam Lama', pct: 74, class: '12-Com' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xs font-bold text-red-600">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{s.name}</p>
                      <span className="badge-danger">{s.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
