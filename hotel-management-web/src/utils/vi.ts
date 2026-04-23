export function viRoomStatus(code?: string | null) {
  const x = (code ?? '').toUpperCase();
  if (x === 'VACANT') return 'Trống';
  if (x === 'OCCUPIED') return 'Đang có khách';
  if (x === 'DIRTY') return 'Cần dọn';
  if (x === 'CLEANING') return 'Đang dọn';
  if (x === 'OUT_OF_SERVICE') return 'Ngưng phục vụ';
  return x || '—';
}

export function viBookingStatus(code?: string | null) {
  const x = (code ?? '').toUpperCase();
  if (x === 'CONFIRMED') return 'Đã xác nhận';
  if (x === 'CHECKED_IN') return 'Đã nhận phòng';
  if (x === 'CHECKED_OUT') return 'Đã trả phòng';
  if (x === 'CANCELLED') return 'Đã hủy';
  return x || '—';
}

export function viLoyaltyTier(code?: string | null) {
  const x = (code ?? 'BRONZE').toUpperCase();
  if (x === 'BRONZE') return 'Đồng';
  if (x === 'SILVER') return 'Bạc';
  if (x === 'GOLD') return 'Vàng';
  if (x === 'PLATINUM') return 'Bạch kim';
  return x;
}

export function viPaymentStatus(code?: string | null) {
  const x = (code ?? '').toUpperCase();
  if (x === 'PAID') return 'Đã thanh toán';
  if (x === 'VOID') return 'Đã hủy giao dịch';
  return x || '—';
}

export function viPaymentMethod(code?: string | null) {
  const x = (code ?? '').toUpperCase();
  if (x === 'CASH') return 'Tiền mặt';
  if (x === 'BANK_TRANSFER') return 'Chuyển khoản';
  if (x === 'CARD') return 'Thẻ';
  return x || '—';
}

export function viServiceOrderStatus(code?: string | null) {
  const x = (code ?? '').toUpperCase();
  if (x === 'ACTIVE') return 'Đang áp dụng';
  if (x === 'CANCELLED') return 'Đã hủy';
  return x || '—';
}

/** Mã vai trò đăng nhập (hiển thị tiếng Việt) */
export function viUserRole(code?: string | null) {
  const x = (code ?? '').toUpperCase();
  if (x === 'ADMIN') return 'Quản trị viên';
  if (x === 'RECEPTION') return 'Lễ tân';
  if (x === 'MANAGER') return 'Quản lý';
  if (x === 'ACCOUNTANT') return 'Kế toán';
  return x || '—';
}
