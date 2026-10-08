import type { AccessTradeClient } from "./client";
import { AccessTradeError, unwrapSuccessFlag } from "./envelopes";
import {
  isRaw,
  normalizeEach,
  optHttpUrl,
  optId,
  optMoney,
  optNumber,
  optString,
  reqHttpUrl,
  reqString,
  type Raw,
  type Skipped,
} from "./normalize";
import { asId, parseAtTimestamp, parseStringBool } from "./parse";

const ISCLIX_DEEP_LINK = /^(https:\/\/go\.isclix\.com\/deep_link\/\d+)\?url=([\s\S]+)$/;
const ALREADY_ENCODED = /^https?%3A/i;

/**
 * `prod_link` của voucher nối thẳng URL đích vào `?url=` mà không mã hoá, nên `&signature=...&voucherCode=...`
 * của URL đích bị đọc thành tham số của link deep_link và rơi khỏi trang đích. Mã hoá lại phần URL đích.
 * Link không đúng dạng go.isclix.com/deep_link/<số>?url=... hoặc đã mã hoá thì giữ nguyên.
 */
export function fixProdLink(prodLink: string): string {
  const match = ISCLIX_DEEP_LINK.exec(prodLink);
  if (!match || ALREADY_ENCODED.test(match[2])) return prodLink;
  return `${match[1]}?url=${encodeURIComponent(match[2])}`;
}

export interface VoucherCode {
  code: string;
  description: string | null;
  /** Số tiền tiết kiệm (đồng), nếu có. */
  saveAmount: number | null;
  /** Mã loại mã giảm giá, chưa có bảng giá trị trong tài liệu. */
  type: number | null;
}

export interface VoucherCategory {
  /** Mã ngành, vd "EC-29". */
  code: string;
  name: string | null;
}

export interface Voucher {
  /** Id dạng chuỗi, vd "shopee-198385957076992" hoặc "5756834766452765293". */
  id: string;
  name: string;
  /** Văn bản chưa lọc từ bên thứ ba: phải sanitize trước khi hiển thị. */
  content: string | null;
  merchant: string | null;
  /** Id chiến dịch dài (19 chữ số). */
  campaignId: string | null;
  /** Id chiến dịch ngắn, vd "322". */
  campaignShortId: string | null;
  campaignName: string | null;
  codes: VoucherCode[];
  categories: VoucherCategory[];
  /** Link trang khuyến mại của sàn, đã kiểm tra là http(s). */
  url: string;
  /** Link affiliate đã mã hoá lại URL đích (xem `fixProdLink`). */
  affLink: string;
  imageUrl: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isHot: boolean;
  /** Phần trăm lượt đã dùng, 0 đến 100. */
  percentageUsed: number;
  discountValue: number;
  discountPercentage: number;
  coinCap: number;
  coinPercentage: number;
  maxValue: number;
  minSpend: number;
  shopId: string | null;
  status: number | null;
}

function optTime(value: unknown): Date | null {
  return value === undefined || value === null ? null : parseAtTimestamp(value);
}

/** `shop_id` khi `null`, khi `0`, khi là số: chỉ số dương mới là id thật. */
function shopIdOf(value: unknown): string | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? String(value) : null;
}

function normalizeCodes(value: unknown): VoucherCode[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRaw).flatMap((entry) => {
    const code = optString(entry, "coupon_code");
    if (code === null) return [];
    return [
      {
        code,
        description: optString(entry, "coupon_desc"),
        saveAmount: optMoney(entry, "coupon_save"),
        type: optNumber(entry, "coupon_type"),
      },
    ];
  });
}

function normalizeCategories(value: unknown): VoucherCategory[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRaw).flatMap((entry) => {
    const code = optString(entry, "category_name");
    return code === null ? [] : [{ code, name: optString(entry, "category_name_show") }];
  });
}

export function normalizeVoucher(raw: Raw): Voucher {
  return {
    id: asId(raw.id, "id"),
    name: reqString(raw, "name"),
    content: optString(raw, "content"),
    merchant: optString(raw, "merchant"),
    campaignId: optId(raw, "campaign_id"),
    campaignShortId: optId(raw, "campaign"),
    campaignName: optString(raw, "campaign_name"),
    codes: normalizeCodes(raw.coupons),
    categories: normalizeCategories(raw.categories),
    url: reqHttpUrl(raw, "link"),
    affLink: fixProdLink(reqHttpUrl(raw, "prod_link")),
    imageUrl: optHttpUrl(raw, "image"),
    startsAt: optTime(raw.start_date),
    endsAt: optTime(raw.end_date),
    isHot: raw.is_hot === undefined || raw.is_hot === null ? false : parseStringBool(raw.is_hot),
    percentageUsed: optNumber(raw, "percentage_used") ?? 0,
    discountValue: optMoney(raw, "discount_value") ?? 0,
    discountPercentage: optNumber(raw, "discount_percentage") ?? 0,
    coinCap: optMoney(raw, "coin_cap") ?? 0,
    coinPercentage: optNumber(raw, "coin_percentage") ?? 0,
    maxValue: optMoney(raw, "max_value") ?? 0,
    minSpend: optMoney(raw, "min_spend") ?? 0,
    shopId: shopIdOf(raw.shop_id),
    status: optNumber(raw, "status"),
  };
}

/**
 * Còn dùng được tại `now`: đang chạy (`status` 1), đã bắt đầu, chưa hết hạn (mốc hết hạn không tính),
 * và chưa hết lượt. Danh sách của AccessTrade vẫn trả cả voucher đã dùng hết (`percentage_used: 100`).
 */
