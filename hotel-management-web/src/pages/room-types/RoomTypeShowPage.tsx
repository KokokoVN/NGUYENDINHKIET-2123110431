import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

type Hotel = { hotelId: number; hotelName: string };
type RoomType = {
  roomTypeId: number;
  hotelId: number;
  roomTypeName: string;
  capacity: number;
  baseRate: number;
  description?: string | null;
  isActive: boolean;
};

export function RoomTypeShowPage() {
  const params = useParams();
  const id = Number(params.id);
  const [data, setData] = useState<RoomType | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const [roomTypeRes, hotelsRes] = await Promise.all([
          api.get<RoomType>(`/api/roomtypes/${id}`, { params: { includeInactive: true } }),
          api.get<Hotel[]>('/api/hotels', { params: { includeInactive: true } }),
        ]);
        setData(roomTypeRes.data);
        setHotels(hotelsRes.data);
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

  return (
    <div>
      <PageHeader
        title="Chi tiết loại phòng"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/room-types" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
              ← Danh sách
            </Link>
            {id ? (
              <Link to={`/room-types/${id}/edit`} className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>
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
            <dd>{data.roomTypeId}</dd>
            <dt>Khách sạn</dt>
            <dd>{hotelLabel(data.hotelId)}</dd>
            <dt>Tên</dt>
            <dd>{data.roomTypeName}</dd>
            <dt>Sức chứa</dt>
            <dd>{data.capacity}</dd>
            <dt>Giá cơ bản/đêm</dt>
            <dd>{Number(data.baseRate).toLocaleString('vi-VN')} đ</dd>
            <dt>Mô tả</dt>
            <dd>{data.description ?? '—'}</dd>
            <dt>Trạng thái</dt>
            <dd>{data.isActive ? <span className="badge badge--ok">Đang hoạt động</span> : <span className="badge badge--muted">Ngưng hoạt động</span>}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}

