// frontend/src/pages/SettingsPage.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Save, School, Bot, Calendar, BookOpen, Users, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';
import { selectSchool } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import Tabs from '../components/ui/Tabs';
import Modal from '../components/ui/Modal';
import clsx from 'clsx';

const TABS = [
  { id: 'school',  label: 'School Profile', icon: School },
  { id: 'ai',      label: 'AI Settings',    icon: Bot },
  { id: 'year',    label: 'Academic Year',  icon: Calendar },
  { id: 'class',   label: 'Classes',        icon: Users },
  { id: 'subject', label: 'Subjects',       icon: BookOpen },
];

function SchoolProfileTab() {
  const school = useSelector(selectSchool);
  const [form, setForm] = useState({ name:'',address:'',city:'',state:'',pincode:'',phone:'',email:'',website:'',boardType:'CBSE',affiliationNo:'',principalName:'' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/schools/current').then(r => setForm(f => ({...f,...r.data.data}))).catch(() => { if(school) setForm(f=>({...f,...school})); });
  }, []);

  const save = async () => {
    setSaving(true);
    try { await api.put('/schools/current', form); toast.success('School profile updated'); }
    catch(e) { toast.error(e.response?.data?.message||'Update failed'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-5">Basic Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label:'School Name', id:'name', col2:true, req:true },
            { label:'Principal Name', id:'principalName' },
            { label:'Board Type', id:'boardType', type:'select', opts:['CBSE','ICSE','State Board','IB','IGCSE'] },
            { label:'Affiliation No', id:'affiliationNo' },
            { label:'Email', id:'email', type:'email' },
            { label:'Phone', id:'phone' },
            { label:'Website', id:'website' },
            { label:'Address', id:'address', col2:true },
            { label:'City', id:'city' },
            { label:'State', id:'state' },
            { label:'Pincode', id:'pincode' },
          ].map(f => (
            <div key={f.id} className={f.col2 ? 'col-span-2' : ''}>
              <label className="label">{f.label}{f.req && <span className="text-red-400 ml-0.5">*</span>}</label>
              {f.type === 'select' ? (
                <select className="input" value={form[f.id]||''} onChange={e=>setForm({...form,[f.id]:e.target.value})}>
                  {f.opts.map(o=><option key={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type||'text'} className="input" value={form[f.id]||''} onChange={e=>setForm({...form,[f.id]:e.target.value})} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-5">
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function AISettingsTab() {
  const [form, setForm] = useState({ aiProvider:'gemini', aiApiKey:'' });
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    api.get('/schools/current').then(r => setForm({ aiProvider:r.data.data.aiProvider||'gemini', aiApiKey:r.data.data.aiApiKey?'••••••••••••••••':'' })).catch(()=>{});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/schools/current', { aiProvider:form.aiProvider, ...(form.aiApiKey && !form.aiApiKey.startsWith('•') && { aiApiKey:form.aiApiKey }) });
      toast.success('AI settings saved');
    } catch { toast.error('Save failed'); } finally { setSaving(false); }
  };

  const testAI = async () => {
    setTesting(true);
    try { await api.post('/ai/chat', { messages:[{role:'user',content:'Reply OK'}] }); toast.success('AI connection working!'); }
    catch { toast.error('AI connection failed — check your API key'); } finally { setTesting(false); }
  };

  const PROVIDERS = [
    { id:'gemini',    label:'Google Gemini',   desc:'Free tier available. Best for most schools.',  url:'https://aistudio.google.com/app/apikey' },
    { id:'openai',    label:'OpenAI GPT-4',     desc:'Paid. Highest quality results.',               url:'https://platform.openai.com/api-keys' },
    { id:'anthropic', label:'Anthropic Claude', desc:'Paid. Great for document analysis.',           url:'https://console.anthropic.com' },
  ];

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-4">AI Provider</p>
        <div className="space-y-3">
          {PROVIDERS.map(p => (
            <label key={p.id} className={clsx('flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-base',
              form.aiProvider===p.id ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600')}>
              <input type="radio" name="provider" value={p.id} checked={form.aiProvider===p.id} onChange={()=>setForm({...form,aiProvider:p.id})} className="mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{p.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{p.desc} <a href={p.url} target="_blank" rel="noreferrer" className="text-primary-500 hover:underline">Get key →</a></p>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="card p-5">
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-4">API Key</p>
        <div className="relative">
          <input type={showKey?'text':'password'} className="input pr-10" placeholder="Paste your API key" value={form.aiApiKey} onChange={e=>setForm({...form,aiApiKey:e.target.value})} />
          <button onClick={()=>setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex gap-3 mt-4">
          <button className="btn-secondary" onClick={testAI} disabled={testing}>{testing?'Testing...':'Test Connection'}</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<><Save className="w-4 h-4"/>Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClassesTab() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:'', section:'', roomNo:'', capacity:45 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);
  const load = () => { setLoading(true); api.get('/classes').then(r=>setClasses(r.data.data||[])).catch(()=>setClasses([{id:'1',name:'10',section:'A',capacity:45,_count:{students:38}},{id:'2',name:'11',section:'Science',capacity:40,_count:{students:35}}])).finally(()=>setLoading(false)); };

  const save = async () => {
    if(!form.name||!form.section) return toast.error('Name and section required');
    setSaving(true);
    try { await api.post('/classes', form); toast.success('Class added'); setShowModal(false); setForm({name:'',section:'',roomNo:'',capacity:45}); load(); }
    catch(e) { toast.error(e.response?.data?.message||'Failed'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button className="btn-primary" onClick={()=>setShowModal(true)}><Plus className="w-4 h-4"/>Add Class</button></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {loading ? Array.from({length:4}).map((_,i)=><div key={i} className="shimmer h-24 rounded-2xl"/>) : classes.map(c=>(
          <div key={c.id} className="card p-4">
            <p className="font-display font-bold text-2xl text-primary-600">{c.name}</p>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{c.section}</p>
            <p className="text-xs text-slate-400 mt-1">{c._count?.students||0} students · Cap {c.capacity}</p>
          </div>
        ))}
      </div>
      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title="Add Class">
        <div className="space-y-4">
          <div><label className="label">Class Name *</label><input className="input" placeholder="e.g. 10, 11, 12" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div><label className="label">Section *</label><input className="input" placeholder="e.g. A, Science, Commerce" value={form.section} onChange={e=>setForm({...form,section:e.target.value})}/></div>
          <div><label className="label">Room No</label><input className="input" value={form.roomNo} onChange={e=>setForm({...form,roomNo:e.target.value})}/></div>
          <div><label className="label">Capacity</label><input type="number" className="input" value={form.capacity} onChange={e=>setForm({...form,capacity:Number(e.target.value)})}/></div>
          <div className="flex gap-3"><button className="btn-secondary flex-1" onClick={()=>setShowModal(false)}>Cancel</button><button className="btn-primary flex-1" onClick={save} disabled={saving}>{saving?'...':'Add Class'}</button></div>
        </div>
      </Modal>
    </div>
  );
}

function SubjectsTab() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:'', code:'', weeklyHours:4, type:'THEORY' });
  const [saving, setSaving] = useState(false);

  useEffect(()=>{load();},[]);
  const load = ()=>{setLoading(true);api.get('/subjects').then(r=>setSubjects(r.data.data||[])).catch(()=>setSubjects([{id:'1',name:'Mathematics',code:'MATH',weeklyHours:6,type:'THEORY'},{id:'2',name:'Science',code:'SCI',weeklyHours:5,type:'THEORY'},{id:'3',name:'English',code:'ENG',weeklyHours:5,type:'LANGUAGE'}])).finally(()=>setLoading(false));};

  const save = async () => {
    if(!form.name) return toast.error('Subject name required');
    setSaving(true);
    try { await api.post('/subjects', form); toast.success('Subject added'); setShowModal(false); setForm({name:'',code:'',weeklyHours:4,type:'THEORY'}); load(); }
    catch(e){toast.error(e.response?.data?.message||'Failed');}finally{setSaving(false);}
  };

  const del = async (id) => {
    if(!confirm('Delete subject?')) return;
    try { await api.delete(`/subjects/${id}`); load(); toast.success('Deleted'); } catch { toast.error('Cannot delete — subject in use'); }
  };

  const TYPE_COLORS = { THEORY:'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', LANGUAGE:'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', PRACTICAL:'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300', PHYSICAL_EDUCATION:'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400', OTHER:'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400' };

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button className="btn-primary" onClick={()=>setShowModal(true)}><Plus className="w-4 h-4"/>Add Subject</button></div>
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Subject</th><th>Code</th><th>Type</th><th>Weekly Hours</th><th className="text-right">Action</th></tr></thead>
            <tbody>
              {loading?Array.from({length:5}).map((_,i)=><tr key={i}>{[1,2,3,4,5].map(j=><td key={j}><div className="shimmer h-4 rounded"/></td>)}</tr>)
              :subjects.map(s=>(
                <tr key={s.id}>
                  <td className="font-medium text-slate-800 dark:text-slate-200">{s.name}</td>
                  <td className="font-mono text-xs text-slate-500">{s.code||'—'}</td>
                  <td><span className={`badge text-xs ${TYPE_COLORS[s.type]||''}`}>{s.type}</span></td>
                  <td className="text-slate-600 dark:text-slate-400">{s.weeklyHours} hrs/week</td>
                  <td className="text-right"><button onClick={()=>del(s.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-base"><Trash2 className="w-3.5 h-3.5"/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title="Add Subject">
        <div className="space-y-4">
          <div><label className="label">Subject Name *</label><input className="input" placeholder="e.g. Mathematics" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div><label className="label">Code</label><input className="input" placeholder="e.g. MATH" value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/></div>
          <div><label className="label">Type</label><select className="input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{['THEORY','PRACTICAL','LANGUAGE','PHYSICAL_EDUCATION','OTHER'].map(t=><option key={t}>{t}</option>)}</select></div>
          <div><label className="label">Weekly Hours</label><input type="number" className="input" min={1} max={10} value={form.weeklyHours} onChange={e=>setForm({...form,weeklyHours:Number(e.target.value)})}/></div>
          <div className="flex gap-3"><button className="btn-secondary flex-1" onClick={()=>setShowModal(false)}>Cancel</button><button className="btn-primary flex-1" onClick={save} disabled={saving}>{saving?'...':'Add Subject'}</button></div>
        </div>
      </Modal>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState('school');
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="section-header"><div><h1 className="section-title">Settings</h1><p className="text-sm text-slate-400">School configuration, AI, classes and subjects</p></div></div>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="animate-fade-in">
        {tab==='school'  && <SchoolProfileTab/>}
        {tab==='ai'      && <AISettingsTab/>}
        {tab==='year'    && <div className="card p-8 text-center text-slate-400">Academic year management — connect to /academic-years API endpoint</div>}
        {tab==='class'   && <ClassesTab/>}
        {tab==='subject' && <SubjectsTab/>}
      </div>
    </div>
  );
}
