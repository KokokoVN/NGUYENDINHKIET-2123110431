import { type FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiMessage, emitToast } from '../../api/client';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';

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

export function ServiceOrderShowPage() {
  const params = useParams();
  const id = Number(params.id);
  const [data, setData] = useState<ServiceOrder | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [pendingCancel, setPendingCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [saving, setSaving] = useState(false);

  function flash(msg: string) {
    setSuccess(msg);
    emitToast('success', msg);
    setTimeout(() => setSuccess(''), 3500);
  }

  async function load() {
    if (!id) return;
    const { data } = await api.get<ServiceOrder>(`/api/serviceorders/${id}`);
    setData(data);
  }

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        await load();
        setError('');
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function submitCancel(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      setSaving(true);
      setError('');
      await api.put(`/api/serviceorders/${id}/cancel`, cancelReason.trim() ? { reason: cancelReason.trim() } : {});
      setPendingCancel(false);
      await load();
      flash('Đã hủy dịch vụ sử dụng.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const isActive = String(data?.statusCode || '').toUpperCase() === 'ACTIVE';

  return (
    <div>
      <PageHeader
        title="Chi tiết dịch vụ sử dụng"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/service-orders" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
              ← Danh sách
            </Link>
            <Link to="/service-orders/new" className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>
              Thêm dịch vụ
            </Link>
          </div>
        }
      />
      {success && <div className="alert alert--success">{success}</div>}
      {error && <div className="alert alert--error">{error}</div>}
      {!error && !data && <p className="muted">Đang tải…</p>}

      {data && (
        <>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card__head">
              <h3>Thao tác</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0 1rem 1rem' }}>
              {isActive ? (
                <button type="button" className="hm-btn hm-btn--danger" onClick={() => setPendingCancel(true)} disabled={saving}>
                  Hủy
                </button>
              ) : (
                <span className="muted">Không có thao tác.</span>
              )}
            </div>
          </div>

          <div className="card">
            <dl className="detail-grid">
              <dt>ID</dt>
              <dd>{data.serviceOrderId}</dd>
              <dt>Phòng</dt>
              <dd>{data.roomNumber ?? (data.roomId ? `#${data.roomId}` : '—')}</dd>
              <dt>Mã đặt phòng</dt>
              <dd>{data.reservationId ?? '—'}</dd>
              <dt>StayId</dt>
              <dd>{data.stayId}</dd>
              <dt>Mã dịch vụ</dt>
              <dd>
                <span className="badge badge--info">{data.serviceCode}</span>
              </dd>
              <dt>Tên dịch vụ</dt>
              <dd>{data.serviceName ?? '—'}</dd>
              <dt>Mô tả</dt>
              <dd>{data.description ?? '—'}</dd>
              <dt>Số lượng</dt>
              <dd>{data.quantity}</dd>
              <dt>Đơn giá</dt>
              <dd>{Number(data.unitPrice).toLocaleString('vi-VN')} đ</dd>
              <dt>Tổng</dt>
              <dd>
                <strong>{Number(data.quantity * data.unitPrice).toLocaleString('vi-VN')} đ</strong>
              </dd>
              <dt>Trạng thái</dt>
              <dd>{String(data.statusCode || '').toUpperCase()}</dd>
              <dt>Lý do hủy</dt>
              <dd>{data.cancelReason ?? '—'}</dd>
            </dl>
          </div>
        </>
      )}

      <Modal
        open={pendingCancel}
        title={data ? `Hủy dịch vụ #${data.serviceOrderId}` : 'Hủy dịch vụ'}
        onClose={() => !saving && setPendingCancel(false)}
        footer={
          <>
            <button type="button" className="hm-btn hm-btn--ghost" disabled={saving} onClick={() => setPendingCancel(false)}>
              Đóng
            </button>
            <button type="submit" form="so-cancel" className="hm-btn hm-btn--danger" disabled={saving}>
              {saving ? 'Đang hủy…' : 'Xác nhận hủy'}
            </button>
          </>
        }
      >
        <form id="so-cancel" className="form-stack" onSubmit={submitCancel}>
          <label>
            Lý do (không bắt buộc)
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="VD: Khách đổi ý" />
          </label>
        </form>
      </Modal>
    </div>
  );
}

