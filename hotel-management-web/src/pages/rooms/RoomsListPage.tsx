import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { viRoomStatus } from '../../utils/vi';

type Hotel = { hotelId: number; hotelName: string };
type RoomTypeRef = { roomTypeId: number; roomTypeName: string; hotelId: number };
type Room = {
  roomId: number;
  hotelId: number;
  roomTypeId: number;
  roomNumber: string;
  floor?: string | null;
  statusCode: string;
  isActive: boolean;
};
type Paged<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export function RoomsListPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeRef[]>([]);
  const [list, setList] = useState<Room[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [roomNumber, setRoomNumber] = useState('');
  const [statusCode, setStatusCode] = useState('');
  const [roomTypeId, setRoomTypeId] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  function flashSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3500);
  }

  const loadRefs = useCallback(async () => {
    const [hotelsRes, roomTypesRes] = await Promise.all([
      api.get<Hotel[]>('/api/hotels', { params: { includeInactive: true } }),
      api.get<RoomTypeRef[]>('/api/roomtypes', { params: { includeInactive: true } }),
    ]);
    setHotels(hotelsRes.data);
    setRoomTypes(roomTypesRes.data);
  }, []);

  const load = useCallback(async (targetPage = 1) => {
    const params: Record<string, unknown> = { includeInactive: true };
    if (roomNumber.trim()) params.roomNumber = roomNumber.trim();
    if (statusCode.trim()) params.statusCode = statusCode.trim();
    if (roomTypeId.trim()) params.roomTypeId = Number(roomTypeId);
    params.page = targetPage;
    params.pageSize = pageSize;
    const { data } = await api.get<Paged<Room>>('/api/rooms', { params });
    setList(data.items);
    setPage(data.page);
    setTotalItems(data.totalItems);
    setTotalPages(data.totalPages);
  }, [roomNumber, statusCode, roomTypeId]);

  useEffect(() => {
    void loadRefs().catch((e) => setError(apiMessage(e)));
  }, [loadRefs]);

  useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        try {
          await load();
        } catch (e) {
          setError(apiMessage(e));
        }
      })();
    }, 220);
    return () => clearTimeout(t);
  }, [load]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setError('');
      await api.delete(`/api/rooms/${deleteTarget.roomId}`);
      setDeleteTarget(null);
      await load();
      flashSuccess('Đã ngưng hoạt động phòng.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  async function restore(id: number) {
    try {
      setRestoringId(id);
      setError('');
      await api.put(`/api/rooms/${id}/restore`);
      await load();
      flashSuccess('Đã hoạt động lại phòng.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setRestoringId(null);
    }
  }

  function statusBadge(s: string) {
    const x = (s || '').toUpperCase();
    if (x === 'VACANT') return <span className="badge badge--ok">{viRoomStatus(x)}</span>;
    if (x === 'OCCUPIED') return <span className="badge badge--warn">{viRoomStatus(x)}</span>;
    if (x === 'DIRTY' || x === 'CLEANING') return <span className="badge badge--info">{viRoomStatus(x)}</span>;
    return <span className="badge badge--muted">{viRoomStatus(x)}</span>;
  }

  function hotelLabel(hotelId: number) {
    const h = hotels.find((x) => x.hotelId === hotelId);
    if (!h) return `#${hotelId}`;
    return `${h.hotelName} (#${hotelId})`;
  }

  function roomTypeLabel(id: number) {
    const rt = roomTypes.find((x) => x.roomTypeId === id);
    if (!rt) return `#${id}`;
    return `${rt.roomTypeName} (#${id})`;
  }

  return (
    <div>
      <PageHeader
        title="Phòng"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="hm-btn hm-btn--ghost" onClick={() => void load()}>
              Làm mới
            </button>
            <Link to="/rooms/new" className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>
              Thêm phòng
            </Link>
          </div>
        }
      />
      {success && <div className="alert alert--success">{success}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      <div className="card card--toolbar form-inline">
        <label>
          Số phòng
          <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="VD: 101" />
        </label>
        <label>
          Trạng thái
          <select value={statusCode} onChange={(e) => setStatusCode(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="VACANT">Trống</option>
            <option value="OCCUPIED">Đang có khách</option>
            <option value="DIRTY">Cần dọn</option>
            <option value="CLEANING">Đang dọn</option>
            <option value="OUT_OF_SERVICE">Ngưng phục vụ</option>
          </select>
        </label>
        <label>
          Mã loại phòng
          <input type="number" min={1} value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)} placeholder="VD: 3" />
        </label>
        <span className="muted" style={{ alignSelf: 'center' }}></span>
      </div>

      <div className="card">
        <div className="card__head">
          <h3>Danh sách</h3>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {list.length} phòng
          </span>
        </div>
        <div className="table-wrap table-wrap--tall">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Số phòng</th>
                <th>Khách sạn</th>
                <th>Loại phòng</th>
                <th>Tầng</th>
                <th>Trạng thái</th>
                <th className="cell-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-hint">Chưa có dữ liệu.</div>
                  </td>
                </tr>
              ) : (
                list.map((r) => (
                  <tr key={r.roomId}>
                    <td>{r.roomId}</td>
                    <td>
                      <strong>{r.roomNumber}</strong>
                    </td>
                    <td>{hotelLabel(r.hotelId)}</td>
                    <td>{roomTypeLabel(r.roomTypeId)}</td>
                    <td>{r.floor ?? '—'}</td>
                    <td>{statusBadge(r.statusCode)}</td>
                    <td className="cell-actions">
                      <Link to={`/rooms/${r.roomId}`} className="hm-btn hm-btn--sm hm-btn--ghost" style={{ textDecoration: 'none' }}>
                        Xem
                      </Link>
                      <Link to={`/rooms/${r.roomId}/edit`} className="hm-btn hm-btn--sm hm-btn--ghost" style={{ textDecoration: 'none' }}>
                        Sửa
                      </Link>
                      {r.isActive ? (
                        <button type="button" className="hm-btn hm-btn--sm hm-btn--danger" onClick={() => setDeleteTarget(r)}>
                          Ngưng HĐ
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="hm-btn hm-btn--sm hm-btn--primary"
                          disabled={restoringId === r.roomId}
                          onClick={() => void restore(r.roomId)}
                        >
                          {restoringId === r.roomId ? 'Đang bật…' : 'Hoạt động lại'}
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Ngưng hoạt động phòng?"
        message={deleteTarget ? `Phòng ${deleteTarget.roomNumber} sẽ đổi trạng thái Ngưng phục vụ.` : ''}
        confirmLabel="Ngưng hoạt động"
        danger
        loading={deleting}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={(p) => void load(p)} />
    </div>
  );
}

