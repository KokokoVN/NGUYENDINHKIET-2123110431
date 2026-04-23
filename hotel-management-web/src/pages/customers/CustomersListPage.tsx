import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { viLoyaltyTier } from '../../utils/vi';

type Customer = {
  customerId: number;
  customerType: string;
  fullName?: string;
  companyName?: string;
  idNumber?: string;
  phone?: string;
  loyaltyPoints?: number;
  loyaltyTier?: string;
  deletedAt?: string | null;
};
type Paged<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export function CustomersListPage() {
  const [list, setList] = useState<Customer[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
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
    params.page = targetPage;
    params.pageSize = pageSize;
    const { data } = await api.get<Paged<Customer>>('/api/customers', { params });
    setList(data.items);
    setPage(data.page);
    setTotalItems(data.totalItems);
    setTotalPages(data.totalPages);
  }, [search]);

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
      await api.delete(`/api/customers/${deleteTarget.customerId}`);
      setDeleteTarget(null);
      await load();
      flashSuccess('Đã xóa mềm khách hàng.');
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
      await api.put(`/api/customers/${id}/restore`);
      await load();
      flashSuccess('Đã hoạt động lại khách hàng.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setRestoringId(null);
    }
  }

  function typeLabel(t: string) {
    if (t === 'COMPANY') return 'Công ty';
    if (t === 'AGENCY') return 'Đại lý';
    return 'Cá nhân';
  }

  return (
    <div>
      <PageHeader
        title="Khách hàng"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="hm-btn hm-btn--ghost" onClick={() => void load()}>
              Làm mới
            </button>
            <Link to="/customers/new" className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>
              Thêm khách hàng
            </Link>
          </div>
        }
      />
      {success && <div className="alert alert--success">{success}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      <div className="card card--toolbar form-inline">
        <label>
          Tìm kiếm
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên / công ty / SĐT / Email" />
        </label>
        <span className="muted" style={{ alignSelf: 'center' }}></span>
      </div>

      <div className="card">
        <div className="card__head">
          <h3>Danh sách</h3>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {list.length} khách · Trang {page}/{totalPages}
          </span>
        </div>
        <div className="table-wrap table-wrap--tall">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên / Loại</th>
                <th>Số giấy tờ</th>
                <th>SĐT</th>
                <th>Điểm</th>
                <th>Hạng</th>
                <th className="cell-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-hint">Chưa có dữ liệu.</div>
                  </td>
                </tr>
              ) : (
                list.map((c) => (
                  <tr key={c.customerId}>
                    <td>{c.customerId}</td>
                    <td>
                      <strong>{c.fullName || c.companyName || '—'}</strong>
                      <div className="muted" style={{ fontSize: '0.72rem', marginTop: '0.15rem' }}>
                        {typeLabel(c.customerType)}
                      </div>
                    </td>
                    <td>{c.idNumber ?? '—'}</td>
                    <td>{c.phone ?? '—'}</td>
                    <td>{c.loyaltyPoints ?? 0}</td>
                    <td>
                      <span className="badge badge--info">{viLoyaltyTier(c.loyaltyTier)}</span>
                    </td>
                    <td className="cell-actions">
                      <Link to={`/customers/${c.customerId}`} className="hm-btn hm-btn--sm hm-btn--ghost" style={{ textDecoration: 'none' }}>
                        Xem
                      </Link>
                      <Link to={`/customers/${c.customerId}/edit`} className="hm-btn hm-btn--sm hm-btn--ghost" style={{ textDecoration: 'none' }}>
                        Sửa
                      </Link>
                      {c.deletedAt ? (
                        <button
                          type="button"
                          className="hm-btn hm-btn--sm hm-btn--primary"
                          disabled={restoringId === c.customerId}
                          onClick={() => void restore(c.customerId)}
                        >
                          {restoringId === c.customerId ? 'Đang bật…' : 'Hoạt động lại'}
                        </button>
                      ) : (
                        <button type="button" className="hm-btn hm-btn--sm hm-btn--danger" onClick={() => setDeleteTarget(c)}>
                          Ngưng HĐ
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
        title="Xóa mềm khách hàng?"
        message={deleteTarget ? `Khách «${deleteTarget.fullName || deleteTarget.companyName || '#' + deleteTarget.customerId}» sẽ bị ẩn khỏi danh sách.` : ''}
        confirmLabel="Xóa mềm"
        danger
        loading={deleting}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
