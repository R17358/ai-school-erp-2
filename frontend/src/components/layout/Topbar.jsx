// frontend/src/components/layout/Topbar.jsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, Search, LogOut, ChevronDown } from 'lucide-react';
import { toggleDarkMode } from '../../store/slices/uiSlice';
import { logoutUser, selectUser } from '../../store/slices/authSlice';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function Topbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { darkMode } = useSelector(s => s.ui);
  const user = useSelector(selectUser);
  const { list: notifications, unread } = useSelector(s => s.notifications);
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const profile = user?.teacherProfile || user?.studentProfile || user?.staffProfile || user?.principalProfile;
  const displayName = profile
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User';

  return (
    <header
      className="fixed top-0 right-0 z-20 flex items-center justify-between px-6
                 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl
                 border-b border-slate-100 dark:border-slate-700/50 transition-all duration-300"
      style={{ height: 'var(--topbar-height)', left: 'var(--sidebar-width)' }}
    >
      {/* Search */}
      <div className="relative max-w-xs w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search students, teachers..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800
                     border border-slate-200 dark:border-slate-700
                     focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400
                     text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500
                     transition-all duration-200"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode */}
        <button
          onClick={() => dispatch(toggleDarkMode())}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400
                     hover:bg-slate-100 dark:hover:bg-slate-700 transition-base"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4.5 h-4.5" style={{width:18,height:18}} />
                    : <Moon className="w-4.5 h-4.5" style={{width:18,height:18}} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowUserMenu(false); }}
            className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400
                       hover:bg-slate-100 dark:hover:bg-slate-700 transition-base"
          >
            <Bell style={{width:18,height:18}} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 card py-2 shadow-card-lg animate-slide-down z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-700/50">
                <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">Notifications</span>
                {unread > 0 && <span className="badge-danger">{unread} new</span>}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">No notifications</div>
                ) : notifications.slice(0, 8).map(n => (
                  <div key={n.id} className={clsx(
                    'px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-base border-b border-slate-50 dark:border-slate-700/30',
                    !n.isRead && 'bg-primary-50/50 dark:bg-primary-900/10'
                  )}>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{n.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotif(false); }}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl
                       hover:bg-slate-100 dark:hover:bg-slate-700 transition-base"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-24 truncate">
              {displayName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 card py-1.5 shadow-card-lg animate-slide-down z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/50 mb-1">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-base"
              >
                My Profile
              </button>
              <button
                onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-base"
              >
                Settings
              </button>
              <div className="border-t border-slate-100 dark:border-slate-700/50 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-danger-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-base flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
