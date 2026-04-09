import { type FormEvent, useEffect, useState } from 'react';
import { api, apiMessage } from '../api/client';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';

type Invoice = {
  id: number;
  bookingId: number;
  roomAmount: number;
  serviceAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paidAt: string;
  note?: string;
};

type InvoiceDetail = Invoice & {
  booking?: {
    reservationId: number;
    statusCode?: string;
    checkInDate?: string;
    checkOutDate?: string;
  };
};

export function InvoicesPage() {
  const [list, setList] = useState<Invoice[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [note, setNote] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  function flashSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  }

  async function load() {
    const { data } = await api.get<Invoice[]>('/api/invoices');
    setList(data);
  }

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      setError('');
      await api.post('/api/invoices', {
        bookingId: Number(bookingId),
        paymentMethod,
        note: note.trim() || null,
      });
      setBookingId('');
      setNote('');
      await load();
      flashSuccess('Đã xuất hóa đơn.');
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  async function openDetail(id: number) {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    setError('');
    try {
      const { data } = await api.get<InvoiceDetail>(`/api/invoices/${id}`);
      setDetail(data);
    } catch (e) {
      setError(apiMessage(e));
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  function payBadge(m: string) {
    if (m === 'CASH') return <span className="badge badge--muted">Tiền mặt</span>;
    if (m === 'BANK_TRANSFER') return <span className="badge badge--info">Chuyển khoản</span>;
    if (m === 'CARD') return <span className="badge badge--warn">Thẻ</span>;
    return <span className="badge badge--muted">{m}</span>;
  }

  return (
    <div>
      <PageHeader
        title="Hóa đơn"
        subtitle="Tạo sau CHECKED_OUT — xem chi tiết từ API. Không có sửa/xóa hóa đơn trên backend."
        actions={
          <button type="button" className="btn btn--ghost" onClick={() => void load()}>
            Làm mới
          </button>
        }
      />
      {success && <div className="alert alert--success">{success}</div>}
      {error && <div className="alert alert--error">{error}</div>}
      <div className="grid-2">
        <form className="card form-stack" onSubmit={onCreate}>
          <div className="card__head">
            <h3>Xuất hóa đơn</h3>
          </div>
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
          <button type="submit" className="btn btn--primary">
            Tạo hóa đơn
          </button>
        </form>
        <div className="card">
          <div className="card__head">
            <h3>Đã xuất</h3>
            <span className="muted" style={{ fontSize: '0.8rem' }}>
              {list.length} hóa đơn
            </span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Đặt phòng</th>
                  <th>Tổng</th>
                  <th>PTTT</th>
                  <th className="cell-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-hint">Chưa có hóa đơn.</div>
                    </td>
                  </tr>
                ) : (
                  list.map((i) => (
                    <tr key={i.id}>
                      <td>{i.id}</td>
                      <td>
                        <strong>#{i.bookingId}</strong>
                      </td>
                      <td>
                        <strong>{i.totalAmount.toLocaleString('vi-VN')} đ</strong>
                      </td>
                      <td>{payBadge(i.paymentMethod)}</td>
                      <td className="cell-actions">
                        <button type="button" className="btn btn--sm btn--ghost" onClick={() => void openDetail(i.id)}>
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={detailOpen} title="Chi tiết hóa đơn" onClose={() => setDetailOpen(false)} size="lg">
        {detailLoading && <p className="muted">Đang tải…</p>}
        {!detailLoading && detail && (
          <>
            <dl className="detail-grid">
              <dt>Số HĐ</dt>
              <dd>{detail.id}</dd>
              <dt>Đặt phòng</dt>
              <dd>#{detail.bookingId}</dd>
              <dt>Tiền phòng</dt>
              <dd>{detail.roomAmount.toLocaleString('vi-VN')} đ</dd>
              <dt>Dịch vụ</dt>
              <dd>{detail.serviceAmount.toLocaleString('vi-VN')} đ</dd>
              <dt>Tổng cộng</dt>
              <dd>
                <strong>{detail.totalAmount.toLocaleString('vi-VN')} đ</strong>
              </dd>
              <dt>Thanh toán</dt>
              <dd>{payBadge(detail.paymentMethod)}</dd>
              <dt>Thời điểm TT</dt>
              <dd>{new Date(detail.paidAt).toLocaleString('vi-VN')}</dd>
              {detail.note ? (
                <>
                  <dt>Ghi chú</dt>
                  <dd>{detail.note}</dd>
                </>
              ) : null}
              {detail.booking ? (
                <>
                  <dt>Trạng thái đặt</dt>
                  <dd>{detail.booking.statusCode ?? '—'}</dd>
                  <dt>Ở từ / đến</dt>
                  <dd>
                    {detail.booking.checkInDate ?? '—'} → {detail.booking.checkOutDate ?? '—'}
                  </dd>
                </>
              ) : null}
            </dl>
          </>
        )}
      </Modal>
    </div>
  );
}
