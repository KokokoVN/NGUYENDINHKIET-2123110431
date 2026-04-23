import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { normalizeText, validateNameLike } from '../../utils/formValidation';
import { viRoomStatus } from '../../utils/vi';

const ROOM_STATUSES = ['VACANT', 'OCCUPIED', 'DIRTY', 'CLEANING', 'OUT_OF_SERVICE'] as const;

type Hotel = { hotelId: number; hotelName: string };
type RoomType = { roomTypeId: number; roomTypeName: string; hotelId: number };

export function RoomNewPage() {
  const navigate = useNavigate();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [types, setTypes] = useState<RoomType[]>([]);
  const [hotelId, setHotelId] = useState<number>(0);
  const [roomTypeId, setRoomTypeId] = useState<number>(0);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [statusCode, setStatusCode] = useState<(typeof ROOM_STATUSES)[number]>('VACANT');
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
    if (!hotelId) return;
    void (async () => {
      try {
        const { data } = await api.get<RoomType[]>('/api/roomtypes', { params: { hotelId } });
        setTypes(data);
        if (data.length) setRoomTypeId(data[0].roomTypeId);
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, [hotelId]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const numberKey = normalizeText(roomNumber).toLowerCase();
      if (!hotelId || !numberKey) return;
      const localErr = validateNameLike(roomNumber, 'Số phòng');
      if (localErr) return;
      try {
        const { data } = await api.get<Array<{ roomNumber: string; hotelId: number }>>('/api/rooms', {
          params: { includeInactive: true },
        });
        const dup = data.some((r) => r.hotelId === hotelId && normalizeText(r.roomNumber).toLowerCase() === numberKey);
        setFieldErrors((prev) => ({ ...prev, roomNumber: dup ? 'Số phòng đã tồn tại trong khách sạn này.' : '' }));
      } catch {
        // silent
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [hotelId, roomNumber]);

  async function validateForm() {
    const nextErrors: Record<string, string> = {};
    const roomNumberErr = validateNameLike(roomNumber, 'Số phòng');
    if (roomNumberErr) nextErrors.roomNumber = roomNumberErr;
    if (!hotelId) nextErrors.hotelId = 'Vui lòng chọn khách sạn.';
    if (!roomTypeId) nextErrors.roomTypeId = 'Vui lòng chọn loại phòng.';

    if (!Object.keys(nextErrors).length) {
      const numberKey = normalizeText(roomNumber).toLowerCase();
      const { data } = await api.get<Array<{ roomNumber: string; hotelId: number }>>('/api/rooms', {
        params: { includeInactive: true },
      });
      if (data.some((r) => r.hotelId === hotelId && normalizeText(r.roomNumber).toLowerCase() === numberKey)) {
        nextErrors.roomNumber = 'Số phòng đã tồn tại trong khách sạn này.';
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hotelId || !roomTypeId) return;
    try {
      setSaving(true);
      setError('');
      if (!(await validateForm())) return;
      const { data } = await api.post<{ roomId: number }>('/api/rooms', {
        hotelId,
        roomTypeId,
        roomNumber: roomNumber.trim(),
        floor: floor.trim() || null,
        statusCode,
      });
      navigate(`/rooms/${data.roomId}`, { replace: true });
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Thêm phòng"
        actions={
          <Link to="/rooms" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
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
          Loại phòng *
          <select value={roomTypeId || ''} onChange={(e) => setRoomTypeId(Number(e.target.value))}>
            {types.map((t) => (
              <option key={t.roomTypeId} value={t.roomTypeId}>
                {t.roomTypeName}
              </option>
            ))}
          </select>
        </label>
        <div className="grid-2">
          <label>
            Số phòng *
            <input
              value={roomNumber}
              onChange={(e) => {
                const v = e.target.value;
                setRoomNumber(v);
                const localErr = validateNameLike(v, 'Số phòng');
                setFieldErrors((prev) => ({ ...prev, roomNumber: localErr || prev.roomNumber || '' }));
              }}
              required
            />
            {fieldErrors.roomNumber && <div className="field-error">{fieldErrors.roomNumber}</div>}
          </label>
          <label>
            Tầng
            <input value={floor} onChange={(e) => setFloor(e.target.value)} />
          </label>
        </div>
        <label>
          Trạng thái
          <select value={statusCode} onChange={(e) => setStatusCode(e.target.value as (typeof ROOM_STATUSES)[number])}>
            {ROOM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {viRoomStatus(s)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={'hm-btn hm-btn--primary' + (saving ? ' hm-btn--loading' : '')} disabled={saving || !roomTypeId}>
          {saving ? 'Đang lưu…' : 'Tạo phòng'}
        </button>
      </form>
    </div>
  );
}

