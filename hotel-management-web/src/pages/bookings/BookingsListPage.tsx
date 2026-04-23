import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { viBookingStatus } from '../../utils/vi';

type Hotel = { hotelId: number; hotelName: string };
type Booking = {
  reservationId: number;
  hotelId: number;
  roomId: number;
  statusCode: string;
  checkInDate: string;
  checkOutDate: string;
  room?: { roomNumber?: string };
};
type Paged<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export function BookingsListPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [list, setList] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [filterHotelId, setFilterHotelId] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [success, setSuccess] = useState('');

  const loadBookings = useCallback(async (targetPage = 1) => {
    const params: Record<string, unknown> = { page: targetPage, pageSize };
    if (filterHotelId !== '') params.hotelId = filterHotelId;
    if (statusFilter) params.statusCode = statusFilter;
    const { data } = await api.get<Paged<Booking>>('/api/bookings', { params });
    setList(data.items);
    setPage(data.page);
    setTotalItems(data.totalItems);
    setTotalPages(data.totalPages);
  }, [filterHotelId, statusFilter]);

  const loadHotels = useCallback(async () => {
    const { data } = await api.get<Hotel[]>('/api/hotels');
    setHotels(data);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadHotels();
        await loadBookings();
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, [loadHotels, loadBookings]);

  useEffect(() => {
    void (async () => {
      try {
        await loadBookings();
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, [loadBookings]);

  function bookingStatusBadge(code: string) {
    if (code === 'CONFIRMED') return <span className="badge badge--info">{viBookingStatus(code)}</span>;
    if (code === 'CHECKED_IN') return <span className="badge badge--warn">{viBookingStatus(code)}</span>;
    if (code === 'CHECKED_OUT') return <span className="badge badge--ok">{viBookingStatus(code)}</span>;
    if (code === 'CANCELLED') return <span className="badge badge--danger">{viBookingStatus(code)}</span>;
    return <span className="badge badge--muted">{viBookingStatus(code)}</span>;
  }

  function hotelName(id: number) {
    return hotels.find((h) => h.hotelId === id)?.hotelName ?? `ID ${id}`;
  }

  async function doCheckIn(reservationId: number) {
    try {
      setActionLoadingId(reservationId);
      setError('');
      await api.put(`/api/bookings/${reservationId}/check-in`);
      setSuccess(`Đã nhận phòng đơn #${reservationId}.`);
      await loadBookings(page);
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function doCheckOut(reservationId: number) {
    try {
      setActionLoadingId(reservationId);
      setError('');
      await api.put(`/api/bookings/${reservationId}/check-out`);
      setSuccess(`Đã trả phòng đơn #${reservationId}.`);
      await loadBookings(page);
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Đặt phòng"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="hm-btn hm-btn--ghost" onClick={() => void loadBookings()}>
              Làm mới
            </button>
            <Link to="/bookings/new" className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>
              Tạo đặt phòng
            </Link>
          </div>
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
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="CHECKED_IN">Đã nhận phòng</option>
            <option value="CHECKED_OUT">Đã trả phòng</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </label>
      </div>
      <div className="card">
        <div className="card__head">
          <h3>Danh sách</h3>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {totalItems} đơn
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
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-hint">Không có đặt phòng phù hợp bộ lọc.</div>
                  </td>
                </tr>
              ) : (
                list.map((b) => (
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
                      {b.statusCode === 'CONFIRMED' && (
                        <button
                          type="button"
                          className="hm-btn hm-btn--sm"
                          disabled={actionLoadingId === b.reservationId}
                          onClick={() => void doCheckIn(b.reservationId)}
                        >
                          Check-in
                        </button>
                      )}
                      {b.statusCode === 'CHECKED_IN' && (
                        <button
                          type="button"
                          className="hm-btn hm-btn--sm"
                          disabled={actionLoadingId === b.reservationId}
                          onClick={() => void doCheckOut(b.reservationId)}
                        >
                          Check-out
                        </button>
                      )}
                      <Link
                        to={`/bookings/${b.reservationId}`}
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
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={(p) => void loadBookings(p)} />
    </div>
  );
}
