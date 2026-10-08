import { cacheLife } from "next/cache";
import { createAccessTradeClient, type AccessTradeClient } from "./accesstrade/client";
import { listDatafeeds, type DatafeedProduct } from "./accesstrade/datafeeds";
import { listTopProducts, type TopProduct } from "./accesstrade/top-products";
import { isVoucherActive, listVouchers, type Voucher } from "./accesstrade/offers";
import { env, hasAccessTrade } from "./env";

/**
 * Nguồn dữ liệu cho các trang công khai. Mỗi hàm được cache bằng `'use cache'`
 * (Next 16 không cache `fetch` theo mặc định) để không gọi AccessTrade mỗi lượt
 * xem trang. Lỗi và thiếu cấu hình KHÔNG làm sập trang: trả `state` để giao
 * diện hiện đúng trạng thái.
 */

export type CatalogState = "ok" | "not_configured" | "error";

export interface CatalogResult<T> {
  state: CatalogState;
  items: T[];
  /** Lý do khi `state` không phải "ok", để hiện cho quản trị và ghi log. */
  message?: string;
  /** Số bản ghi bị bỏ qua vì dữ liệu hỏng. */
  skippedCount: number;
  /**
   * Mốc thời gian (epoch mili-giây) lúc lấy dữ liệu. Lấy ở đây, bên trong hàm đã
   * cache, vì Next 16 không cho đọc đồng hồ khi dựng trang. Giao diện dùng mốc này
   * để đếm ngược, nhờ vậy số giờ còn lại khớp đúng với lúc lọc.
   */
  asOf: number;
}

function notConfigured<T>(): CatalogResult<T> {
  return {
    state: "not_configured",
    items: [],
    skippedCount: 0,
    asOf: Date.now(),
    message: "Chưa cấu hình ACCESSTRADE_API_KEY",
  };
}

function failed<T>(error: unknown): CatalogResult<T> {
  return {
    state: "error",
    items: [],
    skippedCount: 0,
    asOf: Date.now(),
    message: error instanceof Error ? error.message : String(error),
  };
}

function client(): AccessTradeClient {
  const { ACCESSTRADE_API_KEY } = env();
  if (!ACCESSTRADE_API_KEY) throw new Error("Thiếu ACCESSTRADE_API_KEY");
  return createAccessTradeClient({ apiKey: ACCESSTRADE_API_KEY });
}

/**
 * Chiến dịch dùng cho trang chủ.
 *
 * PHẢI lọc theo chiến dịch. Kiểm chứng ngày 2026-10-08 trên tài khoản thật:
 * gọi `/v1/datafeeds` không lọc thì 200 sản phẩm đầu đều là `30shine_store` với
 * `update_time` năm 2023, và mọi ảnh của nhà cung cấp đó đã bị xoá khỏi CDN
 * (hstatic trả 404). Hai chiến dịch dưới đây có dữ liệu năm 2026.
 *
 * Thêm hoặc bớt tại đây khi có chiến dịch mới được duyệt trên pub2.accesstrade.vn.
 */
export const FEATURED_CAMPAIGNS = ["shopee", "cellphones_cps"] as const;

/**
 * Sản phẩm nổi bật cho trang chủ, gộp từ các chiến dịch còn sống.
 *
 * KHÔNG lọc `statusDiscount`: toàn bộ kho đều có `status_discount: 0`, và gọi kèm
 * `status_discount=1` còn làm AccessTrade trả HTTP 502.
 */
