/**
 * Bóc "vỏ" response của AccessTrade. Mỗi kiểu vỏ có cách báo lỗi riêng nên mỗi kiểu
 * một hàm: `response.ok` không đủ, vì TikTok Shop trả lỗi bằng HTTP 200 kèm `status: false`.
 * Bảng kiểu vỏ: docs/integrations/accesstrade-api.md, mục 4.
 */

export type AccessTradeErrorKind =
  | "http"
  | "envelope"
  | "partial"
  | "unsafe_integer"
  | "invalid_json"
  | "network"
  | "timeout";

export class AccessTradeError extends Error {
  readonly kind: AccessTradeErrorKind;
  readonly detail: unknown;

  constructor(kind: AccessTradeErrorKind, message: string, detail?: unknown) {
    super(message);
    this.name = "AccessTradeError";
    this.kind = kind;
    this.detail = detail;
  }
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(message: string, detail?: unknown): never {
  throw new AccessTradeError("envelope", message, detail);
}

function messageOf(json: JsonRecord): string {
  return typeof json.message === "string" && json.message !== "" ? json.message : "(không có message)";
}

/**
 * `JSON.parse` làm mất chữ số của số nguyên vượt 2^53, và id AccessTrade dài 19 chữ số.
 * Thấy số như vậy thì dừng hẳn, không để id sai lan đi.
 */
export function assertNoUnsafeIntegers(value: unknown, path = "$"): void {
  if (typeof value === "number") {
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
      throw new AccessTradeError(
        "unsafe_integer",
        `Số nguyên vượt giới hạn an toàn tại ${path}: JSON.parse đã làm mất chữ số`,
        { path },
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => assertNoUnsafeIntegers(item, `${path}[${i}]`));
    return;
  }
  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) assertNoUnsafeIntegers(item, `${path}.${key}`);
  }
}

/** Kiểu A và B: `{ data: [...], total? }`. Chỉ có HTTP status để biết lỗi. */
export function unwrapList(json: unknown): { items: unknown[]; total: number | null } {
  if (!isRecord(json) || !Array.isArray(json.data)) fail("Phản hồi không có mảng data");
  return { items: json.data, total: typeof json.total === "number" ? json.total : null };
}

export const CASHBACK_OK_CODE = "PX00000";

export interface CashbackPage {
  campaigns: unknown[];
  meta: { perPage: number | null; currentPage: number | null; total: number | null };
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

/** Kiểu C (`/v1/cashback/campaigns`): thành công khi `status === "success"` và `code === "PX00000"`. */
export function unwrapCashback(json: unknown): CashbackPage {
  if (!isRecord(json)) fail("Phản hồi không phải object");
  if (json.status !== "success" || json.code !== CASHBACK_OK_CODE) {
    fail(`AccessTrade báo lỗi: code=${String(json.code)} message=${messageOf(json)}`);
  }
  const data = json.data;
  if (!isRecord(data) || !Array.isArray(data.campaigns)) fail("Phản hồi thiếu data.campaigns");
  const meta = isRecord(data.meta) ? data.meta : {};
  return {
    campaigns: data.campaigns,
    meta: {
      perPage: numberOrNull(meta.per_page),
      currentPage: numberOrNull(meta.current_page),
      total: numberOrNull(meta.total),
    },
  };
}

export interface CreatedLink {
  affLink: string;
  shortLink: string | null;
  urlOrigin: string | null;
}

export interface ProductLinkResult {
  successLinks: CreatedLink[];
  errorLinks: unknown[];
  suspendUrls: unknown[];
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** Kiểu D (`/v1/product_link/create`): `success: true` chỉ nói request đã nhận, chưa nói link nào tạo được. */
export function unwrapProductLinks(json: unknown): ProductLinkResult {
  if (!isRecord(json) || json.success !== true) {
    fail(`AccessTrade báo lỗi khi tạo link: ${isRecord(json) ? messageOf(json) : "phản hồi không phải object"}`);
  }
  const data = json.data;
  if (!isRecord(data)) fail("Phản hồi thiếu data");
  const successLinks = (Array.isArray(data.success_link) ? data.success_link : []).map((item): CreatedLink => {
    if (!isRecord(item) || typeof item.aff_link !== "string") fail("success_link có phần tử thiếu aff_link", item);
    return {
      affLink: item.aff_link,
      shortLink: stringOrNull(item.short_link),
      urlOrigin: stringOrNull(item.url_origin),
    };
  });
  return {
    successLinks,
    errorLinks: Array.isArray(data.error_link) ? data.error_link : [],
    suspendUrls: Array.isArray(data.suspend_url) ? data.suspend_url : [],
  };
}

/** Đối chiếu số link gửi đi với số link tạo được. Thiếu bất kỳ link nào thì báo lỗi, kèm kết quả trong `detail`. */
export function assertAllLinksCreated(sentCount: number, result: ProductLinkResult): void {
  const complete =
    result.errorLinks.length === 0 &&
    result.suspendUrls.length === 0 &&
    result.successLinks.length === sentCount;
  if (complete) return;
  throw new AccessTradeError(
    "partial",
    `Tạo link không trọn vẹn: gửi ${sentCount}, thành công ${result.successLinks.length}, ` +
      `lỗi ${result.errorLinks.length}, bị tạm ngưng ${result.suspendUrls.length}`,
    result,
  );
}

/** Kiểu E (TikTok Shop): HTTP vẫn 200 khi lỗi, chỉ `status: false` cho biết. */
export function unwrapStatusEnvelope(json: unknown): { data: unknown; message: string } {
  if (!isRecord(json)) fail("Phản hồi không phải object");
  if (json.status !== true) fail(`AccessTrade báo lỗi: ${messageOf(json)}`, json);
  return { data: json.data, message: messageOf(json) };
}

/** Kiểu F và G (khuyến mãi): thành công khi `success === true`. */
export function unwrapSuccessFlag(json: unknown): unknown {
  if (!isRecord(json)) fail("Phản hồi không phải object");
  if (json.success !== true) fail(`AccessTrade báo lỗi: ${messageOf(json)}`, json);
  return json.data;
}

/** Kiểu H (`/v1/product_detail`): object trần, không vỏ. */
export function unwrapBareObject(json: unknown): JsonRecord {
  if (!isRecord(json)) fail("Phản hồi không phải object");
  return json;
}
