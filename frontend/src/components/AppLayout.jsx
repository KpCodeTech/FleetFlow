import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  return (
    <div
      style={{ height: '100vh', width: '100vw', display: 'flex', overflow: 'hidden', backgroundColor: 'var(--bg-base)' }}
    >
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header />
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }} className="fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
