import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { HUD } from './HUD';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <>
      <TopBar />
      <div className="app-shell">
        <HUD />
        <Outlet />
        <footer className="app-footer">
          Spotter&apos;s Field Guide — Portfolio Learning Experience
          {' · '}
          <a href="/admin">Media admin</a>
        </footer>
      </div>
      <BottomNav />
    </>
  );
}
