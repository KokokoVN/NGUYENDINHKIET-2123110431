import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';

type Hotel = {
  hotelId: number;
  hotelName: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
};
type Paged<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export function HotelsListPage() {
  const [list, setList] = useState<Hotel[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Hotel | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  function flashSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3500);
  }

  const load = useCallback(async (targetPage = 1) => {
    const params: Record<string, unknown> = { includeInactive: true };
    if (search.trim()) params.search = search.trim();
    if (phone.trim()) params.phone = phone.trim();
    if (email.trim()) params.email = email.trim();
    params.page = targetPage;
    params.pageSize = pageSize;
    const { data } = await api.get<Paged<Hotel>>('/api/hotels', { params });
    setList(data.items);
    setPage(data.page);
    setTotalItems(data.totalItems);
    setTotalPages(data.totalPages);
  }, [search, phone, email, pageSize]);

  useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        try {
          await load();
        } catch (e) {
          setError(apiMessage(e));
        }
      })();
    }, 220);
    return () => clearTimeout(t);
  }, [load]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setError('');
      await api.delete(`/api/hotels/${deleteTarget.hotelId}`);
      setDeleteTarget(null);
      await load();
      flashSuccess('Đã ngưng hoạt động khách sạn.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  async function restore(id: number) {
    try {
      setRestoringId(id);
      setError('');
      await api.put(`/api/hotels/${id}/restore`);
      await load();
      flashSuccess('Đã hoạt động lại khách sạn.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Khách sạn"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="hm-btn hm-btn--ghost" onClick={() => void load()}>
              Làm mới
            </button>
            <Link to="/hotels/new" className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>
              Thêm khách sạn
            </Link>
          </div>
        }
      />
      {success && <div className="alert alert--success">{success}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      <div className="card card--toolbar form-inline">
        <label>
          Tìm kiếm
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên hoặc địa chỉ" />
        </label>
        <label>
          Số điện thoại
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="SĐT" />
        </label>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        </label>
        <span className="muted" style={{ alignSelf: 'center' }}></span>
      </div>

      <div className="card">
        <div className="card__head">
          <h3>Danh sách</h3>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {list.length} khách sạn · Trang {page}/{totalPages}
          </span>
        </div>
        <div className="table-wrap table-wrap--tall">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>SĐT</th>
                <th>Email</th>
                <th>Trạng thái</th>
                <th className="cell-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
                    {list.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-hint">Chưa có dữ liệu.</div>
                  </td>
                </tr>
              ) : (
                list.map((h) => (
                  <tr key={h.hotelId}>
                    <td>{h.hotelId}</td>
                    <td>
                      <strong>{h.hotelName}</strong>
                      {h.address ? (
                        <div className="muted" style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                          {h.address}
                        </div>
                      ) : null}
                    </td>
                    <td>{h.phone ?? '—'}</td>
                    <td>{h.email ?? '—'}</td>
                    <td>{h.isActive ? <span className="badge badge--ok">Đang hoạt động</span> : <span className="badge badge--muted">Ngưng hoạt động</span>}</td>
                    <td className="cell-actions">
                      <Link to={`/hotels/${h.hotelId}`} className="hm-btn hm-btn--sm hm-btn--ghost" style={{ textDecoration: 'none' }}>
                        Xem
                      </Link>
                      <Link to={`/hotels/${h.hotelId}/edit`} className="hm-btn hm-btn--sm hm-btn--ghost" style={{ textDecoration: 'none' }}>
                        Sửa
                      </Link>
                      {h.isActive ? (
                        <button
                          type="button"
                          className="hm-btn hm-btn--sm hm-btn--danger"
                          onClick={() => setDeleteTarget(h)}
                        >
                          Ngưng HĐ
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="hm-btn hm-btn--sm hm-btn--primary"
                          disabled={restoringId === h.hotelId}
                          onClick={() => void restore(h.hotelId)}
                        >
                          {restoringId === h.hotelId ? 'Đang bật…' : 'Hoạt động lại'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={(p) => void load(p)} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Ngưng hoạt động khách sạn?"
        message={
          deleteTarget
            ? `Khách sạn «${deleteTarget.hotelName}» sẽ bị ngưng hoạt động. Điều kiện: không còn phòng/loại phòng đang hoạt động.`
            : ''
        }
        confirmLabel="Ngưng hoạt động"
        danger
        loading={deleting}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

