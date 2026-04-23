import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { api, apiMessage } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';

type Hotel = { hotelId: number; hotelName: string };
type RoomType = {
  roomTypeId: number;
  hotelId: number;
  roomTypeName: string;
  capacity: number;
  baseRate: number;
  description?: string;
  isActive: boolean;
};

export function RoomTypesPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState<number>(0);
  const [list, setList] = useState<RoomType[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(2);
  const [baseRate, setBaseRate] = useState(500000);
  const [description, setDescription] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<RoomType | null>(null);
  const [eName, setEName] = useState('');
  const [eCap, setECap] = useState(2);
  const [eRate, setERate] = useState(0);
  const [eDesc, setEDesc] = useState('');
  const [eActive, setEActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<RoomType | null>(null);
  const [deleting, setDeleting] = useState(false);

  function flashSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  }

  const loadHotels = useCallback(async () => {
    const { data } = await api.get<Hotel[]>('/api/hotels');
    setHotels(data);
    setHotelId((prev) => prev || data[0]?.hotelId || 0);
  }, []);

  const loadTypes = useCallback(async (hid: number) => {
    if (!hid) return;
    const { data } = await api.get<RoomType[]>(`/api/roomtypes?hotelId=${hid}`);
    setList(data);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadHotels();
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, [loadHotels]);

  useEffect(() => {
    if (!hotelId) return;
    void (async () => {
      try {
        await loadTypes(hotelId);
        setError('');
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, [hotelId, loadTypes]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!hotelId) return;
    try {
      setError('');
      await api.post('/api/roomtypes', {
        hotelId,
        roomTypeName: name.trim(),
        capacity,
        baseRate,
        description: description.trim() || null,
        isActive: true,
      });
      setName('');
      setDescription('');
      await loadTypes(hotelId);
      flashSuccess('Đã thêm loại phòng.');
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  function openEdit(r: RoomType) {
    setEditing(r);
    setEName(r.roomTypeName);
    setECap(r.capacity);
    setERate(r.baseRate);
    setEDesc(r.description ?? '');
    setEActive(r.isActive);
    setEditOpen(true);
    setError('');
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      setSaving(true);
      setError('');
      await api.put(`/api/roomtypes/${editing.roomTypeId}`, {
        roomTypeName: eName.trim(),
        capacity: eCap,
        baseRate: eRate,
        description: eDesc.trim() || null,
        isActive: eActive,
      });
      setEditOpen(false);
      setEditing(null);
      await loadTypes(hotelId);
      flashSuccess('Đã cập nhật loại phòng.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setError('');
      await api.delete(`/api/roomtypes/${deleteTarget.roomTypeId}`);
      setDeleteTarget(null);
      await loadTypes(hotelId);
      flashSuccess('Đã ngưng hoạt động loại phòng.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Loại phòng"
        actions={
          <button type="button" className="hm-btn hm-btn--ghost" onClick={() => hotelId && void loadTypes(hotelId)}>
            Làm mới
          </button>
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
      </div>
      <div className="grid-2">
        <form className="card form-stack" onSubmit={onCreate}>
          <div className="card__head">
            <h3>Thêm loại phòng</h3>
          </div>
          <label>
            Tên loại *
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Sức chứa
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />
          </label>
          <label>
            Giá cơ bản / đêm (đ)
            <input
              type="number"
              min={0}
              value={baseRate}
              onChange={(e) => setBaseRate(Number(e.target.value))}
            />
          </label>
          <label>
            Mô tả
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <button type="submit" className="hm-btn hm-btn--primary" disabled={!hotelId}>
            Lưu mới
          </button>
        </form>
        <div className="card">
          <div className="card__head">
            <h3>Danh sách</h3>
            <span className="muted" style={{ fontSize: '0.8rem' }}>
              {list.length} loại
            </span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên</th>
                  <th>Sức chứa</th>
                  <th>Giá / đêm</th>
                  <th className="cell-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-hint">Chọn khách sạn và thêm loại phòng.</div>
                    </td>
                  </tr>
                ) : (
                  list.map((r) => (
                    <tr key={r.roomTypeId}>
                      <td>{r.roomTypeId}</td>
                      <td>
                        <strong>{r.roomTypeName}</strong>
                        {r.description ? (
                          <div className="muted" style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                            {r.description}
                          </div>
                        ) : null}
                      </td>
                      <td>{r.capacity}</td>
                      <td>{r.baseRate.toLocaleString('vi-VN')} đ</td>
                      <td className="cell-actions">
                        <button type="button" className="hm-btn hm-btn--sm hm-btn--ghost" onClick={() => openEdit(r)}>
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="hm-btn hm-btn--sm hm-btn--danger"
                          onClick={() => setDeleteTarget(r)}
                        >
                          Ngưng HĐ
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

      <Modal
        open={editOpen}
        title="Sửa loại phòng"
        onClose={() => !saving && setEditOpen(false)}
        size="lg"
        footer={
          <>
            <button type="button" className="hm-btn hm-btn--ghost" disabled={saving} onClick={() => setEditOpen(false)}>
              Đóng
            </button>
            <button type="submit" form="form-edit-rt" className="hm-btn hm-btn--primary" disabled={saving}>
              {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </>
        }
      >
        <form id="form-edit-rt" className="form-stack" onSubmit={onSaveEdit}>
          <label>
            Tên loại *
            <input value={eName} onChange={(e) => setEName(e.target.value)} required />
          </label>
          <label>
            Sức chứa
            <input type="number" min={1} value={eCap} onChange={(e) => setECap(Number(e.target.value))} />
          </label>
          <label>
            Giá cơ bản / đêm
            <input type="number" min={0} value={eRate} onChange={(e) => setERate(Number(e.target.value))} />
          </label>
          <label>
            Mô tả
            <textarea rows={2} value={eDesc} onChange={(e) => setEDesc(e.target.value)} />
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={eActive} onChange={(e) => setEActive(e.target.checked)} />
            <span>Đang hoạt động</span>
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Ngưng hoạt động loại phòng?"
        message={
          deleteTarget
            ? `Loại «${deleteTarget.roomTypeName}» sẽ bị ngưng hoạt động. Cần không còn phòng nào đang dùng loại này.`
            : ''
        }
        confirmLabel="Ngưng hoạt động"
        danger
        loading={deleting}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
