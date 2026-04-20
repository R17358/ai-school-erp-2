// frontend/src/components/layout/AuthLayout.jsx
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { School } from 'lucide-react';

export default function AuthLayout() {
  const { user } = useSelector(s => s.auth);
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-slate-900 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary-400 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-64 h-64 rounded-full bg-accent-500 blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <School className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-5xl font-bold text-white mb-4">SchoolSphere</h1>
          <p className="text-primary-200 text-lg leading-relaxed">
            AI-Powered School Management System. Automate timetables, manage attendance, generate question papers, and much more.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-left">
            {[
              { label: 'AI Timetable', desc: 'Auto-generate conflict-free schedules' },
              { label: 'Smart Results', desc: 'AI insights on student performance' },
              { label: 'Seating AI', desc: 'Auto exam seating arrangements' },
              { label: 'Study Planner', desc: 'Personalized learning roadmaps' },
            ].map(f => (
              <div key={f.label} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                <p className="text-white font-semibold text-sm">{f.label}</p>
                <p className="text-primary-300 text-xs mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <School className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-slate-800 dark:text-white">SchoolSphere</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
