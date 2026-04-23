type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }: PaginationProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        marginTop: '1rem',
      }}
    >
      <span className="muted">
        {totalItems === 0 ? 'Không có dữ liệu' : `Tổng ${totalItems} bản ghi · Trang ${page}/${totalPages} · ${pageSize} dòng/trang`}
      </span>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="button" className="hm-btn hm-btn--ghost" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
          Trang trước
        </button>
        <button type="button" className="hm-btn hm-btn--ghost" disabled={page >= totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>
          Trang sau
        </button>
      </div>
    </div>
  );
}
