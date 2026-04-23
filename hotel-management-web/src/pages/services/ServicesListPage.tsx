import { type FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiMessage, emitToast } from '../../api/client';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';

type Hotel = { hotelId: number; hotelName: string };
type ServiceItem = {
  hotelServiceId: number;
  hotelId: number;
  serviceCode: string;
  serviceName: string;
  defaultUnitPrice: number;
  isActive: boolean;
};
type Paged<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export function ServicesListPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState<number>(0);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [search, setSearch] = useState('');
  const [list, setList] = useState<ServiceItem[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [eName, setEName] = useState('');
  const [ePrice, setEPrice] = useState<number>(0);
  const [eActive, setEActive] = useState(true);

  function flashSuccess(msg: string) {
    setSuccess(msg);
    emitToast('success', msg);
    setTimeout(() => setSuccess(''), 4000);
  }

  async function loadHotels() {
    const { data } = await api.get<Hotel[]>('/api/hotels');
    setHotels(data);
    if (data.length && !hotelId) setHotelId(data[0].hotelId);
  }

  async function load(targetPage = 1) {
    const params: Record<string, unknown> = { includeInactive };
    if (hotelId) params.hotelId = hotelId;
    if (search.trim()) params.search = search.trim();
    params.page = targetPage;
    params.pageSize = pageSize;
    const { data } = await api.get<Paged<ServiceItem>>('/api/hotelservices', { params });
    setList(data.items);
    setPage(data.page);
    setTotalItems(data.totalItems);
    setTotalPages(data.totalPages);
  }

  useEffect(() => {
    void (async () => {
      try {
        await loadHotels();
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hotelId) return;
    void (async () => {
      try {
        await load();
        setError('');
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, includeInactive, search]);

  function openEdit(x: ServiceItem) {
    setEditing(x);
    setEName(x.serviceName);
    setEPrice(x.defaultUnitPrice);
    setEActive(x.isActive);
    setEditOpen(true);
    setError('');
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      setSaving(true);
      setError('');
      await api.put(`/api/hotelservices/${editing.hotelServiceId}`, {
        serviceName: eName.trim(),
        defaultUnitPrice: ePrice,
        isActive: eActive,
      });
      setEditOpen(false);
      setEditing(null);
      await load();
      flashSuccess('Đã cập nhật dịch vụ.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Danh mục dịch vụ"
        subtitle="Dịch vụ theo từng khách sạn. Chỉ quản trị viên hoặc quản lý được thêm và chỉnh sửa."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="hm-btn hm-btn--ghost" onClick={() => void load()}>
              Làm mới
            </button>
            <Link to="/services/new" className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>
              Thêm dịch vụ
            </Link>
          </div>
        }
      />
      {success && <div className="alert alert--success">{success}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      <div className="card card--toolbar form-inline">
        <label>
          Khách sạn
          <select value={hotelId || ''} onChange={(e) => setHotelId(Number(e.target.value))}>
            {hotels.map((h) => (
              <option key={h.hotelId} value={h.hotelId}>
                {h.hotelName}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
          <span>Hiện cả dịch vụ ngưng hoạt động</span>
        </label>
        <label>
          Tìm kiếm
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mã hoặc tên dịch vụ" />
        </label>
      </div>

      <div className="card">
        <div className="card__head">
          <h3>Danh sách</h3>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {totalItems} dịch vụ
          </span>
        </div>
        <div className="table-wrap table-wrap--tall">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Mã dịch vụ</th>
                <th>Tên</th>
                <th>Giá gợi ý</th>
                <th>Trạng thái</th>
                <th className="cell-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-hint">Chưa có dịch vụ cho khách sạn này.</div>
                  </td>
                </tr>
              ) : (
                list.map((x) => (
                  <tr key={x.hotelServiceId}>
                    <td>{x.hotelServiceId}</td>
                    <td>
                      <span className="badge badge--muted">{x.serviceCode}</span>
                    </td>
                    <td>
                      <strong>{x.serviceName}</strong>
                    </td>
                    <td>{Number(x.defaultUnitPrice).toLocaleString('vi-VN')} đ</td>
                    <td>{x.isActive ? <span className="badge badge--ok">Đang hoạt động</span> : <span className="badge badge--muted">Ngưng hoạt động</span>}</td>
                    <td className="cell-actions">
                      <Link
                        to={`/services/${x.hotelServiceId}`}
                        className="hm-btn hm-btn--sm hm-btn--ghost"
                        style={{ textDecoration: 'none' }}
                      >
                        Xem
                      </Link>
                      <button type="button" className="hm-btn hm-btn--sm hm-btn--ghost" onClick={() => openEdit(x)}>
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={(p) => void load(p)} />

      <Modal
        open={editOpen}
        title="Sửa dịch vụ"
        onClose={() => !saving && setEditOpen(false)}
        footer={
          <>
            <button type="button" className="hm-btn hm-btn--ghost" disabled={saving} onClick={() => setEditOpen(false)}>
              Đóng
            </button>
            <button type="submit" form="form-edit-service" className="hm-btn hm-btn--primary" disabled={saving}>
              {saving ? 'Đang lưu…' : 'Lưu'}
            </button>
          </>
        }
      >
        <form id="form-edit-service" className="form-stack" onSubmit={onSaveEdit}>
          <div className="muted" style={{ fontSize: '0.88rem' }}>
            Code không sửa trên API. Đang sửa: <strong>{editing?.serviceCode}</strong>
          </div>
          <label>
            Tên dịch vụ *
            <input value={eName} onChange={(e) => setEName(e.target.value)} required />
          </label>
          <label>
            Đơn giá mặc định (đ)
            <input type="number" min={0} value={ePrice} onChange={(e) => setEPrice(Number(e.target.value))} required />
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={eActive} onChange={(e) => setEActive(e.target.checked)} />
            <span>Đang hoạt động</span>
          </label>
        </form>
      </Modal>
    </div>
  );
}

