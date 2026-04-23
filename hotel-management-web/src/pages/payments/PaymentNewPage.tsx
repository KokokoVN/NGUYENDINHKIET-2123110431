import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

export function PaymentNewPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [targetType, setTargetType] = useState<'STAY' | 'BOOKING'>('STAY');
  const [stayId, setStayId] = useState('');
  const [reservationId, setReservationId] = useState('');

  const [paymentType, setPaymentType] = useState<'CHARGE' | 'DEPOSIT' | 'REFUND'>('CHARGE');
  const [methodCode, setMethodCode] = useState<'CASH' | 'BANK_TRANSFER' | 'CARD' | 'OTHER'>('CASH');
  const [amount, setAmount] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [note, setNote] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const payload: Record<string, unknown> = {
        paymentType,
        methodCode,
        amount: Number(amount),
        referenceNo: referenceNo.trim() || null,
        note: note.trim() || null,
      };
      if (targetType === 'STAY') payload.stayId = Number(stayId);
      else payload.reservationId = Number(reservationId);

      const { data } = await api.post<{ paymentId: number }>('/api/payments', payload);
      navigate(`/payments/${data.paymentId}`, { replace: true });
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const canSubmit =
    amount.trim() &&
    Number(amount) > 0 &&
    ((targetType === 'STAY' && stayId.trim() && Number(stayId) > 0) ||
      (targetType === 'BOOKING' && reservationId.trim() && Number(reservationId) > 0));

  return (
    <div>
      <PageHeader
        title="Tạo thanh toán"
        subtitle="Tạo giao dịch và ghi nhận ở trạng thái PAID."
        actions={
          <Link to="/payments" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
            ← Danh sách
          </Link>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}

      <form className="card form-stack" onSubmit={onSubmit}>
        <label>
          Áp dụng cho *
          <select value={targetType} onChange={(e) => setTargetType(e.target.value as 'STAY' | 'BOOKING')}>
            <option value="STAY">Lưu trú (Stay)</option>
            <option value="BOOKING">Đặt phòng (Booking)</option>
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
            Loại thanh toán *
            <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as typeof paymentType)}>
              <option value="CHARGE">CHARGE</option>
              <option value="DEPOSIT">DEPOSIT</option>
              <option value="REFUND">REFUND</option>
            </select>
          </label>
          <label>
            Phương thức *
            <select value={methodCode} onChange={(e) => setMethodCode(e.target.value as typeof methodCode)}>
              <option value="CASH">CASH</option>
              <option value="BANK_TRANSFER">BANK_TRANSFER</option>
              <option value="CARD">CARD</option>
              <option value="OTHER">OTHER</option>
            </select>
          </label>
        </div>

        <label>
          Số tiền (đ) *
          <input type="number" min={0.01} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        <label>
          ReferenceNo
          <input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="VD: Mã giao dịch ngân hàng" />
        </label>
        <label>
          Ghi chú
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>

        <button type="submit" className={'hm-btn hm-btn--primary' + (saving ? ' hm-btn--loading' : '')} disabled={saving || !canSubmit}>
          {saving ? 'Đang lưu…' : 'Tạo thanh toán'}
        </button>
      </form>
    </div>
  );
}

