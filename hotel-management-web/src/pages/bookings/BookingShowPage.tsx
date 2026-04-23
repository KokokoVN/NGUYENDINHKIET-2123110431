import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/PageHeader';
import { viBookingStatus, viRoomStatus } from '../../utils/vi';

type Hotel = { hotelId: number; hotelName: string };
type Booking = {
  reservationId: number;
  hotelId: number;
  roomId: number;
  customerId?: number;
  statusCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children?: number;
  ratePerNight: number;
  specialRequest?: string;
  room?: { roomNumber?: string };
  customer?: { fullName?: string; companyName?: string };
};

export function BookingShowPage() {
  const params = useParams();
  const id = Number(params.id);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingCancel, setPendingCancel] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  function flashSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3500);
  }

  const loadDetail = useCallback(async () => {
    if (!id) return;
    const [{ data: h }, { data: b }] = await Promise.all([
      api.get<Hotel[]>('/api/hotels'),
      api.get<Booking>(`/api/bookings/${id}`),
    ]);
    setHotels(h);
    setDetail(b);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        setLoading(true);
        setError('');
        await loadDetail();
      } catch (e) {
        setError(apiMessage(e));
        setDetail(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, loadDetail]);

  async function doCheckIn() {
    if (!id) return;
    try {
      setActionLoading(true);
      setError('');
      await api.put(`/api/bookings/${id}/check-in`);
      await loadDetail();
      flashSuccess('Đã nhận phòng.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function doCheckOut() {
    if (!id) return;
    try {
      setActionLoading(true);
      setError('');
      await api.put(`/api/bookings/${id}/check-out`);
      setPendingCheckout(false);
      await loadDetail();
      flashSuccess('Đã trả phòng.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelBooking() {
    if (!id) return;
    try {
      setActionLoading(true);
      setError('');
      await api.put(`/api/bookings/${id}/cancel`);
      setPendingCancel(false);
      await loadDetail();
      flashSuccess('Đã hủy đặt phòng.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  function bookingStatusBadge(code: string) {
    if (code === 'CONFIRMED') return <span className="badge badge--info">{viBookingStatus(code)}</span>;
    if (code === 'CHECKED_IN') return <span className="badge badge--warn">{viBookingStatus(code)}</span>;
    if (code === 'CHECKED_OUT') return <span className="badge badge--ok">{viBookingStatus(code)}</span>;
    if (code === 'CANCELLED') return <span className="badge badge--danger">{viBookingStatus(code)}</span>;
    return <span className="badge badge--muted">{viBookingStatus(code)}</span>;
  }

  function hotelName(hid: number) {
    return hotels.find((h) => h.hotelId === hid)?.hotelName ?? `ID ${hid}`;
  }

  return (
    <div>
      <PageHeader
        title="Chi tiết đặt phòng"
        subtitle="Nhận phòng, trả phòng hoặc hủy đặt tùy theo trạng thái hiện tại của đơn."
        actions={
          <Link to="/bookings" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
            ← Danh sách
          </Link>
        }
      />
      {success && <div className="alert alert--success">{success}</div>}
      {error && <div className="alert alert--error">{error}</div>}
      {loading && <p className="muted">Đang tải…</p>}
      {!loading && detail && (
        <>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card__head">
              <h3>Thao tác</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0 1rem 1rem' }}>
              {detail.statusCode === 'CONFIRMED' && (
                <>
                  <button type="button" className="hm-btn" disabled={actionLoading} onClick={() => void doCheckIn()}>
                    Nhận phòng
                  </button>
                  <button
                    type="button"
                    className="hm-btn hm-btn--danger"
                    disabled={actionLoading}
                    onClick={() => setPendingCancel(true)}
                  >
                    Hủy đặt
                  </button>
                </>
              )}
              {detail.statusCode === 'CHECKED_IN' && (
                <button type="button" className="hm-btn" disabled={actionLoading} onClick={() => setPendingCheckout(true)}>
                  Trả phòng
                </button>
              )}
            </div>
          </div>
          <div className="card">
            <dl className="detail-grid">
              <dt>Mã đặt</dt>
              <dd>{detail.reservationId}</dd>
              <dt>Khách sạn</dt>
              <dd>{hotelName(detail.hotelId)}</dd>
              <dt>Phòng</dt>
              <dd>{detail.room?.roomNumber ?? `#${detail.roomId}`}</dd>
              <dt>Khách</dt>
              <dd>
                {detail.customer
                  ? detail.customer.fullName || detail.customer.companyName || `ID ${detail.customerId ?? '—'}`
                  : detail.customerId
                    ? `Khách #${detail.customerId}`
                    : '—'}
              </dd>
              <dt>Trạng thái</dt>
              <dd>{bookingStatusBadge(detail.statusCode)}</dd>
              <dt>Check-in / out</dt>
              <dd>
                {detail.checkInDate} → {detail.checkOutDate}
              </dd>
              <dt>Người lớn / trẻ em</dt>
              <dd>
                {detail.adults} / {detail.children ?? 0}
              </dd>
              <dt>Giá / đêm</dt>
              <dd>{Number(detail.ratePerNight).toLocaleString('vi-VN')} đ</dd>
              {detail.specialRequest ? (
                <>
                  <dt>Yêu cầu</dt>
                  <dd>{detail.specialRequest}</dd>
                </>
              ) : null}
            </dl>
          </div>
        </>
      )}

      <ConfirmDialog
        open={pendingCancel}
        title="Hủy đặt phòng?"
        message="Chỉ áp dụng khi đơn đang Đã xác nhận. Thao tác không hoàn tác qua giao diện này."
        confirmLabel="Hủy đặt"
        danger
        loading={actionLoading}
        onCancel={() => !actionLoading && setPendingCancel(false)}
        onConfirm={() => void cancelBooking()}
      />

      <ConfirmDialog
        open={pendingCheckout}
        title="Trả phòng?"
        message={`Kết thúc lưu trú, cập nhật trạng thái phòng (${viRoomStatus('DIRTY')}) và đặt phòng (${viBookingStatus('CHECKED_OUT')}).`}
        confirmLabel="Trả phòng"
        loading={actionLoading}
        onCancel={() => !actionLoading && setPendingCheckout(false)}
        onConfirm={() => void doCheckOut()}
      />
    </div>
  );
}
