import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiMessage } from '../../api/client';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';

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
type CascadeChildrenInfo = { rooms?: number };
type Paged<T> = { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number };

export function RoomTypesListPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [list, setList] = useState<RoomType[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [hotelId, setHotelId] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [maxBaseRate, setMaxBaseRate] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<RoomType | null>(null);
  const [cascadeTarget, setCascadeTarget] = useState<{ roomType: RoomType; children: CascadeChildrenInfo } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  function hotelLabel(id: number) {
    const h = hotels.find((x) => x.hotelId === id);
    if (!h) return `#${id}`;
    return `${h.hotelName} (#${id})`;
  }

  function flashSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3500);
  }

  const loadHotels = useCallback(async () => {
    const { data } = await api.get<Hotel[]>('/api/hotels');
    setHotels(data);
  }, []);

  const load = useCallback(async (targetPage = 1) => {
    const params: Record<string, unknown> = { includeInactive: true };
    if (hotelId !== '') params.hotelId = hotelId;
    if (search.trim()) params.search = search.trim();
    if (minCapacity.trim()) params.minCapacity = Number(minCapacity);
    if (maxBaseRate.trim()) params.maxBaseRate = Number(maxBaseRate);
    params.page = targetPage;
    params.pageSize = pageSize;
    const { data } = await api.get<Paged<RoomType>>('/api/roomtypes', { params });
    setList(data.items);
    setPage(data.page);
    setTotalItems(data.totalItems);
    setTotalPages(data.totalPages);
  }, [hotelId, search, minCapacity, maxBaseRate]);

  useEffect(() => {
    void (async () => {
      try {
        await loadHotels();
        await load();
      } catch (e) {
        setError(apiMessage(e));
      }
    })();
  }, [loadHotels, load]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load().catch((e) => setError(apiMessage(e)));
    }, 220);
    return () => clearTimeout(t);
  }, [load]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setError('');
      await api.delete(`/api/roomtypes/${deleteTarget.roomTypeId}`);
      setDeleteTarget(null);
      await load();
      flashSuccess('Đã ngưng hoạt động loại phòng.');
    } catch (err) {
      const responseData = (err as { response?: { data?: { requiresConfirmation?: boolean; activeChildren?: CascadeChildrenInfo } } }).response?.data;
      if (responseData?.requiresConfirmation) {
        setDeleteTarget(null);
        setCascadeTarget({ roomType: deleteTarget, children: responseData.activeChildren ?? {} });
        return;
      }
      setError(apiMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  async function confirmCascadeDelete() {
    if (!cascadeTarget) return;
    try {
      setDeleting(true);
      setError('');
      await api.delete(`/api/roomtypes/${cascadeTarget.roomType.roomTypeId}`, { params: { cascadeChildren: true } });
      setCascadeTarget(null);
      await load();
      flashSuccess('Đã ngưng hoạt động loại phòng và toàn bộ phòng con.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  async function restore(id: number) {
    try {
      setRestoringId(id);
      setError('');
      await api.put(`/api/roomtypes/${id}/restore`);
      await load();
      flashSuccess('Đã hoạt động lại loại phòng.');
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Loại phòng"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="hm-btn hm-btn--ghost" onClick={() => void load()}>
              Làm mới
            </button>
            <Link to="/room-types/new" className="hm-btn hm-btn--primary" style={{ textDecoration: 'none' }}>
              Thêm loại phòng
            </Link>
          </div>
        }
      />
      {success && <div className="alert alert--success">{success}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      <div className="card card--toolbar form-inline">
        <label>
          Khách sạn
          <select value={hotelId === '' ? '' : String(hotelId)} onChange={(e) => setHotelId(e.target.value === '' ? '' : Number(e.target.value))}>
            <option value="">Tất cả</option>
            {hotels.map((h) => (
              <option key={h.hotelId} value={h.hotelId}>
                {h.hotelName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tìm kiếm
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên loại phòng" />
        </label>
        <label>
          Sức chứa tối thiểu
          <input type="number" min={1} value={minCapacity} onChange={(e) => setMinCapacity(e.target.value)} placeholder="VD: 2" />
        </label>
        <label>
          Giá tối đa / đêm
          <input type="number" min={0} value={maxBaseRate} onChange={(e) => setMaxBaseRate(e.target.value)} placeholder="VD: 800000" />
        </label>
        <span className="muted" style={{ alignSelf: 'center' }}></span>
      </div>

      <div className="card">
        <div className="card__head">
          <h3>Danh sách</h3>
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {list.length} loại
          </span>
        </div>
        <div className="table-wrap table-wrap--tall">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Khách sạn</th>
                <th>Sức chứa</th>
                <th>Giá/đêm</th>
                <th>Trạng thái</th>
                <th className="cell-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-hint">Chưa có dữ liệu.</div>
                  </td>
                </tr>
              ) : (
                list.map((r) => (
                  <tr key={r.roomTypeId}>
                    <td>{r.roomTypeId}</td>
                    <td>
                      <strong>{r.roomTypeName}</strong>
                      {r.description ? (
                        <div className="muted" style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                          {r.description}
                        </div>
                      ) : null}
                    </td>
                    <td>{hotelLabel(r.hotelId)}</td>
                    <td>{r.capacity}</td>
                    <td>{Number(r.baseRate).toLocaleString('vi-VN')} đ</td>
                    <td>{r.isActive ? <span className="badge badge--ok">Đang hoạt động</span> : <span className="badge badge--muted">Ngưng hoạt động</span>}</td>
                    <td className="cell-actions">
                      <Link to={`/room-types/${r.roomTypeId}`} className="hm-btn hm-btn--sm hm-btn--ghost" style={{ textDecoration: 'none' }}>
                        Xem
                      </Link>
                      <Link to={`/room-types/${r.roomTypeId}/edit`} className="hm-btn hm-btn--sm hm-btn--ghost" style={{ textDecoration: 'none' }}>
                        Sửa
                      </Link>
                      {r.isActive ? (
                        <button type="button" className="hm-btn hm-btn--sm hm-btn--danger" onClick={() => setDeleteTarget(r)}>
                          Ngưng HĐ
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="hm-btn hm-btn--sm hm-btn--primary"
                          disabled={restoringId === r.roomTypeId}
                          onClick={() => void restore(r.roomTypeId)}
                        >
                          {restoringId === r.roomTypeId ? 'Đang bật…' : 'Hoạt động lại'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Ngưng hoạt động loại phòng?"
        message={deleteTarget ? `Loại «${deleteTarget.roomTypeName}» sẽ bị ngưng hoạt động. Điều kiện: không còn phòng đang hoạt động gán loại này.` : ''}
        confirmLabel="Ngưng hoạt động"
        danger
        loading={deleting}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      <ConfirmDialog
        open={!!cascadeTarget}
        title="Xác nhận ngưng toàn bộ phòng con?"
        message={cascadeTarget ? `Loại «${cascadeTarget.roomType.roomTypeName}» còn ${cascadeTarget.children.rooms ?? 0} phòng đang hoạt động. Bạn có muốn ngưng tất cả không?` : ''}
        confirmLabel="Ngưng tất cả"
        danger
        loading={deleting}
        onCancel={() => !deleting && setCascadeTarget(null)}
        onConfirm={confirmCascadeDelete}
      />
      <Pagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={(p) => void load(p)} />
    </div>
  );
}

