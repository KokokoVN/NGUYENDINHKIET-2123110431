import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
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

export function RoomShowPage() {
  const params = useParams();
  const id = Number(params.id);
  const [data, setData] = useState<Room | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeRef[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const [roomRes, hotelsRes, roomTypesRes] = await Promise.all([
          api.get<Room>(`/api/rooms/${id}`, { params: { includeInactive: true } }),
          api.get<Hotel[]>('/api/hotels', { params: { includeInactive: true } }),
          api.get<RoomTypeRef[]>('/api/roomtypes', { params: { includeInactive: true } }),
        ]);
        setData(roomRes.data);
        setHotels(hotelsRes.data);
        setRoomTypes(roomTypesRes.data);
        setError('');
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, [id]);

  function hotelLabel(hotelId: number) {
    const h = hotels.find((x) => x.hotelId === hotelId);
    if (!h) return `#${hotelId}`;
    return `${h.hotelName} (#${hotelId})`;
  }

  function roomTypeLabel(roomTypeId: number) {
    const rt = roomTypes.find((x) => x.roomTypeId === roomTypeId);
    if (!rt) return `#${roomTypeId}`;
    return `${rt.roomTypeName} (#${roomTypeId})`;
  }

  return (
    <div>
      <PageHeader
        title="Chi tiết phòng"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/rooms" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
              ← Danh sách
            </Link>
            {id ? (
              <Link to={`/rooms/${id}/edit`} className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>
                Sửa
              </Link>
            ) : null}
          </div>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}
      {!error && !data && <p className="muted">Đang tải…</p>}

      {data && (
        <div className="card">
          <dl className="detail-grid">
            <dt>ID</dt>
            <dd>{data.roomId}</dd>
            <dt>Khách sạn</dt>
            <dd>{hotelLabel(data.hotelId)}</dd>
            <dt>Loại phòng</dt>
            <dd>{roomTypeLabel(data.roomTypeId)}</dd>
            <dt>Số phòng</dt>
            <dd>{data.roomNumber}</dd>
            <dt>Tầng</dt>
            <dd>{data.floor ?? '—'}</dd>
            <dt>Trạng thái</dt>
            <dd>
              <span className="badge badge--info">{viRoomStatus(data.statusCode)}</span>
            </dd>
            <dt>Trạng thái hoạt động</dt>
            <dd>{data.isActive ? <span className="badge badge--ok">Đang hoạt động</span> : <span className="badge badge--muted">Ngưng hoạt động</span>}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}

