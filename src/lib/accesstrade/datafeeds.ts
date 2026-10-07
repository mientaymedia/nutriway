import type { AccessTradeClient } from "./client";
import { unwrapList } from "./envelopes";
import {
  normalizeEach,
  optHttpUrl,
  optMoney,
  optNumber,
  optString,
  reqHttpUrl,
  reqMoney,
  reqString,
  type Raw,
  type Skipped,
} from "./normalize";
import { asId, parseAtTimestamp, toDdMmYyyy } from "./parse";

export const DATAFEED_DEFAULT_LIMIT = 50;
export const DATAFEED_MAX_LIMIT = 200;

export interface DatafeedProduct {
  /** Id dạng chuỗi, vd "224_AN273FAAA1FXLXVNAMZ-2293380". */
  productId: string;
  sku: string | null;
  name: string;
  merchant: string | null;
  campaign: string | null;
  domain: string | null;
  category: string | null;
  url: string;
  /** Link affiliate, đã kiểm tra là http(s). */
  affLink: string;
  imageUrl: string | null;
  /** Giá gốc (đồng). */
  price: number;
  /** Giá SAU khuyến mại (đồng). Field `discount` của AccessTrade là giá sau giảm, không phải số tiền giảm. */
  salePrice: number;
  /** Số tiền được giảm (đồng). */
  discountAmount: number;
  discountRate: number;
  hasDiscount: boolean;
  updatedAt: Date | null;
  /** Văn bản hoặc HTML chưa lọc từ bên thứ ba: phải sanitize trước khi hiển thị. */
  description: string | null;
}

export function normalizeDatafeedProduct(raw: Raw): DatafeedProduct {
  const price = reqMoney(raw, "price");
  const updateTime = raw.update_time;
  return {
    productId: asId(raw.product_id, "product_id"),
    sku: optString(raw, "sku"),
    name: reqString(raw, "name"),
    merchant: optString(raw, "merchant"),
    campaign: optString(raw, "campaign"),
    domain: optString(raw, "domain"),
    category: optString(raw, "cate"),
    url: reqHttpUrl(raw, "url"),
    affLink: reqHttpUrl(raw, "aff_link"),
    imageUrl: optHttpUrl(raw, "image"),
    price,
    salePrice: optMoney(raw, "discount") ?? price,
    discountAmount: optMoney(raw, "discount_amount") ?? 0,
    discountRate: optNumber(raw, "discount_rate") ?? 0,
    hasDiscount: raw.status_discount === 1 || raw.status_discount === "1",
    updatedAt: updateTime === undefined || updateTime === null ? null : parseAtTimestamp(updateTime),
    description: optString(raw, "desc"),
  };
}

export interface DatafeedQuery {
  campaign?: string;
  domain?: string;
  priceFrom?: number;
  priceTo?: number;
  /** Lọc theo giá sau khuyến mại. */
  discountFrom?: number;
  discountTo?: number;
  discountAmountFrom?: number;
  discountAmountTo?: number;
  discountRateFrom?: number;
  discountRateTo?: number;
  statusDiscount?: 0 | 1;
  updatedFrom?: Date;
  updatedTo?: Date;
  page?: number;
  /** 1 đến 200, mặc định 50. */
  limit?: number;
}

export interface DatafeedPage {
  products: DatafeedProduct[];
  /** Bản ghi bị bỏ qua vì hỏng, kèm lý do. */
  skipped: Skipped[];
  total: number | null;
  /** Dựa vào số bản ghi trả về, không tin `total`. */
  hasMore: boolean;
}

export async function listDatafeeds(
  client: Pick<AccessTradeClient, "request">,
  query: DatafeedQuery = {},
): Promise<DatafeedPage> {
  const limit = query.limit ?? DATAFEED_DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > DATAFEED_MAX_LIMIT) {
    throw new RangeError(`limit phải là số nguyên từ 1 đến ${DATAFEED_MAX_LIMIT}`);
  }
  if (query.page !== undefined && (!Number.isInteger(query.page) || query.page < 1)) {
    throw new RangeError("page phải là số nguyên từ 1");
  }

  const json = await client.request("GET", "/v1/datafeeds", {
    query: {
      campaign: query.campaign,
      domain: query.domain,
      price_from: query.priceFrom,
      price_to: query.priceTo,
      discount_from: query.discountFrom,
      discount_to: query.discountTo,
      discount_amount_from: query.discountAmountFrom,
      discount_amount_to: query.discountAmountTo,
      discount_rate_from: query.discountRateFrom,
      discount_rate_to: query.discountRateTo,
      status_discount: query.statusDiscount,
      update_from: query.updatedFrom && toDdMmYyyy(query.updatedFrom),
      update_to: query.updatedTo && toDdMmYyyy(query.updatedTo),
      page: query.page,
      limit,
    },
  });
  const { items, total } = unwrapList(json);
  const { items: products, skipped } = normalizeEach(items, normalizeDatafeedProduct);
  return { products, skipped, total, hasMore: items.length >= limit };
}