export function isVoucherActive(voucher: Voucher, now: Date): boolean {
  if (voucher.status !== null && voucher.status !== 1) return false;
  if (voucher.percentageUsed >= 100) return false;
  if (voucher.startsAt && now.getTime() < voucher.startsAt.getTime()) return false;
  if (voucher.endsAt && now.getTime() >= voucher.endsAt.getTime()) return false;
  return true;
}

export interface VoucherPage {
  vouchers: Voucher[];
  /** Bản ghi bị bỏ qua vì hỏng, kèm lý do. */
  skipped: Skipped[];
  count: number | null;
  currentCount: number | null;
  upcomingCount: number | null;
  /** Chỉ biết khi người gọi truyền `limit`: dựa vào số bản ghi trả về. */
  hasMore: boolean;
}

function checkPaging(limit: number | undefined, page?: number): void {
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
    throw new RangeError("limit phải là số nguyên từ 1");
  }
  if (page !== undefined && (!Number.isInteger(page) || page < 1)) {
    throw new RangeError("page phải là số nguyên từ 1");
  }
}

function parseVoucherPage(json: unknown, limit: number | undefined): VoucherPage {
  const data = unwrapSuccessFlag(json);
  if (!isRaw(data) || !Array.isArray(data.data)) {
    throw new AccessTradeError("envelope", "Phản hồi thiếu data.data");
  }
  const { items, skipped } = normalizeEach(data.data, normalizeVoucher);
  return {
    vouchers: items,
    skipped,
    count: optNumber(data, "count"),
    currentCount: optNumber(data, "count_current_day_coupon"),
    upcomingCount: optNumber(data, "count_next_day_coupon"),
    hasMore: limit !== undefined && data.data.length >= limit,
  };
}

type Requester = Pick<AccessTradeClient, "request">;

export interface VoucherListQuery {
  merchant?: string;
  keyword?: string;
  /** true: sắp diễn ra; false: đang diễn ra. */
  upcoming?: boolean;
  limit?: number;
  page?: number;
}

/** Danh sách mã khuyến mại (`/coupon` ở chế độ liệt kê). */
export async function listVouchers(client: Requester, query: VoucherListQuery = {}): Promise<VoucherPage> {
  checkPaging(query.limit, query.page);
  const json = await client.request("GET", "/v1/offers_informations/coupon", {
    query: {
      merchant: query.merchant,
      keyword: query.keyword,
      is_next_day_coupon: query.upcoming,
      limit: query.limit,
      page: query.page,
    },
  });
  return parseVoucherPage(json, query.limit);
}

/** Tìm mã khuyến mại theo link sản phẩm (`/coupon` ở chế độ `URL`; tài liệu nói chỉ hỗ trợ Shopee và Tiki). */
export async function findVouchersByUrl(client: Requester, url: string): Promise<VoucherPage> {
  let protocol: string;
  try {
    protocol = new URL(url).protocol;
  } catch {
    throw new RangeError("url không hợp lệ");
  }
  if (protocol !== "https:" && protocol !== "http:") throw new RangeError("url phải là http hoặc https");
  const json = await client.request("GET", "/v1/offers_informations/coupon", { query: { URL: url } });
  return parseVoucherPage(json, undefined);
}

export interface HotVoucherQuery {
  limit?: number;
  /** `week` là hot theo tuần, `month` là theo tháng. */
  period?: "week" | "month";
}

export async function listHotVouchers(client: Requester, query: HotVoucherQuery = {}): Promise<VoucherPage> {
  checkPaging(query.limit);
  const json = await client.request("GET", "/v1/offers_informations/coupon_hot", {
    query: {
      limit: query.limit,
      date: query.period === "week" ? 1 : query.period === "month" ? 2 : undefined,
    },
  });
  return parseVoucherPage(json, query.limit);
}

export interface VoucherMerchant {
  /** Id dài 19 chữ số, dạng chuỗi. */
  id: string;
  displayName: string;
  loginName: string | null;
  logoUrl: string | null;
  totalOffer: number;
}

export function normalizeVoucherMerchant(raw: Raw): VoucherMerchant {
  return {
    id: asId(raw.id, "id"),
    displayName: reqString(raw, "display_name"),
    loginName: optString(raw, "login_name"),
    logoUrl: optHttpUrl(raw, "logo"),
    totalOffer: optNumber(raw, "total_offer") ?? 0,
  };
}

export interface VoucherKeyword {
  /** Vd "shopee-181427514064896". */
  id: string;
  iconText: string;
  totalOffer: number;
}

export function normalizeVoucherKeyword(raw: Raw): VoucherKeyword {
  return {
    id: asId(raw.id, "id"),
    iconText: reqString(raw, "icon_text"),
    totalOffer: optNumber(raw, "total_offer") ?? 0,
  };
}

async function listSimple<T>(
  client: Requester,
  path: string,
  normalize: (raw: Raw) => T,
): Promise<{ items: T[]; skipped: Skipped[] }> {
  const data = unwrapSuccessFlag(await client.request("GET", path));
  if (!Array.isArray(data)) throw new AccessTradeError("envelope", "Phản hồi thiếu mảng data");
  return normalizeEach(data, normalize);
}

export async function listVoucherMerchants(
  client: Requester,
): Promise<{ merchants: VoucherMerchant[]; skipped: Skipped[] }> {
  const { items, skipped } = await listSimple(client, "/v1/offers_informations/merchant_list", normalizeVoucherMerchant);
  return { merchants: items, skipped };
}

export async function listVoucherKeywords(
  client: Requester,
): Promise<{ keywords: VoucherKeyword[]; skipped: Skipped[] }> {
  const { items, skipped } = await listSimple(client, "/v1/offers_informations/keyword_list", normalizeVoucherKeyword);
  return { keywords: items, skipped };
}
