import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

type InvoiceEntity = { id: number };
type StayRef = {
  stayId: number;
  reservationId?: number | null;
  hotelId: number;
  hotelName?: string | null;
  roomNumber?: string | null;
  customerName?: string | null;
  statusCode: string;
  checkInAt?: string | null;
  checkOutAt?: string | null;
};

export function InvoiceNewPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [note, setNote] = useState('');

  const [stays, setStays] = useState<StayRef[]>([]);
  const [loadingStays, setLoadingStays] = useState(false);
  const [selectedStayId, setSelectedStayId] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        setLoadingStays(true);
        const { data } = await api.get<StayRef[]>('/api/stays', { params: { statusCode: 'CHECKED_OUT' } });
        setStays(data);
      } catch (e) {
        // không chặn form, chỉ show message nếu cần
      } finally {
        setLoadingStays(false);
      }
    })();
  }, []);

  const stayOptions = useMemo(() => {
    return stays
      .filter((s) => (s.statusCode || '').toUpperCase() === 'CHECKED_OUT' && s.reservationId)
      .slice()
      .sort((a, b) => (b.stayId ?? 0) - (a.stayId ?? 0));
  }, [stays]);

  useEffect(() => {
    if (!selectedStayId) return;
    const s = stayOptions.find((x) => String(x.stayId) === selectedStayId);
    if (!s?.reservationId) return;
    setBookingId(String(s.reservationId));
  }, [selectedStayId, stayOptions]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const { data: body } = await api.post<InvoiceEntity>('/api/invoices', {
        bookingId: Number(bookingId),
        paymentMethod: 'CASH',
        note: note.trim() || null,
      });
      navigate(`/invoices/${body.id}`, { replace: true });
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Xuất hóa đơn"
        subtitle="Chỉ xuất được sau khi khách đã trả phòng. Hóa đơn đã lập không sửa hay xóa trên giao diện này."
        actions={
          <Link to="/invoices" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
            ← Danh sách
          </Link>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}
      <form className="card form-stack" onSubmit={onCreate}>
        <label>
          Chọn Stay đã trả phòng (gợi ý)
          <select value={selectedStayId} onChange={(e) => setSelectedStayId(e.target.value)} disabled={loadingStays || stayOptions.length === 0} required>
            <option value="">{loadingStays ? 'Đang tải…' : stayOptions.length === 0 ? 'Chưa có stay CHECKED_OUT' : 'Chọn stay…'}</option>
            {stayOptions.map((s) => (
              <option key={s.stayId} value={String(s.stayId)}>
                Stay #{s.stayId} — Booking #{s.reservationId} — {s.hotelName ?? `HotelId ${s.hotelId}`} — Phòng {s.roomNumber ?? '—'} — {s.customerName ?? '—'}
              </option>
            ))}
          </select>
          <div className="muted" style={{ fontSize: '0.85rem' }}>
            Khi chọn stay, hệ thống tự điền mã đặt phòng (reservationId) để xuất hóa đơn.
          </div>
        </label>
        <label>
          Mã đặt phòng (reservationId)
          <input value={bookingId} readOnly required />
        </label>
        <label>
          Thanh toán
          <input value="CASH (Tiền mặt)" readOnly />
        </label>
        <label>
          Ghi chú
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="submit" className="hm-btn hm-btn--primary" disabled={saving}>
          {saving ? 'Đang tạo…' : 'Tạo hóa đơn'}
        </button>
      </form>
    </div>
  );
}
