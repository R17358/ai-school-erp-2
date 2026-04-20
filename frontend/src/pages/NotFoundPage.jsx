// Stub pages for routes not yet fully built

// frontend/src/pages/NotFoundPage.jsx
export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 bg-surface-light dark:bg-surface-dark">
      <div className="text-8xl font-display font-black text-slate-200 dark:text-slate-700">404</div>
      <p className="text-slate-500 text-lg">Page not found</p>
      <a href="/dashboard" className="btn-primary">Go to Dashboard</a>
    </div>
  );
}
export default NotFoundPage;
