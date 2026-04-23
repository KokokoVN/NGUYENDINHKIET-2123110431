import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

export function ServiceOrderNewPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [targetType, setTargetType] = useState<'STAY' | 'BOOKING'>('BOOKING');
  const [stayId, setStayId] = useState('');
  const [reservationId, setReservationId] = useState('');

  const [serviceCode, setServiceCode] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const payload: Record<string, unknown> = {
        serviceCode: serviceCode.trim(),
        description: description.trim() || null,
        quantity,
        unitPrice,
      };
      if (targetType === 'STAY') payload.stayId = Number(stayId);
      else payload.reservationId = Number(reservationId);

      const { data } = await api.post<{ serviceOrderId: number }>('/api/serviceorders', payload);
      navigate(`/service-orders/${data.serviceOrderId}`, { replace: true });
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const canSubmit =
    serviceCode.trim() &&
    quantity >= 1 &&
    unitPrice >= 0 &&
    ((targetType === 'STAY' && stayId.trim() && Number(stayId) > 0) ||
      (targetType === 'BOOKING' && reservationId.trim() && Number(reservationId) > 0));

  return (
    <div>
      <PageHeader
        title="Thêm dịch vụ sử dụng"
        subtitle="Chỉ tạo được khi khách đã check-in (Stay IN_HOUSE)."
        actions={
          <Link to="/service-orders" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
            ← Danh sách
          </Link>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}

      <form className="card form-stack" onSubmit={onSubmit}>
        <label>
          Áp dụng cho *
          <select value={targetType} onChange={(e) => setTargetType(e.target.value as 'STAY' | 'BOOKING')}>
            <option value="BOOKING">ReservationId (Booking)</option>
            <option value="STAY">StayId</option>
          </select>
        </label>
        {targetType === 'STAY' ? (
          <label>
            StayId *
            <input type="number" min={1} value={stayId} onChange={(e) => setStayId(e.target.value)} required />
          </label>
        ) : (
          <label>
            ReservationId *
            <input type="number" min={1} value={reservationId} onChange={(e) => setReservationId(e.target.value)} required />
          </label>
        )}

        <div className="grid-2">
          <label>
            Mã dịch vụ *
            <input value={serviceCode} onChange={(e) => setServiceCode(e.target.value)} required placeholder="VD: BREAKFAST" />
          </label>
          <label>
            Số lượng *
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 1)} required />
          </label>
        </div>
        <label>
          Đơn giá (đ)
          <input type="number" min={0} value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value) || 0)} required />
        </label>
        <label>
          Mô tả
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="VD: Ăn sáng" />
        </label>

        <button type="submit" className={'hm-btn hm-btn--primary' + (saving ? ' hm-btn--loading' : '')} disabled={saving || !canSubmit}>
          {saving ? 'Đang lưu…' : 'Thêm dịch vụ'}
        </button>
      </form>
    </div>
  );
}

