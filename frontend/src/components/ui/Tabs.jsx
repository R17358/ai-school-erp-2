// frontend/src/components/ui/Tabs.jsx
import clsx from 'clsx';
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={clsx('px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200',
            active === tab.id
              ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200')}>
          {tab.icon && <tab.icon className="w-3.5 h-3.5 inline mr-1.5" style={{width:14,height:14,display:'inline',marginRight:6}} />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
