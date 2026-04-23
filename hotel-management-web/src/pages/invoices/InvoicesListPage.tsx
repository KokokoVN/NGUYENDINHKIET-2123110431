import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';

type Invoice = {
  id: number;
  bookingId: number;
  roomAmount: number;
  serviceAmount: number;
  totalAmount: number;
  paymentMethod: string;
  booking?: {
    checkInDate?: string;
    checkOutDate?: string;
  };
};
type Paged<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export function InvoicesListPage() {
  const [list, setList] = useState<Invoice[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async (targetPage = 1) => {
    const params: Record<string, unknown> = { page: targetPage, pageSize };
    if (search.trim()) params.search = search.trim();
    const { data } = await api.get<Paged<Invoice>>('/api/invoices', { params });
    setList(data.items);
    setPage(data.page);
    setTotalItems(data.totalItems);
    setTotalPages(data.totalPages);
  }, [search]);

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, [load]);

  function payBadge(m: string) {
    if (m === 'CASH') return <span className="badge badge--muted">Tiền mặt</span>;
    if (m === 'BANK_TRANSFER') return <span className="badge badge--info">Chuyển khoản</span>;
    if (m === 'CARD') return <span className="badge badge--warn">Thẻ</span>;
    return <span className="badge badge--muted">{m}</span>;
  }

  function nights(i: Invoice) {
    if (!i.booking?.checkInDate || !i.booking?.checkOutDate) return null;
    const from = new Date(i.booking.checkInDate);
    const to = new Date(i.booking.checkOutDate);
    const diff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    return Number.isFinite(diff) ? Math.max(0, diff) : null;
  }

  return (
    <div>
      <PageHeader
        title="Hóa đơn"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="hm-btn hm-btn--ghost" onClick={() => void load()}>
              Làm mới
            </button>
            <Link to="/invoices/new" className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>
              Xuất hóa đơn
            </Link>
          </div>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}
      <div className="card card--toolbar form-inline">
        <label>
          Tìm kiếm
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="BookingId / ghi chú / phương thức" />
        </label>
      </div>
      <div className="card">
        <div className="card__head">
          <h3>Đã xuất</h3>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {totalItems} hóa đơn
          </span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Đặt phòng</th>
                <th>Số đêm</th>
                <th>Tiền phòng</th>
                <th>Dịch vụ</th>
                <th>Tổng</th>
                <th>PTTT</th>
                <th className="cell-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-hint">Chưa có hóa đơn.</div>
                  </td>
                </tr>
              ) : (
                list.map((i) => (
                  <tr key={i.id}>
                    <td>{i.id}</td>
                    <td>
                      <strong>#{i.bookingId}</strong>
                    </td>
                    <td>{nights(i) ?? '—'}</td>
                    <td>{i.roomAmount.toLocaleString('vi-VN')} đ</td>
                    <td>{i.serviceAmount.toLocaleString('vi-VN')} đ</td>
                    <td>
                      <strong>{i.totalAmount.toLocaleString('vi-VN')} đ</strong>
                    </td>
                    <td>{payBadge(i.paymentMethod)}</td>
                    <td className="cell-actions">
                      <Link
                        to={`/invoices/${i.id}`}
                        className="hm-btn hm-btn--sm hm-btn--ghost"
                        style={{ textDecoration: 'none' }}
                      >
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={(p) => void load(p)} />
    </div>
  );
}
