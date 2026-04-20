// frontend/src/pages/AIAssistantPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Bot, Send, Sparkles, Calendar, FileText, MapPin,
  BookOpen, TrendingUp, RotateCcw, Copy, Check, ChevronRight,
  Wand2, Clock, GraduationCap
} from 'lucide-react';
import api from '../services/api';
import { selectUserRole, selectSchool } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const AI_TOOLS = [
  {
    id: 'chat',
    label: 'AI Chat',
    icon: Bot,
    color: 'bg-violet-500',
    description: 'Ask anything about school operations',
  },
  {
    id: 'timetable',
    label: 'Timetable Generator',
    icon: Calendar,
    color: 'bg-blue-500',
    description: 'Auto-generate conflict-free class schedules',
    roles: ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL'],
  },
  {
    id: 'qp',
    label: 'Question Paper',
    icon: FileText,
    color: 'bg-orange-500',
    description: 'Generate Bloom\'s taxonomy-based QPs',
    roles: ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','TEACHER'],
  },
  {
    id: 'notes',
    label: 'Notes Generator',
    icon: BookOpen,
    color: 'bg-green-500',
    description: 'Generate simple-language study notes',
    roles: ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','TEACHER','STUDENT'],
  },
  {
    id: 'seating',
    label: 'Seating Arrangement',
    icon: MapPin,
    color: 'bg-rose-500',
    description: 'Auto-assign exam seating',
    roles: ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','TEACHER'],
  },
  {
    id: 'studyplan',
    label: 'Study Planner',
    icon: GraduationCap,
    color: 'bg-teal-500',
    description: 'Personalized learning roadmaps',
    roles: ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','TEACHER','STUDENT'],
  },
];

