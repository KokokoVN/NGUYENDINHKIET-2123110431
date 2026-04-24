import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';

type StayView = {
  stayId: number;
  reservationId?: number | null;
  hotelId: number;
  hotelName?: string | null;
  roomNumber?: string | null;
  statusCode: string;
};

type HotelServiceItem = {
  hotelServiceId: number;
  hotelId: number;
  serviceCode: string;
  serviceName: string;
  defaultUnitPrice: number;
  isActive: boolean;
};

type DraftItem = {
  key: string;
  serviceCode: string;
  serviceName?: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
};

export function ServiceOrderNewPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingRef, setLoadingRef] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  const [stayId, setStayId] = useState('');

  const [stayInfo, setStayInfo] = useState<StayView | null>(null);
  const [services, setServices] = useState<HotelServiceItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [staysInHouse, setStaysInHouse] = useState<StayView[]>([]);
  const [loadingStays, setLoadingStays] = useState(false);
  const [selectedStayPick, setSelectedStayPick] = useState('');

  const [serviceCode, setServiceCode] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [draft, setDraft] = useState<DraftItem[]>([]);

  useEffect(() => {
    // reset phụ thuộc khi đổi stay
    setStayInfo(null);
    setServices([]);
    setSelectedServiceId('');
    setServiceCode('');
    setUnitPrice(0);
    setDescription('');
    setDraft([]);
  }, [stayId]);

  useEffect(() => {
    // load danh sách stay đang ở để chọn nhanh
    void (async () => {
      try {
        setLoadingStays(true);
        const { data } = await api.get<StayView[]>('/api/stays', { params: { statusCode: 'IN_HOUSE' } });
        setStaysInHouse(data);
      } catch {
        // ignore
      } finally {
        setLoadingStays(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedStayPick) return;
    setStayId(selectedStayPick);
  }, [selectedStayPick]);

  const canLoadRef = useMemo(() => {
    return stayId.trim() && Number(stayId) > 0;
  }, [stayId]);

  async function loadStayAndServices() {
    if (!canLoadRef) {
      setError('Vui lòng chọn Stay hợp lệ.');
      return;
    }
    try {
      setLoadingRef(true);
      setLoadingServices(true);
      setError('');
      setStayInfo(null);
      setServices([]);
      setSelectedServiceId('');

      const { data } = await api.get<StayView>(`/api/stays/${Number(stayId)}`);
      const stay: StayView | null = data ?? null;

      if (!stay) {
        setError('Không tìm thấy lưu trú đang ở (IN_HOUSE). Hãy check-in trước khi thêm dịch vụ.');
        return;
      }
      if ((stay.statusCode || '').toUpperCase() !== 'IN_HOUSE') {
        setError('Chỉ thêm dịch vụ khi stay ở trạng thái IN_HOUSE.');
        return;
      }

      setStayInfo(stay);

      const { data: list } = await api.get<HotelServiceItem[]>('/api/hotelservices', {
        params: { hotelId: stay.hotelId, includeInactive: false },
      });
      setServices(list);
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setLoadingRef(false);
      setLoadingServices(false);
    }
  }

  const serviceOptions = useMemo(() => {
    return services
      .filter((x) => x.isActive)
      .slice()
      .sort((a, b) => a.serviceCode.localeCompare(b.serviceCode));
  }, [services]);

  useEffect(() => {
    if (!selectedServiceId) return;
    const s = serviceOptions.find((x) => String(x.hotelServiceId) === selectedServiceId);
    if (!s) return;
    setServiceCode(s.serviceCode);
    setUnitPrice(Number(s.defaultUnitPrice) || 0);
    if (!description.trim()) setDescription(s.serviceName);
  }, [selectedServiceId, serviceOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  function addToDraft() {
    const code = serviceCode.trim().toUpperCase();
    if (!code) {
      setError('Vui lòng chọn dịch vụ.');
      return;
    }
    if (!stayId.trim() || Number(stayId) <= 0) {
      setError('Vui lòng chọn Stay trước.');
      return;
    }
    if (quantity < 1) {
      setError('Số lượng phải >= 1.');
      return;
    }
    if (unitPrice < 0) {
      setError('Đơn giá không hợp lệ.');
      return;
    }
    const opt = serviceOptions.find((x) => x.serviceCode === code);
    const name = opt?.serviceName;
    const desc = description.trim() ? description.trim() : null;
    const key = `${code}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setDraft((prev) => [...prev, { key, serviceCode: code, serviceName: name, description: desc, quantity, unitPrice }]);
    setError('');
  }

  function removeDraft(key: string) {
    setDraft((prev) => prev.filter((x) => x.key !== key));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      if (draft.length === 0) {
        setError('Hãy thêm ít nhất 1 dịch vụ vào danh sách trước khi lưu.');
        return;
      }

      const payload = {
        stayId: Number(stayId),
        items: draft.map((x) => ({
          serviceCode: x.serviceCode,
          description: x.description ?? null,
          quantity: x.quantity,
          unitPrice: x.unitPrice,
        })),
      };

      await api.post('/api/serviceorders/bulk', payload);
      navigate('/service-orders', { replace: true });
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const canSubmit =
    stayId.trim() &&
    Number(stayId) > 0 &&
    draft.length > 0;

  return (
    <div>
      <PageHeader
        title="Thêm dịch vụ sử dụng"
        subtitle="Chỉ tạo được khi khách đã check-in (Stay IN_HOUSE)."
        actions={
          <Link to="/service-orders" className="hm-btn hm-btn--ghost" style={{ textDecoration: 'none' }}>
            ← Danh sách
          </Link>
        }
      />
      {error && <div className="alert alert--error">{error}</div>}

      <form className="card form-stack" onSubmit={onSubmit}>
        <label>
          Chọn Stay đang lưu trú (gợi ý)
          <select value={selectedStayPick} onChange={(e) => setSelectedStayPick(e.target.value)} disabled={loadingStays || staysInHouse.length === 0}>
            <option value="">{loadingStays ? 'Đang tải…' : staysInHouse.length === 0 ? 'Chưa có stay IN_HOUSE' : 'Chọn stay…'}</option>
            {staysInHouse.map((s) => (
              <option key={s.stayId} value={String(s.stayId)}>
                Stay #{s.stayId} — Booking #{s.reservationId ?? '—'} — {s.hotelName ?? `HotelId ${s.hotelId}`} — Phòng {s.roomNumber ?? '—'}
              </option>
            ))}
          </select>
          <div className="muted" style={{ fontSize: '0.85rem' }}>
            Chọn stay sẽ tự điền StayId, sau đó bấm “Tải dịch vụ theo khách sạn” để chọn dịch vụ.
          </div>
        </label>

        <label>
          StayId *
          <input type="number" min={1} value={stayId} onChange={(e) => setStayId(e.target.value)} required />
        </label>

        <button
          type="button"
          className="hm-btn hm-btn--ghost"
          onClick={() => void loadStayAndServices()}
          disabled={loadingRef || loadingServices || !canLoadRef}
        >
          {loadingRef || loadingServices ? 'Đang tải…' : 'Tải dịch vụ theo khách sạn'}
        </button>

        {stayInfo && (
          <div className="alert alert--success">
            Đang thêm dịch vụ cho <strong>Stay #{stayInfo.stayId}</strong> — {stayInfo.hotelName ? `Khách sạn: ${stayInfo.hotelName}` : `HotelId: ${stayInfo.hotelId}`}
            {stayInfo.roomNumber ? ` — Phòng ${stayInfo.roomNumber}` : ''}
          </div>
        )}

        <label>
          Dịch vụ theo khách sạn
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            disabled={!stayInfo || serviceOptions.length === 0}
          >
            <option value="">
              {!stayInfo ? 'Hãy bấm "Tải dịch vụ theo khách sạn" trước' : serviceOptions.length === 0 ? 'Khách sạn chưa có dịch vụ' : 'Chọn dịch vụ…'}
            </option>
            {serviceOptions.map((s) => (
              <option key={s.hotelServiceId} value={String(s.hotelServiceId)}>
                {s.serviceCode} — {s.serviceName} ({Number(s.defaultUnitPrice).toLocaleString('vi-VN')}đ)
              </option>
            ))}
          </select>
        </label>

        <div className="grid-2">
          <label>
            Mã dịch vụ *
            <input value={serviceCode} onChange={(e) => setServiceCode(e.target.value)} required placeholder="VD: BREAKFAST" />
          </label>
          <label>
            Số lượng *
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 1)} required />
          </label>
        </div>
        <label>
          Đơn giá (đ)
          <input type="number" min={0} value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value) || 0)} required />
        </label>
        <label>
          Mô tả
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="VD: Ăn sáng" />
        </label>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="hm-btn hm-btn--ghost" onClick={addToDraft} disabled={!serviceCode.trim() || saving}>
            + Thêm vào danh sách
          </button>
          <button type="submit" className={'hm-btn hm-btn--primary' + (saving ? ' hm-btn--loading' : '')} disabled={saving || !canSubmit}>
            {saving ? 'Đang lưu…' : `Lưu tất cả (${draft.length})`}
          </button>
        </div>

        {draft.length > 0 && (
          <div className="card" style={{ marginTop: '0.75rem' }}>
            <div className="card__head">
              <h3>Dịch vụ sẽ thêm</h3>
              <span className="muted" style={{ fontSize: '0.85rem' }}>{draft.length} dòng</span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Tên</th>
                    <th>SL</th>
                    <th>Đơn giá</th>
                    <th>Ghi chú</th>
                    <th className="cell-actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {draft.map((d) => (
                    <tr key={d.key}>
                      <td><strong>{d.serviceCode}</strong></td>
                      <td>{d.serviceName ?? '—'}</td>
                      <td>{d.quantity}</td>
                      <td>{Number(d.unitPrice).toLocaleString('vi-VN')}</td>
                      <td>{d.description ?? '—'}</td>
                      <td className="cell-actions">
                        <button type="button" className="hm-btn hm-btn--sm hm-btn--danger" onClick={() => removeDraft(d.key)}>
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

