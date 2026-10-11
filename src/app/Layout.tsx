import { Suspense, useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, CalendarCheck, LayoutDashboard, Menu, Repeat, Search, Timer, X } from 'lucide-react';
import { NAV } from './nav';
import { SearchDialog } from '@/components/SearchDialog';
import { ErrorBoundary } from './ErrorBoundary';

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="nav" aria-label="Main">
      {NAV.map((g) => (
        <div key={g.title}>
          <div className="nav__group-title">{g.title}</div>
          <ul className="nav__list">
            {g.items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.to === '/'} className="nav__link" onClick={onNavigate} title={item.label}>
                    <Icon aria-hidden style={item.color ? { color: `var(${item.color})` } : undefined} />
                    <span className="nav__label">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Layout() {
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') setDrawer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { setDrawer(false); window.scrollTo(0, 0); }, [location.pathname]);

  // Full-screen runner for assessments: hide navigation chrome.
  const focusMode = location.pathname.startsWith('/oa/run/');

  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to content</a>
      {!focusMode && (
        <aside className="sidebar" aria-label="Sidebar">
          <Link to="/" className="sidebar__brand"><span className="brand-mark" aria-hidden>P</span><span>PrepForge</span></Link>
          <NavList />
        </aside>
      )}
      <div className="main">
        {!focusMode && (
          <header className="topbar">
            <button className="icon-btn menu-button" onClick={() => setDrawer(true)} aria-label="Open menu" aria-expanded={drawer}><Menu /></button>
            <Link to="/" className="topbar__brand" aria-label="PrepForge home"><span className="brand-mark" aria-hidden>P</span><span>PrepForge</span></Link>
            <div className="topbar__spacer" />
            <button className="search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search (Ctrl+K)">
              <Search size={16} aria-hidden /> <span>Search</span> <kbd>Ctrl K</kbd>
            </button>
          </header>
        )}
        <main id="main" className="content" tabIndex={-1}>
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<p className="muted">Loading…</p>}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {!focusMode && (
        <nav className="bottombar" aria-label="Quick navigation">
          <NavLink to="/" end><LayoutDashboard aria-hidden />Home</NavLink>
          <NavLink to="/plan"><CalendarCheck aria-hidden />Today</NavLink>
          <NavLink to="/learn"><BookOpen aria-hidden />Learn</NavLink>
          <NavLink to="/oa"><Timer aria-hidden />Practice</NavLink>
          <NavLink to="/revision"><Repeat aria-hidden />Revise</NavLink>
        </nav>
      )}

      {drawer && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawer(false)} />
          <div className="drawer" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="drawer__head">
              <Link to="/" className="row" style={{ gap: 8, color: 'var(--ink)', fontWeight: 600 }}><span className="brand-mark" aria-hidden>P</span>PrepForge</Link>
              <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Close menu" autoFocus><X /></button>
            </div>
            <NavList onNavigate={() => setDrawer(false)} />
          </div>
        </>
      )}
      {searchOpen && <SearchDialog onClose={closeSearch} />}
    </div>
  );
}
