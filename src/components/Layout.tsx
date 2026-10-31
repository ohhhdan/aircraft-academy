import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <>
      <TopBar />
      <div className="app-shell">
        <Outlet />
        <footer className="app-footer">
          Spotter&apos;s Field Guide — Portfolio Learning Experience
        </footer>
      </div>
      <BottomNav />
    </>
  );
}
