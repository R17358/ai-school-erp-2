// frontend/src/components/ui/ConfirmDialog.jsx
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';
export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', variant = 'danger', loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${variant==='danger' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
          <AlertTriangle className={`w-7 h-7 ${variant==='danger' ? 'text-red-500' : 'text-yellow-500'}`} />
        </div>
        <div>
          <h3 className="font-display font-bold text-slate-800 dark:text-white text-lg">{title}</h3>
          <p className="text-sm text-slate-400 mt-1">{message}</p>
        </div>
        <div className="flex gap-3 w-full">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className={`flex-1 btn ${variant==='danger' ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
