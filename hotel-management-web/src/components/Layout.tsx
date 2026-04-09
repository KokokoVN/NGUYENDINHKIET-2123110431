import type { ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  'nav-link' + (isActive ? ' nav-link--active' : '');

function NavItem({ to, end, icon, children }: { to: string; end?: boolean; icon: string; children: ReactNode }) {
  return (
    <NavLink to={to} end={end} className={linkClass}>
      <span className="nav-link__icon" aria-hidden>
        {icon}
      </span>
      {children}
    </NavLink>
  );
}

export function Layout() {
  const { fullName, username, role, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === 'ADMIN';
  const initial = (fullName || username || '?').charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__brand-inner">
            <div className="sidebar__logo" aria-hidden>
              🏨
            </div>
            <div>
              <div className="sidebar__title">LuxeStay</div>
              <div className="sidebar__tagline">Quản lý khách sạn</div>
            </div>
          </div>
        </div>

        <div className="sidebar__section">
          <div className="sidebar__section-label">Tổng quan</div>
          <nav className="sidebar__nav">
            <NavItem to="/" end icon="📊">
              Tổng quan
            </NavItem>
          </nav>
        </div>

        <div className="sidebar__section">
          <div className="sidebar__section-label">Vận hành</div>
          <nav className="sidebar__nav">
            <NavItem to="/hotels" icon="🏢">
              Khách sạn
            </NavItem>
            <NavItem to="/room-types" icon="🛏️">
              Loại phòng
            </NavItem>
            <NavItem to="/rooms" icon="🚪">
              Phòng
            </NavItem>
            <NavItem to="/customers" icon="👤">
              Khách hàng
            </NavItem>
            <NavItem to="/bookings" icon="📅">
              Đặt phòng
            </NavItem>
          </nav>
        </div>

        <div className="sidebar__section">
          <div className="sidebar__section-label">Tài chính</div>
          <nav className="sidebar__nav">
            <NavItem to="/invoices" icon="🧾">
              Hóa đơn
            </NavItem>
          </nav>
        </div>

        {isAdmin && (
          <div className="sidebar__section">
            <div className="sidebar__section-label">Hệ thống</div>
            <nav className="sidebar__nav">
              <NavItem to="/users" icon="⚙️">
                Người dùng
              </NavItem>
            </nav>
          </div>
        )}
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar__brand">
            <span className="topbar__brand-name">LuxeStay</span>
            <span className="topbar__brand-muted">Console</span>
          </div>
          <div className="topbar__right">
            <div className="topbar__user">
              <div className="topbar__avatar" aria-hidden>
                {initial}
              </div>
              <div className="topbar__meta">
                <span className="topbar__name">{fullName || username}</span>
                <span className="topbar__role">{role}</span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
            >
              Đăng xuất
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
