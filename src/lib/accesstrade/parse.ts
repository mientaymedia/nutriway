/**
 * Chuẩn hoá dữ liệu "bẩn" của AccessTrade ở biên: tiền, tỷ lệ, thời gian, boolean, id.
 * Cạm bẫy gốc: docs/integrations/accesstrade-api.md, mục 6.
 */

const PLAIN_NUMBER = /^\d+(\.\d+)?$/;
const GROUPED_NUMBER = /^\d{1,3}(\.\d{3})+$/;

export interface VndParse {
  /** Số tiền, làm tròn về đồng nguyên. */
  value: number;
  /** true khi chuỗi đọc được theo hai cách (vd "3.000") và không có `expected` để phân xử. */
  ambiguous: boolean;
}

/**
 * Đọc chuỗi tiền của TikTok Shop. Cùng một field có hai quy ước dấu chấm:
 * "5849.900000000001" là thập phân, còn "3.000" là 3000 đồng (phân cách hàng nghìn).
 *
 * "3.000" đọc được cả hai cách. Có `expected` (vd giá × tỷ lệ) thì chọn cách gần
 * `expected` hơn; không có thì mặc định phân cách nghìn và báo `ambiguous`.
 * Quy tắc này CHƯA kiểm chứng bằng dữ liệu thật.
 */
export function parseVndAmount(raw: string | number, expected?: number): VndParse {
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < 0) throw new RangeError(`Số tiền không hợp lệ: ${raw}`);
    return { value: Math.round(raw), ambiguous: false };
  }
  const s = raw.trim();
  const grouped = GROUPED_NUMBER.test(s);
  if (!grouped && !PLAIN_NUMBER.test(s)) throw new RangeError(`Không đọc được số tiền: "${s}"`);
  if (!grouped) return { value: Math.round(Number(s)), ambiguous: false };

  const thousands = Number(s.replace(/\./g, ""));
  if (s.split(".").length > 2) return { value: thousands, ambiguous: false };

  const decimal = Math.round(Number(s));
  if (expected === undefined) return { value: thousands, ambiguous: true };
  const pickThousands = Math.abs(thousands - expected) <= Math.abs(decimal - expected);
  return { value: pickThousands ? thousands : decimal, ambiguous: false };
}

/** `commission.rate` của TikTok là phần trăm × 100: 1500 là 15%, 3587 là 35,87%. */
export function commissionRateToPercent(rate: number): number {
  if (!Number.isFinite(rate) || rate < 0) throw new RangeError(`Tỷ lệ hoa hồng không hợp lệ: ${rate}`);
  return rate / 100;
}

/** Giờ trần (không kèm múi giờ) của AccessTrade. CHƯA kiểm chứng là UTC+7: đổi khi có kết quả. */
export const BARE_TIMESTAMP_OFFSET_MINUTES = 7 * 60;

export interface TimestampOptions {
  bareOffsetMinutes?: number;
}

function validDate(date: Date, source: string): Date {
  if (Number.isNaN(date.getTime())) throw new RangeError(`Thời gian không hợp lệ: "${source}"`);
  return date;
}

function fromParts(
  source: string,
  [y, mo, d, h, mi, s]: readonly number[],
  offsetMinutes: number,
): Date {
  const utc = Date.UTC(y, mo - 1, d, h, mi, s);
  const check = new Date(utc);
  const roundTrips =
    check.getUTCFullYear() === y &&
    check.getUTCMonth() === mo - 1 &&
    check.getUTCDate() === d &&
    check.getUTCHours() === h &&
    check.getUTCMinutes() === mi &&
    check.getUTCSeconds() === s;
  if (!roundTrips) throw new RangeError(`Thời gian không hợp lệ: "${source}"`);
  return new Date(utc - offsetMinutes * 60_000);
}

function numbers(match: RegExpExecArray, from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = from; i <= to; i += 1) out.push(Number(match[i] ?? "0"));
  return out;
}

function isMongoDate(value: unknown): value is { $date: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "$date" in value &&
    typeof (value as { $date: unknown }).$date === "number"
  );
}

const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const ISO_BARE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?)?$/;
const DMY = /^(\d{2})-(\d{2})-(\d{4})(?:T(\d{2}):(\d{2}):(\d{2}))?$/;
const RFC_1123 = /^[A-Za-z]{3}, \d{1,2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/;

/**
 * Đọc 7 định dạng thời gian của AccessTrade và trả về `Date` (UTC):
 * ISO có múi giờ, ISO trần, `DD-MM-YYYY[THH:MM:SS]`, `YYYY-MM-DD`, RFC 1123, `{ $date: ms }`.
 * Định dạng không có múi giờ được coi là giờ ở `bareOffsetMinutes`.
 */
export function parseAtTimestamp(input: unknown, options: TimestampOptions = {}): Date {
  const offset = options.bareOffsetMinutes ?? BARE_TIMESTAMP_OFFSET_MINUTES;
  if (isMongoDate(input)) return validDate(new Date(input.$date), String(input.$date));
  if (typeof input !== "string") throw new RangeError(`Thời gian phải là chuỗi, nhận ${typeof input}`);

  const s = input.trim();
  if (ISO_WITH_ZONE.test(s) || RFC_1123.test(s)) return validDate(new Date(s), s);

  const iso = ISO_BARE.exec(s);
  if (iso) return fromParts(s, numbers(iso, 1, 6), offset);

  const dmy = DMY.exec(s);
  if (dmy) {
    const [d, mo, y] = numbers(dmy, 1, 3);
    return fromParts(s, [y, mo, d, ...numbers(dmy, 4, 6)], offset);
  }
  throw new RangeError(`Không nhận ra định dạng thời gian: "${s}"`);
}

/** Dạng AccessTrade nhận ở `since` / `until`: ISO có `Z`, không phần mili-giây. */
export function toAtIso(date: Date): string {
  return validDate(date, String(date)).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Dạng `DD-MM-YYYY` mà datafeeds và top_products nhận. Mặc định tính theo ngày Việt Nam (UTC+7). */
export function toDdMmYyyy(date: Date, offsetMinutes: number = BARE_TIMESTAMP_OFFSET_MINUTES): string {
  validDate(date, String(date));
  const local = new Date(date.getTime() + offsetMinutes * 60_000);
  const dd = String(local.getUTCDate()).padStart(2, "0");
  const mm = String(local.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${local.getUTCFullYear()}`;
}

/** `is_hot` trả chuỗi "True"/"False", mà "False" là truthy trong JavaScript. */
export function parseStringBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (s === "true" || s === "1") return true;
    if (s === "false" || s === "0" || s === "") return false;
  }
  throw new RangeError(`Không đọc được boolean: ${String(value)}`);
}

/** Id luôn là chuỗi. Id 19 chữ số dưới dạng số đã mất chữ số khi `JSON.parse`, nên từ chối. */
export function asId(value: unknown, field = "id"): string {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  if (typeof value === "number" && Number.isSafeInteger(value)) return String(value);
  const got = typeof value === "number" ? "số không an toàn" : typeof value;
  throw new RangeError(`${field}: id phải là chuỗi hoặc số nguyên an toàn, nhận ${got}`);
}
