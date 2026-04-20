// frontend/src/components/ui/Badge.jsx
import clsx from 'clsx';

const VARIANTS = {
  primary: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
  success: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  warning: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  danger:  'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
  gray:    'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
  blue:    'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  purple:  'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  orange:  'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  pink:    'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
};

export default function Badge({ children, variant = 'gray', className }) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', VARIANTS[variant], className)}>
      {children}
    </span>
  );
}
