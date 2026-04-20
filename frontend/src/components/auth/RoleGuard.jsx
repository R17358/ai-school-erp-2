// frontend/src/components/auth/RoleGuard.jsx
import { useSelector } from 'react-redux';
import { selectUserRole } from '../../store/slices/authSlice';
import { ShieldOff } from 'lucide-react';

export default function RoleGuard({ roles, children }) {
  const role = useSelector(selectUserRole);
  if (!roles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <ShieldOff className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <h3 className="font-display text-lg font-semibold text-slate-700 dark:text-slate-200">Access Restricted</h3>
          <p className="text-sm text-slate-400 mt-1">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }
  return children;
}
