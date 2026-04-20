// frontend/src/pages/CalendarPage.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ChevronLeft, ChevronRight, Plus, Calendar, Flag, Star, BookOpen } from 'lucide-react';
import api from '../services/api';
import { selectUserRole } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import clsx from 'clsx';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const TYPE_CONFIG = {
  NATIONAL: { color:'bg-orange-500', label:'National Holiday', icon:'🇮🇳' },
  STATE:    { color:'bg-yellow-500', label:'State Holiday',    icon:'🏛' },
  SCHOOL:   { color:'bg-primary-500', label:'School Event',   icon:'🏫' },
  FESTIVAL: { color:'bg-pink-500',   label:'Festival',        icon:'🎉' },
  EXAM:     { color:'bg-red-500',    label:'Exam',            icon:'📝' },
  SUNDAY:   { color:'bg-slate-400',  label:'Sunday',          icon:'📅' },
  event:    { color:'bg-teal-500',   label:'Event',           icon:'⭐' },
};

const MOCK_HOLIDAYS = [
  { id:'1', name:'Republic Day',       date:'2025-01-26', type:'NATIONAL' },
  { id:'2', name:'Holi',               date:'2025-03-14', type:'FESTIVAL' },
  { id:'3', name:'Independence Day',   date:'2024-08-15', type:'NATIONAL' },
  { id:'4', name:'Gandhi Jayanti',     date:'2024-10-02', type:'NATIONAL' },
  { id:'5', name:'Diwali',             date:'2024-10-31', type:'FESTIVAL' },
  { id:'6', name:'Christmas',          date:'2024-12-25', type:'FESTIVAL' },
  { id:'7', name:'Annual Day',         date:'2024-12-20', type:'SCHOOL' },
  { id:'8', name:'Sports Day',         date:'2024-11-15', type:'SCHOOL' },
  { id:'9', name:'Unit Test 3',        date:'2024-11-10', type:'EXAM' },
];

const MOCK_EVENTS = [
  { id:'e1', title:'Parent-Teacher Meeting', date:'2024-11-05', type:'event', description:'PTM for classes 9-12' },
  { id:'e2', title:'Science Exhibition',     date:'2024-11-22', type:'event', description:'Annual science fair' },
  { id:'e3', title:'Prize Distribution',     date:'2024-12-18', type:'event', description:'Annual prize ceremony' },
];

