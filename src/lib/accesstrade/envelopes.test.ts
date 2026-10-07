import { describe, expect, it } from "vitest";
import {
  AccessTradeError,
  assertAllLinksCreated,
  assertNoUnsafeIntegers,
  unwrapBareObject,
  unwrapCashback,
  unwrapList,
  unwrapProductLinks,
  unwrapStatusEnvelope,
  unwrapSuccessFlag,
} from "./envelopes";

function kindOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (error) {
    return error instanceof AccessTradeError ? error.kind : "khác";
  }
  return undefined;
}

describe("unwrapList (kiểu A và B)", () => {
  it("lấy data và total", () => {
    expect(unwrapList({ data: [1, 2], total: 589 })).toEqual({ items: [1, 2], total: 589 });
  });

  it("total vắng thì là null", () => {
    expect(unwrapList({ data: [] }).total).toBeNull();
  });

  it("báo lỗi khi thiếu mảng data", () => {
    expect(kindOf(() => unwrapList({ data: {} }))).toBe("envelope");
    expect(kindOf(() => unwrapList(null))).toBe("envelope");
  });
});

describe("unwrapCashback (kiểu C)", () => {
  const ok = {
    status: "success",
    code: "PX00000",
    message: "Success",
    data: { campaigns: [{ campaign_id: "4679977611385258995" }], meta: { per_page: 50, current_page: 1, total: 1 } },
  };

  it("đọc campaigns và meta", () => {
    expect(unwrapCashback(ok)).toEqual({
      campaigns: [{ campaign_id: "4679977611385258995" }],
      meta: { perPage: 50, currentPage: 1, total: 1 },
    });
  });

  it("báo lỗi khi code khác PX00000, dù HTTP có thể là 200", () => {
    expect(kindOf(() => unwrapCashback({ ...ok, code: "PX10001", message: "Invalid" }))).toBe("envelope");
  });

  it("báo lỗi khi status không phải success", () => {
    expect(kindOf(() => unwrapCashback({ ...ok, status: "error" }))).toBe("envelope");
  });

  it("báo lỗi khi thiếu campaigns", () => {
    expect(kindOf(() => unwrapCashback({ ...ok, data: {} }))).toBe("envelope");
  });
});

describe("unwrapProductLinks và assertAllLinksCreated (kiểu D)", () => {
  const link = { aff_link: "https://go.isclix.com/x", short_link: "https://s/abc", url_origin: "https://shopee.vn" };
  const body = (data: unknown) => ({ success: true, data });

  it("đọc success_link", () => {
    const result = unwrapProductLinks(body({ success_link: [link], error_link: [], suspend_url: [] }));
    expect(result.successLinks).toEqual([
      { affLink: "https://go.isclix.com/x", shortLink: "https://s/abc", urlOrigin: "https://shopee.vn" },
    ]);
  });

  it("báo lỗi khi success không phải true", () => {
    expect(kindOf(() => unwrapProductLinks({ success: false, data: {} }))).toBe("envelope");
  });

  it("báo lỗi khi phần tử success_link thiếu aff_link", () => {
    expect(kindOf(() => unwrapProductLinks(body({ success_link: [{}] })))).toBe("envelope");
  });

  it("đủ link thì qua", () => {
    const result = unwrapProductLinks(body({ success_link: [link] }));
    expect(() => assertAllLinksCreated(1, result)).not.toThrow();
  });

  it("success true nhưng rụng link vào error_link thì báo partial", () => {
    const result = unwrapProductLinks(body({ success_link: [link], error_link: ["https://bad"] }));
    expect(kindOf(() => assertAllLinksCreated(2, result))).toBe("partial");
  });

  it("có suspend_url thì báo partial", () => {
    const result = unwrapProductLinks(body({ success_link: [link], suspend_url: ["https://blocked"] }));
    expect(kindOf(() => assertAllLinksCreated(1, result))).toBe("partial");
  });

  it("thiếu link mà không có lỗi nào vẫn báo partial", () => {
    const result = unwrapProductLinks(body({ success_link: [link] }));
    expect(kindOf(() => assertAllLinksCreated(3, result))).toBe("partial");
  });
});

describe("unwrapStatusEnvelope (kiểu E, TikTok Shop)", () => {
  it("status false là lỗi dù HTTP 200, và giữ message", () => {
    expect(() => unwrapStatusEnvelope({ data: {}, message: "The link is not part of the campaign", status: false })).toThrow(
      /not part of the campaign/,
    );
  });

  it("status true trả data", () => {
    expect(unwrapStatusEnvelope({ data: { aff_url: "u" }, message: "ok", status: true })).toEqual({
      data: { aff_url: "u" },
      message: "ok",
    });
  });
});

describe("unwrapSuccessFlag (kiểu F và G)", () => {
  it("trả data khi success true", () => {
    expect(unwrapSuccessFlag({ success: true, data: [1] })).toEqual([1]);
  });

  it("báo lỗi khi success không phải true", () => {
    expect(kindOf(() => unwrapSuccessFlag({ success: false }))).toBe("envelope");
  });
});

describe("unwrapBareObject (kiểu H)", () => {
  it("nhận object, từ chối mảng", () => {
    expect(unwrapBareObject({ name: "a" })).toEqual({ name: "a" });
    expect(kindOf(() => unwrapBareObject([]))).toBe("envelope");
  });
});

describe("assertNoUnsafeIntegers", () => {
  it("dừng khi gặp số nguyên đã mất chữ số và nêu đường dẫn", () => {
    const parsed = JSON.parse('{"data":[{"id":5585194803623188142}]}');
    expect(() => assertNoUnsafeIntegers(parsed)).toThrow(/\$\.data\[0\]\.id/);
    expect(kindOf(() => assertNoUnsafeIntegers(parsed))).toBe("unsafe_integer");
  });

  it("cho qua số thực, số nguyên an toàn và chuỗi dài", () => {
    expect(() =>
      assertNoUnsafeIntegers({ rate: 6.24, total: 589, id: "5585194803623188142", list: [1, 2] }),
    ).not.toThrow();
  });
});