export async function getFeaturedProducts(limit = 24): Promise<CatalogResult<DatafeedProduct>> {
  "use cache";
  cacheLife("hours");
  if (!hasAccessTrade()) return notConfigured();
  try {
    const at = client();
    const perCampaign = Math.max(1, Math.ceil(limit / FEATURED_CAMPAIGNS.length));
    const pages = await Promise.all(
      FEATURED_CAMPAIGNS.map((campaign) => listDatafeeds(at, { campaign, limit: perCampaign })),
    );

    // Sản phẩm không có ảnh hiển thị rất tệ trong lưới, nên bỏ qua.
    const items: DatafeedProduct[] = [];
    const seen = new Set<string>();
    for (const page of pages) {
      for (const product of page.products) {
        if (!product.imageUrl || seen.has(product.productId)) continue;
        seen.add(product.productId);
        items.push(product);
      }
    }

    return {
      state: "ok",
      items: items.slice(0, limit),
      skippedCount: pages.reduce((sum, page) => sum + page.skipped.length, 0),
      asOf: Date.now(),
    };
  } catch (error) {
    return failed(error);
  }
}

/** Sản phẩm bán chạy. */
export async function getBestSellers(): Promise<CatalogResult<TopProduct>> {
  "use cache";
  cacheLife("hours");
  if (!hasAccessTrade()) return notConfigured();
  try {
    const page = await listTopProducts(client());
    return { state: "ok", items: page.products, skippedCount: page.skipped.length, asOf: Date.now() };
  } catch (error) {
    return failed(error);
  }
}

/**
 * Mã khuyến mại còn dùng được. Lọc bằng `isVoucherActive` vì AccessTrade vẫn
 * trả cả voucher hết hạn hoặc đã dùng hết lượt. Dùng mức cache ngắn hơn sản
 * phẩm vì voucher hết hạn theo giờ.
 */
export async function getActiveVouchers(limit = 12): Promise<CatalogResult<Voucher>> {
  "use cache";
  cacheLife("minutes");
  if (!hasAccessTrade()) return notConfigured();
  try {
    const page = await listVouchers(client(), { limit });
    const asOf = Date.now();
    return {
      state: "ok",
      items: page.vouchers.filter((voucher) => isVoucherActive(voucher, new Date(asOf))),
      skippedCount: page.skipped.length,
      asOf,
    };
  } catch (error) {
    return failed(error);
  }
}

export type SortKey = "moi-nhat" | "gia-thap" | "gia-cao" | "giam-nhieu";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "moi-nhat", label: "Mới nhất" },
  { key: "gia-thap", label: "Giá thấp đến cao" },
  { key: "gia-cao", label: "Giá cao đến thấp" },
  { key: "giam-nhieu", label: "Giảm nhiều nhất" },
];

export function isSortKey(value: unknown): value is SortKey {
  return SORT_OPTIONS.some((option) => option.key === value);
}

/** Số trang lấy từ mỗi chiến dịch khi dựng kho duyệt. */
const POOL_PAGES = 3;
const POOL_PAGE_SIZE = 200;

/**
 * Kho sản phẩm để khách duyệt và sắp xếp.
 *
 * `/v1/datafeeds` KHÔNG có tham số sắp xếp, nên phải tải sẵn một kho rồi sắp xếp
 * trong bộ nhớ. Kho này là một phần của 16 triệu sản phẩm, không phải toàn bộ —
 * giao diện nói rõ điều đó thay vì để khách tưởng đang sắp xếp cả kho.
 */
export async function getProductPool(): Promise<CatalogResult<DatafeedProduct>> {
  "use cache";
  cacheLife("hours");
  if (!hasAccessTrade()) return notConfigured();
  try {
    const at = client();
    const requests = FEATURED_CAMPAIGNS.flatMap((campaign) =>
      Array.from({ length: POOL_PAGES }, (_, index) =>
        listDatafeeds(at, { campaign, limit: POOL_PAGE_SIZE, page: index + 1 }),
      ),
    );
    const pages = await Promise.all(requests);

    const items: DatafeedProduct[] = [];
    const seen = new Set<string>();
    for (const page of pages) {
      for (const product of page.products) {
        if (!product.imageUrl || seen.has(product.productId)) continue;
        seen.add(product.productId);
        items.push(product);
      }
    }
    return {
      state: "ok",
      items,
      skippedCount: pages.reduce((sum, page) => sum + page.skipped.length, 0),
      asOf: Date.now(),
    };
  } catch (error) {
    return failed(error);
  }
}

