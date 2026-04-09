import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, apiMessage } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

type UserRow = {
  userId: number;
  username: string;
  fullName?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
};

export function UsersPage() {
  const { role } = useAuth();
  const [list, setList] = useState<UserRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role !== 'ADMIN') return;
    void (async () => {
      try {
        const { data } = await api.get<UserRow[]>('/api/users');
        setList(data);
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, [role]);

  if (role !== 'ADMIN') return <Navigate to="/" replace />;

  return (
    <div>
      <PageHeader
        title="Người dùng"
        subtitle="Chỉ xem danh sách (GET /api/users). Thêm / sửa / khóa tài khoản cần mở rộng API hoặc seed SQL."
        actions={
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              void (async () => {
                try {
                  const { data } = await api.get<UserRow[]>('/api/users');
                  setList(data);
                  setError('');
                } catch (e) {
                  setError(apiMessage(e));
                }
              })()
            }
          >
            Làm mới
          </button>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
          Trang này chỉ đọc dữ liệu để đối chiếu quyền. Để có đầy đủ thêm–sửa–xóa người dùng trên giao diện, backend cần thêm
          endpoint (ví dụ POST/PUT/DELETE <code style={{ color: 'var(--accent)' }}>/api/users</code>) và phân quyền phù hợp.
        </p>
      </div>
      <div className="card">
        <div className="card__head">
          <h3>Tài khoản</h3>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {list.length} user
          </span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-hint">Không có dữ liệu hoặc chưa tải xong.</div>
                  </td>
                </tr>
              ) : (
                list.map((u) => (
                  <tr key={u.userId}>
                    <td>{u.userId}</td>
                    <td>
                      <strong>{u.username}</strong>
                    </td>
                    <td>{u.fullName ?? '—'}</td>
                    <td>{u.email ?? '—'}</td>
                    <td>
                      {u.isActive ? (
                        <span className="badge badge--ok">Hoạt động</span>
                      ) : (
                        <span className="badge badge--danger">Khóa</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
