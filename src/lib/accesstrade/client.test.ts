import { describe, expect, it, vi } from "vitest";
import { createAccessTradeClient, createRateLimiter, type FetchLike } from "./client";
import { AccessTradeError } from "./envelopes";

const KEY = "test-key-khong-phai-khoa-that";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function clientWith(fetchImpl: FetchLike, extra: Partial<Parameters<typeof createAccessTradeClient>[0]> = {}) {
  return createAccessTradeClient({ apiKey: KEY, fetch: fetchImpl, ...extra });
}

async function errorOf(promise: Promise<unknown>): Promise<AccessTradeError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof AccessTradeError) return error;
    throw error;
  }
  throw new Error("Mong đợi bị lỗi nhưng không có");
}

describe("createAccessTradeClient", () => {
  it("từ chối khoá rỗng", () => {
    expect(() => createAccessTradeClient({ apiKey: "  " })).toThrow(/ACCESSTRADE_API_KEY/);
  });

  it("gửi header Token (không phải Bearer) và ghép query, bỏ tham số undefined", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => json({ data: [] }));
    await clientWith(fetchImpl).request("GET", "/v1/datafeeds", {
      query: { limit: 50, domain: "lazada.vn", sku: undefined, tag: ["a", "b"] },
    });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url.toString()).toBe("https://api.accesstrade.vn/v1/datafeeds?limit=50&domain=lazada.vn&tag=a&tag=b");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Token ${KEY}`);
    expect(headers["Content-Type"]).toBe("application/json");
    expect(init.method).toBe("GET");
  });

  it("không bao giờ gửi khoá tới host khác", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => json({}));
    const client = clientWith(fetchImpl);
    await expect(client.request("GET", "//evil.example/x")).rejects.toThrow(/không hợp lệ/);
    await expect(client.request("GET", "https://evil.example/x")).rejects.toThrow(/không hợp lệ/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("HTTP 401 báo lỗi http và không làm lộ khoá", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => new Response("unauthorized", { status: 401 }));
    const error = await errorOf(clientWith(fetchImpl).request("GET", "/v1/campaigns"));
    expect(error.kind).toBe("http");
    expect(error.message).toMatch(/401/);
    expect(error.message).not.toContain(KEY);
    expect(JSON.stringify(error.detail)).not.toContain(KEY);
  });

  it("phản hồi không phải JSON thì báo invalid_json", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => new Response("<html>", { status: 200 }));
    expect((await errorOf(clientWith(fetchImpl).request("GET", "/v1/campaigns"))).kind).toBe("invalid_json");
  });

  it("dừng khi id 19 chữ số bị biến thành số", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => new Response('{"data":[{"id":5585194803623188142}]}'));
    expect((await errorOf(clientWith(fetchImpl).request("GET", "/v1/campaigns"))).kind).toBe("unsafe_integer");
  });

  it("lỗi mạng và quá thời gian chờ được phân biệt", async () => {
    const down = vi.fn<FetchLike>(async () => {
      throw new TypeError("fetch failed");
    });
    expect((await errorOf(clientWith(down).request("GET", "/v1/campaigns"))).kind).toBe("network");

    const hang: FetchLike = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      });
    const slow = clientWith(hang, { timeoutMs: 10 });
    expect((await errorOf(slow.request("GET", "/v1/campaigns"))).kind).toBe("timeout");
  });

  it("nhóm limited đi qua bộ điều tiết, nhóm mặc định thì không", async () => {
    const acquire = vi.fn(async () => undefined);
    const fetchImpl = vi.fn<FetchLike>(async () => json({ data: [] }));
    const client = clientWith(fetchImpl, { limitedThrottle: { acquire } });
    await client.request("GET", "/v1/transactions", { bucket: "limited" });
    await client.request("GET", "/v1/datafeeds");
    expect(acquire).toHaveBeenCalledTimes(1);
  });
});

describe("listCashbackCampaigns", () => {
  const ok = {
    status: "success",
    code: "PX00000",
    data: { campaigns: [{ campaign_id: "4679977611385258995" }], meta: { per_page: 50, current_page: 1, total: 1 } },
  };

  it("gửi page_size và trả campaigns cùng meta", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => json(ok));
    const page = await clientWith(fetchImpl).listCashbackCampaigns({ page: 2, pageSize: 20, sortBy: "max_commission" });
    expect(fetchImpl.mock.calls[0][0].toString()).toBe(
      "https://api.accesstrade.vn/v1/cashback/campaigns?page=2&page_size=20&sort_by=max_commission",
    );
    expect(page.campaigns).toHaveLength(1);
    expect(page.meta.perPage).toBe(50);
  });

  it("báo lỗi khi code khác PX00000 dù HTTP 200", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => json({ ...ok, code: "PX10001", message: "Invalid token" }));
    expect((await errorOf(clientWith(fetchImpl).listCashbackCampaigns())).kind).toBe("envelope");
  });
});

describe("createProductLinks", () => {
  const link = { aff_link: "https://go.isclix.com/x", short_link: null, url_origin: "https://shopee.vn" };
  const input = { campaignId: "4751584435713464237", urls: ["https://shopee.vn/a"], utmContent: "click-123" };

  it("gửi body POST đúng tên trường, bỏ trường undefined", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => json({ success: true, data: { success_link: [link] } }));
    const result = await clientWith(fetchImpl).createProductLinks(input);
    const init = fetchImpl.mock.calls[0][1];
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      campaign_id: "4751584435713464237",
      urls: ["https://shopee.vn/a"],
      utm_content: "click-123",
    });
    expect(result.successLinks[0].affLink).toBe("https://go.isclix.com/x");
  });

  it("gửi urls dạng chuỗi phân tách dấu phẩy khi được yêu cầu", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () =>
      json({ success: true, data: { success_link: [link, link] } }),
    );
    await clientWith(fetchImpl).createProductLinks({
      ...input,
      urls: ["https://shopee.vn/a", "https://shopee.vn/b"],
      urlsAs: "csv",
    });
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1].body)).urls).toBe("https://shopee.vn/a,https://shopee.vn/b");
  });

  it("success true nhưng rụng link thì báo partial, kèm kết quả trong detail", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () =>
      json({ success: true, data: { success_link: [link], error_link: ["https://shopee.vn/b"] } }),
    );
    const error = await errorOf(
      clientWith(fetchImpl).createProductLinks({ ...input, urls: ["https://shopee.vn/a", "https://shopee.vn/b"] }),
    );
    expect(error.kind).toBe("partial");
    expect((error.detail as { successLinks: unknown[] }).successLinks).toHaveLength(1);
  });

  it("kiểm tra đầu vào trước khi gọi mạng", async () => {
    const fetchImpl = vi.fn<FetchLike>(async () => json({}));
    const client = clientWith(fetchImpl);
    await expect(client.createProductLinks({ ...input, campaignId: "322abc" })).rejects.toThrow(/campaignId/);
    await expect(client.createProductLinks({ ...input, urls: [] })).rejects.toThrow(/ít nhất một URL/);
    await expect(client.createProductLinks({ ...input, urls: ["không phải url"] })).rejects.toThrow(/không hợp lệ/);
    await expect(client.createProductLinks({ ...input, urls: ["javascript:alert(1)"] })).rejects.toThrow(/http/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("createRateLimiter", () => {
  it("chờ đến khi cửa sổ trượt có chỗ", async () => {
    let time = 0;
    const sleeps: number[] = [];
    const limiter = createRateLimiter({
      max: 2,
      windowMs: 1000,
      now: () => time,
      sleep: async (ms) => {
        sleeps.push(ms);
        time += ms;
      },
    });
    await limiter.acquire();
    await limiter.acquire();
    expect(sleeps).toEqual([]);
    await limiter.acquire();
    expect(sleeps).toEqual([1000]);
    expect(time).toBe(1000);
  });

  it("xếp hàng nhiều lượt gọi đồng thời, không vượt giới hạn", async () => {
    let time = 0;
    const stamps: number[] = [];
    const limiter = createRateLimiter({
      max: 2,
      windowMs: 1000,
      now: () => time,
      sleep: async (ms) => {
        time += ms;
      },
    });
    await Promise.all(
      [1, 2, 3, 4, 5].map(async () => {
        await limiter.acquire();
        stamps.push(time);
      }),
    );
    expect(stamps).toEqual([0, 0, 1000, 1000, 2000]);
  });
});