function sorted(items: readonly DatafeedProduct[], sort: SortKey): DatafeedProduct[] {
  const copy = [...items];
  switch (sort) {
    case "gia-thap":
      return copy.sort((a, b) => a.salePrice - b.salePrice);
    case "gia-cao":
      return copy.sort((a, b) => b.salePrice - a.salePrice);
    case "giam-nhieu":
      return copy.sort((a, b) => {
        const rate = (p: DatafeedProduct) => (p.price > 0 ? (p.price - p.salePrice) / p.price : 0);
        return rate(b) - rate(a);
      });
    default:
      return copy.sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
  }
}

export interface ProductListPage {
  items: DatafeedProduct[];
  state: CatalogState;
  /** Tổng số sản phẩm trong kho đang duyệt, không phải toàn bộ kho AccessTrade. */
  poolSize: number;
  page: number;
  totalPages: number;
}

/** Một trang sản phẩm đã sắp xếp. `query` lọc theo tên, bỏ dấu. */
export async function listProducts(options: {
  sort?: SortKey;
  page?: number;
  perPage?: number;
  query?: string;
}): Promise<ProductListPage> {
  const sort = options.sort ?? "moi-nhat";
  const perPage = options.perPage ?? 48;
  const pool = await getProductPool();

  const words = foldText(options.query ?? "").split(/\s+/).filter(Boolean);
  const matched =
    words.length === 0
      ? pool.items
      : pool.items.filter((product) => {
          const haystack = foldText(`${product.name} ${product.merchant ?? ""} ${product.category ?? ""}`);
          return words.every((word) => haystack.includes(word));
        });

  const ordered = sorted(matched, sort);
  const totalPages = Math.max(1, Math.ceil(ordered.length / perPage));
  const page = Math.min(Math.max(1, options.page ?? 1), totalPages);
  return {
    items: ordered.slice((page - 1) * perPage, page * perPage),
    state: pool.state,
    poolSize: ordered.length,
    page,
    totalPages,
  };
}

/** Bỏ dấu để tìm "sua rua mat" ra "sữa rửa mặt". */
export function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/**
 * Sản phẩm liên quan: cùng nhà cung cấp, bỏ chính nó ra.
 * Dựa trên tập đã cache nên không tốn thêm lượt gọi AccessTrade.
 */
export async function getRelatedProducts(
  productId: string,
  merchant: string | null,
  limit = 6,
): Promise<DatafeedProduct[]> {
  "use cache";
  cacheLife("hours");
  const all = await getFeaturedProducts(400);
  const sameShop = all.items.filter(
    (product) => product.productId !== productId && product.merchant === merchant,
  );
  const others = all.items.filter(
    (product) => product.productId !== productId && product.merchant !== merchant,
  );
  // Ưu tiên cùng gian hàng, thiếu thì lấy thêm sản phẩm khác cho đủ hàng.
  return [...sameShop, ...others].slice(0, limit);
}

/**
 * Tìm một sản phẩm theo id, dùng cho trang chi tiết và cho đường dẫn `/go`.
 * Tìm trong cùng tập chiến dịch mà trang chủ hiển thị, nên mọi sản phẩm khách
 * nhìn thấy đều mở được trang chi tiết.
 */
export async function findProduct(productId: string): Promise<DatafeedProduct | null> {
  "use cache";
  cacheLife("hours");
  if (!hasAccessTrade()) return null;
  try {
    const at = client();
    const pages = await Promise.all(
      FEATURED_CAMPAIGNS.map((campaign) => listDatafeeds(at, { campaign, limit: 200 })),
    );
    for (const page of pages) {
      const found = page.products.find((product) => product.productId === productId);
      if (found) return found;
    }
    return null;
  } catch {
    return null;
  }
}
