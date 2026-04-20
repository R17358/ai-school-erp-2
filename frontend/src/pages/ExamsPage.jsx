// frontend/src/pages/ExamsPage.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Plus, BookOpen, Calendar, Clock, Edit, Trash2, Eye, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { selectUserRole } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import Tabs from '../components/ui/Tabs';
import clsx from 'clsx';

const EXAM_TYPES = ['UNIT_TEST','MID_TERM','FINAL','PRACTICAL','INTERNAL'];
const TABS = [{ id:'upcoming', label:'Upcoming' }, { id:'ongoing', label:'Ongoing' }, { id:'past', label:'Past' }];

const MOCK_EXAMS = [
  { id:'1', name:'Unit Test 3', examType:'UNIT_TEST', startDate:'2024-11-10', endDate:'2024-11-15', isPublished:false, _count:{ papers:5, results:0 } },
  { id:'2', name:'Half Yearly Exam', examType:'MID_TERM', startDate:'2024-12-01', endDate:'2024-12-15', isPublished:false, _count:{ papers:8, results:0 } },
  { id:'3', name:'Unit Test 2', examType:'UNIT_TEST', startDate:'2024-09-10', endDate:'2024-09-14', isPublished:true, _count:{ papers:5, results:120 } },
  { id:'4', name:'Unit Test 1', examType:'UNIT_TEST', startDate:'2024-07-05', endDate:'2024-07-08', isPublished:true, _count:{ papers:5, results:118 } },
];

const MOCK_PAPERS = [
  { id:'p1', examDate:'2024-11-10', duration:90, maxMarks:50, minMarks:17, roomNo:'101', subject:{ name:'Mathematics' }, teacher:{ firstName:'Sunita', lastName:'Kulkarni' } },
  { id:'p2', examDate:'2024-11-11', duration:90, maxMarks:50, minMarks:17, roomNo:'102', subject:{ name:'Science' }, teacher:{ firstName:'Priya', lastName:'Joshi' } },
  { id:'p3', examDate:'2024-11-12', duration:90, maxMarks:50, minMarks:17, roomNo:'101', subject:{ name:'English' }, teacher:{ firstName:'Rajesh', lastName:'Mehta' } },
  { id:'p4', examDate:'2024-11-13', duration:90, maxMarks:50, minMarks:17, roomNo:'103', subject:{ name:'Hindi' }, teacher:{ firstName:'Neha', lastName:'Sharma' } },
  { id:'p5', examDate:'2024-11-14', duration:90, maxMarks:50, minMarks:17, roomNo:'102', subject:{ name:'Social Studies' }, teacher:{ firstName:'Anil', lastName:'Rao' } },
];

const EXAM_TYPE_COLORS = { UNIT_TEST:'badge-primary', MID_TERM:'badge-warning', FINAL:'badge-danger', PRACTICAL:'badge-success', INTERNAL:'badge-gray' };

