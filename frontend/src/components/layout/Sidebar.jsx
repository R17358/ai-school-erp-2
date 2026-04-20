// frontend/src/components/layout/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebarCollapse } from '../../store/slices/uiSlice';
import { selectUser, selectUserRole, selectSchool } from '../../store/slices/authSlice';
import {
  LayoutDashboard, Users, GraduationCap, UserCog, ClipboardCheck,
  CalendarDays, BookOpen, FileText, DollarSign, Wallet, UserMinus,
  Bell, Settings, Bot, BarChart3, ChevronLeft, ChevronRight,
  Calendar, MapPin, School
} from 'lucide-react';
import clsx from 'clsx';

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard',    icon: LayoutDashboard, path: '/dashboard', roles: 'ALL' },
      { label: 'AI Assistant', icon: Bot,             path: '/ai-assistant', roles: 'ALL' },
    ]
  },
  {
    title: 'People',
    items: [
      { label: 'Students',  icon: GraduationCap, path: '/students', roles: ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','TEACHER','STAFF','STUDENT','PARENT'] },
      { label: 'Teachers',  icon: Users,         path: '/teachers', roles: 'ALL' },
      { label: 'Staff',     icon: UserCog,       path: '/staff',    roles: ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL'] },
    ]
  },
  {
    title: 'Academics',
    items: [
      { label: 'Attendance',  icon: ClipboardCheck, path: '/attendance', roles: 'ALL' },
      { label: 'Timetable',   icon: CalendarDays,   path: '/timetable',  roles: 'ALL' },
      { label: 'Exams',       icon: BookOpen,        path: '/exams',      roles: ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','TEACHER','STUDENT','PARENT'] },
      { label: 'Results',     icon: FileText,        path: '/results',    roles: 'ALL' },
      { label: 'Seating',     icon: MapPin,          path: '/seating',    roles: ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','TEACHER'] },
    ]
  },
  {
    title: 'Finance & HR',
    items: [
      { label: 'Fees',    icon: DollarSign, path: '/fees',   roles: ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','STAFF','STUDENT','PARENT'] },
      { label: 'Salary',  icon: Wallet,     path: '/salary', roles: ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','TEACHER','STAFF','WATCHMAN','PEON'] },
      { label: 'Leaves',  icon: UserMinus,  path: '/leaves', roles: ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL','TEACHER','STAFF','WATCHMAN','PEON'] },
    ]
  },
  {
    title: 'Communication',
    items: [
      { label: 'Notices',  icon: Bell,         path: '/notices',  roles: 'ALL' },
      { label: 'Calendar', icon: Calendar,     path: '/calendar', roles: 'ALL' },
    ]
  },
  {
    title: 'Admin',
    items: [
      { label: 'Reports',  icon: BarChart3, path: '/reports',  roles: ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL'] },
      { label: 'Settings', icon: Settings,  path: '/settings', roles: ['SUPER_ADMIN','PRINCIPAL','VICE_PRINCIPAL'] },
    ]
  },
];

const ROLE_COLORS = {
  SUPER_ADMIN: 'bg-purple-500', PRINCIPAL: 'bg-primary-600',
  VICE_PRINCIPAL: 'bg-blue-500', TEACHER: 'bg-teal-500',
  STAFF: 'bg-slate-500', STUDENT: 'bg-green-500',
  PARENT: 'bg-orange-500', WATCHMAN: 'bg-gray-500', PEON: 'bg-gray-500',
};

export default function Sidebar() {
  const dispatch = useDispatch();
  const { sidebarCollapsed } = useSelector(s => s.ui);
  const user = useSelector(selectUser);
  const role = useSelector(selectUserRole);
  const school = useSelector(selectSchool);

  const canSee = (roles) => {
    if (roles === 'ALL') return true;
    return roles.includes(role);
  };

  const profile = user?.teacherProfile || user?.studentProfile || user?.staffProfile || user?.principalProfile;
  const displayName = profile
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User';

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-full bg-white dark:bg-slate-900',
        'border-r border-slate-100 dark:border-slate-700/50',
        'flex flex-col z-30 transition-all duration-300 overflow-hidden',
      )}
      style={{ width: sidebarCollapsed ? '72px' : 'var(--sidebar-width)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-700/50 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0 shadow-glow">
          <School className="w-5 h-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <p className="font-display font-bold text-slate-800 dark:text-white text-sm leading-tight truncate">
              {school?.name || 'SchoolSphere'}
            </p>
            <p className="text-xs text-slate-400 truncate">{school?.code}</p>
          </div>
        )}
        <button
          onClick={() => dispatch(toggleSidebarCollapse())}
          className={clsx(
            'ml-auto p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-base shrink-0',
            sidebarCollapsed && 'mx-auto'
          )}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 no-scrollbar">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(item => canSee(item.roles));
          if (!visibleItems.length) return null;
          return (
            <div key={section.title} className="mb-4">
              {!sidebarCollapsed && (
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1.5">
                  {section.title}
                </p>
              )}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={({ isActive }) => clsx(
                    'nav-item mb-0.5',
                    isActive && 'active',
                    sidebarCollapsed && 'justify-center px-0 py-2.5'
                  )}
                >
                  <item.icon className="w-4.5 h-4.5 shrink-0" style={{ width: 18, height: 18 }} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User profile at bottom */}
      <div className="border-t border-slate-100 dark:border-slate-700/50 p-3">
        <NavLink to="/profile" className={clsx(
          'flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-base cursor-pointer',
          sidebarCollapsed && 'justify-center'
        )}>
          <div className={clsx(
            'w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0',
            ROLE_COLORS[role] || 'bg-slate-500'
          )}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{displayName}</p>
              <p className="text-xs text-slate-400 capitalize">{role?.toLowerCase().replace('_', ' ')}</p>
            </div>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
