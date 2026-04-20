// frontend/src/pages/LoginPage.jsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const dispatch = useDispatch();
  const { loading } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', password: '', schoolCode: '' });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Email and password required');
    const result = await dispatch(loginUser(form));
    if (result.meta.requestStatus === 'rejected') {
      toast.error(result.payload || 'Login failed');
    } else {
      toast.success('Welcome back!');
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-3xl font-bold text-slate-800 dark:text-white mb-2">Welcome back</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Sign in to your SchoolSphere account</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label">School Code <span className="text-slate-300">(optional for multi-school)</span></label>
          <input type="text" className="input" placeholder="e.g. DPS-NAGPUR"
            value={form.schoolCode} onChange={e => setForm({...form, schoolCode: e.target.value})} />
        </div>
        <div>
          <label className="label">Email Address</label>
          <input type="email" className="input" placeholder="your@school.edu" required
            value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'} className="input pr-10" placeholder="••••••••" required
              value={form.password} onChange={e => setForm({...form, password: e.target.value})}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-base">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><LogIn className="w-4 h-4" /> Sign In</>
          )}
        </button>
      </form>

      <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
        <p className="text-xs font-semibold text-slate-500 mb-2">Demo Credentials</p>
        <div className="space-y-1 text-xs text-slate-500 font-mono">
          <p>Principal: principal@demo.school / Demo@123</p>
          <p>Teacher: teacher@demo.school / Demo@123</p>
          <p>Student: student@demo.school / Demo@123</p>
        </div>
      </div>
    </div>
  );
}
