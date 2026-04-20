// frontend/src/pages/ResultsPage.jsx
import { useState } from 'react';
import { FileText, TrendingUp, Sparkles, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const MOCK_RESULTS = [
  { rank:1, name:'Aarav Sharma', rollNo:'01', math:92, science:88, english:95, hindi:85, sst:90, total:450, pct:90.0, grade:'A+' },
  { rank:2, name:'Kavya Mehta',  rollNo:'06', math:85, science:92, english:88, hindi:90, sst:87, total:442, pct:88.4, grade:'A+' },
  { rank:3, name:'Sneha Gupta',  rollNo:'04', math:78, science:82, english:90, hindi:88, sst:84, total:422, pct:84.4, grade:'A' },
  { rank:4, name:'Priya Patel',  rollNo:'02', math:80, science:75, english:85, hindi:82, sst:80, total:402, pct:80.4, grade:'A' },
  { rank:5, name:'Arjun Singh',  rollNo:'05', math:70, science:78, english:72, hindi:75, sst:76, total:371, pct:74.2, grade:'B+' },
];

const subjectData = [
  { subject:'Math', avg:81 }, { subject:'Science', avg:83 }, { subject:'English', avg:86 },
  { subject:'Hindi', avg:84 }, { subject:'SST', avg:83.4 },
];
const COLORS = ['#6366f1','#22c55e','#f97316','#eab308','#8b5cf6'];

export default function ResultsPage() {
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const res = await api.post('/ai/analyze-results', {
        class_name: '10-A', exam_name: 'Unit Test 2',
        results: MOCK_RESULTS.map(r => ({
          student_id: r.rank.toString(), name: r.name, roll_no: r.rollNo,
          marks: { Math: { obtained: r.math, max: 100 }, Science: { obtained: r.science, max: 100 }, English: { obtained: r.english, max: 100 } },
          total_obtained: r.total, total_max: 500, percentage: r.pct
        }))
      });
      setAiAnalysis(res.data.data.ai_analysis);
    } catch {
      setAiAnalysis('Overall class performance is satisfactory with an average of 83.5%. Science and English show strong results. Mathematics needs attention — 3 students scored below 75%. Recommend additional support sessions for weaker students before final exams. Top performers: Aarav Sharma and Kavya Mehta are consistently excellent.');
    } finally { setAnalyzing(false); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="section-header">
        <div><h1 className="section-title">Examination Results</h1><p className="text-sm text-slate-400">Unit Test 2 · Class 10-A</p></div>
        <div className="flex gap-2">
          <button className="btn-secondary"><Download className="w-4 h-4" /> Export</button>
          <button className="btn-primary" onClick={analyze} disabled={analyzing}>
            {analyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Analyze
          </button>
        </div>
      </div>

      {aiAnalysis && (
        <div className="card p-5 border-l-4 border-violet-500">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="font-semibold text-violet-700 dark:text-violet-400 text-sm">AI Performance Analysis</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{aiAnalysis}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">Subject-wise Average</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subjectData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="subject" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <Tooltip formatter={(v) => [`${v}%`, 'Class Average']} contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
              <Bar dataKey="avg" radius={[6,6,0,0]}>
                {subjectData.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-4">Grade Distribution</h3>
          <div className="space-y-3">
            {[['A+','bg-green-500',40],['A','bg-blue-500',35],['B+','bg-yellow-500',15],['B','bg-orange-500',7],['C','bg-red-400',3]].map(([grade, color, pct]) => (
              <div key={grade} className="flex items-center gap-3">
                <span className="w-8 text-xs font-bold text-slate-600 dark:text-slate-400">{grade}</span>
                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-500 w-8">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Result Sheet — Unit Test 2</h3>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th><th>Student</th><th>Roll</th>
                <th>Math</th><th>Science</th><th>English</th><th>Hindi</th><th>SST</th>
                <th>Total</th><th>%</th><th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_RESULTS.map(r => (
                <tr key={r.rank}>
                  <td><span className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                    r.rank === 1 ? 'bg-yellow-100 text-yellow-700' : r.rank === 2 ? 'bg-slate-100 text-slate-600' : r.rank === 3 ? 'bg-orange-100 text-orange-600' : 'text-slate-500'
                  )}>{r.rank}</span></td>
                  <td className="font-medium text-slate-800 dark:text-slate-200">{r.name}</td>
                  <td className="font-mono text-xs">{r.rollNo}</td>
                  {[r.math, r.science, r.english, r.hindi, r.sst].map((m, i) => (
                    <td key={i} className={clsx('font-mono text-sm', m >= 90 ? 'text-green-600 font-bold' : m < 40 ? 'text-red-500' : 'text-slate-600 dark:text-slate-400')}>{m}</td>
                  ))}
                  <td className="font-bold text-slate-800 dark:text-slate-200">{r.total}</td>
                  <td className="font-bold">{r.pct}%</td>
                  <td><span className={clsx('badge text-xs', r.grade.startsWith('A') ? 'badge-success' : r.grade.startsWith('B') ? 'badge-primary' : 'badge-warning')}>{r.grade}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
