import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

type InvoiceEntity = { id: number };

export function InvoiceNewPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [note, setNote] = useState('');

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const { data: body } = await api.post<InvoiceEntity>('/api/invoices', {
        bookingId: Number(bookingId),
        paymentMethod,
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
          Mã đặt phòng (reservationId)
          <input value={bookingId} onChange={(e) => setBookingId(e.target.value)} required />
        </label>
        <label>
          Thanh toán
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="CASH">Tiền mặt</option>
            <option value="BANK_TRANSFER">Chuyển khoản</option>
            <option value="CARD">Thẻ</option>
          </select>
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
