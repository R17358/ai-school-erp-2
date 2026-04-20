// frontend/src/App.jsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { getMe } from './store/slices/authSlice';
import { setDarkMode } from './store/slices/uiSlice';

// Layout
import AppLayout from './components/layout/AppLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth pages
import LoginPage from './pages/LoginPage';

// Dashboard
import DashboardPage from './pages/DashboardPage';

// Module pages
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import TeachersPage from './pages/TeachersPage';
import StaffPage from './pages/StaffPage';
import AttendancePage from './pages/AttendancePage';
import TimetablePage from './pages/TimetablePage';
import ExamsPage from './pages/ExamsPage';
import ResultsPage from './pages/ResultsPage';
import FeesPage from './pages/FeesPage';
import SalaryPage from './pages/SalaryPage';
import LeavesPage from './pages/LeavesPage';
import NoticePage from './pages/NoticePage';
import CalendarPage from './pages/CalendarPage';
import AIAssistantPage from './pages/AIAssistantPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ReportsPage from './pages/ReportsPage';
import SeatingPage from './pages/SeatingPage';
import NotFoundPage from './pages/NotFoundPage';

// Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleGuard from './components/auth/RoleGuard';

function App() {
  const dispatch = useDispatch();
  const { accessToken, initialized } = useSelector((s) => s.auth);
  const { darkMode } = useSelector((s) => s.ui);

  useEffect(() => {
    // Apply dark mode on mount
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (accessToken) dispatch(getMe());
    else dispatch({ type: 'auth/getMe/rejected' });
  }, []);

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-light dark:bg-surface-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <span className="text-white font-display font-bold text-xl">S</span>
          </div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary-500 animate-bounce"
                   style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        className: 'dark:bg-slate-800 dark:text-white',
        duration: 3000,
        style: { borderRadius: '12px', fontSize: '14px', fontFamily: 'Plus Jakarta Sans' },
      }} />

      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Protected app routes */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/notices" element={<NoticePage />} />
          <Route path="/settings" element={<RoleGuard roles={['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL']}><SettingsPage /></RoleGuard>} />

          {/* Students */}
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/:id" element={<StudentDetailPage />} />

          {/* Teachers & Staff */}
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/staff" element={<RoleGuard roles={['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL']}><StaffPage /></RoleGuard>} />

          {/* Academics */}
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/timetable" element={<TimetablePage />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/seating" element={<SeatingPage />} />

          {/* Finance */}
          <Route path="/fees" element={<FeesPage />} />
          <Route path="/salary" element={<RoleGuard roles={['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','TEACHER','STAFF','WATCHMAN','PEON']}><SalaryPage /></RoleGuard>} />

          {/* HR */}
          <Route path="/leaves" element={<LeavesPage />} />

          {/* Reports */}
          <Route path="/reports" element={<RoleGuard roles={['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL']}><ReportsPage /></RoleGuard>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
