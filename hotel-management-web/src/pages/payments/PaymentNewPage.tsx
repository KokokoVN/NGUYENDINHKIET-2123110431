import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

export function PaymentNewPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [stayId, setStayId] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [note, setNote] = useState('');
  const [stays, setStays] = useState<Array<{
    stayId: number;
    reservationId?: number | null;
    statusCode: string;
    hotelName?: string | null;
    roomNumber?: string | null;
    customerName?: string | null;
  }>>([]);
  const [loadingStays, setLoadingStays] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        setLoadingStays(true);
        const { data } = await api.get<typeof stays>('/api/stays', { params: { statusCode: 'CHECKED_OUT' } });
        setStays(data);
      } catch {
        // để backend báo lỗi khi submit nếu cần
      } finally {
        setLoadingStays(false);
      }
    })();
  }, []);

  const stayOptions = useMemo(
    () =>
      stays
        .filter((s) => String(s.statusCode || '').toUpperCase() === 'CHECKED_OUT')
        .slice()
        .sort((a, b) => b.stayId - a.stayId),
    [stays]
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const payload: Record<string, unknown> = {
        referenceNo: referenceNo.trim() || null,
        note: note.trim() || null,
        stayId: Number(stayId),
      };

      const { data } = await api.post<{ paymentId: number }>('/api/payments', payload);
      navigate(`/payments/${data.paymentId}`, { replace: true });
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = stayId.trim() && Number(stayId) > 0;

  return (
    <div>
      <PageHeader
        title="Tạo thanh toán"
        subtitle="Chọn stay đã check-out. Hệ thống tự tính tiền phòng + dịch vụ và chỉ ghi nhận tiền mặt."
        actions={
          <Link to="/payments" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
            ← Danh sách
          </Link>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}

      <form className="card form-stack" onSubmit={onSubmit}>
        <label>
          Stay đã check-out *
          <select value={stayId} onChange={(e) => setStayId(e.target.value)} required disabled={loadingStays || stayOptions.length === 0}>
            <option value="">
              {loadingStays ? 'Đang tải…' : stayOptions.length === 0 ? 'Chưa có stay CHECKED_OUT' : 'Chọn stay…'}
            </option>
            {stayOptions.map((s) => (
              <option key={s.stayId} value={String(s.stayId)}>
                Stay #{s.stayId} — Booking #{s.reservationId ?? '—'} — {s.hotelName ?? '—'} — Phòng {s.roomNumber ?? '—'} —{' '}
                {s.customerName ?? '—'}
              </option>
            ))}
          </select>
        </label>

        <label>
          Phương thức thanh toán
          <input value="CASH (Tiền mặt)" readOnly />
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

