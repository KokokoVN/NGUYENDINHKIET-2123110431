import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

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

function viStayStatus(statusCode: string) {
  const x = (statusCode || '').toUpperCase();
  if (x === 'IN_HOUSE') return 'Đang lưu trú';
  if (x === 'CHECKED_OUT') return 'Đã trả phòng';
  if (x === 'CANCELLED') return 'Đã hủy';
  return x || '—';
}

export function StayShowPage() {
  const params = useParams();
  const id = Number(params.id);
  const [data, setData] = useState<Stay | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const { data } = await api.get<Stay>(`/api/stays/${id}`);
        setData(data);
        setError('');
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, [id]);

  return (
    <div>
      <PageHeader
        title="Chi tiết lưu trú"
        actions={
          <Link to="/stays" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
            ← Danh sách
          </Link>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}
      {!error && !data && <p className="muted">Đang tải…</p>}

      {data && (
        <div className="card">
          <dl className="detail-grid">
            <dt>ID</dt>
            <dd>{data.stayId}</dd>
            <dt>Mã đặt phòng</dt>
            <dd>{data.reservationId ?? '—'}</dd>
            <dt>Khách sạn</dt>
            <dd>{data.hotelName ?? (data.hotelId ?? '—')}</dd>
            <dt>Phòng</dt>
            <dd>{data.roomNumber ?? (data.roomId ?? '—')}</dd>
            <dt>Khách hàng</dt>
            <dd>{data.customerName ?? (data.customerId ?? '—')}</dd>
            <dt>Check-in</dt>
            <dd>{data.checkInAt ? new Date(data.checkInAt).toLocaleString('vi-VN') : '—'}</dd>
            <dt>Check-out</dt>
            <dd>{data.checkOutAt ? new Date(data.checkOutAt).toLocaleString('vi-VN') : '—'}</dd>
            <dt>Trạng thái</dt>
            <dd>
              <span className="badge badge--info">{viStayStatus(data.statusCode)}</span>
            </dd>
          </dl>
        </div>
      )}
    </div>
  );
}

