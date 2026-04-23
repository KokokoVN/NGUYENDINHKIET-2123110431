import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { normalizeText, validateNameLike } from '../../utils/formValidation';

type Hotel = { hotelId: number; hotelName: string };
type RoomType = {
  roomTypeId: number;
  hotelId: number;
  roomTypeName: string;
  capacity: number;
  baseRate: number;
  description?: string | null;
  isActive: boolean;
};

export function RoomTypeEditPage() {
  const params = useParams();
  const id = Number(params.id);
  const navigate = useNavigate();

  const [data, setData] = useState<RoomType | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [roomTypeName, setRoomTypeName] = useState('');
  const [capacity, setCapacity] = useState<number>(2);
  const [baseRate, setBaseRate] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const [roomTypeRes, hotelsRes] = await Promise.all([
          api.get<RoomType>(`/api/roomtypes/${id}`, { params: { includeInactive: true } }),
          api.get<Hotel[]>('/api/hotels', { params: { includeInactive: true } }),
        ]);
        const roomType = roomTypeRes.data;
        setData(roomType);
        setHotels(hotelsRes.data);
        setRoomTypeName(roomType.roomTypeName);
        setCapacity(roomType.capacity);
        setBaseRate(Number(roomType.baseRate));
        setDescription(roomType.description ?? '');
        setIsActive(!!roomType.isActive);
        setError('');
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!id || !data) return;
    const timer = setTimeout(async () => {
      const normalizedName = normalizeText(roomTypeName).toLowerCase();
      if (!normalizedName) return;
      const localErr = validateNameLike(roomTypeName, 'Tên loại');
      if (localErr) return;
      try {
        const { data: rows } = await api.get<Array<{ roomTypeId: number; roomTypeName: string; hotelId: number }>>('/api/roomtypes', {
          params: { includeInactive: true, hotelId: data.hotelId },
        });
        const dup = rows
          .filter((r) => r.roomTypeId !== id)
          .some((r) => normalizeText(r.roomTypeName).toLowerCase() === normalizedName);
        setFieldErrors((prev) => ({ ...prev, roomTypeName: dup ? 'Tên loại phòng đã tồn tại trong khách sạn này.' : '' }));
      } catch {
        // silent realtime check
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [id, data, roomTypeName]);

  async function validateForm() {
    const nextErrors: Record<string, string> = {};
    const nameErr = validateNameLike(roomTypeName, 'Tên loại');
    if (nameErr) nextErrors.roomTypeName = nameErr;
    if (capacity < 1) nextErrors.capacity = 'Sức chứa phải lớn hơn 0.';
    if (baseRate < 0) nextErrors.baseRate = 'Giá cơ bản không hợp lệ.';

    if (!Object.keys(nextErrors).length && data) {
      const normalizedName = normalizeText(roomTypeName).toLowerCase();
      const { data: rows } = await api.get<Array<{ roomTypeId: number; roomTypeName: string; hotelId: number }>>('/api/roomtypes', {
        params: { includeInactive: true, hotelId: data.hotelId },
      });
      if (
        rows
          .filter((r) => r.roomTypeId !== id)
          .some((r) => normalizeText(r.roomTypeName).toLowerCase() === normalizedName)
      ) {
        nextErrors.roomTypeName = 'Tên loại phòng đã tồn tại trong khách sạn này.';
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      setSaving(true);
      setError('');
      if (!(await validateForm())) return;
      await api.put(`/api/roomtypes/${id}`, {
        roomTypeName: roomTypeName.trim(),
        capacity,
        baseRate,
        description: description.trim() || null,
        isActive,
      });
      navigate(`/room-types/${id}`, { replace: true });
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Sửa loại phòng"
        subtitle={data ? `Mã loại phòng: ${data.roomTypeId}` : 'Đang tải…'}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/room-types" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
              ← Danh sách
            </Link>
            {id ? (
              <Link to={`/room-types/${id}`} className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
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
          <div className="muted" style={{ fontSize: '0.88rem' }}>
            Khách sạn:{' '}
            <strong>{hotels.find((h) => h.hotelId === data.hotelId)?.hotelName ?? `#${data.hotelId}`}</strong>
            {' '} (ID: {data.hotelId}, API không cho đổi hotelId ở PUT)
          </div>
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
              Giá cơ bản/đêm (đ)
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
          <button type="submit" className={'hm-btn hm-btn--primary' + (saving ? ' hm-btn--loading' : '')} disabled={saving}>
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </form>
      )}
    </div>
  );
}

