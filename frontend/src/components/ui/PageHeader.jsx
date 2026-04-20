// frontend/src/components/ui/PageHeader.jsx
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="section-header">
      <div>
        <h1 className="section-title">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
