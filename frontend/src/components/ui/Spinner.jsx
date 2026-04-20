// frontend/src/components/ui/Spinner.jsx
import clsx from 'clsx';
export default function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-[3px]' };
  return <div className={clsx('rounded-full border-slate-200 border-t-primary-600 animate-spin', sizes[size], className)} />;
}
