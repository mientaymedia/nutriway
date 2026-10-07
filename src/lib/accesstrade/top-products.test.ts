import { describe, expect, it, vi } from "vitest";
import type { AccessTradeClient } from "./client";
import { AccessTradeError } from "./envelopes";
import { listTopProducts, normalizeTopProduct } from "./top-products";

const sample = {
  aff_link: "https://go.isclix.com/deep_link/9999999999?url=https%3A%2F%2Ffado.example%2Frazor.html",
  brand: "",
  category_id: "",
  category_name: "Sports & Outdoors",
  desc: null,
  discount: 2869795.0,
  image: "https://img.example/razor.jpg",
  link: "https://fado.example/razor.html",
  name: "Razor Turbo Jetts Electric Heel Wheels - Red",
  price: 2869795.0,
  product_category: "FADOTREN2000000",
  product_id: "B076WVGLXS",
  short_desc: null,
};

function fakeClient(body: unknown) {
  const request = vi.fn<AccessTradeClient["request"]>(async () => body);
  return { client: { request }, request };
}

describe("normalizeTopProduct", () => {
  it("chuẩn hoá bản ghi mẫu, chuỗi rỗng thành null", () => {
    expect(normalizeTopProduct(sample)).toEqual({
      productId: "B076WVGLXS",
      name: "Razor Turbo Jetts Electric Heel Wheels - Red",
      brand: null,
      categoryId: null,
      categoryName: "Sports & Outdoors",
      productCategory: "FADOTREN2000000",
      url: "https://fado.example/razor.html",
      affLink: sample.aff_link,
      imageUrl: "https://img.example/razor.jpg",
      price: 2869795,
      salePrice: 2869795,
      description: null,
      shortDescription: null,
    });
  });

  it("discount là giá khuyến mại thấp hơn giá gốc", () => {
    const product = normalizeTopProduct({ ...sample, price: 3000000, discount: 2500000 });
    expect(product.price).toBe(3000000);
    expect(product.salePrice).toBe(2500000);
  });

  it("giá khuyến mại vắng thì bằng giá gốc", () => {
    expect(normalizeTopProduct({ ...sample, discount: undefined }).salePrice).toBe(2869795);
  });

  it("nhận category_id dạng số và đổi thành chuỗi", () => {
    expect(normalizeTopProduct({ ...sample, category_id: 123 }).categoryId).toBe("123");
    expect(normalizeTopProduct({ ...sample, category_id: "7016" }).categoryId).toBe("7016");
  });

  it("từ chối bản ghi thiếu trường bắt buộc", () => {
    expect(() => normalizeTopProduct({ ...sample, name: undefined })).toThrow(/name/);
    expect(() => normalizeTopProduct({ ...sample, link: undefined })).toThrow(/link/);
    expect(() => normalizeTopProduct({ ...sample, price: "abc" })).toThrow(RangeError);
  });

  it("từ chối link không phải http(s)", () => {
    expect(() => normalizeTopProduct({ ...sample, aff_link: "javascript:alert(1)" })).toThrow(/http/);
  });
});

describe("listTopProducts", () => {
  it("gọi đúng đường dẫn, ngày sang DD-MM-YYYY giờ Việt Nam", async () => {
    const { client, request } = fakeClient({ data: [], total: 0 });
    await listTopProducts(client, {
      merchant: "lazada",
      from: new Date("2020-06-30T17:00:00Z"),
      to: new Date("2020-07-19T17:00:00Z"),
    });
    expect(request.mock.calls[0][0]).toBe("GET");
    expect(request.mock.calls[0][1]).toBe("/v1/top_products");
    expect(request.mock.calls[0][2]).toMatchObject({
      query: { merchant: "lazada", date_from: "01-07-2020", date_to: "20-07-2020" },
    });
  });

  it("không truyền gì thì không gửi tham số nào", async () => {
    const { client, request } = fakeClient({ data: [] });
    await listTopProducts(client);
    const query = request.mock.calls[0][2]?.query ?? {};
    expect(Object.values(query).filter((value) => value !== undefined)).toEqual([]);
  });

  it("trả sản phẩm, liệt kê bản ghi bị bỏ qua kèm lý do", async () => {
    const { client } = fakeClient({ data: [sample, { ...sample, product_id: null }, 42], total: 1 });
    const page = await listTopProducts(client);
    expect(page.products).toHaveLength(1);
    expect(page.total).toBe(1);
    expect(page.skipped.map((s) => s.index)).toEqual([1, 2]);
    expect(page.skipped[0].reason).toMatch(/product_id/);
    expect(page.skipped[1].reason).toBe("phần tử không phải object");
  });

  it("total vắng thì là null", async () => {
    const { client } = fakeClient({ data: [] });
    expect((await listTopProducts(client)).total).toBeNull();
  });

  it("từ chối from sau to trước khi gọi mạng", async () => {
    const { client, request } = fakeClient({ data: [] });
    await expect(
      listTopProducts(client, { from: new Date("2020-07-20T00:00:00Z"), to: new Date("2020-07-01T00:00:00Z") }),
    ).rejects.toThrow(RangeError);
    expect(request).not.toHaveBeenCalled();
  });

  it("báo lỗi vỏ khi thiếu mảng data", async () => {
    const { client } = fakeClient({ message: "lỗi" });
    await expect(listTopProducts(client)).rejects.toBeInstanceOf(AccessTradeError);
  });
});
