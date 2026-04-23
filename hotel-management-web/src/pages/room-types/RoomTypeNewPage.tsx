import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { normalizeText, validateNameLike } from '../../utils/formValidation';

type Hotel = { hotelId: number; hotelName: string };

export function RoomTypeNewPage() {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState<number>(0);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [roomTypeName, setRoomTypeName] = useState('');
  const [capacity, setCapacity] = useState<number>(2);
  const [baseRate, setBaseRate] = useState<number>(500000);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    const timer = setTimeout(async () => {
      const normalizedName = normalizeText(roomTypeName).toLowerCase();
      if (!hotelId || !normalizedName) return;
      const localErr = validateNameLike(roomTypeName, 'Tên loại');
      if (localErr) return;
      try {
        const { data } = await api.get<Array<{ roomTypeName: string; hotelId: number }>>('/api/roomtypes', {
          params: { includeInactive: true, hotelId },
        });
        const dup = data.some((r) => normalizeText(r.roomTypeName).toLowerCase() === normalizedName);
        setFieldErrors((prev) => ({ ...prev, roomTypeName: dup ? 'Tên loại phòng đã tồn tại trong khách sạn này.' : '' }));
      } catch {
        // silent realtime check
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [hotelId, roomTypeName]);

  async function validateForm() {
    const nextErrors: Record<string, string> = {};
    const nameErr = validateNameLike(roomTypeName, 'Tên loại');
    if (nameErr) nextErrors.roomTypeName = nameErr;
    if (!hotelId) nextErrors.hotelId = 'Vui lòng chọn khách sạn.';
    if (capacity < 1) nextErrors.capacity = 'Sức chứa phải lớn hơn 0.';
    if (baseRate < 0) nextErrors.baseRate = 'Giá cơ bản không hợp lệ.';

    if (!Object.keys(nextErrors).length) {
      const normalizedName = normalizeText(roomTypeName).toLowerCase();
      const { data } = await api.get<Array<{ roomTypeName: string; hotelId: number }>>('/api/roomtypes', {
        params: { includeInactive: true, hotelId },
      });
      if (data.some((r) => normalizeText(r.roomTypeName).toLowerCase() === normalizedName)) {
        nextErrors.roomTypeName = 'Tên loại phòng đã tồn tại trong khách sạn này.';
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hotelId) return;
    try {
      setSaving(true);
      setError('');
      if (!(await validateForm())) return;
      const { data } = await api.post<{ roomTypeId: number }>('/api/roomtypes', {
        hotelId,
        roomTypeName: roomTypeName.trim(),
        capacity,
        baseRate,
        description: description.trim() || null,
        isActive,
      });
      navigate(`/room-types/${data.roomTypeId}`, { replace: true });
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Thêm loại phòng"
        actions={
          <Link to="/room-types" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
            ← Danh sách
          </Link>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}

      <form className="card form-stack" onSubmit={onSubmit}>
        <label>
          Khách sạn *
          <select value={hotelId || ''} onChange={(e) => setHotelId(Number(e.target.value))}>
            {hotels.map((h) => (
              <option key={h.hotelId} value={h.hotelId}>
                {h.hotelName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tên loại *
          <input
            value={roomTypeName}
            onChange={(e) => {
              const v = e.target.value;
              setRoomTypeName(v);
              const localErr = validateNameLike(v, 'Tên loại');
              setFieldErrors((prev) => ({ ...prev, roomTypeName: localErr || prev.roomTypeName || '' }));
            }}
            required
          />
          {fieldErrors.roomTypeName && <div className="field-error">{fieldErrors.roomTypeName}</div>}
        </label>
        <div className="grid-2">
          <label>
            Sức chứa
            <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
          </label>
          <label>
            Giá cơ bản / đêm (đ)
            <input type="number" min={0} value={baseRate} onChange={(e) => setBaseRate(Number(e.target.value))} />
          </label>
        </div>
        <label>
          Mô tả
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span>Đang hoạt động</span>
        </label>
        <button type="submit" className={'hm-btn hm-btn--primary' + (saving ? ' hm-btn--loading' : '')} disabled={saving || !hotelId}>
          {saving ? 'Đang lưu…' : 'Tạo loại phòng'}
        </button>
      </form>
    </div>
  );
}

