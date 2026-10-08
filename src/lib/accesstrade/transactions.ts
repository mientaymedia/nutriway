import type { AccessTradeClient } from "./client";
import { unwrapList } from "./envelopes";
import {
  normalizeEach,
  optHttpUrl,
  optId,
  optMoney,
  optNumber,
  optString,
  reqMoney,
  type Raw,
  type Skipped,
} from "./normalize";
import { asId, parseAtTimestamp, parseStringBool, toAtIso } from "./parse";

export type ConversionStatus = "hold" | "approved" | "rejected";

const STATUS_BY_CODE: Record<number, ConversionStatus> = { 0: "hold", 1: "approved", 2: "rejected" };
const CODE_BY_STATUS: Record<ConversionStatus, number> = { hold: 0, approved: 1, rejected: 2 };

/** Mã trạng thái của AccessTrade: 0 hold, 1 approved, 2 rejected. Giá trị lạ thì báo lỗi, không đoán. */
export function statusFromCode(value: unknown): ConversionStatus {
  const code = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  if (typeof code === "number" && code in STATUS_BY_CODE) return STATUS_BY_CODE[code];
  throw new RangeError(`status: không nhận ra giá trị ${String(value)}`);
}

export interface TransactionUtm {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  /** NutriWay đặt `click_id` vào đây khi tạo link, để ghép giao dịch với lượt click. */
  content: string | null;
  term: string | null;
}

export interface Transaction {
  /** Id bản ghi (hex 32 ký tự). */
  id: string;
  /** Mã đơn của sàn, chữ và số lẫn lộn, vd "230104EETP0VN8". */
  transactionId: string;
  conversionId: string | null;
  merchant: string | null;
  status: ConversionStatus;
  isConfirmed: boolean;
  isBrandBonus: boolean;
  /** Giá trị giao dịch (đồng). */
  transactionValue: number;
  /** Hoa hồng cho publisher (đồng). */
  commission: number;
  productId: string | null;
  productName: string | null;
  productPrice: number | null;
  productQuantity: number | null;
  productCategory: string | null;
  categoryName: string | null;
  customerType: string | null;
  conversionPlatform: string | null;
  clickUrl: string | null;
  clickTime: Date | null;
  /** Thời điểm phát sinh giao dịch. Giờ trần của AccessTrade được coi là UTC+7 (chưa kiểm chứng). */
  transactionTime: Date;
  updateTime: Date | null;
  confirmedTime: Date | null;
  utm: TransactionUtm;
  reasonRejected: string | null;
  /** Bản ghi gốc để đối chiếu, đã bỏ `_extra` (thiết bị và user agent của người click). */
  raw: Raw;
}

function optTime(value: unknown): Date | null {
  return value === undefined || value === null || value === "" ? null : parseAtTimestamp(value);
}

function boolOr(value: unknown, fallback: boolean): boolean {
  return value === undefined || value === null ? fallback : parseStringBool(value);
}

export function normalizeTransaction(raw: Raw): Transaction {
  const transactionTime = optTime(raw.transaction_time);
  if (transactionTime === null) throw new RangeError("transaction_time: thiếu thời gian giao dịch");
  return {
    id: asId(raw.id, "id"),
    transactionId: asId(raw.transaction_id, "transaction_id"),
    conversionId: optId(raw, "conversion_id"),
    merchant: optString(raw, "merchant"),
    status: statusFromCode(raw.status),
    isConfirmed: boolOr(raw.is_confirmed, false),
    isBrandBonus: boolOr(raw.is_brand_bonus, false),
    transactionValue: optMoney(raw, "transaction_value") ?? 0,
    commission: reqMoney(raw, "commission"),
    productId: optId(raw, "product_id"),
    productName: optString(raw, "product_name"),
    productPrice: optMoney(raw, "product_price"),
    productQuantity: optNumber(raw, "product_quantity"),
    productCategory: optString(raw, "product_category"),
    categoryName: optString(raw, "category_name"),
    customerType: optString(raw, "customer_type"),
    conversionPlatform: optString(raw, "conversion_platform"),
    clickUrl: optHttpUrl(raw, "click_url"),
    clickTime: optTime(raw.click_time),
    transactionTime,
    updateTime: optTime(raw.update_time),
    confirmedTime: optTime(raw.confirmed_time),
    utm: {
      source: optString(raw, "utm_source"),
      medium: optString(raw, "utm_medium"),
      campaign: optString(raw, "utm_campaign"),
      content: optString(raw, "utm_content"),
      term: optString(raw, "utm_term"),
    },
    // Tài liệu ghi `reason_reject`, response thật là `reason_rejected`: đọc cả hai.
    reasonRejected: optString(raw, "reason_rejected") ?? optString(raw, "reason_reject"),
    raw: Object.fromEntries(Object.entries(raw).filter(([key]) => key !== "_extra")),
  };
}

