import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';

type Stay = {
  stayId: number;
  reservationId?: number | null;
  roomId?: number | null;
  hotelId?: number | null;
  roomNumber?: string | null;
  hotelName?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  statusCode: string;
};
type Paged<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export function StaysListPage() {
  const [list, setList] = useState<Stay[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [reservationId, setReservationId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [hotelId, setHotelId] = useState('');
  const [statusCode, setStatusCode] = useState('');

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  async function load(targetPage = 1) {
    const params: Record<string, unknown> = {};
    if (reservationId.trim()) params.reservationId = Number(reservationId);
    if (roomId.trim()) params.roomId = Number(roomId);
    if (hotelId.trim()) params.hotelId = Number(hotelId);
    if (statusCode.trim()) params.statusCode = statusCode.trim().toUpperCase();
    params.page = targetPage;
    params.pageSize = pageSize;
    const { data } = await api.get<Paged<Stay>>('/api/stays', { params });
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
  }, [reservationId, roomId, hotelId, statusCode]);

  function statusBadge(s: string) {
    const x = (s || '').toUpperCase();
    if (x === 'IN_HOUSE') return <span className="badge badge--warn">Đang lưu trú</span>;
    if (x === 'CHECKED_OUT') return <span className="badge badge--ok">Đã trả phòng</span>;
    if (x === 'CANCELLED') return <span className="badge badge--danger">Đã hủy</span>;
    return <span className="badge badge--muted">{x || '—'}</span>;
  }

  return (
    <div>
      <PageHeader
        title="Lưu trú"
        actions={
          <button type="button" className="hm-btn hm-btn--ghost" onClick={() => void load().catch((e) => setError(apiMessage(e)))}>
            Làm mới
          </button>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}

      <div className="card card--toolbar form-inline">
        <label>
          Mã đặt phòng
          <input type="number" min={1} value={reservationId} onChange={(e) => setReservationId(e.target.value)} placeholder="VD: 1" />
        </label>
        <label>
          Mã phòng
          <input type="number" min={1} value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="VD: 3" />
        </label>
        <label>
          Mã khách sạn
          <input type="number" min={1} value={hotelId} onChange={(e) => setHotelId(e.target.value)} placeholder="VD: 2" />
        </label>
        <label>
          Trạng thái
          <input value={statusCode} onChange={(e) => setStatusCode(e.target.value)} placeholder="VD: IN_HOUSE" />
        </label>
      </div>

      <div className="card">
        <div className="card__head">
          <h3>Danh sách</h3>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {loading ? 'Đang tải…' : `${list.length} lượt · Trang ${page}/${totalPages}`}
          </span>
        </div>
        <div className="table-wrap table-wrap--tall">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Đặt phòng</th>
                <th>Khách sạn</th>
                <th>Phòng</th>
                <th>Khách hàng</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Trạng thái</th>
                  <th className="cell-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-hint">{loading ? 'Đang tải…' : 'Chưa có lượt lưu trú.'}</div>
                  </td>
                </tr>
              ) : (
                list.map((x) => (
                  <tr key={x.stayId}>
                    <td>{x.stayId}</td>
                    <td>{x.reservationId ?? '—'}</td>
                    <td>{x.hotelName ?? (x.hotelId ?? '—')}</td>
                    <td>{x.roomNumber ?? (x.roomId ?? '—')}</td>
                    <td>{x.customerName ?? (x.customerId ?? '—')}</td>
                    <td>{x.checkInAt ? new Date(x.checkInAt).toLocaleString('vi-VN') : '—'}</td>
                    <td>{x.checkOutAt ? new Date(x.checkOutAt).toLocaleString('vi-VN') : '—'}</td>
                    <td>{statusBadge(x.statusCode)}</td>
                    <td className="cell-actions">
                      <Link to={`/stays/${x.stayId}`} className="hm-btn hm-btn--sm hm-btn--ghost" style={{ textDecoration: 'none' }}>
                        Xem
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

