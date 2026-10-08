import { describe, expect, it, vi } from "vitest";
import type { AccessTradeClient } from "./client";
import { AccessTradeError } from "./envelopes";
import {
  findVouchersByUrl,
  fixProdLink,
  isVoucherActive,
  listHotVouchers,
  listVoucherKeywords,
  listVoucherMerchants,
  listVouchers,
  normalizeVoucher,
} from "./offers";

const TARGET = "https://shopee.vn/search?promotionId=198385957076992&signature=832e&voucherCode=LAROPH120&ref=sansandeals";

const voucher = {
  banner: [],
  campaign: "322",
  campaign_id: "4751584435713464237",
  campaign_name: "Shopee Việt Nam Smartlink cho tất cả thiết bị",
  categories: [{ category_name: "EC-29", category_name_show: "Other", category_no: "" }],
  coin_cap: 0,
  coin_percentage: 0,
  content: "La Roche-Posay Chính Hãng",
  coupons: [{ coupon_code: "LAROPH120", coupon_desc: "Giảm 120,000 VNĐ cho đơn tối thiểu 1,000,000 VNĐ" }],
  ctime: "Sat, 02 Oct 2021 17:04:21 GMT",
  discount_percentage: 0,
  discount_value: 0,
  end_date: "Sat, 02 Oct 2021 23:59:00 GMT",
  id: "shopee-198385957076992",
  image: "https://img.example/lrp.jpg",
  is_hot: "False",
  link: TARGET,
  max_value: 0,
  merchant: "shopee",
  min_spend: 0,
  name: "[La Roche-Posay Chính Hãng]-Giảm 120,000 VNĐ",
  percentage_used: 27,
  prod_link: `https://go.isclix.com/deep_link/9999999999?url=${TARGET}`,
  register: 1,
  shop_id: 37251700,
  start_date: "Sat, 02 Oct 2021 00:18:00 GMT",
  status: 1,
  time_left: "Còn lại 0 ngày 6 giờ 55 phút",
};

const hotVoucher = {
  ...voucher,
  id: "5756834766452765293",
  is_hot: "True",
  coupons: [{ coupon_code: "NAFNEWBUYT9", coupon_desc: "VOUCHER GIẢM 20K", coupon_save: "20000", coupon_type: 5 }],
  ctime: { $date: 1632996182570 },
  start_date: { $date: 1632960000000 },
  end_date: { $date: 1633305600000 },
  shop_id: 0,
};

function fakeClient(body: unknown) {
  const request = vi.fn<AccessTradeClient["request"]>(async () => body);
  return { client: { request }, request };
}

function pageBody(items: unknown[]) {
  return {
    success: true,
    data: { count: 29, count_current_day_coupon: 29, count_next_day_coupon: 0, data: items },
  };
}

describe("fixProdLink", () => {
  const broken = "https://go.isclix.com/deep_link/9999999999?url=https://shopee.vn/search?promotionId=1&signature=abc&voucherCode=LAROPH120&ref=x";

  it("link gốc làm voucherCode rơi khỏi URL đích", () => {
    const params = new URL(broken).searchParams;
    expect(params.get("url")).toBe("https://shopee.vn/search?promotionId=1");
    expect(params.get("voucherCode")).toBe("LAROPH120");
  });

  it("mã hoá lại để URL đích giữ nguyên mọi tham số", () => {
    const params = new URL(fixProdLink(broken)).searchParams;
    expect(params.get("url")).toBe("https://shopee.vn/search?promotionId=1&signature=abc&voucherCode=LAROPH120&ref=x");
    expect([...params.keys()]).toEqual(["url"]);
  });

  it("giữ nguyên link đã mã hoá, link lạ và link không có url", () => {
    const encoded = "https://go.isclix.com/deep_link/9999999999?url=https%3A%2F%2Fshopee.vn%2Fa%3Fb%3D1";
    expect(fixProdLink(encoded)).toBe(encoded);
    const other = "https://example.com/x?url=https://a.example/c?d=1&e=2";
    expect(fixProdLink(other)).toBe(other);
    const bare = "https://go.isclix.com/deep_link/9999999999";
    expect(fixProdLink(bare)).toBe(bare);
  });
});

