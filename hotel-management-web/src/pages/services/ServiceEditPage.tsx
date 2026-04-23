import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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

export function ServiceEditPage() {
  const params = useParams();
  const id = Number(params.id);
  const navigate = useNavigate();

  const [data, setData] = useState<ServiceItem | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [serviceName, setServiceName] = useState('');
  const [defaultUnitPrice, setDefaultUnitPrice] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const { data } = await api.get<ServiceItem>(`/api/hotelservices/${id}`);
        setData(data);
        setServiceName(data.serviceName);
        setDefaultUnitPrice(data.defaultUnitPrice);
        setIsActive(!!data.isActive);
        setError('');
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, [id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      setSaving(true);
      setError('');
      await api.put(`/api/hotelservices/${id}`, {
        serviceName: serviceName.trim(),
        defaultUnitPrice,
        isActive,
      });
      navigate(`/services/${id}`, { replace: true });
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Sửa dịch vụ"
        subtitle={data ? `Mã: ${data.serviceCode} · ID: ${data.hotelServiceId}` : 'Đang tải…'}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/services" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
              ← Danh sách
            </Link>
            {id ? (
              <Link to={`/services/${id}`} className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
                Xem
              </Link>
            ) : null}
          </div>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}
      {!error && !data && <p className="muted">Đang tải…</p>}

      {data && (
        <form className="card form-stack" onSubmit={onSubmit}>
          <div className="grid-2">
            <label>
              ServiceCode
              <input value={data.serviceCode} disabled />
            </label>
            <label>
              HotelId
              <input value={String(data.hotelId)} disabled />
            </label>
          </div>
          <label>
            Tên dịch vụ *
            <input value={serviceName} onChange={(e) => setServiceName(e.target.value)} required />
          </label>
          <label>
            Đơn giá mặc định (đ)
            <input type="number" min={0} value={defaultUnitPrice} onChange={(e) => setDefaultUnitPrice(Number(e.target.value))} required />
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span>Đang hoạt động</span>
          </label>
          <button type="submit" className={'hm-btn hm-btn--primary' + (saving ? ' hm-btn--loading' : '')} disabled={saving}>
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </form>
      )}
    </div>
  );
}

