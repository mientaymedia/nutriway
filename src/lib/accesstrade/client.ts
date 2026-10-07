import {
  AccessTradeError,
  assertAllLinksCreated,
  assertNoUnsafeIntegers,
  unwrapCashback,
  unwrapProductLinks,
  type CashbackPage,
  type ProductLinkResult,
} from "./envelopes";

export const ACCESSTRADE_BASE_URL = "https://api.accesstrade.vn";
const DEFAULT_TIMEOUT_MS = 30_000;
/** Giới hạn công bố của transactions, order-list, order-products: 10 request mỗi phút. */
const LIMITED_MAX = 10;
const LIMITED_WINDOW_MS = 60_000;
const BODY_PREVIEW_CHARS = 300;

export interface Throttle {
  acquire(): Promise<void>;
}

export interface RateLimiterOptions {
  max: number;
  windowMs: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

/** Cửa sổ trượt: tối đa `max` lượt trong `windowMs`, người đến sau xếp hàng. `now` và `sleep` tiêm vào để test. */
export function createRateLimiter(options: RateLimiterOptions): Throttle {
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const stamps: number[] = [];
  let queue: Promise<void> = Promise.resolve();

  async function take(): Promise<void> {
    for (;;) {
      const t = now();
      while (stamps.length > 0 && t - stamps[0] >= options.windowMs) stamps.shift();
      if (stamps.length < options.max) {
        stamps.push(t);
        return;
      }
      await sleep(stamps[0] + options.windowMs - t);
    }
  }

  return {
    acquire() {
      const turn = queue.then(take);
      queue = turn.catch(() => undefined);
      return turn;
    },
  };
}

export type FetchLike = (input: URL, init: RequestInit) => Promise<Response>;
type QueryValue = string | number | boolean | undefined | readonly string[];

export interface AccessTradeClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: FetchLike;
  timeoutMs?: number;
  /** Bộ điều tiết cho nhóm endpoint giới hạn 10 request/phút. Mặc định: 10/phút, dùng chung trong client này. */
  limitedThrottle?: Throttle;
}

export interface RequestOptions {
  query?: Record<string, QueryValue>;
  body?: unknown;
  /** `limited` là nhóm giới hạn 10 request/phút. */
  bucket?: "default" | "limited";
}

export interface CreateLinksInput {
  /** Id chiến dịch dài, dạng chuỗi chữ số. */
  campaignId: string;
  urls: readonly string[];
  /** Tài liệu mâu thuẫn: bảng ghi chuỗi phân tách dấu phẩy, ví dụ lại gửi mảng. Mặc định mảng, chờ kiểm chứng. */
  urlsAs?: "array" | "csv";
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  sub1?: string;
  sub2?: string;
  sub3?: string;
  sub4?: string;
  shortDomain?: string;
}

export interface CashbackQuery {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  sortBy?: "min_commission" | "max_commission";
  sortOrder?: "asc" | "desc";
}

export interface AccessTradeClient {
  request(method: "GET" | "POST", path: string, options?: RequestOptions): Promise<unknown>;
  listCashbackCampaigns(query?: CashbackQuery): Promise<CashbackPage>;
  createProductLinks(input: CreateLinksInput): Promise<ProductLinkResult>;
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, QueryValue>): URL {
  const base = new URL(baseUrl);
  const url = new URL(path, base);
  // Khoá API chỉ được gửi tới đúng host AccessTrade, kể cả khi `path` bị dùng sai.
  if (!/^\/[^/]/.test(path) || url.origin !== base.origin) {
    throw new Error(`Đường dẫn không hợp lệ: ${path}`);
  }
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined) continue;
    if (typeof value === "object") {
      for (const item of value) url.searchParams.append(key, item);
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

function checkLinkInput(input: CreateLinksInput): void {
  if (!/^\d+$/.test(input.campaignId)) {
    throw new Error("campaignId phải là chuỗi chữ số (id chiến dịch dài của AccessTrade)");
  }
  if (input.urls.length === 0) throw new Error("Cần ít nhất một URL");
  for (const raw of input.urls) {
    let protocol: string;
    try {
      protocol = new URL(raw).protocol;
    } catch {
      throw new Error(`URL không hợp lệ: ${raw}`);
    }
    if (protocol !== "https:" && protocol !== "http:") throw new Error(`URL phải là http hoặc https: ${raw}`);
  }
}

export function createAccessTradeClient(options: AccessTradeClientOptions): AccessTradeClient {
  const apiKey = options.apiKey.trim();
  if (apiKey === "") throw new Error("Thiếu ACCESSTRADE_API_KEY");
  const baseUrl = options.baseUrl ?? ACCESSTRADE_BASE_URL;
  const fetchImpl: FetchLike = options.fetch ?? ((input, init) => fetch(input, init));
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const limited =
    options.limitedThrottle ?? createRateLimiter({ max: LIMITED_MAX, windowMs: LIMITED_WINDOW_MS });

  async function request(
    method: "GET" | "POST",
    path: string,
    opts: RequestOptions = {},
  ): Promise<unknown> {
    const url = buildUrl(baseUrl, path, opts.query);
    if (opts.bucket === "limited") await limited.acquire();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let status: number;
    let ok: boolean;
    let text: string;
    try {
      const res = await fetchImpl(url, {
        method,
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        signal: controller.signal,
      });
      status = res.status;
      ok = res.ok;
      text = await res.text();
    } catch {
      const kind = controller.signal.aborted ? "timeout" : "network";
      throw new AccessTradeError(kind, `${method} ${path}: ${kind === "timeout" ? "quá thời gian chờ" : "lỗi mạng"}`);
    } finally {
      clearTimeout(timer);
    }

    if (!ok) {
      const hint = status === 401 ? " (API key sai hoặc thiếu)" : status === 429 ? " (quá giới hạn request)" : "";
      throw new AccessTradeError("http", `${method} ${path}: HTTP ${status}${hint}`, {
        status,
        body: text.slice(0, BODY_PREVIEW_CHARS),
      });
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new AccessTradeError("invalid_json", `${method} ${path}: phản hồi không phải JSON hợp lệ`, {
        body: text.slice(0, BODY_PREVIEW_CHARS),
      });
    }
    assertNoUnsafeIntegers(json);
    return json;
  }

  return {
    request,

    async listCashbackCampaigns(query = {}) {
      const json = await request("GET", "/v1/cashback/campaigns", {
        query: {
          page: query.page,
          page_size: query.pageSize,
          category_id: query.categoryId,
          sort_by: query.sortBy,
          sort_order: query.sortOrder,
        },
      });
      return unwrapCashback(json);
    },

    async createProductLinks(input) {
      checkLinkInput(input);
      const json = await request("POST", "/v1/product_link/create", {
        body: {
          campaign_id: input.campaignId,
          urls: input.urlsAs === "csv" ? input.urls.join(",") : input.urls,
          utm_source: input.utmSource,
          utm_medium: input.utmMedium,
          utm_campaign: input.utmCampaign,
          utm_content: input.utmContent,
          sub1: input.sub1,
          sub2: input.sub2,
          sub3: input.sub3,
          sub4: input.sub4,
          short_domain: input.shortDomain,
        },
      });
      const result = unwrapProductLinks(json);
      assertAllLinksCreated(input.urls.length, result);
      return result;
    },
  };
}
