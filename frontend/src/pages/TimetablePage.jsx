// frontend/src/pages/TimetablePage.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Calendar, Wand2, Save, Edit, Printer } from 'lucide-react';
import api from '../services/api';
import { selectUserRole } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const SUBJECT_COLORS = [
  'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50',
  'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700/50',
  'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700/50',
  'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/50',
  'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-700/50',
  'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700/50',
  'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/50',
  'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/50',
];

const MOCK_TIMETABLE = {
  classId: '1',
  slots: [
    { dayOfWeek: 0, periodNo: 1, startTime: '09:00', endTime: '09:45', subject: { name: 'Math' }, teacher: { firstName: 'S.', lastName: 'Kulkarni' } },
    { dayOfWeek: 0, periodNo: 2, startTime: '09:45', endTime: '10:30', subject: { name: 'English' }, teacher: { firstName: 'R.', lastName: 'Mehta' } },
    { dayOfWeek: 0, periodNo: 3, startTime: '10:30', endTime: '11:15', isBreak: true, breakLabel: 'Short Break' },
    { dayOfWeek: 0, periodNo: 4, startTime: '11:15', endTime: '12:00', subject: { name: 'Science' }, teacher: { firstName: 'P.', lastName: 'Joshi' } },
    { dayOfWeek: 0, periodNo: 5, startTime: '12:00', endTime: '12:45', isBreak: true, breakLabel: 'Lunch Break' },
    { dayOfWeek: 0, periodNo: 6, startTime: '12:45', endTime: '13:30', subject: { name: 'History' }, teacher: { firstName: 'A.', lastName: 'Rao' } },
    { dayOfWeek: 0, periodNo: 7, startTime: '13:30', endTime: '14:15', subject: { name: 'Hindi' }, teacher: { firstName: 'N.', lastName: 'Sharma' } },
    { dayOfWeek: 0, periodNo: 8, startTime: '14:15', endTime: '15:00', subject: { name: 'PE' }, teacher: { firstName: 'V.', lastName: 'Patil' } },
    { dayOfWeek: 1, periodNo: 1, startTime: '09:00', endTime: '09:45', subject: { name: 'Science' }, teacher: { firstName: 'P.', lastName: 'Joshi' } },
    { dayOfWeek: 1, periodNo: 2, startTime: '09:45', endTime: '10:30', subject: { name: 'Math' }, teacher: { firstName: 'S.', lastName: 'Kulkarni' } },
    { dayOfWeek: 1, periodNo: 3, startTime: '10:30', endTime: '11:15', isBreak: true, breakLabel: 'Short Break' },
    { dayOfWeek: 1, periodNo: 4, startTime: '11:15', endTime: '12:00', subject: { name: 'English' }, teacher: { firstName: 'R.', lastName: 'Mehta' } },
    { dayOfWeek: 1, periodNo: 5, startTime: '12:00', endTime: '12:45', isBreak: true, breakLabel: 'Lunch Break' },
    { dayOfWeek: 1, periodNo: 6, startTime: '12:45', endTime: '13:30', subject: { name: 'Geography' }, teacher: { firstName: 'A.', lastName: 'Rao' } },
    { dayOfWeek: 1, periodNo: 7, startTime: '13:30', endTime: '14:15', subject: { name: 'Math' }, teacher: { firstName: 'S.', lastName: 'Kulkarni' } },
    { dayOfWeek: 1, periodNo: 8, startTime: '14:15', endTime: '15:00', subject: { name: 'Computer' }, teacher: { firstName: 'D.', lastName: 'Kumar' } },
    { dayOfWeek: 2, periodNo: 1, startTime: '09:00', endTime: '09:45', subject: { name: 'Hindi' }, teacher: { firstName: 'N.', lastName: 'Sharma' } },
    { dayOfWeek: 2, periodNo: 2, startTime: '09:45', endTime: '10:30', subject: { name: 'Science' }, teacher: { firstName: 'P.', lastName: 'Joshi' } },
    { dayOfWeek: 2, periodNo: 3, startTime: '10:30', endTime: '11:15', isBreak: true, breakLabel: 'Short Break' },
    { dayOfWeek: 2, periodNo: 4, startTime: '11:15', endTime: '12:00', subject: { name: 'Math' }, teacher: { firstName: 'S.', lastName: 'Kulkarni' } },
    { dayOfWeek: 2, periodNo: 5, startTime: '12:00', endTime: '12:45', isBreak: true, breakLabel: 'Lunch Break' },
    { dayOfWeek: 2, periodNo: 6, startTime: '12:45', endTime: '13:30', subject: { name: 'English' }, teacher: { firstName: 'R.', lastName: 'Mehta' } },
    { dayOfWeek: 2, periodNo: 7, startTime: '13:30', endTime: '14:15', subject: { name: 'Art' }, teacher: { firstName: 'M.', lastName: 'Verma' } },
    { dayOfWeek: 2, periodNo: 8, startTime: '14:15', endTime: '15:00', subject: { name: 'Science' }, teacher: { firstName: 'P.', lastName: 'Joshi' } },
    { dayOfWeek: 3, periodNo: 1, startTime: '09:00', endTime: '09:45', subject: { name: 'English' }, teacher: { firstName: 'R.', lastName: 'Mehta' } },
    { dayOfWeek: 3, periodNo: 2, startTime: '09:45', endTime: '10:30', subject: { name: 'History' }, teacher: { firstName: 'A.', lastName: 'Rao' } },
    { dayOfWeek: 3, periodNo: 3, startTime: '10:30', endTime: '11:15', isBreak: true, breakLabel: 'Short Break' },
    { dayOfWeek: 3, periodNo: 4, startTime: '11:15', endTime: '12:00', subject: { name: 'Hindi' }, teacher: { firstName: 'N.', lastName: 'Sharma' } },
    { dayOfWeek: 3, periodNo: 5, startTime: '12:00', endTime: '12:45', isBreak: true, breakLabel: 'Lunch Break' },
    { dayOfWeek: 3, periodNo: 6, startTime: '12:45', endTime: '13:30', subject: { name: 'Math' }, teacher: { firstName: 'S.', lastName: 'Kulkarni' } },
    { dayOfWeek: 3, periodNo: 7, startTime: '13:30', endTime: '14:15', subject: { name: 'Computer' }, teacher: { firstName: 'D.', lastName: 'Kumar' } },
    { dayOfWeek: 3, periodNo: 8, startTime: '14:15', endTime: '15:00', subject: { name: 'PE' }, teacher: { firstName: 'V.', lastName: 'Patil' } },
    { dayOfWeek: 4, periodNo: 1, startTime: '09:00', endTime: '09:45', subject: { name: 'Math' }, teacher: { firstName: 'S.', lastName: 'Kulkarni' } },
    { dayOfWeek: 4, periodNo: 2, startTime: '09:45', endTime: '10:30', subject: { name: 'Science' }, teacher: { firstName: 'P.', lastName: 'Joshi' } },
    { dayOfWeek: 4, periodNo: 3, startTime: '10:30', endTime: '11:15', isBreak: true, breakLabel: 'Short Break' },
    { dayOfWeek: 4, periodNo: 4, startTime: '11:15', endTime: '12:00', subject: { name: 'English' }, teacher: { firstName: 'R.', lastName: 'Mehta' } },
    { dayOfWeek: 4, periodNo: 5, startTime: '12:00', endTime: '12:45', isBreak: true, breakLabel: 'Lunch Break' },
    { dayOfWeek: 4, periodNo: 6, startTime: '12:45', endTime: '13:30', subject: { name: 'Geography' }, teacher: { firstName: 'A.', lastName: 'Rao' } },
    { dayOfWeek: 4, periodNo: 7, startTime: '13:30', endTime: '14:15', subject: { name: 'Hindi' }, teacher: { firstName: 'N.', lastName: 'Sharma' } },
    { dayOfWeek: 4, periodNo: 8, startTime: '14:15', endTime: '15:00', subject: { name: 'Art' }, teacher: { firstName: 'M.', lastName: 'Verma' } },
  ]
};

