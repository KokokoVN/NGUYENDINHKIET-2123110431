import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { apiMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__hero">
        <h2>Chào mừng trở lại</h2>
        <p>Hệ thống quản lý phòng, đặt chỗ, khách hàng và hóa đơn — đồng bộ với API ASP.NET Core.</p>
        <ul className="login-page__features">
          <li>Bảng điều khiển doanh thu &amp; tỷ lệ phòng</li>
          <li>Luồng đặt phòng → nhận phòng → trả phòng</li>
          <li>Tích điểm &amp; hạng khách (theo cấu hình API)</li>
        </ul>
      </div>
      <div className="login-page__form-area">
        <form className={`login-card card card--glass`} onSubmit={onSubmit}>
          <div className="login-brand">
            <div className="login-brand__logo" aria-hidden>
              🏨
            </div>
            <div>
              <div className="login-brand__title">Đăng nhập</div>
              <div className="login-brand__subtitle">Tài khoản nội bộ</div>
            </div>
          </div>
          {error && <div className="alert alert--error">{error}</div>}
          <div className="form-stack">
            <label>
              Tên đăng nhập
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                placeholder="admin"
              />
            </label>
            <label>
              Mật khẩu
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="••••••"
              />
            </label>
            <button
              type="submit"
              className={'btn btn--primary' + (loading ? ' btn--loading' : '')}
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
