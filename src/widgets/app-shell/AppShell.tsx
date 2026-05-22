import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/widgets/sidebar/Sidebar';
import { Topbar } from '@/widgets/topbar/Topbar';

export const AppShell = () => (
  <div className="app-shell">
    <Topbar />
    <Sidebar />
    <main className="main-content">
      <Outlet />
    </main>
  </div>
);