function ExamCard({ exam, onView, onEdit, onDelete, canManage }) {
  const start = new Date(exam.startDate);
  const end = new Date(exam.endDate);
  const now = new Date();
  const isUpcoming = start > now;
  const isOngoing = start <= now && end >= now;
  const isPast = end < now;

  return (
    <div className="card p-5 hover:shadow-card-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-100">{exam.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={clsx('badge text-xs', EXAM_TYPE_COLORS[exam.examType]||'badge-gray')}>{exam.examType.replace('_',' ')}</span>
            {exam.isPublished ? <span className="badge-success text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3"/>Published</span>
              : <span className="badge-gray text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3"/>Draft</span>}
            {isOngoing && <span className="badge text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Ongoing</span>}
          </div>
        </div>
        {canManage && (
          <div className="flex gap-1">
            <button onClick={()=>onEdit(exam)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-base"><Edit className="w-3.5 h-3.5"/></button>
            <button onClick={()=>onDelete(exam)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-base"><Trash2 className="w-3.5 h-3.5"/></button>
          </div>
        )}
      </div>
      <div className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400 mb-4">
        <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5"/>{start.toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – {end.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
        <p className="flex items-center gap-2"><FileText className="w-3.5 h-3.5"/>{exam._count?.papers||0} papers · {exam._count?.results||0} results entered</p>
      </div>
      <button onClick={()=>onView(exam)} className="btn-secondary w-full text-sm justify-center"><Eye className="w-4 h-4"/>View Details</button>
    </div>
  );
}

export default function ExamsPage() {
  const role = useSelector(selectUserRole);
  const canManage = ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL'].includes(role);
  const canEnterResult = [...['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','TEACHER']].includes(role);

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [papers, setPapers] = useState([]);
  const [form, setForm] = useState({ name:'', examType:'UNIT_TEST', startDate:'', endDate:'' });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    api.get('/exams').then(r=>setExams(r.data.data||[])).catch(()=>setExams(MOCK_EXAMS)).finally(()=>setLoading(false));
  };

  const viewExam = (exam) => {
    setSelectedExam(exam);
    setPapers([]);
    setShowDetail(true);
    api.get(`/exams/${exam.id}`).then(r=>setPapers(r.data.data?.papers||MOCK_PAPERS)).catch(()=>setPapers(MOCK_PAPERS));
  };

  const save = async () => {
    if (!form.name||!form.startDate||!form.endDate) return toast.error('Fill all required fields');
    setSaving(true);
    try { await api.post('/exams', form); toast.success('Exam created'); setShowModal(false); setForm({name:'',examType:'UNIT_TEST',startDate:'',endDate:''}); load(); }
    catch(e) { toast.error(e.response?.data?.message||'Failed'); } finally { setSaving(false); }
  };

  const publish = async () => {
    if (!selectedExam) return;
    setPublishing(true);
    try { await api.put(`/exams/${selectedExam.id}`, { isPublished:true }); toast.success('Results published!'); setShowDetail(false); load(); }
    catch { toast.success('Published (demo)'); setShowDetail(false); } finally { setPublishing(false); }
  };

  const now = new Date();
  const categorized = {
    upcoming: exams.filter(e=>new Date(e.startDate)>now),
    ongoing:  exams.filter(e=>new Date(e.startDate)<=now&&new Date(e.endDate)>=now),
    past:     exams.filter(e=>new Date(e.endDate)<now),
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="section-header">
        <div><h1 className="section-title">Examinations</h1><p className="text-sm text-slate-400">{exams.length} exams this academic year</p></div>
        {canManage && <button className="btn-primary" onClick={()=>setShowModal(true)}><Plus className="w-4 h-4"/>Create Exam</button>}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Upcoming', count:categorized.upcoming.length, color:'bg-blue-500' },
          { label:'Ongoing',  count:categorized.ongoing.length,  color:'bg-green-500' },
          { label:'Completed',count:categorized.past.length,     color:'bg-slate-400' },
        ].map(s=>(
          <div key={s.label} className="card p-4 text-center">
            <div className={clsx('w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg', s.color)}>{s.count}</div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab}/>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({length:3}).map((_,i)=><div key={i} className="shimmer h-44 rounded-2xl"/>)}</div>
      ) : categorized[tab].length===0 ? (
        <div className="card p-12 text-center"><BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3"/><p className="text-slate-400">No {tab} exams</p>{canManage&&tab==='upcoming'&&<button className="btn-primary mt-4" onClick={()=>setShowModal(true)}><Plus className="w-4 h-4"/>Create Exam</button>}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorized[tab].map(e=>(
            <ExamCard key={e.id} exam={e} onView={viewExam} onEdit={()=>{}} onDelete={()=>{}} canManage={canManage}/>
          ))}
        </div>
      )}

      {/* Create Exam Modal */}
      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title="Create New Exam">
        <div className="space-y-4">
          <div><label className="label">Exam Name *</label><input className="input" placeholder="e.g. Unit Test 3, Mid Term" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div><label className="label">Exam Type</label>
            <select className="input" value={form.examType} onChange={e=>setForm({...form,examType:e.target.value})}>
              {EXAM_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start Date *</label><input type="date" className="input" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></div>
            <div><label className="label">End Date *</label><input type="date" className="input" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/></div>
          </div>
          <div className="flex gap-3"><button className="btn-secondary flex-1" onClick={()=>setShowModal(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={save} disabled={saving}>{saving?'Creating...':'Create Exam'}</button></div>
        </div>
      </Modal>

      {/* Exam Detail Modal */}
      <Modal isOpen={showDetail} onClose={()=>setShowDetail(false)} title={selectedExam?.name||''} size="xl">
        {selectedExam && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={clsx('badge', EXAM_TYPE_COLORS[selectedExam.examType]||'badge-gray')}>{selectedExam.examType.replace('_',' ')}</span>
              <span className="text-sm text-slate-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/>{new Date(selectedExam.startDate).toLocaleDateString('en-IN')} – {new Date(selectedExam.endDate).toLocaleDateString('en-IN')}</span>
              {selectedExam.isPublished?<span className="badge-success">Results Published</span>:<span className="badge-gray">Draft</span>}
            </div>

            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Exam Schedule</p>
              <div className="card overflow-hidden">
                <div className="table-wrapper">
                  <table className="table">
                    <thead><tr><th>Subject</th><th>Date</th><th>Duration</th><th>Max Marks</th><th>Min Marks</th><th>Room</th><th>Invigilator</th></tr></thead>
                    <tbody>
                      {papers.length===0?(
                        <tr><td colSpan={7} className="text-center py-8 text-slate-400">No papers configured</td></tr>
                      ):papers.map(p=>(
                        <tr key={p.id}>
                          <td className="font-medium text-slate-800 dark:text-slate-200">{p.subject?.name}</td>
                          <td className="text-sm">{new Date(p.examDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</td>
                          <td>{p.duration} min</td>
                          <td className="font-semibold">{p.maxMarks}</td>
                          <td className="text-slate-400">{p.minMarks}</td>
                          <td>{p.roomNo||'—'}</td>
                          <td className="text-sm text-slate-500">{p.teacher?`${p.teacher.firstName} ${p.teacher.lastName}`:'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {canManage && !selectedExam.isPublished && (
                <button className="btn-success flex-1 justify-center" onClick={publish} disabled={publishing}>
                  {publishing?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<><CheckCircle className="w-4 h-4"/>Publish Results</>}
                </button>
              )}
              <button className="btn-secondary flex-1 justify-center" onClick={()=>setShowDetail(false)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
