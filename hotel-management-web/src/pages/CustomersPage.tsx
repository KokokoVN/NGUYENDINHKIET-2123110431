import { type FormEvent, useEffect, useState } from 'react';
import { api, apiMessage } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';

type Customer = {
  customerId: number;
  customerType: string;
  fullName?: string;
  companyName?: string;
  taxCode?: string;
  phone?: string;
  email?: string;
  notes?: string;
  loyaltyPoints?: number;
  loyaltyTier?: string;
};

export function CustomersPage() {
  const [list, setList] = useState<Customer[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customerType, setCustomerType] = useState('INDIVIDUAL');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [eType, setEType] = useState('INDIVIDUAL');
  const [eFull, setEFull] = useState('');
  const [eCompany, setECompany] = useState('');
  const [eTax, setETax] = useState('');
  const [ePhone, setEPhone] = useState('');
  const [eEmail, setEEmail] = useState('');
  const [eNotes, setENotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  function flashSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  }

  async function load() {
    const { data } = await api.get<Customer[]>('/api/customers');
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
      await api.post('/api/customers', {
        customerType,
        fullName: fullName.trim() || null,
        companyName: companyName.trim() || null,
        taxCode: taxCode.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      });
      setFullName('');
      setCompanyName('');
      setTaxCode('');
      setPhone('');
      setEmail('');
      setNotes('');
      await load();
      flashSuccess('Đã thêm khách hàng.');
    } catch (err) {
      setError(apiMessage(err));
    }
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setEType(c.customerType);
    setEFull(c.fullName ?? '');
    setECompany(c.companyName ?? '');
    setETax(c.taxCode ?? '');
    setEPhone(c.phone ?? '');
    setEEmail(c.email ?? '');
    setENotes(c.notes ?? '');
    setEditOpen(true);
    setError('');
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      setSaving(true);
      setError('');
      await api.put(`/api/customers/${editing.customerId}`, {
        customerType: eType,
        fullName: eFull.trim() || null,
        companyName: eCompany.trim() || null,
        taxCode: eTax.trim() || null,
        phone: ePhone.trim() || null,
        email: eEmail.trim() || null,
        notes: eNotes.trim() || null,
      });
      setEditOpen(false);
      setEditing(null);
      await load();
      flashSuccess('Đã cập nhật khách hàng.');
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
      await api.delete(`/api/customers/${deleteTarget.customerId}`);
      setDeleteTarget(null);
      await load();
      flashSuccess('Đã xóa mềm khách hàng.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  function tierBadge(tier?: string) {
    const x = tier || 'BRONZE';
    if (x === 'PLATINUM') return <span className="badge badge--ok">{x}</span>;
    if (x === 'GOLD') return <span className="badge badge--warn">{x}</span>;
    if (x === 'SILVER') return <span className="badge badge--info">{x}</span>;
    return <span className="badge badge--muted">{x}</span>;
  }

  function typeLabel(t: string) {
    if (t === 'COMPANY') return 'Công ty';
    if (t === 'AGENCY') return 'Đại lý';
    return 'Cá nhân';
  }

  return (
    <div>
      <PageHeader
        title="Khách hàng"
        subtitle="Hồ sơ, sửa, xóa mềm — điểm/hạng cập nhật khi xuất hóa đơn (theo quy tắc API)."
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
            <h3>Thêm khách</h3>
          </div>
          <label>
            Loại
            <select value={customerType} onChange={(e) => setCustomerType(e.target.value)}>
              <option value="INDIVIDUAL">Cá nhân</option>
              <option value="COMPANY">Công ty</option>
              <option value="AGENCY">Đại lý</option>
            </select>
          </label>
          {customerType === 'INDIVIDUAL' ? (
            <label>
              Họ tên *
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </label>
          ) : (
            <label>
              Tên công ty *
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </label>
          )}
          <label>
            MST / Mã số thuế
            <input value={taxCode} onChange={(e) => setTaxCode(e.target.value)} />
          </label>
          <label>
            SĐT
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Ghi chú
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <button type="submit" className="btn btn--primary">
            Lưu mới
          </button>
        </form>
        <div className="card">
          <div className="card__head">
            <h3>Danh sách</h3>
            <span className="muted" style={{ fontSize: '0.8rem' }}>
              {list.length} khách
            </span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên / Loại</th>
                  <th>SĐT</th>
                  <th>Điểm</th>
                  <th>Hạng</th>
                  <th className="cell-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-hint">Chưa có khách hàng.</div>
                    </td>
                  </tr>
                ) : (
                  list.map((c) => (
                    <tr key={c.customerId}>
                      <td>{c.customerId}</td>
                      <td>
                        <strong>{c.fullName || c.companyName || '—'}</strong>
                        <div className="muted" style={{ fontSize: '0.72rem', marginTop: '0.15rem' }}>
                          {typeLabel(c.customerType)}
                        </div>
                      </td>
                      <td>{c.phone ?? '—'}</td>
                      <td>{c.loyaltyPoints ?? 0}</td>
                      <td>{tierBadge(c.loyaltyTier)}</td>
                      <td className="cell-actions">
                        <button type="button" className="btn btn--sm btn--ghost" onClick={() => openEdit(c)}>
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="btn btn--sm btn--danger"
                          onClick={() => setDeleteTarget(c)}
                        >
                          Xóa
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
        title="Sửa khách hàng"
        onClose={() => !saving && setEditOpen(false)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn--ghost" disabled={saving} onClick={() => setEditOpen(false)}>
              Đóng
            </button>
            <button type="submit" form="form-edit-cust" className="btn btn--primary" disabled={saving}>
              {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </>
        }
      >
        <form id="form-edit-cust" className="form-stack" onSubmit={onSaveEdit}>
          <label>
            Loại
            <select value={eType} onChange={(e) => setEType(e.target.value)}>
              <option value="INDIVIDUAL">Cá nhân</option>
              <option value="COMPANY">Công ty</option>
              <option value="AGENCY">Đại lý</option>
            </select>
          </label>
          {eType === 'INDIVIDUAL' ? (
            <label>
              Họ tên *
              <input value={eFull} onChange={(e) => setEFull(e.target.value)} required />
            </label>
          ) : (
            <label>
              Tên công ty *
              <input value={eCompany} onChange={(e) => setECompany(e.target.value)} required />
            </label>
          )}
          <label>
            MST
            <input value={eTax} onChange={(e) => setETax(e.target.value)} />
          </label>
          <label>
            SĐT
            <input value={ePhone} onChange={(e) => setEPhone(e.target.value)} />
          </label>
          <label>
            Email
            <input type="email" value={eEmail} onChange={(e) => setEEmail(e.target.value)} />
          </label>
          <label>
            Ghi chú
            <textarea rows={2} value={eNotes} onChange={(e) => setENotes(e.target.value)} />
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa mềm khách hàng?"
        message={
          deleteTarget
            ? `Khách «${deleteTarget.fullName || deleteTarget.companyName || '#' + deleteTarget.customerId}» sẽ bị ẩn khỏi danh sách (soft delete).`
            : ''
        }
        confirmLabel="Xóa mềm"
        danger
        loading={deleting}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