describe("normalizeVoucher", () => {
  it("chuẩn hoá voucher của /coupon (ngày RFC 1123)", () => {
    const v = normalizeVoucher(voucher);
    expect(v).toMatchObject({
      id: "shopee-198385957076992",
      merchant: "shopee",
      campaignId: "4751584435713464237",
      campaignShortId: "322",
      isHot: false,
      percentageUsed: 27,
      shopId: "37251700",
      status: 1,
      discountValue: 0,
    });
    expect(v.startsAt?.toISOString()).toBe("2021-10-02T00:18:00.000Z");
    expect(v.endsAt?.toISOString()).toBe("2021-10-02T23:59:00.000Z");
    expect(v.codes).toEqual([
      { code: "LAROPH120", description: "Giảm 120,000 VNĐ cho đơn tối thiểu 1,000,000 VNĐ", saveAmount: null, type: null },
    ]);
    expect(v.categories).toEqual([{ code: "EC-29", name: "Other" }]);
  });

  it("mã hoá lại URL đích trong affLink để không mất voucherCode", () => {
    const v = normalizeVoucher(voucher);
    expect(v.affLink).not.toContain("&voucherCode");
    expect(v.affLink).toContain("%26voucherCode%3DLAROPH120");
    expect(new URL(v.affLink).searchParams.get("url")).toBe(TARGET);
  });

  it("chuẩn hoá voucher của /coupon_hot (ngày Mongo, is_hot True, shop_id 0)", () => {
    const v = normalizeVoucher(hotVoucher);
    expect(v.isHot).toBe(true);
    expect(v.shopId).toBeNull();
    expect(v.startsAt?.toISOString()).toBe(new Date(1632960000000).toISOString());
    expect(v.endsAt?.toISOString()).toBe(new Date(1633305600000).toISOString());
    expect(v.codes[0]).toEqual({ code: "NAFNEWBUYT9", description: "VOUCHER GIẢM 20K", saveAmount: 20000, type: 5 });
  });

  it("is_hot vắng thì là false", () => {
    expect(normalizeVoucher({ ...voucher, is_hot: undefined }).isHot).toBe(false);
  });

  it("bỏ qua mã không có coupon_code", () => {
    const v = normalizeVoucher({ ...voucher, coupons: [{ coupon_desc: "thiếu mã" }, { coupon_code: "OK1" }] });
    expect(v.codes.map((c) => c.code)).toEqual(["OK1"]);
  });

  it("từ chối voucher thiếu trường bắt buộc hoặc link độc hại", () => {
    expect(() => normalizeVoucher({ ...voucher, id: undefined })).toThrow(/id/);
    expect(() => normalizeVoucher({ ...voucher, name: "" })).toThrow(/name/);
    expect(() => normalizeVoucher({ ...voucher, link: undefined })).toThrow(/link/);
    expect(() => normalizeVoucher({ ...voucher, prod_link: "javascript:alert(1)" })).toThrow(/http/);
    expect(() => normalizeVoucher({ ...voucher, end_date: "hôm qua" })).toThrow(RangeError);
  });
});

describe("isVoucherActive", () => {
  const v = normalizeVoucher(voucher);
  const during = new Date("2021-10-02T12:00:00Z");

  it("đang chạy trong khoảng bắt đầu đến hết hạn", () => {
    expect(isVoucherActive(v, during)).toBe(true);
  });

  it("chưa bắt đầu hoặc đã hết hạn thì không dùng được, mốc hết hạn không tính", () => {
    expect(isVoucherActive(v, new Date("2021-10-01T00:00:00Z"))).toBe(false);
    expect(isVoucherActive(v, new Date("2021-10-02T23:59:00Z"))).toBe(false);
    expect(isVoucherActive(v, new Date("2021-10-03T00:00:00Z"))).toBe(false);
  });

  it("hết lượt hoặc không ở trạng thái chạy thì không dùng được", () => {
    expect(isVoucherActive({ ...v, percentageUsed: 100 }, during)).toBe(false);
    expect(isVoucherActive({ ...v, status: 0 }, during)).toBe(false);
  });

  it("không có mốc thời gian thì coi là không giới hạn", () => {
    expect(isVoucherActive({ ...v, startsAt: null, endsAt: null }, new Date("2030-01-01T00:00:00Z"))).toBe(true);
  });
});

