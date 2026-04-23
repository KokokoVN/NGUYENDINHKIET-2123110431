import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

type Hotel = { hotelId: number; hotelName: string };
type Room = { roomId: number; roomNumber: string; hotelId: number; statusCode?: string };
type Customer = { customerId: number; fullName?: string | null; companyName?: string | null };
type BookingRef = {
  roomId: number;
  hotelId: number;
  checkInDate: string;
  checkOutDate: string;
  statusCode: string;
};
type Booking = { reservationId: number };

export function BookingNewPage() {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  const [formHotelId, setFormHotelId] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [checkInDateStr, setCheckInDateStr] = useState('');
  const [checkOutDateStr, setCheckOutDateStr] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [adults, setAdults] = useState(1);
  const [useNewCustomer, setUseNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerIdType, setNewCustomerIdType] = useState('CCCD');
  const [newCustomerIdNumber, setNewCustomerIdNumber] = useState('');
  const [newCustomerDateOfBirth, setNewCustomerDateOfBirth] = useState('');
  const [newCustomerNationality, setNewCustomerNationality] = useState('Việt Nam');

  useEffect(() => {
    void (async () => {
      try {
        const [h, r, c] = await Promise.all([
          api.get<Hotel[]>('/api/hotels'),
          api.get<Room[]>('/api/rooms'),
          api.get<Customer[]>('/api/customers', { params: { includeInactive: false } }),
        ]);
        setHotels(h.data);
        setRooms(r.data);
        setCustomers(c.data);
        if (h.data.length) setFormHotelId(h.data[0].hotelId);
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, []);

  async function searchAvailableRooms() {
    if (!formHotelId || !checkInDateStr || !checkOutDateStr) {
      setError('Vui lòng chọn khách sạn, ngày nhận phòng và ngày trả phòng.');
      return;
    }
    if (checkInDateStr >= checkOutDateStr) {
      setError('Ngày trả phòng phải lớn hơn ngày nhận phòng.');
      return;
    }

    try {
      setSearching(true);
      setError('');
      setSelectedRoom(null);
      setHasSearched(true);
      const roomsByHotel = rooms.filter((r) => r.hotelId === formHotelId);

      const { data: bookings } = await api.get<BookingRef[]>('/api/bookings', {
        params: {
          hotelId: formHotelId,
          statusCode: 'CONFIRMED',
          pageSize: 500,
        },
      });
      const { data: checkedInBookings } = await api.get<BookingRef[]>('/api/bookings', {
        params: {
          hotelId: formHotelId,
          statusCode: 'CHECKED_IN',
          pageSize: 500,
        },
      });
      const activeBookings = [...bookings, ...checkedInBookings];
      const from = new Date(checkInDateStr);
      const to = new Date(checkOutDateStr);

      const result = roomsByHotel.filter((room) => {
        if (room.statusCode && (room.statusCode === 'OUT_OF_SERVICE' || room.statusCode === 'MAINTENANCE')) {
          return false;
        }
        const hasOverlap = activeBookings.some((b) => {
          if (b.roomId !== room.roomId) return false;
          const bFrom = new Date(b.checkInDate);
          const bTo = new Date(b.checkOutDate);
          return from < bTo && to > bFrom;
        });
        return !hasOverlap;
      });
      setAvailableRooms(result);
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setSearching(false);
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      if (!selectedRoom) {
        setError('Vui lòng tìm phòng trống và chọn một phòng để đặt.');
        return;
      }

      if (!checkInDateStr || !checkOutDateStr) {
        setError('Vui lòng chọn thời gian nhận và trả phòng.');
        return;
      }

      const body: Record<string, unknown> = {
        roomId: selectedRoom.roomId,
        checkInDate: checkInDateStr,
        checkOutDate: checkOutDateStr,
        adults,
        children: 0,
      };

      if (useNewCustomer) {
        const name = newCustomerName.trim();
        if (!name) {
          setError('Vui lòng nhập họ tên khách hàng mới.');
          return;
        }
        body.newCustomer = {
          customerType: 'INDIVIDUAL',
          fullName: name,
          phone: newCustomerPhone.trim() || null,
          email: newCustomerEmail.trim() || null,
          idType: newCustomerIdType.trim() || null,
          idNumber: newCustomerIdNumber.trim() || null,
          dateOfBirth: newCustomerDateOfBirth || null,
          nationality: newCustomerNationality.trim() || null,
        };
      } else {
        const cid = customerId.trim();
        if (cid) body.customerId = Number(cid);
      }

      const { data: booking } = await api.post<Booking>('/api/bookings', body);
      navigate(`/bookings/${booking.reservationId}`, { replace: true });
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Tạo đặt phòng"
        subtitle="Tìm phòng trống theo thời gian, bấm Thuê rồi nhập thông tin khách."
        actions={
          <Link to="/bookings" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
            ← Danh sách
          </Link>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}
      <div className="card form-stack" style={{ marginBottom: '1rem' }}>
        <label>
          Khách sạn
          <select value={formHotelId || ''} onChange={(e) => setFormHotelId(Number(e.target.value))}>
            {hotels.map((h) => (
              <option key={h.hotelId} value={h.hotelId}>
                {h.hotelName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ngày nhận phòng
          <input type="date" value={checkInDateStr} onChange={(e) => setCheckInDateStr(e.target.value)} required />
        </label>
        <label>
          Ngày trả phòng
          <input type="date" value={checkOutDateStr} onChange={(e) => setCheckOutDateStr(e.target.value)} required />
        </label>
        <button type="button" className="hm-btn hm-btn--primary" onClick={() => void searchAvailableRooms()} disabled={searching}>
          {searching ? 'Đang tìm…' : 'Tìm phòng trống'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card__head">
          <h3>Danh sách phòng trống</h3>
          <span className="muted" style={{ fontSize: '0.85rem' }}>{availableRooms.length} phòng</span>
        </div>
        <div style={{ display: 'grid', gap: '0.5rem', padding: '0 1rem 1rem' }}>
          {!hasSearched ? (
            <div className="empty-hint">Chọn thời gian nhận - trả phòng rồi bấm "Tìm phòng trống".</div>
          ) : availableRooms.length === 0 ? (
            <div className="empty-hint">Không có phòng trống trong khoảng thời gian này.</div>
          ) : (
            availableRooms.map((r) => (
              <div key={r.roomId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.75rem' }}>
                <div>
                  <strong>Phòng {r.roomNumber}</strong>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>Mã phòng: #{r.roomId}</div>
                </div>
                <button type="button" className="hm-btn hm-btn--sm hm-btn--primary" onClick={() => setSelectedRoom(r)}>
                  Thuê
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedRoom && (
        <form className="card form-stack" onSubmit={onCreate}>
          <div className="alert alert--success">Đã chọn phòng {selectedRoom.roomNumber} (#{selectedRoom.roomId}). Nhập thông tin khách để hoàn tất đặt phòng.</div>
          <div className="detail-grid">
            <dt>Phòng</dt>
            <dd>{selectedRoom.roomNumber}</dd>
            <dt>Khách sạn</dt>
            <dd>{hotels.find((h) => h.hotelId === selectedRoom.hotelId)?.hotelName || `#${selectedRoom.hotelId}`}</dd>
            <dt>Thời gian</dt>
            <dd>{checkInDateStr} → {checkOutDateStr}</dd>
          </div>
          <label>
            Số người lớn
            <input type="number" min={1} value={adults} onChange={(e) => setAdults(Number(e.target.value))} />
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={useNewCustomer} onChange={(e) => setUseNewCustomer(e.target.checked)} />
            <span>Thêm khách hàng mới</span>
          </label>

          {!useNewCustomer ? (
            <label>
              Khách hàng có sẵn (tùy chọn)
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Không chọn</option>
                {customers.map((c) => (
                  <option key={c.customerId} value={String(c.customerId)}>
                    #{c.customerId} - {c.fullName || c.companyName || 'Không tên'}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label>
                Họ tên khách hàng *
                <input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} required />
              </label>
              <label>
                Loại giấy tờ
                <input value={newCustomerIdType} onChange={(e) => setNewCustomerIdType(e.target.value)} placeholder="CCCD/CMND/PASSPORT" />
              </label>
              <label>
                Số giấy tờ
                <input value={newCustomerIdNumber} onChange={(e) => setNewCustomerIdNumber(e.target.value)} />
              </label>
              <label>
                Ngày sinh
                <input type="date" value={newCustomerDateOfBirth} onChange={(e) => setNewCustomerDateOfBirth(e.target.value)} />
              </label>
              <label>
                Quốc tịch
                <input value={newCustomerNationality} onChange={(e) => setNewCustomerNationality(e.target.value)} />
              </label>
              <label>
                Số điện thoại
                <input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} />
              </label>
              <label>
                Email
                <input type="email" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} />
              </label>
            </>
          )}

          <button type="submit" className="hm-btn hm-btn--primary" disabled={saving}>
            {saving ? 'Đang tạo…' : 'Xác nhận đặt phòng'}
          </button>
        </form>
      )}
    </div>
  );
}
