import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { normalizePhone, normalizeText, validateAddress, validateEmail, validateNameLike, validatePhone } from '../../utils/formValidation';

type Hotel = {
  hotelId: number;
  hotelName: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
};

export function HotelNewPage() {
  const navigate = useNavigate();
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

        setFieldErrors((prev) => {
          const next = { ...prev };
          const dupName = data.some((h) => normalizeText(h.hotelName).toLowerCase() === normalizedName);
          const dupPhone = !!(normalizedPhone && data.some((h) => normalizePhone(h.phone ?? '') === normalizedPhone));
          const dupEmail = !!(normalizedEmail && data.some((h) => (h.email ?? '').trim().toLowerCase() === normalizedEmail));
          next.hotelName = dupName ? 'Tên khách sạn đã tồn tại.' : '';
          next.phone = dupPhone ? 'Số điện thoại đã tồn tại.' : '';
          next.email = dupEmail ? 'Email đã tồn tại.' : '';
          return next;
        });
        setFieldHints({
          hotelName: normalizedName ? (data.some((h) => normalizeText(h.hotelName).toLowerCase() === normalizedName) ? '' : 'Có thể sử dụng.') : '',
          phone: normalizedPhone ? (data.some((h) => normalizePhone(h.phone ?? '') === normalizedPhone) ? '' : 'Có thể sử dụng.') : '',
          email: normalizedEmail ? (data.some((h) => (h.email ?? '').trim().toLowerCase() === normalizedEmail) ? '' : 'Có thể sử dụng.') : '',
        });
      } catch {
        // Ignore realtime duplicate check errors to avoid noisy UX while typing.
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [hotelName, phone, email, validateLocalField]);

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

      if (data.some((h) => normalizeText(h.hotelName).toLowerCase() === normalizedName))
        nextErrors.hotelName = 'Tên khách sạn đã tồn tại.';
      if (normalizedPhone && data.some((h) => normalizePhone(h.phone ?? '') === normalizedPhone))
        nextErrors.phone = 'Số điện thoại đã tồn tại.';
      if (normalizedEmail && data.some((h) => (h.email ?? '').trim().toLowerCase() === normalizedEmail))
        nextErrors.email = 'Email đã tồn tại.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      if (!(await validateForm())) return;
      const { data } = await api.post<{ hotelId: number }>('/api/hotels', {
        hotelName: hotelName.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        isActive,
      });
      navigate(`/hotels/${data.hotelId}`, { replace: true });
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Thêm khách sạn"
        subtitle="Nhập thông tin cơ sở lưu trú mới."
        actions={
          <Link to="/hotels" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
            ← Danh sách
          </Link>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}

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
          {saving ? 'Đang lưu…' : 'Tạo khách sạn'}
        </button>
      </form>
    </div>
  );
}

