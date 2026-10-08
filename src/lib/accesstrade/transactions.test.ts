import { describe, expect, it, vi } from "vitest";
import type { AccessTradeClient } from "./client";
import { AccessTradeError } from "./envelopes";
import { listTransactions, normalizeTransaction, statusFromCode } from "./transactions";

const sample = {
  merchant: "shopee",
  status: 1,
  update_time: "2023-03-30T19:51:57",
  click_url: "https://shopee.vn/universal-link/san-pham?utm_content=click-123",
  conversion_platform: "website",
  utm_campaign: "",
  product_category: "brand_bonus",
  utm_content: "click-123",
  transaction_time: "2023-01-04T09:02:45",
  product_image: "",
  utm_source: "",
  is_brand_bonus: true,
  transaction_value: 262.0,
  _extra: {
    parameters: { click_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    device_type: "pc",
    os: "Windows",
    browser: "Chrome",
  },
  reason_rejected: "",
  category_name: "",
  utm_term: "",
  product_id: "brand_bonus_12333534959@shopee@bonus",
  is_confirmed: 1,
  confirmed_time: "2023-02-28T23:59:59",
  product_price: 262.0,
  id: "95ea6bb766b28ecc419a9b3979ba29c2",
  commission: 225.0,
  customer_type: "",
  conversion_id: 148916905,
  utm_medium: "",
  product_quantity: 1,
  click_time: "2023-01-04T09:02:26",
  product_name: "",
  transaction_id: "230104EETP0VN8",
};

const range = { since: new Date("2023-01-01T00:00:00Z"), until: new Date("2023-01-31T00:00:00Z") };

function fakeClient(body: unknown) {
  const request = vi.fn<AccessTradeClient["request"]>(async () => body);
  return { client: { request }, request };
}

describe("statusFromCode", () => {
  it("đổi 0, 1, 2 thành hold, approved, rejected", () => {
    expect([0, 1, 2].map(statusFromCode)).toEqual(["hold", "approved", "rejected"]);
    expect(statusFromCode("2")).toBe("rejected");
  });

  it("báo lỗi với giá trị lạ thay vì đoán", () => {
    expect(() => statusFromCode(5)).toThrow(/status/);
    expect(() => statusFromCode(undefined)).toThrow(RangeError);
    expect(() => statusFromCode("approved")).toThrow(RangeError);
  });
});

describe("normalizeTransaction", () => {
  it("chuẩn hoá giao dịch mẫu", () => {
    const t = normalizeTransaction(sample);
    expect(t).toMatchObject({
      id: "95ea6bb766b28ecc419a9b3979ba29c2",
      transactionId: "230104EETP0VN8",
      conversionId: "148916905",
      merchant: "shopee",
      status: "approved",
      isConfirmed: true,
      isBrandBonus: true,
      transactionValue: 262,
      commission: 225,
      productId: "brand_bonus_12333534959@shopee@bonus",
      productName: null,
      productQuantity: 1,
      reasonRejected: null,
      utm: { source: null, medium: null, campaign: null, content: "click-123", term: null },
    });
  });

  it("coi giờ trần là UTC+7", () => {
    const t = normalizeTransaction(sample);
    expect(t.transactionTime.toISOString()).toBe("2023-01-04T02:02:45.000Z");
    expect(t.clickTime?.toISOString()).toBe("2023-01-04T02:02:26.000Z");
    expect(t.confirmedTime?.toISOString()).toBe("2023-02-28T16:59:59.000Z");
    expect(t.updateTime?.toISOString()).toBe("2023-03-30T12:51:57.000Z");
  });

  it("bỏ _extra khỏi bản ghi gốc để không giữ user agent của người click", () => {
    const t = normalizeTransaction(sample);
    expect("_extra" in t.raw).toBe(false);
    expect(JSON.stringify(t.raw)).not.toContain("Mozilla");
    expect(t.raw.transaction_id).toBe("230104EETP0VN8");
  });

  it("đọc lý do huỷ ở cả reason_rejected lẫn reason_reject", () => {
    expect(normalizeTransaction({ ...sample, status: 2, reason_rejected: "Hủy đơn hàng." }).reasonRejected).toBe("Hủy đơn hàng.");
    expect(normalizeTransaction({ ...sample, status: 2, reason_rejected: undefined, reason_reject: "Trả hàng" }).reasonRejected).toBe(
      "Trả hàng",
    );
  });

  it("is_confirmed và is_brand_bonus vắng thì là false", () => {
    const t = normalizeTransaction({ ...sample, is_confirmed: undefined, is_brand_bonus: undefined });
    expect(t.isConfirmed).toBe(false);
    expect(t.isBrandBonus).toBe(false);
  });

  it("từ chối giao dịch thiếu trường quyết định tiền hoặc thời gian", () => {
    expect(() => normalizeTransaction({ ...sample, transaction_id: undefined })).toThrow(/transaction_id/);
    expect(() => normalizeTransaction({ ...sample, commission: undefined })).toThrow(/commission/);
    expect(() => normalizeTransaction({ ...sample, transaction_time: undefined })).toThrow(/transaction_time/);
    expect(() => normalizeTransaction({ ...sample, status: 9 })).toThrow(/status/);
  });
});

describe("listTransactions", () => {
  it("đi qua bộ điều tiết và gửi since/until dạng ISO có Z", async () => {
    const { client, request } = fakeClient({ data: [], total: 0 });
    await listTransactions(client, range);
    expect(request.mock.calls[0][0]).toBe("GET");
    expect(request.mock.calls[0][1]).toBe("/v1/transactions");
    expect(request.mock.calls[0][2]).toMatchObject({
      bucket: "limited",
      query: { since: "2023-01-01T00:00:00Z", until: "2023-01-31T00:00:00Z", limit: 100 },
    });
  });

  it("đổi tên và kiểu tham số", async () => {
    const { client, request } = fakeClient({ data: [] });
    await listTransactions(client, {
      ...range,
      status: "rejected",
      isConfirmed: true,
      merchant: "shopee",
      utmContent: "click-123",
      transactionIds: ["230104EETP0VN8", "220602QAVKQKCM"],
      updatedFrom: new Date("2023-02-01T00:00:00Z"),
      updatedTo: new Date("2023-02-05T00:00:00Z"),
      isBrandBonus: false,
      page: 2,
      limit: 50,
    });
    expect(request.mock.calls[0][2]).toMatchObject({
      query: {
        status: 2,
        is_confirmed: 1,
        merchant: "shopee",
        utm_content: "click-123",
        transaction_id: "230104EETP0VN8,220602QAVKQKCM",
        update_time_start: "2023-02-01T00:00:00Z",
        update_time_end: "2023-02-05T00:00:00Z",
        is_brand_bonus: false,
        page: 2,
        limit: 50,
      },
    });
  });

  it("trả giao dịch, liệt kê bản ghi hỏng kèm lý do, hasMore theo số bản ghi", async () => {
    const { client } = fakeClient({ data: [sample, { ...sample, commission: undefined }], total: 99 });
    const page = await listTransactions(client, { ...range, limit: 2 });
    expect(page.transactions).toHaveLength(1);
    expect(page.skipped).toEqual([{ index: 1, reason: "commission: thiếu hoặc không phải số tiền" }]);
    expect(page.total).toBe(99);
    expect(page.hasMore).toBe(true);
  });

  it("chặn bẫy is_confirmed không kèm status trước khi gọi mạng", async () => {
    const { client, request } = fakeClient({ data: [] });
    await expect(listTransactions(client, { ...range, isConfirmed: true })).rejects.toThrow(/status=1/);
    expect(request).not.toHaveBeenCalled();
  });

  it("từ chối tham số sai trước khi gọi mạng", async () => {
    const { client, request } = fakeClient({ data: [] });
    const cases = [
      { ...range, page: 1, offset: 0 },
      { since: range.until, until: range.since },
      { since: range.since, until: range.since },
      { ...range, limit: 0 },
      { ...range, page: 0 },
      { ...range, offset: -1 },
      { ...range, transactionIds: ["a,b"] },
      { ...range, transactionIds: [" "] },
      { ...range, updatedFrom: range.until, updatedTo: range.since },
      { since: new Date("không phải ngày"), until: range.until },
    ];
    for (const query of cases) {
      await expect(listTransactions(client, query)).rejects.toThrow(RangeError);
    }
    expect(request).not.toHaveBeenCalled();
  });

  it("báo lỗi vỏ khi thiếu mảng data", async () => {
    const { client } = fakeClient({ message: "lỗi" });
    await expect(listTransactions(client, range)).rejects.toBeInstanceOf(AccessTradeError);
  });
});
