import { type FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiMessage, emitToast } from '../../api/client';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';

type ServiceOrder = {
  serviceOrderId: number;
  stayId: number;
  reservationId?: number | null;
  roomId?: number | null;
  roomNumber?: string | null;
  serviceCode: string;
  serviceName?: string | null;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  statusCode: string;
  cancelReason?: string | null;
  createdAt?: string;
};
type Paged<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export function ServiceOrdersListPage() {
  const [list, setList] = useState<ServiceOrder[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const [stayId, setStayId] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [search, setSearch] = useState('');

  const [cancelTarget, setCancelTarget] = useState<ServiceOrder | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [saving, setSaving] = useState(false);

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
    if (search.trim()) params.search = search.trim();
    params.page = targetPage;
    params.pageSize = pageSize;
    const { data } = await api.get<Paged<ServiceOrder>>('/api/serviceorders', { params });
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
  }, [stayId, reservationId, search]);

  function statusBadge(s: string) {
    const x = (s || '').toUpperCase();
    if (x === 'ACTIVE') return <span className="badge badge--ok">ACTIVE</span>;
    if (x === 'CANCELLED') return <span className="badge badge--danger">CANCELLED</span>;
    return <span className="badge badge--muted">{x || '—'}</span>;
  }

  function openCancel(x: ServiceOrder) {
    setCancelTarget(x);
    setCancelReason('');
    setCancelOpen(true);
    setError('');
  }

  async function submitCancel(e: FormEvent) {
    e.preventDefault();
    if (!cancelTarget) return;
    try {
      setSaving(true);
      setError('');
      await api.put(`/api/serviceorders/${cancelTarget.serviceOrderId}/cancel`, cancelReason.trim() ? { reason: cancelReason.trim() } : {});
      setCancelOpen(false);
      setCancelTarget(null);
      await load();
      flashSuccess('Đã hủy dịch vụ sử dụng.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const [detailTarget, setDetailTarget] = useState<ServiceOrder | null>(null);

  return (
    <div>
      <PageHeader
        title="Dịch vụ sử dụng"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="hm-btn hm-btn--ghost" onClick={() => void load().catch((e) => setError(apiMessage(e)))}>
              Làm mới
            </button>
            <Link to="/service-orders/new" className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>
              Thêm dịch vụ
            </Link>
          </div>
        }
      />
      {success && <div className="alert alert--success">{success}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      <div className="card card--toolbar form-inline">
        <label>
          StayId
          <input type="number" min={1} value={stayId} onChange={(e) => setStayId(e.target.value)} placeholder="VD: 10" />
        </label>
        <label>
          ReservationId
          <input type="number" min={1} value={reservationId} onChange={(e) => setReservationId(e.target.value)} placeholder="VD: 3" />
        </label>
        <label>
          Tìm kiếm
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mã dịch vụ / mô tả" />
        </label>
        <span className="muted" style={{ alignSelf: 'center' }}></span>
      </div>

      <div className="card">
        <div className="card__head">
          <h3>Danh sách</h3>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {loading ? 'Đang tải…' : `${totalItems} dòng · Trang ${page}/${totalPages}`}
          </span>
        </div>
        <div className="table-wrap table-wrap--tall">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Phòng</th>
                <th>Mã đặt</th>
                <th>Dịch vụ</th>
                <th>Mô tả</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Tổng</th>
                <th>Trạng thái</th>
                <th className="cell-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-hint">{loading ? 'Đang tải…' : 'Chưa có dữ liệu.'}</div>
                  </td>
                </tr>
              ) : (
                list.map((x) => (
                  <tr key={x.serviceOrderId}>
                    <td>{x.serviceOrderId}</td>
                    <td>
                      <strong>{x.roomNumber ?? `#${x.roomId ?? '—'}`}</strong>
                      <div className="muted" style={{ fontSize: '0.72rem', marginTop: '0.15rem' }}>Stay #{x.stayId}</div>
                    </td>
                    <td>{x.reservationId ?? '—'}</td>
                    <td>
                      <span className="badge badge--info">{x.serviceCode}</span>
                      {x.serviceName ? <div className="muted" style={{ fontSize: '0.72rem', marginTop: '0.15rem' }}>{x.serviceName}</div> : null}
                    </td>
                    <td>{x.description ?? '—'}</td>
                    <td>{x.quantity}</td>
                    <td>{Number(x.unitPrice).toLocaleString('vi-VN')} đ</td>
                    <td>
                      <strong>{Number(x.quantity * x.unitPrice).toLocaleString('vi-VN')} đ</strong>
                    </td>
                    <td>{statusBadge(x.statusCode)}</td>
                    <td className="cell-actions">
                      <Link to={`/service-orders/${x.serviceOrderId}`} className="hm-btn hm-btn--sm hm-btn--ghost" style={{ textDecoration: 'none' }}>
                        Xem
                      </Link>
                      {String(x.statusCode || '').toUpperCase() === 'ACTIVE' ? (
                        <button type="button" className="hm-btn hm-btn--sm hm-btn--danger" onClick={() => openCancel(x)}>
                          Hủy
                        </button>
                      ) : (
                        <button type="button" className="hm-btn hm-btn--sm hm-btn--ghost" onClick={() => setDetailTarget(x)}>
                          Lý do
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

      <Modal
        open={cancelOpen}
        title={cancelTarget ? `Hủy dịch vụ #${cancelTarget.serviceOrderId}` : 'Hủy dịch vụ'}
        onClose={() => !saving && setCancelOpen(false)}
        footer={
          <>
            <button type="button" className="hm-btn hm-btn--ghost" disabled={saving} onClick={() => setCancelOpen(false)}>
              Đóng
            </button>
            <button type="submit" form="so-cancel" className="hm-btn hm-btn--danger" disabled={saving}>
              {saving ? 'Đang hủy…' : 'Xác nhận hủy'}
            </button>
          </>
        }
      >
        <form id="so-cancel" className="form-stack" onSubmit={submitCancel}>
          <div className="muted" style={{ fontSize: '0.9rem' }}>
            Chỉ hủy được dịch vụ ở trạng thái <strong>ACTIVE</strong>.
          </div>
          <label>
            Lý do (không bắt buộc)
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="VD: Khách đổi ý" />
          </label>
        </form>
      </Modal>

      <Modal
        open={!!detailTarget}
        title={detailTarget ? `Chi tiết #${detailTarget.serviceOrderId}` : 'Chi tiết'}
        onClose={() => setDetailTarget(null)}
        footer={
          <button type="button" className="hm-btn hm-btn--primary" onClick={() => setDetailTarget(null)}>
            Đóng
          </button>
        }
      >
        <div className="form-stack">
          <div>
            <span className="muted">Trạng thái</span>
            <div style={{ marginTop: '0.25rem' }}>{detailTarget ? statusBadge(detailTarget.statusCode) : null}</div>
          </div>
          <div>
            <span className="muted">Lý do hủy</span>
            <div style={{ marginTop: '0.25rem' }}>
              <strong>{detailTarget?.cancelReason || '—'}</strong>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

