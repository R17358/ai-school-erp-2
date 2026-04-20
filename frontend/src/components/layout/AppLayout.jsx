// frontend/src/components/layout/AppLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useSelector } from 'react-redux';

export default function AppLayout() {
  const { sidebarCollapsed } = useSelector(s => s.ui);

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex">
      <Sidebar />
      <div
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '72px' : 'var(--sidebar-width)' }}
      >
        <Topbar />
        <main
          className="flex-1 p-6 overflow-y-auto animate-fade-in"
          style={{ marginTop: 'var(--topbar-height)', minHeight: 'calc(100vh - var(--topbar-height))' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
