import { type FormEvent, useEffect, useState } from 'react';
import { api, apiMessage } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';

type Hotel = { hotelId: number; hotelName: string };
type Room = { roomId: number; roomNumber: string; hotelId: number };
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

export function BookingsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [list, setList] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [filterHotelId, setFilterHotelId] = useState<number | ''>('');
  const [formHotelId, setFormHotelId] = useState(0);

  const [roomId, setRoomId] = useState(0);
  const [customerId, setCustomerId] = useState<string>('');
  const [checkInDateStr, setCheckInDateStr] = useState('');
  const [checkOutDateStr, setCheckOutDateStr] = useState('');
  const [adults, setAdults] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [pendingCancel, setPendingCancel] = useState<number | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  function flashSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3500);
  }

  async function loadBookings() {
    const params =
      filterHotelId === '' ? undefined : { hotelId: filterHotelId };
    const { data } = await api.get<Booking[]>('/api/bookings', { params });
    setList(data);
  }

  async function loadAll() {
    const [h, r] = await Promise.all([
      api.get<Hotel[]>('/api/hotels'),
      api.get<Room[]>('/api/rooms'),
    ]);
    setHotels(h.data);
    setRooms(r.data);
    if (h.data.length && !formHotelId) setFormHotelId(h.data[0].hotelId);
    await loadBookings();
  }

  useEffect(() => {
    void (async () => {
      try {
        await loadAll();
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadBookings();
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, [filterHotelId]);

  const roomsForForm = rooms.filter((r) => r.hotelId === formHotelId);

  useEffect(() => {
    if (!roomsForForm.length) {
      setRoomId(0);
      return;
    }
    if (!roomsForForm.some((r) => r.roomId === roomId)) {
      setRoomId(roomsForForm[0].roomId);
    }
  }, [formHotelId, rooms]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      setError('');
      const body: Record<string, unknown> = {
        roomId,
        checkInDate: checkInDateStr,
        checkOutDate: checkOutDateStr,
        adults,
        children: 0,
      };
      const cid = customerId.trim();
      if (cid) body.customerId = Number(cid);
      await api.post('/api/bookings', body);
      setCheckInDateStr('');
      setCheckOutDateStr('');
      await loadAll();
      flashSuccess('Đã tạo đặt phòng.');
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function doCheckIn(id: number) {
    try {
      setError('');
      await api.put(`/api/bookings/${id}/check-in`);
      await loadAll();
      flashSuccess('Đã nhận phòng.');
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function doCheckOut(id: number) {
    try {
      setActionLoading(true);
      setError('');
      await api.put(`/api/bookings/${id}/check-out`);
      setPendingCheckout(null);
      await loadAll();
      flashSuccess('Đã trả phòng.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelBooking(id: number) {
    try {
      setActionLoading(true);
      setError('');
      await api.put(`/api/bookings/${id}/cancel`);
      setPendingCancel(null);
      await loadAll();
      flashSuccess('Đã hủy đặt phòng.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function openDetail(id: number) {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    setError('');
    try {
      const { data } = await api.get<Booking>(`/api/bookings/${id}`);
      setDetail(data);
    } catch (e) {
      setError(apiMessage(e));
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  const filtered = statusFilter ? list.filter((x) => x.statusCode === statusFilter) : list;

  function bookingStatusBadge(code: string) {
    if (code === 'CONFIRMED') return <span className="badge badge--info">{code}</span>;
    if (code === 'CHECKED_IN') return <span className="badge badge--warn">{code}</span>;
    if (code === 'CHECKED_OUT') return <span className="badge badge--ok">{code}</span>;
    if (code === 'CANCELLED') return <span className="badge badge--danger">{code}</span>;
    return <span className="badge badge--muted">{code}</span>;
  }

  function hotelName(id: number) {
    return hotels.find((h) => h.hotelId === id)?.hotelName ?? `ID ${id}`;
  }

  return (
    <div>
      <PageHeader
        title="Đặt phòng"
        subtitle="Tạo đặt · nhận / trả phòng · hủy (CONFIRMED). API không hỗ trợ sửa ngày sau khi tạo."
        actions={
          <button type="button" className="btn btn--ghost" onClick={() => void loadAll()}>
            Làm mới
          </button>
        }
      />
      {success && <div className="alert alert--success">{success}</div>}
      {error && <div className="alert alert--error">{error}</div>}
      <div className="card card--toolbar form-inline">
        <label>
          Lọc theo khách sạn
          <select
            value={filterHotelId === '' ? '' : String(filterHotelId)}
            onChange={(e) => setFilterHotelId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Tất cả</option>
            {hotels.map((h) => (
              <option key={h.hotelId} value={h.hotelId}>
                {h.hotelName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Lọc trạng thái
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CHECKED_IN">CHECKED_IN</option>
            <option value="CHECKED_OUT">CHECKED_OUT</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </label>
      </div>
      <div className="grid-2">
        <form className="card form-stack" onSubmit={onCreate}>
          <div className="card__head">
            <h3>Tạo đặt phòng</h3>
          </div>
          <label>
            Khách sạn (chọn phòng)
            <select value={formHotelId || ''} onChange={(e) => setFormHotelId(Number(e.target.value))}>
              {hotels.map((h) => (
                <option key={h.hotelId} value={h.hotelId}>
                  {h.hotelName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Phòng
            <select value={roomId || ''} onChange={(e) => setRoomId(Number(e.target.value))}>
              {roomsForForm.map((r) => (
                <option key={r.roomId} value={r.roomId}>
                  #{r.roomId} — {r.roomNumber}
                </option>
              ))}
            </select>
          </label>
          {roomsForForm.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
              Không có phòng cho khách sạn này. Thêm phòng trước.
            </p>
          ) : null}
          <label>
            Khách (customerId, tùy chọn)
            <input
              placeholder="VD: 1"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
          </label>
          <label>
            Check-in
            <input
              type="date"
              value={checkInDateStr}
              onChange={(e) => setCheckInDateStr(e.target.value)}
              required
            />
          </label>
          <label>
            Check-out
            <input
              type="date"
              value={checkOutDateStr}
              onChange={(e) => setCheckOutDateStr(e.target.value)}
              required
            />
          </label>
          <label>
            Số người lớn
            <input
              type="number"
              min={1}
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
            />
          </label>
          <button type="submit" className="btn btn--primary" disabled={!roomsForForm.length}>
            Đặt phòng
          </button>
        </form>
        <div className="card">
          <div className="card__head">
            <h3>Danh sách</h3>
            <span className="muted" style={{ fontSize: '0.8rem' }}>
              {filtered.length} đơn
            </span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Khách sạn</th>
                  <th>Phòng</th>
                  <th>Trạng thái</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th className="cell-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-hint">Không có đặt phòng phù hợp bộ lọc.</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.reservationId}>
                      <td>{b.reservationId}</td>
                      <td>{hotelName(b.hotelId)}</td>
                      <td>
                        <strong>{b.room?.roomNumber ? `${b.room.roomNumber}` : `#${b.roomId}`}</strong>
                      </td>
                      <td>{bookingStatusBadge(b.statusCode)}</td>
                      <td>{b.checkInDate}</td>
                      <td>{b.checkOutDate}</td>
                      <td className="cell-actions">
                        <button
                          type="button"
                          className="btn btn--sm btn--ghost"
                          onClick={() => void openDetail(b.reservationId)}
                        >
                          Chi tiết
                        </button>
                        {b.statusCode === 'CONFIRMED' && (
                          <>
                            <button
                              type="button"
                              className="btn btn--sm"
                              onClick={() => void doCheckIn(b.reservationId)}
                            >
                              Nhận phòng
                            </button>
                            <button
                              type="button"
                              className="btn btn--sm btn--danger"
                              onClick={() => setPendingCancel(b.reservationId)}
                            >
                              Hủy
                            </button>
                          </>
                        )}
                        {b.statusCode === 'CHECKED_IN' && (
                          <button
                            type="button"
                            className="btn btn--sm"
                            onClick={() => setPendingCheckout(b.reservationId)}
                          >
                            Trả phòng
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
      </div>

      <Modal open={detailOpen} title="Chi tiết đặt phòng" onClose={() => setDetailOpen(false)} size="lg">
        {detailLoading && <p className="muted">Đang tải…</p>}
        {!detailLoading && detail && (
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
                  ? `Customer #${detail.customerId}`
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
        )}
      </Modal>

      <ConfirmDialog
        open={pendingCancel !== null}
        title="Hủy đặt phòng?"
        message="Chỉ áp dụng khi đơn đang CONFIRMED. Thao tác không hoàn tác qua giao diện này."
        confirmLabel="Hủy đặt"
        danger
        loading={actionLoading}
        onCancel={() => !actionLoading && setPendingCancel(null)}
        onConfirm={() => {
          if (pendingCancel != null) void cancelBooking(pendingCancel);
        }}
      />

      <ConfirmDialog
        open={pendingCheckout !== null}
        title="Trả phòng?"
        message="Kết thúc lưu trú, cập nhật trạng thái phòng (DIRTY) và đặt phòng (CHECKED_OUT)."
        confirmLabel="Trả phòng"
        loading={actionLoading}
        onCancel={() => !actionLoading && setPendingCheckout(null)}
        onConfirm={() => {
          if (pendingCheckout != null) void doCheckOut(pendingCheckout);
        }}
      />
    </div>
  );
}
