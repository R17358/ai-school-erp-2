// frontend/src/components/ui/Avatar.jsx
import clsx from 'clsx';
const COLORS = ['bg-primary-500','bg-blue-500','bg-green-500','bg-orange-500','bg-pink-500','bg-violet-500','bg-teal-500','bg-rose-500'];
function colorFor(name = '') {
  let hash = 0;
  for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}
export default function Avatar({ name = '', src, size = 'md', className }) {
  const sizes = { xs: 'w-7 h-7 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' };
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  if (src) return <img src={src} alt={name} className={clsx('rounded-xl object-cover', sizes[size], className)} />;
  return (
    <div className={clsx('rounded-xl flex items-center justify-center text-white font-bold shrink-0', sizes[size], colorFor(name), className)}>
      {initials || '?'}
    </div>
  );
}
