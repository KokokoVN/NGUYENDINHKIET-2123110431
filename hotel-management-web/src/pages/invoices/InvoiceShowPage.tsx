import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { viBookingStatus } from '../../utils/vi';

type InvoiceDetail = {
  id: number;
  bookingId: number;
  roomAmount: number;
  serviceAmount: number;
  totalAmount: number;
  nightsStayed?: number;
  ratePerNight?: number;
  paymentMethod: string;
  paidAt: string;
  note?: string;
  serviceItems?: Array<{
    serviceOrderId: number;
    stayId: number;
    roomId?: number;
    roomNumber?: string | null;
    serviceCode: string;
    serviceName?: string | null;
    description?: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  booking?: {
    reservationId: number;
    statusCode?: string;
    checkInDate?: string;
    checkOutDate?: string;
  };
};

export function InvoiceShowPage() {
  const params = useParams();
  const id = Number(params.id);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get<InvoiceDetail>(`/api/invoices/${id}`);
        setDetail(data);
      } catch (e) {
        setError(apiMessage(e));
        setDetail(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function payBadge(m: string) {
    if (m === 'CASH') return <span className="badge badge--muted">Tiền mặt</span>;
    if (m === 'BANK_TRANSFER') return <span className="badge badge--info">Chuyển khoản</span>;
    if (m === 'CARD') return <span className="badge badge--warn">Thẻ</span>;
    return <span className="badge badge--muted">{m}</span>;
  }

  return (
    <div>
      <PageHeader
        title="Chi tiết hóa đơn"
        actions={
          <Link to="/invoices" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
            ← Danh sách
          </Link>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}
      {loading && <p className="muted">Đang tải…</p>}
      {!loading && detail && (
        <div className="card">
          <dl className="detail-grid">
            <dt>Số HĐ</dt>
            <dd>{detail.id}</dd>
            <dt>Đặt phòng</dt>
            <dd>#{detail.bookingId}</dd>
            <dt>Tiền phòng</dt>
            <dd>
              <strong>{detail.roomAmount.toLocaleString('vi-VN')} đ</strong>
              {typeof detail.nightsStayed === 'number' && typeof detail.ratePerNight === 'number' ? (
                <div className="muted" style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  {detail.nightsStayed} đêm x {detail.ratePerNight.toLocaleString('vi-VN')} đ
                </div>
              ) : null}
            </dd>
            <dt>Dịch vụ</dt>
            <dd>{detail.serviceAmount.toLocaleString('vi-VN')} đ</dd>
            <dt>Tổng cộng</dt>
            <dd>
              <strong>{detail.totalAmount.toLocaleString('vi-VN')} đ</strong>
            </dd>
            <dt>Thanh toán</dt>
            <dd>{payBadge(detail.paymentMethod)}</dd>
            <dt>Thời điểm TT</dt>
            <dd>{new Date(detail.paidAt).toLocaleString('vi-VN')}</dd>
            {detail.note ? (
              <>
                <dt>Ghi chú</dt>
                <dd>{detail.note}</dd>
              </>
            ) : null}
            {detail.booking ? (
              <>
                <dt>Trạng thái đặt</dt>
                <dd>{viBookingStatus(detail.booking.statusCode)}</dd>
                <dt>Ở từ / đến</dt>
                <dd>
                  {detail.booking.checkInDate ?? '—'} → {detail.booking.checkOutDate ?? '—'}
                </dd>
              </>
            ) : null}
          </dl>
          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Chi tiết dịch vụ sử dụng</h4>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Phòng</th>
                    <th>Dịch vụ</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {!detail.serviceItems || detail.serviceItems.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-hint">Không có dịch vụ sử dụng.</div>
                      </td>
                    </tr>
                  ) : (
                    detail.serviceItems.map((x) => (
                      <tr key={x.serviceOrderId}>
                        <td>{x.roomNumber ?? `#${x.roomId ?? '—'}`}</td>
                        <td>
                          <span className="badge badge--info">{x.serviceCode}</span>
                          {x.serviceName ? <div className="muted" style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>{x.serviceName}</div> : null}
                        </td>
                        <td>{x.quantity}</td>
                        <td>{x.unitPrice.toLocaleString('vi-VN')} đ</td>
                        <td>
                          <strong>{x.lineTotal.toLocaleString('vi-VN')} đ</strong>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
