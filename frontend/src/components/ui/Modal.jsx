// frontend/src/components/ui/Modal.jsx
import { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md', hideClose = false }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className={clsx('modal-content w-full animate-scale-in', SIZES[size])}
        onClick={e => e.stopPropagation()}
      >
        {(title || !hideClose) && (
          <div className="flex items-center justify-between mb-5">
            {title && <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white">{title}</h3>}
            {!hideClose && (
              <button onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-base ml-auto">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
