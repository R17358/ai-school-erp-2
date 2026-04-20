// frontend/src/components/ui/SearchInput.jsx
import { Search, X } from 'lucide-react';
export default function SearchInput({ value, onChange, placeholder = 'Search...', className }) {
  return (
    <div className={`relative ${className || 'flex-1'}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input type="text" className="input pl-9 pr-8" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
