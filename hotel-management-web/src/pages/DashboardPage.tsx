import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

const shortcuts = [
  { to: '/bookings', icon: '📅', label: 'Đặt phòng' },
  { to: '/rooms', icon: '🚪', label: 'Phòng' },
  { to: '/customers', icon: '👤', label: 'Khách hàng' },
  { to: '/invoices', icon: '🧾', label: 'Hóa đơn' },
  { to: '/hotels', icon: '🏢', label: 'Khách sạn' },
] as const;

export function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Tổng quan"
        subtitle="Điều hướng nhanh đến các chức năng chính."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/bookings/new" className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>
              Tạo đặt phòng
            </Link>
          </div>
        }
      />

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card__head">
          <h3 style={{ margin: 0 }}>Lối tắt</h3>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            Trang thường dùng
          </span>
        </div>
        <nav className="dash-shortcuts" aria-label="Lối tắt điều hướng">
          {shortcuts.map((s) => (
            <Link key={s.to} to={s.to} className="dash-shortcut">
              <span className="dash-shortcut__icon" aria-hidden>
                {s.icon}
              </span>
              {s.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
