import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiMessage } from '../api/client';
import { PageHeader } from '../components/PageHeader';

export type Payment = {
  paymentId: number;
  stayId?: number | null;
  reservationId?: number | null;
  paymentType: string;
  methodCode: string;
  amount: number;
  statusCode: string;
  referenceNo?: string | null;
  note?: string | null;
};

export function PaymentsPage() {
  const [list, setList] = useState<Payment[]>([]);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await api.get<Payment[]>('/api/payments');
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

  return (
    <div>
      <PageHeader title="Thanh toán" actions={<button type="button" className="hm-btn hm-btn--ghost" onClick={() => void load()}>Làm mới</button>} />
      {error && <div className="alert alert--error">{error}</div>}
      <div className="card">
        <div className="card__head"><h3>Danh sách thanh toán</h3></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>ID</th><th>Loại</th><th>Phương thức</th><th>Số tiền</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={5}><div className="empty-hint">Chưa có thanh toán.</div></td></tr> : list.map((p) => (
                <tr key={p.paymentId}>
                  <td>{p.paymentId}</td><td>{p.paymentType}</td><td>{p.methodCode}</td><td>{p.amount.toLocaleString('vi-VN')} đ</td><td>{p.statusCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '1rem' }}><Link to="/invoices/new" className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>Tạo hóa đơn / thanh toán</Link></div>
      </div>
    </div>
  );
}
