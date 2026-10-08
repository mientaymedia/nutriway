/**
 * Hàm dùng chung để chuẩn hoá từng bản ghi của AccessTrade (datafeeds, top_products, voucher).
 * Bản ghi hỏng bị bỏ qua nhưng KHÔNG im lặng: lý do nằm trong `skipped`.
 */
import { parseVndAmount } from "./parse";

export type Raw = Record<string, unknown>;

export interface Skipped {
  index: number;
  reason: string;
}

export interface Normalized<T> {
  items: T[];
  skipped: Skipped[];
}

export function isRaw(value: unknown): value is Raw {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function reqString(raw: Raw, key: string): string {
  const value = raw[key];
  if (typeof value !== "string" || value.trim() === "") throw new RangeError(`${key}: thiếu hoặc không phải chuỗi`);
  return value.trim();
}

export function optString(raw: Raw, key: string): string | null {
  const value = raw[key];
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s === "" ? null : s;
}

function httpUrl(value: string, key: string): string {
  let protocol: string;
  try {
    protocol = new URL(value).protocol;
  } catch {
    throw new RangeError(`${key}: không phải URL hợp lệ`);
  }
  if (protocol !== "https:" && protocol !== "http:") throw new RangeError(`${key}: URL phải là http hoặc https`);
  return value;
}

/** URL bắt buộc, chỉ nhận http(s): chặn `javascript:` và `data:` lọt vào thuộc tính href hoặc src. */
export function reqHttpUrl(raw: Raw, key: string): string {
  return httpUrl(reqString(raw, key), key);
}

/**
 * URL ảnh tuỳ chọn. Nâng `http://` lên `https://` vì trang chạy HTTPS, mà trình
 * duyệt chặn thẳng ảnh HTTP (mixed content) nên ảnh sẽ không bao giờ hiện.
 * Kiểm chứng ngày 2026-10-08: 13 trong 200 sản phẩm của kho trả về URL `http://`.
 */
export function optImageUrl(raw: Raw, key: string): string | null {
  const value = optHttpUrl(raw, key);
  return value === null ? null : value.replace(/^http:\/\//i, "https://");
}

/** URL tuỳ chọn: giá trị hỏng hoặc không phải http(s) thành null, không làm hỏng cả bản ghi. */
export function optHttpUrl(raw: Raw, key: string): string | null {
  const value = optString(raw, key);
  if (value === null) return null;
  try {
    return httpUrl(value, key);
  } catch {
    return null;
  }
}

function moneyOf(value: unknown, key: string): number {
  if (typeof value === "number" || typeof value === "string") return parseVndAmount(value).value;
  throw new RangeError(`${key}: thiếu hoặc không phải số tiền`);
}

export function reqMoney(raw: Raw, key: string): number {
  return moneyOf(raw[key], key);
}

export function optMoney(raw: Raw, key: string): number | null {
  const value = raw[key];
  return value === undefined || value === null ? null : moneyOf(value, key);
}

/** Id tuỳ chọn: chuỗi không rỗng, hoặc số nguyên an toàn đổi thành chuỗi; còn lại là null. */
export function optId(raw: Raw, key: string): string | null {
  const value = raw[key];
  return typeof value === "number" && Number.isSafeInteger(value) ? String(value) : optString(raw, key);
}

export function optNumber(raw: Raw, key: string): number | null {
  const value = raw[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Chuẩn hoá từng phần tử; phần tử hỏng không làm hỏng cả trang mà được ghi vào `skipped` kèm lý do. */
export function normalizeEach<T>(items: readonly unknown[], normalize: (raw: Raw) => T): Normalized<T> {
  const out: T[] = [];
  const skipped: Skipped[] = [];
  items.forEach((item, index) => {
    try {
      if (!isRaw(item)) throw new RangeError("phần tử không phải object");
      out.push(normalize(item));
    } catch (error) {
      skipped.push({ index, reason: error instanceof Error ? error.message : String(error) });
    }
  });
  return { items: out, skipped };
}
