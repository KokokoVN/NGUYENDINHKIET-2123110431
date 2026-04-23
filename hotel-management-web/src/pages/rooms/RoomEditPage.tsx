import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import { normalizeText, validateNameLike } from '../../utils/formValidation';
import { viRoomStatus } from '../../utils/vi';

const ROOM_STATUSES = ['VACANT', 'OCCUPIED', 'DIRTY', 'CLEANING', 'OUT_OF_SERVICE'] as const;

type Room = {
  roomId: number;
  hotelId: number;
  roomTypeId: number;
  roomNumber: string;
  floor?: string | null;
  statusCode: string;
};
type RoomType = { roomTypeId: number; roomTypeName: string; hotelId: number };
type Hotel = { hotelId: number; hotelName: string };

export function RoomEditPage() {
  const params = useParams();
  const id = Number(params.id);
  const navigate = useNavigate();

  const [data, setData] = useState<Room | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [types, setTypes] = useState<RoomType[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [roomTypeId, setRoomTypeId] = useState<number>(0);
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [statusCode, setStatusCode] = useState<(typeof ROOM_STATUSES)[number]>('VACANT');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const { data } = await api.get<Room>(`/api/rooms/${id}`, { params: { includeInactive: true } });
        setData(data);
        setRoomTypeId(data.roomTypeId);
        setRoomNumber(data.roomNumber);
        setFloor(data.floor ?? '');
        setStatusCode(ROOM_STATUSES.includes(data.statusCode as (typeof ROOM_STATUSES)[number]) ? (data.statusCode as (typeof ROOM_STATUSES)[number]) : 'VACANT');

        const { data: roomTypes } = await api.get<RoomType[]>('/api/roomtypes', { params: { hotelId: data.hotelId, includeInactive: true } });
        setTypes(roomTypes);
        const { data: hotelsRes } = await api.get<Hotel[]>('/api/hotels', { params: { includeInactive: true } });
        setHotels(hotelsRes);
        setError('');
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!id || !data) return;
    const timer = setTimeout(async () => {
      const numberKey = normalizeText(roomNumber).toLowerCase();
      if (!numberKey) return;
      const localErr = validateNameLike(roomNumber, 'Số phòng');
      if (localErr) return;
      try {
        const { data: rows } = await api.get<Array<{ roomId: number; roomNumber: string; hotelId: number }>>('/api/rooms', {
          params: { includeInactive: true },
        });
        const dup = rows
          .filter((r) => r.roomId !== id)
          .some((r) => r.hotelId === data.hotelId && normalizeText(r.roomNumber).toLowerCase() === numberKey);
        setFieldErrors((prev) => ({ ...prev, roomNumber: dup ? 'Số phòng đã tồn tại trong khách sạn này.' : '' }));
      } catch {
        // silent
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [id, data, roomNumber]);

  async function validateForm() {
    const nextErrors: Record<string, string> = {};
    const roomNumberErr = validateNameLike(roomNumber, 'Số phòng');
    if (roomNumberErr) nextErrors.roomNumber = roomNumberErr;
    if (!roomTypeId) nextErrors.roomTypeId = 'Vui lòng chọn loại phòng.';

    if (!Object.keys(nextErrors).length && data) {
      const numberKey = normalizeText(roomNumber).toLowerCase();
      const { data: rows } = await api.get<Array<{ roomId: number; roomNumber: string; hotelId: number }>>('/api/rooms', {
        params: { includeInactive: true },
      });
      if (
        rows
          .filter((r) => r.roomId !== id)
          .some((r) => r.hotelId === data.hotelId && normalizeText(r.roomNumber).toLowerCase() === numberKey)
      ) {
        nextErrors.roomNumber = 'Số phòng đã tồn tại trong khách sạn này.';
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
      await api.put(`/api/rooms/${id}`, {
        roomTypeId,
        roomNumber: roomNumber.trim(),
        floor: floor.trim() || null,
        statusCode,
      });
      navigate(`/rooms/${id}`, { replace: true });
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Sửa phòng"
        subtitle={data ? `Mã phòng: ${data.roomId}` : 'Đang tải…'}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/rooms" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
              ← Danh sách
            </Link>
            {id ? (
              <Link to={`/rooms/${id}`} className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
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
            Khách sạn gắn với phòng:{' '}
            <strong>{hotels.find((h) => h.hotelId === data.hotelId)?.hotelName ?? `#${data.hotelId}`}</strong>
            {' '} (ID: {data.hotelId}, không đổi khách sạn khi sửa phòng)
          </div>
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
          <button type="submit" className={'hm-btn hm-btn--primary' + (saving ? ' hm-btn--loading' : '')} disabled={saving}>
            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </form>
      )}
    </div>
  );
}