export const TRANSACTIONS_DEFAULT_LIMIT = 100;

export interface TransactionQuery {
  /** Theo thời điểm phát sinh giao dịch (sale time). */
  since: Date;
  until: Date;
  status?: ConversionStatus;
  /** Phải đi kèm `status`, xem `listTransactions`. */
  isConfirmed?: boolean;
  merchant?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  transactionIds?: readonly string[];
  /** Theo thời điểm cập nhật giao dịch. */
  updatedFrom?: Date;
  updatedTo?: Date;
  isBrandBonus?: boolean;
  /** Dùng `page` hoặc `offset`, không dùng cả hai. */
  page?: number;
  offset?: number;
  limit?: number;
}

export interface TransactionPage {
  transactions: Transaction[];
  /** Bản ghi bị bỏ qua vì hỏng, kèm lý do. */
  skipped: Skipped[];
  total: number | null;
  /** Dựa vào số bản ghi trả về, không tin `total`. */
  hasMore: boolean;
}

function checkOrder(from: Date, to: Date, fromName: string, toName: string): void {
  if (from.getTime() >= to.getTime()) throw new RangeError(`${fromName} phải trước ${toName}`);
}

function checkQuery(query: TransactionQuery, limit: number): void {
  checkOrder(query.since, query.until, "since", "until");
  if (query.updatedFrom && query.updatedTo) checkOrder(query.updatedFrom, query.updatedTo, "updatedFrom", "updatedTo");
  if (query.isConfirmed !== undefined && query.status === undefined) {
    throw new RangeError(
      "Truyền isConfirmed thì phải truyền status: nếu không, AccessTrade tự đặt status=1 và bỏ mất giao dịch hold/rejected",
    );
  }
  if (query.page !== undefined && query.offset !== undefined) {
    throw new RangeError("Chỉ dùng một trong page hoặc offset: tài liệu không nói rõ hai tham số này kết hợp thế nào");
  }
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError("limit phải là số nguyên từ 1");
  if (query.page !== undefined && (!Number.isInteger(query.page) || query.page < 1)) {
    throw new RangeError("page phải là số nguyên từ 1");
  }
  if (query.offset !== undefined && (!Number.isInteger(query.offset) || query.offset < 0)) {
    throw new RangeError("offset phải là số nguyên từ 0");
  }
  for (const id of query.transactionIds ?? []) {
    if (id.trim() === "" || id.includes(",")) throw new RangeError(`transactionIds có mã không hợp lệ: "${id}"`);
  }
}

/** Giao dịch (theo từng sản phẩm). Thuộc nhóm giới hạn 10 request/phút nên đi qua bộ điều tiết của client. */
export async function listTransactions(
  client: Pick<AccessTradeClient, "request">,
  query: TransactionQuery,
): Promise<TransactionPage> {
  const limit = query.limit ?? TRANSACTIONS_DEFAULT_LIMIT;
  const since = toAtIso(query.since);
  const until = toAtIso(query.until);
  checkQuery(query, limit);

  const json = await client.request("GET", "/v1/transactions", {
    bucket: "limited",
    query: {
      since,
      until,
      status: query.status === undefined ? undefined : CODE_BY_STATUS[query.status],
      is_confirmed: query.isConfirmed === undefined ? undefined : query.isConfirmed ? 1 : 0,
      merchant: query.merchant,
      utm_source: query.utmSource,
      utm_medium: query.utmMedium,
      utm_campaign: query.utmCampaign,
      utm_content: query.utmContent,
      transaction_id: query.transactionIds?.join(","),
      update_time_start: query.updatedFrom && toAtIso(query.updatedFrom),
      update_time_end: query.updatedTo && toAtIso(query.updatedTo),
      is_brand_bonus: query.isBrandBonus,
      page: query.page,
      offset: query.offset,
      limit,
    },
  });
  const { items, total } = unwrapList(json);
  const { items: transactions, skipped } = normalizeEach(items, normalizeTransaction);
  return { transactions, skipped, total, hasMore: items.length >= limit };
}
