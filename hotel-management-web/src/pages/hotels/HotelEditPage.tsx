import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { normalizePhone, normalizeText, validateAddress, validateEmail, validateNameLike, validatePhone } from '../../utils/formValidation';

type Hotel = {
  hotelId: number;
  hotelName: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
};

export function HotelEditPage() {
  const params = useParams();
  const id = Number(params.id);
  const navigate = useNavigate();

  const [data, setData] = useState<Hotel | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [hotelName, setHotelName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fieldHints, setFieldHints] = useState<Record<string, string>>({});

  const validateLocalField = useCallback((field: 'hotelName' | 'address' | 'phone' | 'email', value?: string) => {
    if (field === 'hotelName') return validateNameLike(value ?? hotelName, 'Tên khách sạn');
    if (field === 'address') return validateAddress(value ?? address);
    if (field === 'phone') return validatePhone(value ?? phone);
    return validateEmail(value ?? email);
  }, [hotelName, address, phone, email]);

  function handleBlur(field: 'hotelName' | 'address' | 'phone' | 'email') {
    const msg = validateLocalField(field);
    setFieldErrors((prev) => ({ ...prev, [field]: msg || prev[field] || '' }));
  }

  useEffect(() => {
    if (!id) return;
    const timer = setTimeout(async () => {
      const normalizedName = normalizeText(hotelName).toLowerCase();
      const normalizedPhone = normalizePhone(phone);
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedName && !normalizedPhone && !normalizedEmail) {
        setFieldHints({});
        return;
      }

      const localNameErr = validateLocalField('hotelName');
      const localPhoneErr = validateLocalField('phone');
      const localEmailErr = validateLocalField('email');
      if (localNameErr || localPhoneErr || localEmailErr) {
        setFieldHints({});
        return;
      }

      try {
        const { data } = await api.get<Hotel[]>('/api/hotels', {
          params: { includeInactive: true },
        });
        const others = data.filter((h) => h.hotelId !== id);

        setFieldErrors((prev) => {
          const next = { ...prev };
          const dupName = others.some((h) => normalizeText(h.hotelName).toLowerCase() === normalizedName);
          const dupPhone = !!(normalizedPhone && others.some((h) => normalizePhone(h.phone ?? '') === normalizedPhone));
          const dupEmail = !!(normalizedEmail && others.some((h) => (h.email ?? '').trim().toLowerCase() === normalizedEmail));
          next.hotelName = dupName ? 'Tên khách sạn đã tồn tại.' : '';
          next.phone = dupPhone ? 'Số điện thoại đã tồn tại.' : '';
          next.email = dupEmail ? 'Email đã tồn tại.' : '';
          return next;
        });
        setFieldHints({
          hotelName: normalizedName ? (others.some((h) => normalizeText(h.hotelName).toLowerCase() === normalizedName) ? '' : 'Có thể sử dụng.') : '',
          phone: normalizedPhone ? (others.some((h) => normalizePhone(h.phone ?? '') === normalizedPhone) ? '' : 'Có thể sử dụng.') : '',
          email: normalizedEmail ? (others.some((h) => (h.email ?? '').trim().toLowerCase() === normalizedEmail) ? '' : 'Có thể sử dụng.') : '',
        });
      } catch {
        // Ignore realtime duplicate check errors while typing.
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [id, hotelName, phone, email, validateLocalField]);

  async function validateForm() {
    const nextErrors: Record<string, string> = {};
    const hotelNameErr = validateNameLike(hotelName, 'Tên khách sạn');
    const phoneErr = validatePhone(phone);
    const emailErr = validateEmail(email);
    const addressErr = validateAddress(address);
    if (hotelNameErr) nextErrors.hotelName = hotelNameErr;
    if (phoneErr) nextErrors.phone = phoneErr;
    if (emailErr) nextErrors.email = emailErr;
    if (addressErr) nextErrors.address = addressErr;

    if (!Object.keys(nextErrors).length) {
      const { data } = await api.get<Hotel[]>('/api/hotels', {
        params: { includeInactive: true },
      });
      const normalizedName = normalizeText(hotelName).toLowerCase();
      const normalizedPhone = normalizePhone(phone);
      const normalizedEmail = email.trim().toLowerCase();
      const others = data.filter((h) => h.hotelId !== id);

      if (others.some((h) => normalizeText(h.hotelName).toLowerCase() === normalizedName))
        nextErrors.hotelName = 'Tên khách sạn đã tồn tại.';
      if (normalizedPhone && others.some((h) => normalizePhone(h.phone ?? '') === normalizedPhone))
        nextErrors.phone = 'Số điện thoại đã tồn tại.';
      if (normalizedEmail && others.some((h) => (h.email ?? '').trim().toLowerCase() === normalizedEmail))
        nextErrors.email = 'Email đã tồn tại.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const { data } = await api.get<Hotel>(`/api/hotels/${id}`, { params: { includeInactive: true } });
        setData(data);
        setHotelName(data.hotelName);
        setAddress(data.address ?? '');
        setPhone(data.phone ?? '');
        setEmail(data.email ?? '');
        setIsActive(!!data.isActive);
        setError('');
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, [id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      setSaving(true);
      setError('');
      if (!(await validateForm())) return;
      await api.put(`/api/hotels/${id}`, {
        hotelName: hotelName.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        isActive,
      });
      navigate(`/hotels/${id}`, { replace: true });
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Sửa khách sạn"
        subtitle={data ? `Mã khách sạn: ${data.hotelId}` : 'Đang tải…'}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/hotels" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
              ← Danh sách
            </Link>
            {id ? (
              <Link to={`/hotels/${id}`} className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
                Xem
              </Link>
            ) : null}
          </div>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}
      {!error && !data && <p className="muted">Đang tải…</p>}

      {data && (
        <form className="card form-stack" onSubmit={onSubmit}>
          <label>
            Tên *
            <input
              value={hotelName}
              onChange={(e) => {
                const v = e.target.value;
                setHotelName(v);
                setFieldErrors((prev) => {
                  const localErr = validateLocalField('hotelName', v);
                  return { ...prev, hotelName: localErr || prev.hotelName || '' };
                });
              }}
              onBlur={() => handleBlur('hotelName')}
              required
            />
            {fieldErrors.hotelName && <div className="field-error">{fieldErrors.hotelName}</div>}
            {!fieldErrors.hotelName && fieldHints.hotelName && <div className="field-success">{fieldHints.hotelName}</div>}
          </label>
          <label>
            Địa chỉ
            <input
              value={address}
              onChange={(e) => {
                const v = e.target.value;
                setAddress(v);
                setFieldErrors((prev) => {
                  const localErr = validateLocalField('address', v);
                  return { ...prev, address: localErr || prev.address || '' };
                });
              }}
              onBlur={() => handleBlur('address')}
            />
            {fieldErrors.address && <div className="field-error">{fieldErrors.address}</div>}
          </label>
          <div className="grid-2">
            <label>
              SĐT
              <input
                value={phone}
                onChange={(e) => {
                  const v = e.target.value;
                  setPhone(v);
                  setFieldErrors((prev) => {
                    const localErr = validateLocalField('phone', v);
                    return { ...prev, phone: localErr || prev.phone || '' };
                  });
                }}
                onBlur={() => handleBlur('phone')}
              />
              {fieldErrors.phone && <div className="field-error">{fieldErrors.phone}</div>}
              {!fieldErrors.phone && fieldHints.phone && <div className="field-success">{fieldHints.phone}</div>}
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  const v = e.target.value;
                  setEmail(v);
                  setFieldErrors((prev) => {
                    const localErr = validateLocalField('email', v);
                    return { ...prev, email: localErr || prev.email || '' };
                  });
                }}
                onBlur={() => handleBlur('email')}
              />
              {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
              {!fieldErrors.email && fieldHints.email && <div className="field-success">{fieldHints.email}</div>}
            </label>
          </div>
          <label className="checkbox-row">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span>Đang hoạt động</span>
          </label>
          <button type="submit" className={'hm-btn hm-btn--primary' + (saving ? ' hm-btn--loading' : '')} disabled={saving}>
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </form>
      )}
    </div>
  );
}

