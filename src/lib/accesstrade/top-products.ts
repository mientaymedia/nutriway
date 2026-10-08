import type { AccessTradeClient } from "./client";
import { unwrapList } from "./envelopes";
import {
  normalizeEach,
  optId,
  optImageUrl,
  optMoney,
  optString,
  reqHttpUrl,
  reqMoney,
  reqString,
  salePriceOf,
  type Raw,
  type Skipped,
} from "./normalize";
import { asId, toDdMmYyyy } from "./parse";

export interface TopProduct {
  /** Id dạng chuỗi, vd "B076WVGLXS". */
  productId: string;
  name: string;
  brand: string | null;
  categoryId: string | null;
  categoryName: string | null;
  productCategory: string | null;
  /** Link sản phẩm gốc (field `link`), đã kiểm tra là http(s). */
  url: string;
  /** Link affiliate, đã kiểm tra là http(s). */
  affLink: string;
  imageUrl: string | null;
  /** Giá chưa sale (đồng). */
  price: number;
  /** Giá khuyến mại (đồng). Field `discount` của AccessTrade là giá sau giảm, không phải số tiền giảm. */
  salePrice: number;
  /** Văn bản hoặc HTML chưa lọc từ bên thứ ba: phải sanitize trước khi hiển thị. */
  description: string | null;
  shortDescription: string | null;
}

export function normalizeTopProduct(raw: Raw): TopProduct {
  const price = reqMoney(raw, "price");
  return {
    productId: asId(raw.product_id, "product_id"),
    name: reqString(raw, "name"),
    brand: optString(raw, "brand"),
    categoryId: optId(raw, "category_id"),
    categoryName: optString(raw, "category_name"),
    productCategory: optString(raw, "product_category"),
    url: reqHttpUrl(raw, "link"),
    affLink: reqHttpUrl(raw, "aff_link"),
    imageUrl: optImageUrl(raw, "image"),
    price,
    salePrice: salePriceOf(price, optMoney(raw, "discount")),
    description: optString(raw, "desc"),
    shortDescription: optString(raw, "short_desc"),
  };
}

export interface TopProductsQuery {
  merchant?: string;
  /** Tính theo ngày Việt Nam. */
  from?: Date;
  to?: Date;
}

export interface TopProductsPage {
  products: TopProduct[];
  /** Bản ghi bị bỏ qua vì hỏng, kèm lý do. */
  skipped: Skipped[];
  /** Không đáng tin: tài liệu mẫu trả `total: 1` cho danh sách "50 sản phẩm". Chỉ để tham khảo. */
  total: number | null;
}

/** Endpoint không có phân trang; theo tài liệu trả tối đa khoảng 50 sản phẩm (chưa kiểm chứng). */
export async function listTopProducts(
  client: Pick<AccessTradeClient, "request">,
  query: TopProductsQuery = {},
): Promise<TopProductsPage> {
  if (query.from && query.to && query.from.getTime() > query.to.getTime()) {
    throw new RangeError("from phải trước hoặc bằng to");
  }
  const json = await client.request("GET", "/v1/top_products", {
    query: {
      date_from: query.from && toDdMmYyyy(query.from),
      date_to: query.to && toDdMmYyyy(query.to),
      merchant: query.merchant,
    },
  });
  const { items, total } = unwrapList(json);
  const { items: products, skipped } = normalizeEach(items, normalizeTopProduct);
  return { products, skipped, total };
}
