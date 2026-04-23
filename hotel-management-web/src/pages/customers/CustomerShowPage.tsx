import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { viLoyaltyTier } from '../../utils/vi';

type Customer = {
  customerId: number;
  customerType: string;
  fullName?: string | null;
  companyName?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  loyaltyPoints?: number;
  loyaltyTier?: string;
};

export function CustomerShowPage() {
  const params = useParams();
  const id = Number(params.id);
  const [data, setData] = useState<Customer | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const { data } = await api.get<Customer>(`/api/customers/${id}`, { params: { includeInactive: true } });
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
        title="Chi tiết khách hàng"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/customers" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
              ← Danh sách
            </Link>
            {id ? (
              <Link to={`/customers/${id}/edit`} className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>
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
            <dt>ID</dt><dd>{data.customerId}</dd>
            <dt>Loại</dt><dd>{data.customerType === 'COMPANY' ? 'Công ty' : data.customerType === 'AGENCY' ? 'Đại lý' : 'Cá nhân'}</dd>
            <dt>Họ tên</dt><dd>{data.fullName ?? '—'}</dd>
            <dt>Công ty</dt><dd>{data.companyName ?? '—'}</dd>
            <dt>Loại giấy tờ</dt><dd>{data.idType ?? '—'}</dd>
            <dt>Số giấy tờ</dt><dd>{data.idNumber ?? '—'}</dd>
            <dt>Ngày sinh</dt><dd>{data.dateOfBirth ?? '—'}</dd>
            <dt>Quốc tịch</dt><dd>{data.nationality ?? '—'}</dd>
            <dt>SĐT</dt><dd>{data.phone ?? '—'}</dd>
            <dt>Email</dt><dd>{data.email ?? '—'}</dd>
            <dt>Điểm</dt><dd>{data.loyaltyPoints ?? 0}</dd>
            <dt>Hạng</dt><dd><span className="badge badge--info">{viLoyaltyTier(data.loyaltyTier)}</span></dd>
            <dt>Ghi chú</dt><dd>{data.notes ?? '—'}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}

