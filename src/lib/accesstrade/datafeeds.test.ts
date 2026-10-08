import { describe, expect, it, vi } from "vitest";
import type { AccessTradeClient } from "./client";
import { listDatafeeds, normalizeDatafeedProduct } from "./datafeeds";
import { AccessTradeError } from "./envelopes";

const sample = {
  aff_link: "https://go.isclix.com/deep_link/9999999999?url=https%3A%2F%2Fwww.lazada.vn%2Fao-thun.html",
  campaign: "lazadaapp",
  cate: "thoi-trang-my-pham",
  desc: null,
  discount: 175000.0,
  discount_amount: 0.0,
  discount_rate: 0.0,
  domain: "lazada.vn",
  image: "https://img.example/ao-thun.jpg",
  merchant: "lazadaapp",
  name: "Áo thun cao cấp",
  price: 175000.0,
  product_id: "224_AN273FAAA1FXLXVNAMZ-2293380",
  promotion: null,
  sku: "AN273FAAA1FXLXVNAMZ-2293380",
  status_discount: 0,
  update_time: "24-07-2018T01:02:19",
  url: "https://www.lazada.vn/ao-thun.html",
};

function fakeClient(body: unknown) {
  const request = vi.fn<AccessTradeClient["request"]>(async () => body);
  return { client: { request }, request };
}

describe("normalizeDatafeedProduct", () => {
  it("chuẩn hoá bản ghi mẫu", () => {
    const product = normalizeDatafeedProduct(sample);
    expect(product).toMatchObject({
      productId: "224_AN273FAAA1FXLXVNAMZ-2293380",
      sku: "AN273FAAA1FXLXVNAMZ-2293380",
      name: "Áo thun cao cấp",
      price: 175000,
      salePrice: 175000,
      discountAmount: 0,
      hasDiscount: false,
      description: null,
    });
    expect(product.updatedAt?.toISOString()).toBe("2018-07-23T18:02:19.000Z");
  });

  it("discount là giá sau giảm, không phải số tiền giảm", () => {
    const product = normalizeDatafeedProduct({
      ...sample,
      price: 200000,
      discount: 150000,
      discount_amount: 50000,
      discount_rate: 25,
      status_discount: 1,
    });
    expect(product).toMatchObject({ price: 200000, salePrice: 150000, discountAmount: 50000, discountRate: 25, hasDiscount: true });
  });

  it("giá sau giảm vắng thì bằng giá gốc", () => {
    expect(normalizeDatafeedProduct({ ...sample, discount: undefined }).salePrice).toBe(175000);
  });

  it("discount = 0 nghĩa là không khuyến mãi, KHÔNG phải giá bằng 0", () => {
    // 18/20 sản phẩm Shopee trả discount: 0 kèm price hợp lệ. Hiểu sai là cả
    // trang hiện "0 đồng".
    const product = normalizeDatafeedProduct({ ...sample, price: 200000, discount: 0 });
    expect(product.salePrice).toBe(200000);
    expect(product.price).toBe(200000);
  });

  it("bỏ qua giá khuyến mãi cao hơn giá gốc", () => {
    expect(normalizeDatafeedProduct({ ...sample, price: 100000, discount: 150000 }).salePrice).toBe(100000);
  });

  it("từ chối bản ghi thiếu trường bắt buộc", () => {
    expect(() => normalizeDatafeedProduct({ ...sample, name: undefined })).toThrow(/name/);
    expect(() => normalizeDatafeedProduct({ ...sample, product_id: null })).toThrow(/product_id/);
  });

  it("từ chối link không phải http(s)", () => {
    expect(() => normalizeDatafeedProduct({ ...sample, aff_link: "javascript:alert(1)" })).toThrow(/http/);
    expect(() => normalizeDatafeedProduct({ ...sample, url: "không phải url" })).toThrow(/URL/);
  });

  it("ảnh hỏng thành null thay vì làm hỏng cả bản ghi", () => {
    expect(normalizeDatafeedProduct({ ...sample, image: "data:image/png;base64,AAAA" }).imageUrl).toBeNull();
  });

  it("từ chối thời gian không nhận ra", () => {
    expect(() => normalizeDatafeedProduct({ ...sample, update_time: "hôm qua" })).toThrow(RangeError);
  });
});

describe("listDatafeeds", () => {
  it("gọi đúng đường dẫn và đổi tên tham số, ngày sang DD-MM-YYYY giờ Việt Nam", async () => {
    const { client, request } = fakeClient({ data: [], total: 0 });
    await listDatafeeds(client, {
      domain: "lazada.vn",
      priceFrom: 1000,
      statusDiscount: 1,
      updatedFrom: new Date("2017-09-07T17:00:00Z"),
      page: 2,
      limit: 10,
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toBe("GET");
    expect(request.mock.calls[0][1]).toBe("/v1/datafeeds");
    expect(request.mock.calls[0][2]).toMatchObject({
      query: { domain: "lazada.vn", price_from: 1000, status_discount: 1, update_from: "08-09-2017", page: 2, limit: 10 },
    });
  });

  it("trả sản phẩm, liệt kê bản ghi bị bỏ qua kèm lý do", async () => {
    const { client } = fakeClient({ data: [sample, { ...sample, name: "" }, "rác"], total: 3 });
    const page = await listDatafeeds(client, { limit: 50 });
    expect(page.products).toHaveLength(1);
    expect(page.total).toBe(3);
    expect(page.skipped).toEqual([
      { index: 1, reason: "name: thiếu hoặc không phải chuỗi" },
      { index: 2, reason: "phần tử không phải object" },
    ]);
    expect(page.hasMore).toBe(false);
  });

  it("hasMore dựa vào số bản ghi trả về", async () => {
    const { client } = fakeClient({ data: [sample, sample], total: 999 });
    expect((await listDatafeeds(client, { limit: 2 })).hasMore).toBe(true);
    expect((await listDatafeeds(client, { limit: 3 })).hasMore).toBe(false);
  });

  it("mặc định limit là 50", async () => {
    const { client, request } = fakeClient({ data: [] });
    await listDatafeeds(client);
    expect(request.mock.calls[0][2]).toMatchObject({ query: { limit: 50 } });
  });

  it("từ chối limit và page sai trước khi gọi mạng", async () => {
    const { client, request } = fakeClient({ data: [] });
    await expect(listDatafeeds(client, { limit: 201 })).rejects.toThrow(RangeError);
    await expect(listDatafeeds(client, { limit: 0 })).rejects.toThrow(RangeError);
    await expect(listDatafeeds(client, { page: 0 })).rejects.toThrow(RangeError);
    expect(request).not.toHaveBeenCalled();
  });

  it("báo lỗi vỏ khi thiếu mảng data", async () => {
    const { client } = fakeClient({ message: "lỗi" });
    await expect(listDatafeeds(client)).rejects.toBeInstanceOf(AccessTradeError);
  });
});
