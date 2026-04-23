import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { api, apiMessage } from '../api/client';

type ServiceOrder = {
  serviceOrderId: number;
  bookingId?: number | null;
  stayId?: number | null;
  serviceCode: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  statusCode: string;
};

export function ServiceOrdersPage() {
  const [list, setList] = useState<ServiceOrder[]>([]);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await api.get<ServiceOrder[]>('/api/serviceorders');
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
      <PageHeader title="Dịch vụ sử dụng" actions={<button type="button" className="hm-btn hm-btn--ghost" onClick={() => void load()}>Làm mới</button>} />
      {error && <div className="alert alert--error">{error}</div>}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>ID</th><th>Mã DV</th><th>Số lượng</th><th>Đơn giá</th><th>Tổng</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={6}><div className="empty-hint">Chưa có dữ liệu.</div></td></tr> : list.map((x) => (
                <tr key={x.serviceOrderId}><td>{x.serviceOrderId}</td><td>{x.serviceCode}</td><td>{x.quantity}</td><td>{x.unitPrice.toLocaleString('vi-VN')} đ</td><td>{x.totalAmount.toLocaleString('vi-VN')} đ</td><td>{x.statusCode}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
