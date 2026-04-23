import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { api, apiMessage } from '../api/client';

type Stay = {
  stayId: number;
  bookingId?: number | null;
  roomId?: number | null;
  checkInAtUtc?: string | null;
  checkOutAtUtc?: string | null;
  statusCode: string;
};

export function StaysPage() {
  const [list, setList] = useState<Stay[]>([]);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await api.get<Stay[]>('/api/stays');
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
      <PageHeader title="Lưu trú" actions={<button type="button" className="hm-btn hm-btn--ghost" onClick={() => void load()}>Làm mới</button>} />
      {error && <div className="alert alert--error">{error}</div>}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>ID</th><th>Đặt phòng</th><th>Phòng</th><th>Check-in</th><th>Check-out</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={6}><div className="empty-hint">Chưa có lượt lưu trú.</div></td></tr> : list.map((x) => (
                <tr key={x.stayId}><td>{x.stayId}</td><td>{x.bookingId ?? '-'}</td><td>{x.roomId ?? '-'}</td><td>{x.checkInAtUtc ? new Date(x.checkInAtUtc).toLocaleString('vi-VN') : '-'}</td><td>{x.checkOutAtUtc ? new Date(x.checkOutAtUtc).toLocaleString('vi-VN') : '-'}</td><td>{x.statusCode}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
