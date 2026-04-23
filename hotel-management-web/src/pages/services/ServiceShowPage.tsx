import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

type ServiceItem = {
  hotelServiceId: number;
  hotelId: number;
  serviceCode: string;
  serviceName: string;
  defaultUnitPrice: number;
  isActive: boolean;
};

export function ServiceShowPage() {
  const params = useParams();
  const id = Number(params.id);
  const [data, setData] = useState<ServiceItem | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const { data } = await api.get<ServiceItem>(`/api/hotelservices/${id}`);
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
        title="Chi tiết dịch vụ"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/services" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
              ← Danh sách
            </Link>
            {id ? (
              <Link to={`/services/${id}/edit`} className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>
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
            <dd>{data.hotelServiceId}</dd>
            <dt>HotelId</dt>
            <dd>{data.hotelId}</dd>
            <dt>Mã</dt>
            <dd>
              <span className="badge badge--info">{data.serviceCode}</span>
            </dd>
            <dt>Tên</dt>
            <dd>{data.serviceName}</dd>
            <dt>Giá gợi ý</dt>
            <dd>{Number(data.defaultUnitPrice).toLocaleString('vi-VN')} đ</dd>
            <dt>Trạng thái</dt>
            <dd>{data.isActive ? <span className="badge badge--ok">Đang hoạt động</span> : <span className="badge badge--muted">Ngưng hoạt động</span>}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}