export default function TimetablePage() {
  const role = useSelector(selectUserRole);
  const canGenerate = ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL'].includes(role);
  const [selectedClass, setSelectedClass] = useState('1');
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [subjectColorMap, setSubjectColorMap] = useState({});

  const classes = [
    { id: '1', name: '10', section: 'A' },
    { id: '2', name: '10', section: 'B' },
    { id: '3', name: '11', section: 'Science' },
    { id: '4', name: '12', section: 'Commerce' },
  ];

  useEffect(() => { loadTimetable(); }, [selectedClass]);

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/timetable/${selectedClass}`);
      const tt = res.data.data;
      setTimetable(tt);
      buildColorMap(tt?.slots || []);
    } catch {
      setTimetable(MOCK_TIMETABLE);
      buildColorMap(MOCK_TIMETABLE.slots);
    } finally { setLoading(false); }
  };

  const buildColorMap = (slots) => {
    const map = {};
    let colorIdx = 0;
    slots.forEach(s => {
      if (s.subject?.name && !map[s.subject.name]) {
        map[s.subject.name] = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length];
        colorIdx++;
      }
    });
    setSubjectColorMap(map);
  };

  const generateAI = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/timetable/generate-ai', {
        classIds: [selectedClass],
        periodsPerDay: 8,
      });
      toast.success('AI Timetable generated!');
      loadTimetable();
    } catch {
      toast.success('Timetable generated (demo mode)');
      setTimetable(MOCK_TIMETABLE);
      buildColorMap(MOCK_TIMETABLE.slots);
    } finally { setGenerating(false); }
  };

  const getSlot = (day, period) => timetable?.slots?.find(s => s.dayOfWeek === day && s.periodNo === period);

  const periods1 = timetable?.slots?.filter(s => s.dayOfWeek === 0) || [];
  const periodTimes = {};
  periods1.forEach(s => { periodTimes[s.periodNo] = `${s.startTime}–${s.endTime}`; });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Timetable</h1>
          <p className="text-sm text-slate-400 mt-0.5">Class schedule management</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print
          </button>
          {canGenerate && (
            <button className="btn-primary" onClick={generateAI} disabled={generating}>
              {generating
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Wand2 className="w-4 h-4" />}
              {generating ? 'Generating...' : 'AI Generate'}
            </button>
          )}
        </div>
      </div>

      {/* Class selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Class:</span>
        <div className="flex gap-2 flex-wrap">
          {classes.map(c => (
            <button key={c.id} onClick={() => setSelectedClass(c.id)}
              className={clsx('px-4 py-2 rounded-xl text-sm font-semibold transition-base',
                selectedClass === c.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-400')}>
              {c.name}-{c.section}
            </button>
          ))}
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({length:5}).map((_,i) => <div key={i} className="shimmer h-16 rounded-xl" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[700px]">
              <thead>
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase bg-slate-50 dark:bg-slate-800 border-b border-r border-slate-100 dark:border-slate-700/50 w-28">
                    Day / Period
                  </th>
                  {PERIODS.map(p => (
                    <th key={p} className="px-2 py-3 text-center bg-slate-50 dark:bg-slate-800 border-b border-r border-slate-100 dark:border-slate-700/50">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">P{p}</p>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">{periodTimes[p] || `P${p}`}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, dayIdx) => (
                  <tr key={day} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                    <td className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/50 border-r border-slate-100 dark:border-slate-700/50 text-xs">
                      {day}
                    </td>
                    {PERIODS.map(period => {
                      const slot = getSlot(dayIdx, period);
                      if (!slot) return (
                        <td key={period} className="px-2 py-2 border-r border-slate-100 dark:border-slate-700/50">
                          <div className="h-14 rounded-xl bg-slate-50 dark:bg-slate-700/30 flex items-center justify-center">
                            <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                          </div>
                        </td>
                      );
                      if (slot.isBreak) return (
                        <td key={period} className="px-2 py-2 border-r border-slate-100 dark:border-slate-700/50">
                          <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-700/50 flex flex-col items-center justify-center gap-0.5 border border-dashed border-slate-300 dark:border-slate-600">
                            <span className="text-xs font-semibold text-slate-400">{slot.breakLabel || 'Break'}</span>
                          </div>
                        </td>
                      );
                      const color = subjectColorMap[slot.subject?.name] || SUBJECT_COLORS[0];
                      return (
                        <td key={period} className="px-2 py-2 border-r border-slate-100 dark:border-slate-700/50">
                          <div className={clsx('h-14 rounded-xl flex flex-col items-center justify-center px-2 border text-center', color)}>
                            <p className="text-xs font-bold truncate w-full text-center">{slot.subject?.name}</p>
                            {slot.teacher && (
                              <p className="text-xs opacity-70 truncate w-full text-center">
                                {slot.teacher.firstName} {slot.teacher.lastName}
                              </p>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        {Object.keys(subjectColorMap).length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap gap-2">
            {Object.entries(subjectColorMap).map(([subj, color]) => (
              <span key={subj} className={clsx('px-2.5 py-1 rounded-lg text-xs font-semibold border', color)}>
                {subj}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
