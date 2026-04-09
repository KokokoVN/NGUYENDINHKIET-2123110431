import { type FormEvent, useEffect, useState } from 'react';
import { api, apiMessage } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';

const ROOM_STATUSES = ['VACANT', 'OCCUPIED', 'DIRTY', 'CLEANING', 'OUT_OF_SERVICE'] as const;

type Hotel = { hotelId: number; hotelName: string };
type RoomType = { roomTypeId: number; roomTypeName: string; hotelId: number };
type Room = {
  roomId: number;
  hotelId: number;
  roomTypeId: number;
  roomNumber: string;
  floor?: string;
  statusCode: string;
};

export function RoomsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState(0);
  const [types, setTypes] = useState<RoomType[]>([]);
  const [roomTypeId, setRoomTypeId] = useState(0);
  const [list, setList] = useState<Room[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [eTypeId, setETypeId] = useState(0);
  const [eNum, setENum] = useState('');
  const [eFloor, setEFloor] = useState('');
  const [eStatus, setEStatus] = useState('VACANT');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);

  function flashSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  }

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await api.get<Hotel[]>('/api/hotels');
        setHotels(data);
        if (data.length) setHotelId(data[0].hotelId);
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, []);

  useEffect(() => {
    if (!hotelId) return;
    void (async () => {
      try {
        const { data } = await api.get<RoomType[]>(`/api/roomtypes?hotelId=${hotelId}`);
        setTypes(data);
        if (data.length) setRoomTypeId(data[0].roomTypeId);
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, [hotelId]);

  async function loadRooms() {
    const { data } = await api.get<Room[]>('/api/rooms');
    setList(data.filter((r) => r.hotelId === hotelId));
  }

  useEffect(() => {
    if (!hotelId) return;
    void (async () => {
      try {
        await loadRooms();
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, [hotelId]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      setError('');
      await api.post('/api/rooms', {
        hotelId,
        roomTypeId,
        roomNumber: roomNumber.trim(),
        floor: floor.trim() || null,
        statusCode: 'VACANT',
      });
      setRoomNumber('');
      setFloor('');
      await loadRooms();
      flashSuccess('Đã thêm phòng.');
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  function openEdit(r: Room) {
    setEditing(r);
    setETypeId(r.roomTypeId);
    setENum(r.roomNumber);
    setEFloor(r.floor ?? '');
    setEStatus(ROOM_STATUSES.includes(r.statusCode as (typeof ROOM_STATUSES)[number]) ? r.statusCode : 'VACANT');
    setEditOpen(true);
    setError('');
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      setSaving(true);
      setError('');
      await api.put(`/api/rooms/${editing.roomId}`, {
        roomTypeId: eTypeId,
        roomNumber: eNum.trim(),
        floor: eFloor.trim() || null,
        statusCode: eStatus,
      });
      setEditOpen(false);
      setEditing(null);
      await loadRooms();
      flashSuccess('Đã cập nhật phòng.');
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
      await api.delete(`/api/rooms/${deleteTarget.roomId}`);
      setDeleteTarget(null);
      await loadRooms();
      flashSuccess('Đã ngưng hoạt động phòng.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  function roomStatusBadge(code: string) {
    if (code === 'VACANT') return <span className="badge badge--ok">{code}</span>;
    if (code === 'OCCUPIED') return <span className="badge badge--warn">{code}</span>;
    if (code === 'DIRTY' || code === 'CLEANING') return <span className="badge badge--info">{code}</span>;
    return <span className="badge badge--muted">{code}</span>;
  }

  const typesForEdit = types.filter((t) => t.hotelId === hotelId);

  return (
    <div>
      <PageHeader
        title="Phòng"
        subtitle="Thêm / sửa / ngưng hoạt động — loại phòng phải thuộc đúng khách sạn."
        actions={
          <button type="button" className="btn btn--ghost" onClick={() => void loadRooms()}>
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
            <h3>Thêm phòng</h3>
          </div>
          <label>
            Loại phòng
            <select value={roomTypeId || ''} onChange={(e) => setRoomTypeId(Number(e.target.value))}>
              {types.map((t) => (
                <option key={t.roomTypeId} value={t.roomTypeId}>
                  {t.roomTypeName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Số phòng *
            <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} required />
          </label>
          <label>
            Tầng
            <input value={floor} onChange={(e) => setFloor(e.target.value)} />
          </label>
          <button type="submit" className="btn btn--primary" disabled={!types.length}>
            Lưu mới
          </button>
        </form>
        <div className="card">
          <div className="card__head">
            <h3>Danh sách</h3>
            <span className="muted" style={{ fontSize: '0.8rem' }}>
              {list.length} phòng
            </span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Số phòng</th>
                  <th>Tầng</th>
                  <th>Trạng thái</th>
                  <th className="cell-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-hint">Chưa có phòng cho khách sạn này.</div>
                    </td>
                  </tr>
                ) : (
                  list.map((r) => (
                    <tr key={r.roomId}>
                      <td>{r.roomId}</td>
                      <td>
                        <strong>{r.roomNumber}</strong>
                      </td>
                      <td>{r.floor ?? '—'}</td>
                      <td>{roomStatusBadge(r.statusCode)}</td>
                      <td className="cell-actions">
                        <button type="button" className="btn btn--sm btn--ghost" onClick={() => openEdit(r)}>
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="btn btn--sm btn--danger"
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
        title="Sửa phòng"
        onClose={() => !saving && setEditOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn--ghost" disabled={saving} onClick={() => setEditOpen(false)}>
              Đóng
            </button>
            <button type="submit" form="form-edit-room" className="btn btn--primary" disabled={saving}>
              {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </>
        }
      >
        <form id="form-edit-room" className="form-stack" onSubmit={onSaveEdit}>
          <label>
            Loại phòng
            <select value={eTypeId || ''} onChange={(e) => setETypeId(Number(e.target.value))}>
              {typesForEdit.map((t) => (
                <option key={t.roomTypeId} value={t.roomTypeId}>
                  {t.roomTypeName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Số phòng *
            <input value={eNum} onChange={(e) => setENum(e.target.value)} required />
          </label>
          <label>
            Tầng
            <input value={eFloor} onChange={(e) => setEFloor(e.target.value)} />
          </label>
          <label>
            Trạng thái
            <select value={eStatus} onChange={(e) => setEStatus(e.target.value)}>
              {ROOM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Ngưng hoạt động phòng?"
        message={
          deleteTarget
            ? `Phòng ${deleteTarget.roomNumber} sẽ ngưng hoạt động (trạng thái OUT_OF_SERVICE).`
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
