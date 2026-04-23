export function getPageSlice<T>(items: T[], page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, pageSize);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
  const currentPage = Math.min(safePage, totalPages);
  const start = (currentPage - 1) * safeSize;
  return {
    currentPage,
    pageSize: safeSize,
    totalItems,
    totalPages,
    items: items.slice(start, start + safeSize),
  };
}
