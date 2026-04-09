import { type FormEvent, useEffect, useState } from 'react';
import { api, apiMessage } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';

type Hotel = {
  hotelId: number;
  hotelName: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
};

export function HotelsPage() {
  const [list, setList] = useState<Hotel[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Hotel | null>(null);
  const [eName, setEName] = useState('');
  const [eAddress, setEAddress] = useState('');
  const [ePhone, setEPhone] = useState('');
  const [eEmail, setEEmail] = useState('');
  const [eActive, setEActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Hotel | null>(null);
  const [deleting, setDeleting] = useState(false);

  function flashSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  }

  async function load() {
    try {
      const { data } = await api.get<Hotel[]>('/api/hotels');
      setList(data);
      setError('');
    } catch (e) {
      setError(apiMessage(e));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      setError('');
      await api.post('/api/hotels', {
        hotelName: hotelName.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        isActive: true,
      });
      setHotelName('');
      setAddress('');
      setPhone('');
      setEmail('');
      await load();
      flashSuccess('Đã thêm khách sạn.');
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  function openEdit(h: Hotel) {
    setEditing(h);
    setEName(h.hotelName);
    setEAddress(h.address ?? '');
    setEPhone(h.phone ?? '');
    setEEmail(h.email ?? '');
    setEActive(h.isActive);
    setEditOpen(true);
    setError('');
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      setSaving(true);
      setError('');
      await api.put(`/api/hotels/${editing.hotelId}`, {
        hotelName: eName.trim(),
        address: eAddress.trim() || null,
        phone: ePhone.trim() || null,
        email: eEmail.trim() || null,
        isActive: eActive,
      });
      setEditOpen(false);
      setEditing(null);
      await load();
      flashSuccess('Đã cập nhật khách sạn.');
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
      await api.delete(`/api/hotels/${deleteTarget.hotelId}`);
      setDeleteTarget(null);
      await load();
      flashSuccess('Đã ngưng hoạt động khách sạn.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Khách sạn"
        subtitle="Thêm / sửa / ngưng hoạt động (xóa mềm) — ADMIN hoặc Lễ tân."
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
            <h3>Thêm khách sạn</h3>
          </div>
          <label>
            Tên *
            <input value={hotelName} onChange={(e) => setHotelName(e.target.value)} required />
          </label>
          <label>
            Địa chỉ
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <label>
            SĐT
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button type="submit" className="btn btn--primary">
            Lưu mới
          </button>
        </form>
        <div className="card">
          <div className="card__head">
            <h3>Danh sách</h3>
            <span className="muted" style={{ fontSize: '0.8rem' }}>
              {list.length} khách sạn
            </span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên</th>
                  <th>SĐT</th>
                  <th>Trạng thái</th>
                  <th className="cell-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-hint">Chưa có khách sạn. Thêm ở cột trái.</div>
                    </td>
                  </tr>
                ) : (
                  list.map((h) => (
                    <tr key={h.hotelId}>
                      <td>{h.hotelId}</td>
                      <td>
                        <strong>{h.hotelName}</strong>
                        {h.address ? (
                          <div className="muted" style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                            {h.address}
                          </div>
                        ) : null}
                      </td>
                      <td>{h.phone ?? '—'}</td>
                      <td>
                        {h.isActive ? (
                          <span className="badge badge--ok">Hoạt động</span>
                        ) : (
                          <span className="badge badge--muted">Ngưng</span>
                        )}
                      </td>
                      <td className="cell-actions">
                        <button type="button" className="btn btn--sm btn--ghost" onClick={() => openEdit(h)}>
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="btn btn--sm btn--danger"
                          onClick={() => setDeleteTarget(h)}
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
        title="Sửa khách sạn"
        onClose={() => !saving && setEditOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn--ghost" disabled={saving} onClick={() => setEditOpen(false)}>
              Đóng
            </button>
            <button type="submit" form="form-edit-hotel" className="btn btn--primary" disabled={saving}>
              {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </>
        }
      >
        <form id="form-edit-hotel" className="form-stack" onSubmit={onSaveEdit}>
          <label>
            Tên *
            <input value={eName} onChange={(e) => setEName(e.target.value)} required />
          </label>
          <label>
            Địa chỉ
            <input value={eAddress} onChange={(e) => setEAddress(e.target.value)} />
          </label>
          <label>
            SĐT
            <input value={ePhone} onChange={(e) => setEPhone(e.target.value)} />
          </label>
          <label>
            Email
            <input type="email" value={eEmail} onChange={(e) => setEEmail(e.target.value)} />
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={eActive} onChange={(e) => setEActive(e.target.checked)} />
            <span>Đang hoạt động</span>
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Ngưng hoạt động khách sạn?"
        message={
          deleteTarget
            ? `Khách sạn «${deleteTarget.hotelName}» sẽ bị đánh dấu ngưng hoạt động. Chỉ thực hiện được khi không còn phòng/loại phòng đang hoạt động.`
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
