import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

type Hotel = { hotelId: number; hotelName: string };

export function ServiceNewPage() {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [hotelId, setHotelId] = useState<number>(0);
  const [serviceCode, setServiceCode] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [defaultUnitPrice, setDefaultUnitPrice] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await api.get<Hotel[]>('/api/hotels');
        setHotels(data);
        setHotelId((prev) => prev || data[0]?.hotelId || 0);
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hotelId) return;
    try {
      setSaving(true);
      setError('');
      const { data } = await api.post<{ hotelServiceId: number }>('/api/hotelservices', {
        hotelId,
        serviceCode: serviceCode.trim(),
        serviceName: serviceName.trim(),
        defaultUnitPrice,
        isActive,
      });
      navigate(`/services/${data.hotelServiceId}`, { replace: true });
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Thêm dịch vụ"
        subtitle="Tạo dịch vụ trong danh mục theo khách sạn."
        actions={
          <Link to="/services" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
            ← Danh sách
          </Link>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}

      <form className="card form-stack" onSubmit={onSubmit}>
        <label>
          Khách sạn *
          <select value={hotelId || ''} onChange={(e) => setHotelId(Number(e.target.value))} required>
            {hotels.map((h) => (
              <option key={h.hotelId} value={h.hotelId}>
                {h.hotelName}
              </option>
            ))}
          </select>
        </label>
        <div className="grid-2">
          <label>
            Mã dịch vụ *
            <input value={serviceCode} onChange={(e) => setServiceCode(e.target.value)} required placeholder="VD: LAUNDRY" />
          </label>
          <label>
            Đơn giá mặc định (đ)
            <input type="number" min={0} value={defaultUnitPrice} onChange={(e) => setDefaultUnitPrice(Number(e.target.value))} required />
          </label>
        </div>
        <label>
          Tên dịch vụ *
          <input value={serviceName} onChange={(e) => setServiceName(e.target.value)} required />
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span>Đang hoạt động</span>
        </label>
        <button type="submit" className={'hm-btn hm-btn--primary' + (saving ? ' hm-btn--loading' : '')} disabled={saving || !hotelId}>
          {saving ? 'Đang lưu…' : 'Tạo dịch vụ'}
        </button>
      </form>
    </div>
  );
}

