import { type FormEvent, useEffect, useState } from 'react';
import { api, apiMessage } from '../api/client';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';

type Hotel = { hotelId: number; hotelName: string };
type ServiceItem = {
  hotelServiceId: number;
  hotelId: number;
  serviceCode: string;
  serviceName: string;
  defaultUnitPrice: number;
  isActive: boolean;
};

export function ServicesPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState<number>(0);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [list, setList] = useState<ServiceItem[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [serviceCode, setServiceCode] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [defaultUnitPrice, setDefaultUnitPrice] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [eName, setEName] = useState('');
  const [ePrice, setEPrice] = useState<number>(0);
  const [eActive, setEActive] = useState(true);

  function flashSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  }

  async function loadHotels() {
    const { data } = await api.get<Hotel[]>('/api/hotels');
    setHotels(data);
    if (data.length && !hotelId) setHotelId(data[0].hotelId);
  }

  async function load() {
    const params: Record<string, unknown> = { includeInactive };
    if (hotelId) params.hotelId = hotelId;
    const { data } = await api.get<ServiceItem[]>('/api/hotelservices', { params });
    setList(data);
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
  }, [hotelId, includeInactive]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!hotelId) return;
    try {
      setSaving(true);
      setError('');
      await api.post('/api/hotelservices', {
        hotelId,
        serviceCode: serviceCode.trim(),
        serviceName: serviceName.trim(),
        defaultUnitPrice,
        isActive,
      });
      setCreateOpen(false);
      setServiceCode('');
      setServiceName('');
      setDefaultUnitPrice(0);
      setIsActive(true);
      await load();
      flashSuccess('Đã tạo dịch vụ trong danh mục.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

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
            <button type="button" className="hm-btn hm-btn--primary" onClick={() => setCreateOpen(true)} disabled={!hotelId}>
              Thêm dịch vụ
            </button>
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
      </div>

      <div className="card">
        <div className="card__head">
          <h3>Danh sách</h3>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {list.length} dịch vụ
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

      <Modal
        open={createOpen}
        title="Thêm dịch vụ"
        onClose={() => !saving && setCreateOpen(false)}
        footer={
          <>
            <button type="button" className="hm-btn hm-btn--ghost" disabled={saving} onClick={() => setCreateOpen(false)}>
              Đóng
            </button>
            <button type="submit" form="form-create-service" className="hm-btn hm-btn--primary" disabled={saving}>
              {saving ? 'Đang lưu…' : 'Tạo'}
            </button>
          </>
        }
      >
        <form id="form-create-service" className="form-stack" onSubmit={onCreate}>
          <label>
            Mã dịch vụ *
            <input value={serviceCode} onChange={(e) => setServiceCode(e.target.value)} required placeholder="VD: LAUNDRY" />
          </label>
          <label>
            Tên dịch vụ *
            <input value={serviceName} onChange={(e) => setServiceName(e.target.value)} required placeholder="Giặt ủi" />
          </label>
          <label>
            Đơn giá mặc định (đ)
            <input
              type="number"
              min={0}
              value={defaultUnitPrice}
              onChange={(e) => setDefaultUnitPrice(Number(e.target.value))}
              required
            />
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span>Đang hoạt động</span>
          </label>
        </form>
      </Modal>

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

