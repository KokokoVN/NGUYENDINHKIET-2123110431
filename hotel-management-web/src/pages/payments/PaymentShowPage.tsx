import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/PageHeader';

type Payment = {
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

export function PaymentShowPage() {
  const params = useParams();
  const id = Number(params.id);
  const [data, setData] = useState<Payment | null>(null);
  const [error, setError] = useState('');
  const [pendingVoid, setPendingVoid] = useState(false);
  const [voiding, setVoiding] = useState(false);

  async function load() {
    if (!id) return;
    const { data } = await api.get<Payment>(`/api/payments/${id}`);
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

  async function confirmVoid() {
    if (!id) return;
    try {
      setVoiding(true);
      setError('');
      await api.put(`/api/payments/${id}/void`);
      setPendingVoid(false);
      await load();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setVoiding(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Chi tiết thanh toán"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/payments" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
              ← Danh sách
            </Link>
            <Link to="/payments/new" className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>
              Tạo thanh toán
            </Link>
          </div>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}
      {!error && !data && <p className="muted">Đang tải…</p>}

      {data && (
        <>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card__head">
              <h3>Thao tác</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0 1rem 1rem' }}>
              {String(data.statusCode || '').toUpperCase() === 'PAID' ? (
                <button type="button" className="hm-btn hm-btn--danger" onClick={() => setPendingVoid(true)} disabled={voiding}>
                  Hủy giao dịch (VOID)
                </button>
              ) : (
                <span className="muted">Không có thao tác khả dụng.</span>
              )}
            </div>
          </div>

          <div className="card">
            <dl className="detail-grid">
              <dt>ID</dt>
              <dd>{data.paymentId}</dd>
              <dt>Đối tượng</dt>
              <dd>
                {data.stayId ? (
                  <span className="badge badge--muted">Stay #{data.stayId}</span>
                ) : data.reservationId ? (
                  <span className="badge badge--muted">Booking #{data.reservationId}</span>
                ) : (
                  '—'
                )}
              </dd>
              <dt>Loại</dt>
              <dd>
                <span className="badge badge--info">{String(data.paymentType || '').toUpperCase()}</span>
              </dd>
              <dt>Phương thức</dt>
              <dd>{String(data.methodCode || '').toUpperCase()}</dd>
              <dt>Số tiền</dt>
              <dd>
                <strong>{Number(data.amount).toLocaleString('vi-VN')} đ</strong>
              </dd>
              <dt>Trạng thái</dt>
              <dd>{String(data.statusCode || '').toUpperCase()}</dd>
              <dt>ReferenceNo</dt>
              <dd>{data.referenceNo ?? '—'}</dd>
              <dt>Ghi chú</dt>
              <dd>{data.note ?? '—'}</dd>
            </dl>
          </div>
        </>
      )}

      <ConfirmDialog
        open={pendingVoid}
        title="Hủy giao dịch?"
        message={data ? `Thanh toán #${data.paymentId} sẽ chuyển sang VOID.` : ''}
        confirmLabel="Hủy giao dịch"
        danger
        loading={voiding}
        onCancel={() => !voiding && setPendingVoid(false)}
        onConfirm={confirmVoid}
      />
    </div>
  );
}

