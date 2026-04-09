import { useEffect, useState } from 'react';
import { api, apiMessage } from '../api/client';
import { PageHeader } from '../components/PageHeader';

type Dashboard = {
  period: { fromUtc: string; toUtc: string };
  rooms: {
    totalActive: number;
    vacant: number;
    occupied: number;
    byStatus: { status: string; count: number }[];
  };
  bookings: { byStatus: { status: string; count: number }[] };
  invoices: { count: number; revenueTotal: number };
  topServices: { serviceCode: string; lines: number; amount: number }[];
};

export function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: d } = await api.get<Dashboard>('/api/reports/dashboard');
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setError(apiMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <div className="alert alert--error">{error}</div>;
  if (!data)
    return (
      <>
        <PageHeader title="Tổng quan" subtitle="Báo cáo nhanh hệ thống." />
        <p className="muted">Đang tải báo cáo…</p>
      </>
    );

  const periodLabel = `${new Date(data.period.fromUtc).toLocaleDateString('vi-VN')} — ${new Date(data.period.toUtc).toLocaleDateString('vi-VN')}`;

  return (
    <div>
      <PageHeader title="Tổng quan" subtitle={`Kỳ thống kê: ${periodLabel} · Doanh thu & phòng theo API /reports/dashboard.`} />
      <div className="grid-stats">
        <div className="card stat">
          <span className="stat__icon" aria-hidden>
            🏨
          </span>
          <div className="stat__label">Phòng hoạt động</div>
          <div className="stat__value">{data.rooms.totalActive}</div>
        </div>
        <div className="card stat">
          <span className="stat__icon" aria-hidden>
            ✅
          </span>
          <div className="stat__label">Phòng trống</div>
          <div className="stat__value stat__value--ok">{data.rooms.vacant}</div>
        </div>
        <div className="card stat">
          <span className="stat__icon" aria-hidden>
            🛎️
          </span>
          <div className="stat__label">Đang có khách</div>
          <div className="stat__value">{data.rooms.occupied}</div>
        </div>
        <div className="card stat">
          <span className="stat__icon" aria-hidden>
            💰
          </span>
          <div className="stat__label">Doanh thu hóa đơn</div>
          <div className="stat__value">{data.invoices.revenueTotal.toLocaleString('vi-VN')} đ</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <h3>Đặt phòng theo trạng thái</h3>
          <ul className="list-plain">
            {data.bookings.byStatus.map((x) => (
              <li key={x.status}>
                <span className="badge badge--info">{x.status}</span>
                <span>{x.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>Top dịch vụ</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Số dòng</th>
                  <th>Tiền</th>
                </tr>
              </thead>
              <tbody>
                {data.topServices.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="muted" style={{ textAlign: 'center' }}>
                      Chưa có dữ liệu
                    </td>
                  </tr>
                ) : (
                  data.topServices.map((x) => (
                    <tr key={x.serviceCode}>
                      <td>
                        <span className="badge badge--muted">{x.serviceCode}</span>
                      </td>
                      <td>{x.lines}</td>
                      <td>{x.amount.toLocaleString('vi-VN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
