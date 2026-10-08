const VND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

/** Tiền đồng, vd 175000 thành "175.000 ₫". */
export function formatVnd(amount: number): string {
  return VND.format(amount);
}

/** Phần trăm giảm giá, làm tròn xuống. Trả null khi không có giảm. */
export function discountPercent(price: number, salePrice: number): number | null {
  if (price <= 0 || salePrice >= price) return null;
  return Math.floor(((price - salePrice) / price) * 100);
}

/** Số lượt bán gọn, vd 12300 thành "12,3k". */
export function compactCount(value: number): string {
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(1).replace(".", ",").replace(",0", "")}k`;
}
