// frontend/src/components/ui/StatCard.jsx
import clsx from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, sub, color = 'bg-primary-600', trend, onClick }) {
  return (
    <div className={clsx('stat-card', onClick && 'cursor-pointer hover:shadow-card-md transition-shadow')} onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend !== undefined && (
          <span className={clsx('flex items-center gap-1 text-xs font-semibold', trend >= 0 ? 'text-green-600' : 'text-red-500')}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-slate-800 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
