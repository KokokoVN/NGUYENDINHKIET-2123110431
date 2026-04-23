import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

type Hotel = {
  hotelId: number;
  hotelName: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
};

export function HotelShowPage() {
  const params = useParams();
  const id = Number(params.id);

  const [data, setData] = useState<Hotel | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const { data } = await api.get<Hotel>(`/api/hotels/${id}`, { params: { includeInactive: true } });
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
        title="Chi tiết khách sạn"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/hotels" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
              ← Danh sách
            </Link>
            {id ? (
              <Link to={`/hotels/${id}/edit`} className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>
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
            <dd>{data.hotelId}</dd>
            <dt>Tên</dt>
            <dd>{data.hotelName}</dd>
            <dt>Địa chỉ</dt>
            <dd>{data.address ?? '—'}</dd>
            <dt>SĐT</dt>
            <dd>{data.phone ?? '—'}</dd>
            <dt>Email</dt>
            <dd>{data.email ?? '—'}</dd>
            <dt>Trạng thái</dt>
            <dd>{data.isActive ? <span className="badge badge--ok">Đang hoạt động</span> : <span className="badge badge--muted">Ngưng hoạt động</span>}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}

