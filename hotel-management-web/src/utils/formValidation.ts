export function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizePhone(value: string) {
  return value.trim().replace(/[.\-\s]/g, '');
}

export function validateNameLike(value: string, label: string) {
  const v = normalizeText(value);
  if (!v) return `${label} là bắt buộc.`;
  if (v.length < 2) return `${label} phải có ít nhất 2 ký tự.`;
  return '';
}

export function validatePhone(value: string) {
  const v = normalizePhone(value);
  if (!v) return '';
  if (!/^(0|\+84)\d{9,10}$/.test(v)) return 'Số điện thoại không đúng định dạng.';
  return '';
}

export function validateEmail(value: string) {
  const v = value.trim();
  if (!v) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Email không đúng định dạng.';
  return '';
}

export function validateAddress(value: string) {
  const v = normalizeText(value);
  if (!v) return '';
  if (v.length < 5) return 'Địa chỉ quá ngắn.';
  return '';
}

export function validateIdNumber(value: string) {
  const v = value.trim().toUpperCase();
  if (!v) return '';
  if (!/^[A-Z0-9]{6,20}$/.test(v)) return 'Số giấy tờ không hợp lệ (6-20 ký tự chữ/số).';
  return '';
}
