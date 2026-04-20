// frontend/src/components/ui/EmptyState.jsx
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
          <Icon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
      )}
      <div className="text-center">
        <p className="font-display font-semibold text-slate-600 dark:text-slate-300">{title}</p>
        {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