export default function CalendarPage() {
  const role = useSelector(selectUserRole);
  const canManage = ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL'].includes(role);
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [holidays, setHolidays] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:'', date:'', type:'SCHOOL', description:'' });
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => { load(); }, [year]);

  const load = () => {
    setLoading(true);
    api.get('/holidays', { params: { year } }).then(r => {
      setHolidays(r.data.data?.holidays || []);
      setEvents(r.data.data?.events || []);
    }).catch(() => { setHolidays(MOCK_HOLIDAYS); setEvents(MOCK_EVENTS); }).finally(() => setLoading(false));
  };

  const save = async () => {
    if (!form.name || !form.date) return toast.error('Name and date required');
    setSaving(true);
    try {
      await api.post('/holidays', { ...form, date: form.date });
      toast.success('Added to calendar');
      setShowModal(false);
      setForm({ name:'', date:'', type:'SCHOOL', description:'' });
      load();
    } catch { toast.error('Failed to add'); } finally { setSaving(false); }
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getDateStr = (d) => d ? `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` : null;

  const getEventsForDay = (d) => {
    if (!d) return [];
    const dateStr = getDateStr(d);
    const h = holidays.filter(h => h.date?.slice(0,10) === dateStr);
    const e = events.filter(e => e.date?.slice(0,10) === dateStr);
    return [...h.map(x => ({...x, _kind:'holiday'})), ...e.map(x => ({...x, _kind:'event'}))];
  };

  const allItems = [...holidays, ...events].sort((a,b) => new Date(a.date||a.startDate) - new Date(b.date||b.startDate));
  const upcomingItems = allItems.filter(i => new Date(i.date||i.startDate) >= today).slice(0, 8);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="section-header">
        <div><h1 className="section-title">Calendar</h1><p className="text-sm text-slate-400">Holidays, events and important dates</p></div>
        {canManage && <button className="btn-primary" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Add Holiday/Event</button>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 card p-5">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setCurrentDate(new Date(year, month-1, 1))} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-base">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <h2 className="font-display font-bold text-slate-800 dark:text-white text-lg">{MONTHS[month]} {year}</h2>
            <button onClick={() => setCurrentDate(new Date(year, month+1, 1))} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-base">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className={clsx('text-center text-xs font-semibold py-2', d==='Sun' ? 'text-red-400' : 'text-slate-400')}>{d}</div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((d, i) => {
              const dayEvents = getEventsForDay(d);
              const isToday = d && year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
              const isSunday = d && new Date(year, month, d).getDay() === 0;
              const isSelected = selectedDay === d;
              return (
                <div key={i} onClick={() => d && setSelectedDay(isSelected ? null : d)}
                  className={clsx('min-h-[52px] p-1 rounded-lg cursor-pointer transition-base',
                    d ? 'hover:bg-slate-50 dark:hover:bg-slate-700/50' : '',
                    isSelected ? 'bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-300' : '',
                    isToday ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/30' : '')}>
                  {d && (
                    <>
                      <p className={clsx('text-xs font-semibold text-center mb-0.5',
                        isToday ? 'text-primary-600 dark:text-primary-400' : isSunday ? 'text-red-400' : 'text-slate-600 dark:text-slate-400')}>
                        {d}
                      </p>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0,2).map((e, ei) => {
                          const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.event;
                          return (
                            <div key={ei} className={clsx('text-white text-[9px] font-semibold px-1 py-0.5 rounded truncate', cfg.color)}>
                              {e.name || e.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && <div className="text-[9px] text-slate-400 pl-1">+{dayEvents.length-2}</div>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected day detail */}
          {selectedDay && (() => {
            const dayEvts = getEventsForDay(selectedDay);
            return dayEvts.length > 0 ? (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  {selectedDay} {MONTHS[month]} {year}
                </p>
                <div className="space-y-2">
                  {dayEvts.map((e, i) => {
                    const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.event;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className={clsx('w-2.5 h-2.5 rounded-full shrink-0', cfg.color)} />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{e.name || e.title}</span>
                        <span className="badge-gray text-xs">{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 text-sm text-slate-400 text-center">
                No events on {selectedDay} {MONTHS[month]}
              </div>
            );
          })()}
        </div>

        {/* Upcoming events sidebar */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Legend</p>
            <div className="space-y-2">
              {Object.entries(TYPE_CONFIG).filter(([k]) => k !== 'SUNDAY').map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={clsx('w-2.5 h-2.5 rounded-full', cfg.color)} />
                  <span className="text-xs text-slate-600 dark:text-slate-400">{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Upcoming</p>
            {loading ? (
              Array.from({length:4}).map((_,i) => <div key={i} className="shimmer h-10 rounded-xl mb-2" />)
            ) : upcomingItems.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {upcomingItems.map((item, i) => {
                  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.event;
                  const date = new Date(item.date || item.startDate);
                  return (
                    <div key={i} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-base">
                      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 flex-col', cfg.color)}>
                        <span className="text-[9px] leading-none">{MONTHS[date.getMonth()].slice(0,3)}</span>
                        <span className="text-sm font-bold leading-none">{date.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{item.name || item.title}</p>
                        <p className="text-xs text-slate-400">{cfg.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All holidays table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">All Holidays & Events {year}</h3>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Name</th><th>Date</th><th>Day</th><th>Type</th></tr></thead>
            <tbody>
              {[...holidays, ...events.map(e=>({...e,name:e.title}))].sort((a,b)=>new Date(a.date||a.startDate)-new Date(b.date||b.startDate)).map((item,i) => {
                const date = new Date(item.date || item.startDate);
                const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.event;
                return (
                  <tr key={i}>
                    <td className="font-medium text-slate-800 dark:text-slate-200">{item.name || item.title}</td>
                    <td className="text-sm">{date.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</td>
                    <td className="text-sm text-slate-500">{DAYS[date.getDay()]}</td>
                    <td><span className={clsx('text-white text-xs px-2 py-0.5 rounded-full font-semibold', cfg.color)}>{cfg.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Holiday / Event">
        <div className="space-y-4">
          <div><label className="label">Name *</label><input className="input" placeholder="e.g. Annual Day" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
          <div><label className="label">Date *</label><input type="date" className="input" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></div>
          <div><label className="label">Type</label>
            <select className="input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
              {['NATIONAL','STATE','SCHOOL','FESTIVAL','EXAM'].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={()=>setShowModal(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={save} disabled={saving}>{saving?'Saving...':'Add to Calendar'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
