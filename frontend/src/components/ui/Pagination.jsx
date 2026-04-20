// frontend/src/components/ui/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
export default function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  const pages = [];
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  for (let i = start; i <= end; i++) pages.push(i);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700/50">
      <p className="text-xs text-slate-400">Showing {(page-1)*limit+1}–{Math.min(page*limit,total)} of {total}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page-1)} disabled={page===1}
          className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-base">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        {pages.map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={clsx('w-8 h-8 rounded-lg text-xs font-semibold transition-base',
              p===page ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700')}>
            {p}
          </button>
        ))}
        <button onClick={() => onChange(page+1)} disabled={page===totalPages}
          className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-base">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </div>
  );
}