// ─── Chat Tool ────────────────────────────────────────────────
function ChatTool({ school }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello! I'm SchoolBot 🎓 I can help you with timetables, results, attendance queries, school policies, and much more. What would you like to know?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/ai/chat', {
        messages: [...messages, userMsg],
        school_context: school,
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.data.response }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I\'m having trouble connecting right now. Please check the AI service configuration.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[560px]">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((msg, i) => (
          <div key={i} className={clsx('flex gap-3', msg.role === 'user' && 'justify-end')}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={clsx(
              'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-primary-600 text-white rounded-tr-sm'
                : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 rounded-tl-sm'
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/60 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                     style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-slate-100 dark:border-slate-700/50 p-4">
        <div className="flex items-center gap-2">
          <input
            type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask anything about school..."
            className="input flex-1"
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            className="btn-primary px-3 py-2.5 disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
          {['What is today\'s attendance?', 'Show pending fees', 'Exam schedule', 'Leave policy'].map(q => (
            <button key={q} onClick={() => setInput(q)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-base">
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Question Paper Tool ─────────────────────────────────────
function QPTool() {
  const [form, setForm] = useState({
    subject: '', class_name: '', board: 'CBSE', exam_type: 'Mid Term',
    topics: '', total_marks: 80, duration_minutes: 180, difficulty: 'medium',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!form.subject || !form.class_name || !form.topics) {
      toast.error('Please fill subject, class and topics');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/ai/generate-qp', {
        ...form,
        topics: form.topics.split(',').map(t => t.trim()).filter(Boolean),
      });
      setResult(res.data.data.question_paper);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed. Check AI config.');
    } finally {
      setLoading(false);
    }
  };

  const copyQP = () => {
    if (!result) return;
    const text = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="label">Subject *</label>
          <input className="input" placeholder="e.g. Mathematics" value={form.subject}
            onChange={e => setForm({...form, subject: e.target.value})} /></div>
        <div><label className="label">Class *</label>
          <input className="input" placeholder="e.g. 10, 11-Science" value={form.class_name}
            onChange={e => setForm({...form, class_name: e.target.value})} /></div>
        <div><label className="label">Board</label>
          <select className="input" value={form.board} onChange={e => setForm({...form, board: e.target.value})}>
            {['CBSE','ICSE','State Board','IB'].map(b => <option key={b}>{b}</option>)}
          </select></div>
        <div><label className="label">Exam Type</label>
          <select className="input" value={form.exam_type} onChange={e => setForm({...form, exam_type: e.target.value})}>
            {['Unit Test','Mid Term','Final','Half Yearly','Annual'].map(e => <option key={e}>{e}</option>)}
          </select></div>
        <div><label className="label">Total Marks</label>
          <input type="number" className="input" value={form.total_marks}
            onChange={e => setForm({...form, total_marks: Number(e.target.value)})} /></div>
        <div><label className="label">Duration (minutes)</label>
          <input type="number" className="input" value={form.duration_minutes}
            onChange={e => setForm({...form, duration_minutes: Number(e.target.value)})} /></div>
        <div><label className="label">Difficulty</label>
          <select className="input" value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})}>
            {['easy','medium','hard'].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select></div>
        <div><label className="label">Topics (comma separated) *</label>
          <input className="input" placeholder="e.g. Algebra, Geometry, Trigonometry"
            value={form.topics} onChange={e => setForm({...form, topics: e.target.value})} /></div>
      </div>

      <button onClick={generate} disabled={loading} className="btn-primary w-full justify-center py-3">
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating with AI...</>
        ) : (
          <><Wand2 className="w-4 h-4" /> Generate Question Paper</>
        )}
      </button>

      {result && (
        <div className="border border-primary-200 dark:border-primary-700/50 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-700/50">
            <div className="flex items-center gap-2">
              <span className="ai-badge"><Sparkles className="w-3 h-3" /> AI Generated</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{result.title}</span>
            </div>
            <button onClick={copyQP} className="btn-ghost text-xs gap-1.5">
              {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            <p className="text-xs text-slate-500 mb-4 italic">{result.instructions}</p>
            {result.sections?.map((sec, si) => (
              <div key={si} className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">{sec.name}</h4>
                  <span className="badge-gray text-xs">{sec.marks} marks</span>
                </div>
                <div className="space-y-3">
                  {sec.questions?.map((q, qi) => (
                    <div key={qi} className="text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-slate-600 dark:text-slate-400 shrink-0">{q.no}.</span>
                        <div className="flex-1">
                          <span className="text-slate-700 dark:text-slate-300">{q.text}</span>
                          {q.options && (
                            <div className="grid grid-cols-2 gap-1 mt-1.5">
                              {q.options.map((opt, oi) => (
                                <span key={oi} className="text-xs text-slate-500">({String.fromCharCode(65+oi)}) {opt}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="badge-gray text-xs">{q.marks} mk</span>
                            <span className="text-xs text-violet-500">{q.bloom_level}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Notes Generator Tool ────────────────────────────────────
function NotesTool() {
  const [form, setForm] = useState({ subject: '', topic: '', class_name: '', detail_level: 'medium' });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!form.subject || !form.topic || !form.class_name) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/ai/generate-notes', form);
      setNotes(res.data.data.notes);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Notes generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="label">Subject *</label>
          <input className="input" placeholder="e.g. Physics" value={form.subject}
            onChange={e => setForm({...form, subject: e.target.value})} /></div>
        <div><label className="label">Topic *</label>
          <input className="input" placeholder="e.g. Newton's Laws of Motion" value={form.topic}
            onChange={e => setForm({...form, topic: e.target.value})} /></div>
        <div><label className="label">Class *</label>
          <input className="input" placeholder="e.g. 9, 10, 11" value={form.class_name}
            onChange={e => setForm({...form, class_name: e.target.value})} /></div>
        <div><label className="label">Detail Level</label>
          <select className="input" value={form.detail_level} onChange={e => setForm({...form, detail_level: e.target.value})}>
            {['basic','medium','detailed'].map(d => <option key={d}>{d}</option>)}
          </select></div>
      </div>

      <button onClick={generate} disabled={loading} className="btn-primary w-full justify-center py-3">
        {loading
          ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating Notes...</>
          : <><BookOpen className="w-4 h-4" /> Generate Study Notes</>}
      </button>

      {notes && (
        <div className="border border-green-200 dark:border-green-700/50 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-700/50">
            <span className="ai-badge"><Sparkles className="w-3 h-3" /> AI Notes: {form.topic}</span>
            <button onClick={() => { navigator.clipboard.writeText(notes); toast.success('Copied!'); }}
              className="btn-ghost text-xs"><Copy className="w-3.5 h-3.5" /> Copy</button>
          </div>
          <div className="p-5 max-h-96 overflow-y-auto prose prose-sm prose-slate dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{notes}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Study Planner Tool ───────────────────────────────────────
function StudyPlannerTool() {
  const [form, setForm] = useState({
    student_name: '', class_name: '', board: 'CBSE',
    subjects: '', exam_date: '', current_date: new Date().toISOString().split('T')[0],
    weak_subjects: '', daily_study_hours: 4
  });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/study-plan', {
        ...form,
        subjects: form.subjects.split(',').map(s => s.trim()),
        weak_subjects: form.weak_subjects.split(',').map(s => s.trim()).filter(Boolean),
      });
      setPlan(res.data.data.plan);
    } catch (err) {
      toast.error('Study plan generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="label">Student Name</label>
          <input className="input" placeholder="Your name" value={form.student_name}
            onChange={e => setForm({...form, student_name: e.target.value})} /></div>
        <div><label className="label">Class</label>
          <input className="input" placeholder="e.g. 12-Science" value={form.class_name}
            onChange={e => setForm({...form, class_name: e.target.value})} /></div>
        <div><label className="label">Subjects (comma separated)</label>
          <input className="input" placeholder="Math, Physics, Chemistry..." value={form.subjects}
            onChange={e => setForm({...form, subjects: e.target.value})} /></div>
        <div><label className="label">Weak Subjects</label>
          <input className="input" placeholder="Math, Chemistry" value={form.weak_subjects}
            onChange={e => setForm({...form, weak_subjects: e.target.value})} /></div>
        <div><label className="label">Exam Date</label>
          <input type="date" className="input" value={form.exam_date}
            onChange={e => setForm({...form, exam_date: e.target.value})} /></div>
        <div><label className="label">Daily Study Hours</label>
          <input type="number" className="input" min={1} max={12} value={form.daily_study_hours}
            onChange={e => setForm({...form, daily_study_hours: Number(e.target.value)})} /></div>
      </div>
      <button onClick={generate} disabled={loading} className="btn-primary w-full justify-center py-3">
        {loading
          ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Plan...</>
          : <><GraduationCap className="w-4 h-4" /> Generate Study Plan</>}
      </button>
      {plan && (
        <div className="border border-teal-200 dark:border-teal-700/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="ai-badge"><Sparkles className="w-3 h-3" /> Personalized Study Plan</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {plan.subject_allocation && Object.entries(plan.subject_allocation).map(([subj, pct]) => (
              <div key={subj} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-primary-600">{pct}%</p>
                <p className="text-xs text-slate-500 mt-0.5">{subj}</p>
              </div>
            ))}
          </div>
          {plan.milestones && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Milestones</p>
              {plan.milestones.map((m, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {m.week}
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">{m.goal}</p>
                </div>
              ))}
            </div>
          )}
          {plan.revision_strategy && (
            <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-sm text-slate-600 dark:text-slate-400">
              <p className="font-semibold text-primary-700 dark:text-primary-400 mb-1">Revision Strategy</p>
              <p>{plan.revision_strategy}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main AI Assistant Page ───────────────────────────────────
export default function AIAssistantPage() {
  const role = useSelector(selectUserRole);
  const school = useSelector(selectSchool);
  const [activeTool, setActiveTool] = useState('chat');

  const visibleTools = AI_TOOLS.filter(t => !t.roles || t.roles.includes(role));

  const renderTool = () => {
    switch (activeTool) {
      case 'chat': return <ChatTool school={school} />;
      case 'qp': return <QPTool />;
      case 'notes': return <NotesTool />;
      case 'studyplan': return <StudyPlannerTool />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bot className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-400">This tool is coming soon</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <span className="ai-badge text-base"><Sparkles className="w-4 h-4" /> AI</span>
            AI Assistant
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Powered by AI — automate school tasks intelligently</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Tool Selector */}
        <div className="lg:col-span-1 space-y-2">
          {visibleTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={clsx(
                'w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all duration-200',
                activeTool === tool.id
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'card hover:shadow-card-md text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                activeTool === tool.id ? 'bg-white/20' : tool.color)}>
                <tool.icon className={clsx('w-4.5 h-4.5', activeTool === tool.id ? 'text-white' : 'text-white')}
                           style={{ width: 18, height: 18 }} />
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate">{tool.label}</p>
                <p className={clsx('text-xs truncate mt-0.5',
                  activeTool === tool.id ? 'text-white/70' : 'text-slate-400')}>
                  {tool.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Tool Content */}
        <div className="lg:col-span-3 card p-5 overflow-hidden">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-700/50">
            {(() => {
              const tool = visibleTools.find(t => t.id === activeTool);
              if (!tool) return null;
              return (
                <>
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', tool.color)}>
                    <tool.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-semibold text-slate-800 dark:text-slate-100">{tool.label}</h2>
                    <p className="text-xs text-slate-400">{tool.description}</p>
                  </div>
                </>
              );
            })()}
          </div>
          {renderTool()}
        </div>
      </div>
    </div>
  );
}
