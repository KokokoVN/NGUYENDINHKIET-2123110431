import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiMessage, emitToast } from '../../api/client';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';

export type Payment = {
  paymentId: number;
  stayId?: number | null;
  reservationId?: number | null;
  paymentType: string;
  methodCode: string;
  amount: number;
  statusCode: string;
  referenceNo?: string | null;
  note?: string | null;
  createdAt?: string;
};
type Paged<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export function PaymentsListPage() {
  const [list, setList] = useState<Payment[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const [stayId, setStayId] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [statusCode, setStatusCode] = useState('');
  const [search, setSearch] = useState('');

  const [voidTarget, setVoidTarget] = useState<Payment | null>(null);
  const [voiding, setVoiding] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  function flashSuccess(msg: string) {
    setSuccess(msg);
    emitToast('success', msg);
    setTimeout(() => setSuccess(''), 3500);
  }

  async function load(targetPage = 1) {
    const params: Record<string, unknown> = {};
    if (stayId.trim()) params.stayId = Number(stayId);
    if (reservationId.trim()) params.reservationId = Number(reservationId);
    if (statusCode.trim()) params.statusCode = statusCode.trim().toUpperCase();
    if (search.trim()) params.search = search.trim();
    params.page = targetPage;
    params.pageSize = pageSize;
    const { data } = await api.get<Paged<Payment>>('/api/payments', { params });
    setList(data.items);
    setPage(data.page);
    setTotalItems(data.totalItems);
    setTotalPages(data.totalPages);
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e) {
        setError(apiMessage(e));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        try {
          setError('');
          await load();
        } catch (e) {
          setError(apiMessage(e));
        }
      })();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stayId, reservationId, statusCode, search]);

  function statusBadge(s: string) {
    const x = (s || '').toUpperCase();
    if (x === 'PAID') return <span className="badge badge--ok">PAID</span>;
    if (x === 'VOID') return <span className="badge badge--danger">VOID</span>;
    return <span className="badge badge--muted">{x || '—'}</span>;
  }

  async function confirmVoid() {
    if (!voidTarget) return;
    try {
      setVoiding(true);
      setError('');
      await api.put(`/api/payments/${voidTarget.paymentId}/void`);
      setVoidTarget(null);
      await load();
      flashSuccess('Đã hủy giao dịch thanh toán.');
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setVoiding(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Thanh toán"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="hm-btn hm-btn--ghost" onClick={() => void load().catch((e) => setError(apiMessage(e)))}>
              Làm mới
            </button>
            <Link to="/payments/new" className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>
              Tạo thanh toán
            </Link>
          </div>
        }
      />
      {success && <div className="alert alert--success">{success}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      <div className="card card--toolbar form-inline">
        <label>
          StayId
          <input type="number" min={1} value={stayId} onChange={(e) => setStayId(e.target.value)} placeholder="VD: 12" />
        </label>
        <label>
          ReservationId
          <input type="number" min={1} value={reservationId} onChange={(e) => setReservationId(e.target.value)} placeholder="VD: 3" />
        </label>
        <label>
          Trạng thái
          <select value={statusCode} onChange={(e) => setStatusCode(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="PAID">PAID</option>
            <option value="VOID">VOID</option>
          </select>
        </label>
        <label>
          Tìm kiếm
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mã tham chiếu / ghi chú" />
        </label>
        <span className="muted" style={{ alignSelf: 'center' }}></span>
      </div>

      <div className="card">
        <div className="card__head">
          <h3>Danh sách</h3>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {loading ? 'Đang tải…' : `${totalItems} giao dịch · Trang ${page}/${totalPages}`}
          </span>
        </div>
        <div className="table-wrap table-wrap--tall">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Loại</th>
                <th>Phương thức</th>
                <th>Stay/Booking</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th className="cell-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-hint">{loading ? 'Đang tải…' : 'Chưa có thanh toán.'}</div>
                  </td>
                </tr>
              ) : (
                list.map((p) => (
                  <tr key={p.paymentId}>
                    <td>{p.paymentId}</td>
                    <td>
                      <span className="badge badge--info">{(p.paymentType || '').toUpperCase()}</span>
                    </td>
                    <td>{(p.methodCode || '').toUpperCase()}</td>
                    <td>
                      {p.stayId ? (
                        <span className="badge badge--muted">Stay #{p.stayId}</span>
                      ) : p.reservationId ? (
                        <span className="badge badge--muted">Booking #{p.reservationId}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <strong>{Number(p.amount).toLocaleString('vi-VN')} đ</strong>
                    </td>
                    <td>{statusBadge(p.statusCode)}</td>
                    <td className="cell-actions">
                      <Link to={`/payments/${p.paymentId}`} className="hm-btn hm-btn--sm hm-btn--ghost" style={{ textDecoration: 'none' }}>
                        Xem
                      </Link>
                      {String(p.statusCode || '').toUpperCase() === 'PAID' ? (
                        <button type="button" className="hm-btn hm-btn--sm hm-btn--danger" onClick={() => setVoidTarget(p)}>
                          Hủy GD
                        </button>
                      ) : (
                        <span className="muted">—</span>
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
        open={!!voidTarget}
        title="Hủy giao dịch?"
        message={voidTarget ? `Thanh toán #${voidTarget.paymentId} sẽ chuyển sang VOID.` : ''}
        confirmLabel="Hủy giao dịch"
        danger
        loading={voiding}
        onCancel={() => !voiding && setVoidTarget(null)}
        onConfirm={confirmVoid}
      />
    </div>
  );
}

