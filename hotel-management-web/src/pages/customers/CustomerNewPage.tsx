import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { normalizePhone, normalizeText, validateEmail, validateNameLike, validatePhone } from '../../utils/formValidation';

type Customer = {
  customerId: number;
  fullName?: string | null;
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
  idNumber?: string | null;
};

export function CustomerNewPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [customerType, setCustomerType] = useState('INDIVIDUAL');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [idType, setIdType] = useState('CCCD');
  const [idNumber, setIdNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('Việt Nam');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fieldHints, setFieldHints] = useState<Record<string, string>>({});

  const validateLocalField = useCallback((field: 'fullName' | 'companyName' | 'phone' | 'email', value?: string) => {
    if (field === 'fullName') return customerType === 'INDIVIDUAL' ? validateNameLike(value ?? fullName, 'Họ tên') : '';
    if (field === 'companyName') return customerType !== 'INDIVIDUAL' ? validateNameLike(value ?? companyName, 'Tên công ty') : '';
    if (field === 'phone') return validatePhone(value ?? phone);
    return validateEmail(value ?? email);
  }, [customerType, fullName, companyName, phone, email]);

  function handleBlur(field: 'fullName' | 'companyName' | 'phone' | 'email') {
    const msg = validateLocalField(field);
    setFieldErrors((prev) => ({ ...prev, [field]: msg || prev[field] || '' }));
  }

  useEffect(() => {
    const timer = setTimeout(async () => {
      const nameKey = normalizeText(fullName).toLowerCase();
      const companyKey = normalizeText(companyName).toLowerCase();
      const phoneKey = normalizePhone(phone);
      const emailKey = email.trim().toLowerCase();

      if (!nameKey && !companyKey && !phoneKey && !emailKey) return;

      const localErrors: Record<string, string> = {
        fullName: validateLocalField('fullName'),
        companyName: validateLocalField('companyName'),
        phone: validateLocalField('phone'),
        email: validateLocalField('email'),
      };

      try {
        const { data } = await api.get<Customer[]>('/api/customers', { params: { includeInactive: true } });
        const dup = {
          fullName: customerType === 'INDIVIDUAL' && nameKey && data.some((c) => normalizeText(c.fullName ?? '').toLowerCase() === nameKey),
          companyName: customerType !== 'INDIVIDUAL' && companyKey && data.some((c) => normalizeText(c.companyName ?? '').toLowerCase() === companyKey),
          phone: phoneKey && data.some((c) => normalizePhone(c.phone ?? '') === phoneKey),
          email: emailKey && data.some((c) => (c.email ?? '').trim().toLowerCase() === emailKey),
        };

        setFieldErrors((prev) => ({
          ...prev,
          fullName: localErrors.fullName || (dup.fullName ? 'Họ tên đã tồn tại.' : ''),
          companyName: localErrors.companyName || (dup.companyName ? 'Tên công ty đã tồn tại.' : ''),
          phone: localErrors.phone || (dup.phone ? 'Số điện thoại đã tồn tại.' : ''),
          email: localErrors.email || (dup.email ? 'Email đã tồn tại.' : ''),
        }));

        setFieldHints({
          fullName: customerType === 'INDIVIDUAL' && nameKey && !localErrors.fullName && !dup.fullName ? 'Có thể sử dụng.' : '',
          companyName: customerType !== 'INDIVIDUAL' && companyKey && !localErrors.companyName && !dup.companyName ? 'Có thể sử dụng.' : '',
          phone: phoneKey && !localErrors.phone && !dup.phone ? 'Có thể sử dụng.' : '',
          email: emailKey && !localErrors.email && !dup.email ? 'Có thể sử dụng.' : '',
        });
      } catch {
        // silent
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [customerType, fullName, companyName, phone, email, validateLocalField]);

  async function validateForm() {
    const nextErrors: Record<string, string> = {};
    if (customerType === 'INDIVIDUAL') {
      const err = validateNameLike(fullName, 'Họ tên');
      if (err) nextErrors.fullName = err;
    } else {
      const err = validateNameLike(companyName, 'Tên công ty');
      if (err) nextErrors.companyName = err;
    }
    const phoneErr = validatePhone(phone);
    const emailErr = validateEmail(email);
    if (phoneErr) nextErrors.phone = phoneErr;
    if (emailErr) nextErrors.email = emailErr;

    if (!Object.keys(nextErrors).length) {
      const { data } = await api.get<Customer[]>('/api/customers', { params: { includeInactive: true } });
      const normalizedName = normalizeText(fullName).toLowerCase();
      const normalizedCompany = normalizeText(companyName).toLowerCase();
      const normalizedPhone = normalizePhone(phone);
      const normalizedEmail = email.trim().toLowerCase();

      if (customerType === 'INDIVIDUAL' && normalizedName && data.some((c) => normalizeText(c.fullName ?? '').toLowerCase() === normalizedName))
        nextErrors.fullName = 'Họ tên đã tồn tại.';
      if (customerType !== 'INDIVIDUAL' && normalizedCompany && data.some((c) => normalizeText(c.companyName ?? '').toLowerCase() === normalizedCompany))
        nextErrors.companyName = 'Tên công ty đã tồn tại.';
      if (normalizedPhone && data.some((c) => normalizePhone(c.phone ?? '') === normalizedPhone))
        nextErrors.phone = 'Số điện thoại đã tồn tại.';
      if (normalizedEmail && data.some((c) => (c.email ?? '').trim().toLowerCase() === normalizedEmail))
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
      const { data } = await api.post<{ customerId: number }>('/api/customers', {
        customerType,
        fullName: fullName.trim() || null,
        companyName: companyName.trim() || null,
        idType: idType.trim() || null,
        idNumber: idNumber.trim() || null,
        dateOfBirth: dateOfBirth || null,
        nationality: nationality.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      });
      navigate(`/customers/${data.customerId}`, { replace: true });
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Thêm khách hàng"
        actions={
          <Link to="/customers" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
            ← Danh sách
          </Link>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}

      <form className="card form-stack" onSubmit={onSubmit}>
        <label>
          Loại
          <select
            value={customerType}
            onChange={(e) => {
              const next = e.target.value;
              setCustomerType(next);
              setFieldErrors((prev) => ({
                ...prev,
                fullName: next === 'INDIVIDUAL' ? validateNameLike(fullName, 'Họ tên') : '',
                companyName: next === 'INDIVIDUAL' ? '' : validateNameLike(companyName, 'Tên công ty'),
              }));
            }}
          >
            <option value="INDIVIDUAL">Cá nhân</option>
            <option value="COMPANY">Công ty</option>
            <option value="AGENCY">Đại lý</option>
          </select>
        </label>
        {customerType === 'INDIVIDUAL' ? (
          <label>
            Họ tên *
            <input
              value={fullName}
              onChange={(e) => {
                const v = e.target.value;
                setFullName(v);
                setFieldErrors((prev) => {
                  const localErr = validateLocalField('fullName', v);
                  return { ...prev, fullName: localErr || prev.fullName || '' };
                });
              }}
              onBlur={() => handleBlur('fullName')}
              required
            />
            {fieldErrors.fullName && <div className="field-error">{fieldErrors.fullName}</div>}
            {!fieldErrors.fullName && fieldHints.fullName && <div className="field-success">{fieldHints.fullName}</div>}
          </label>
        ) : (
          <label>
            Tên công ty *
            <input
              value={companyName}
              onChange={(e) => {
                const v = e.target.value;
                setCompanyName(v);
                setFieldErrors((prev) => {
                  const localErr = validateLocalField('companyName', v);
                  return { ...prev, companyName: localErr || prev.companyName || '' };
                });
              }}
              onBlur={() => handleBlur('companyName')}
              required
            />
            {fieldErrors.companyName && <div className="field-error">{fieldErrors.companyName}</div>}
            {!fieldErrors.companyName && fieldHints.companyName && <div className="field-success">{fieldHints.companyName}</div>}
          </label>
        )}
        <div className="grid-2">
          <label>
            Loại giấy tờ
            <input value={idType} onChange={(e) => setIdType(e.target.value)} placeholder="CCCD/CMND/PASSPORT" />
          </label>
          <label>
            Số giấy tờ
            <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
          </label>
        </div>
        <div className="grid-2">
          <label>
            Ngày sinh
            <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </label>
          <label>
            Quốc tịch
            <input value={nationality} onChange={(e) => setNationality(e.target.value)} />
          </label>
        </div>
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
        <label>
          Ghi chú
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <button type="submit" className={'hm-btn hm-btn--primary' + (saving ? ' hm-btn--loading' : '')} disabled={saving}>
          {saving ? 'Đang lưu…' : 'Tạo khách hàng'}
        </button>
      </form>
    </div>
  );
}