describe("listVouchers", () => {
  it("gọi đúng đường dẫn và đổi tên tham số", async () => {
    const { client, request } = fakeClient(pageBody([]));
    await listVouchers(client, { merchant: "4742147753565840242", keyword: "shopee-1", upcoming: true, limit: 10, page: 2 });
    expect(request.mock.calls[0][0]).toBe("GET");
    expect(request.mock.calls[0][1]).toBe("/v1/offers_informations/coupon");
    expect(request.mock.calls[0][2]).toMatchObject({
      query: { merchant: "4742147753565840242", keyword: "shopee-1", is_next_day_coupon: true, limit: 10, page: 2 },
    });
  });

  it("trả voucher, bộ đếm và liệt kê bản ghi hỏng kèm lý do", async () => {
    const { client } = fakeClient(pageBody([voucher, { ...voucher, name: "" }, "rác"]));
    const page = await listVouchers(client, { limit: 50 });
    expect(page.vouchers).toHaveLength(1);
    expect([page.count, page.currentCount, page.upcomingCount]).toEqual([29, 29, 0]);
    expect(page.skipped.map((s) => s.index)).toEqual([1, 2]);
    expect(page.hasMore).toBe(false);
  });

  it("hasMore chỉ biết khi có limit", async () => {
    const { client } = fakeClient(pageBody([voucher, voucher]));
    expect((await listVouchers(client, { limit: 2 })).hasMore).toBe(true);
    expect((await listVouchers(client)).hasMore).toBe(false);
  });

  it("báo lỗi khi success không phải true hoặc thiếu data.data", async () => {
    await expect(listVouchers(fakeClient({ success: false, message: "lỗi" }).client)).rejects.toBeInstanceOf(AccessTradeError);
    await expect(listVouchers(fakeClient({ success: true, data: {} }).client)).rejects.toBeInstanceOf(AccessTradeError);
  });

  it("từ chối limit và page sai trước khi gọi mạng", async () => {
    const { client, request } = fakeClient(pageBody([]));
    await expect(listVouchers(client, { limit: 0 })).rejects.toThrow(RangeError);
    await expect(listVouchers(client, { page: 0 })).rejects.toThrow(RangeError);
    expect(request).not.toHaveBeenCalled();
  });
});

describe("findVouchersByUrl", () => {
  it("gửi tham số URL viết hoa", async () => {
    const { client, request } = fakeClient(pageBody([voucher]));
    const page = await findVouchersByUrl(client, "https://shopee.vn/product/1/2");
    expect(request.mock.calls[0][2]).toMatchObject({ query: { URL: "https://shopee.vn/product/1/2" } });
    expect(page.vouchers).toHaveLength(1);
  });

  it("từ chối URL không hợp lệ hoặc không phải http(s) trước khi gọi mạng", async () => {
    const { client, request } = fakeClient(pageBody([]));
    await expect(findVouchersByUrl(client, "không phải url")).rejects.toThrow(RangeError);
    await expect(findVouchersByUrl(client, "javascript:alert(1)")).rejects.toThrow(/http/);
    expect(request).not.toHaveBeenCalled();
  });
});

describe("listHotVouchers", () => {
  it("đổi period thành date 1 hoặc 2", async () => {
    const { client, request } = fakeClient(pageBody([hotVoucher]));
    await listHotVouchers(client, { period: "week", limit: 5 });
    await listHotVouchers(client, { period: "month" });
    await listHotVouchers(client);
    expect(request.mock.calls[0][1]).toBe("/v1/offers_informations/coupon_hot");
    expect(request.mock.calls[0][2]).toMatchObject({ query: { date: 1, limit: 5 } });
    expect(request.mock.calls[1][2]).toMatchObject({ query: { date: 2 } });
    expect(request.mock.calls[2][2]?.query?.date).toBeUndefined();
  });
});

describe("listVoucherMerchants và listVoucherKeywords", () => {
  it("giữ id nhà cung cấp 19 chữ số dạng chuỗi", async () => {
    const { client, request } = fakeClient({
      success: true,
      data: [
        { display_name: "Shopee", id: "4742147753565840242", login_name: "shopee", logo: "https://img.example/s.gif", total_offer: 7480 },
        { display_name: "", id: "1" },
      ],
    });
    const { merchants, skipped } = await listVoucherMerchants(client);
    expect(request.mock.calls[0][1]).toBe("/v1/offers_informations/merchant_list");
    expect(merchants).toEqual([
      { id: "4742147753565840242", displayName: "Shopee", loginName: "shopee", logoUrl: "https://img.example/s.gif", totalOffer: 7480 },
    ]);
    expect(skipped).toHaveLength(1);
  });

  it("đọc danh sách từ khoá", async () => {
    const { client } = fakeClient({ success: true, data: [{ icon_text: "ShopeePay", id: "shopee-181427514064896", total_offer: 6 }] });
    expect((await listVoucherKeywords(client)).keywords).toEqual([
      { id: "shopee-181427514064896", iconText: "ShopeePay", totalOffer: 6 },
    ]);
  });

  it("báo lỗi khi data không phải mảng", async () => {
    await expect(listVoucherMerchants(fakeClient({ success: true, data: {} }).client)).rejects.toBeInstanceOf(AccessTradeError);
  });
});
