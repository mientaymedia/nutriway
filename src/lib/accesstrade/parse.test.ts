import { describe, expect, it } from "vitest";
import {
  asId,
  commissionRateToPercent,
  parseAtTimestamp,
  parseStringBool,
  parseVndAmount,
  toAtIso,
} from "./parse";

describe("parseVndAmount", () => {
  it("đọc chuỗi thập phân và làm tròn về đồng", () => {
    expect(parseVndAmount("5849.900000000001")).toEqual({ value: 5850, ambiguous: false });
    expect(parseVndAmount("3249.9").value).toBe(3250);
  });

  it("đọc số nguyên thường", () => {
    expect(parseVndAmount("20000")).toEqual({ value: 20000, ambiguous: false });
    expect(parseVndAmount(89000).value).toBe(89000);
  });

  it('"3.000" mặc định là 3000 đồng nhưng báo mơ hồ', () => {
    expect(parseVndAmount("3.000")).toEqual({ value: 3000, ambiguous: true });
  });

  it('dùng giá trị kỳ vọng để phân xử "3.000"', () => {
    // giá 20000 × 15% = 3000
    expect(parseVndAmount("3.000", 3000)).toEqual({ value: 3000, ambiguous: false });
    expect(parseVndAmount("3.000", 3)).toEqual({ value: 3, ambiguous: false });
  });

  it("nhiều dấu chấm chắc chắn là phân cách nghìn", () => {
    expect(parseVndAmount("1.234.567")).toEqual({ value: 1234567, ambiguous: false });
  });

  it("từ chối chuỗi không phải số tiền", () => {
    for (const bad of ["", "abc", "-5", "1,5", "1.2.3"]) {
      expect(() => parseVndAmount(bad)).toThrow(RangeError);
    }
    expect(() => parseVndAmount(-1)).toThrow(RangeError);
    expect(() => parseVndAmount(Number.NaN)).toThrow(RangeError);
  });
});

describe("commissionRateToPercent", () => {
  it("chia 100", () => {
    expect(commissionRateToPercent(1500)).toBe(15);
    expect(commissionRateToPercent(3587)).toBe(35.87);
  });

  it("từ chối giá trị âm", () => {
    expect(() => commissionRateToPercent(-1)).toThrow(RangeError);
  });
});

describe("parseAtTimestamp", () => {
  it("đọc ISO có Z", () => {
    expect(parseAtTimestamp("2021-01-01T00:00:00Z").toISOString()).toBe("2021-01-01T00:00:00.000Z");
  });

  it("coi giờ trần là UTC+7 theo mặc định", () => {
    expect(parseAtTimestamp("2023-03-30T19:51:57").toISOString()).toBe("2023-03-30T12:51:57.000Z");
  });

  it("đổi được múi giờ của giờ trần", () => {
    const d = parseAtTimestamp("2023-03-30T19:51:57", { bareOffsetMinutes: 0 });
    expect(d.toISOString()).toBe("2023-03-30T19:51:57.000Z");
  });

  it("đọc DD-MM-YYYYTHH:MM:SS của datafeeds", () => {
    expect(parseAtTimestamp("24-07-2018T01:02:19").toISOString()).toBe("2018-07-23T18:02:19.000Z");
  });

  it("đọc DD-MM-YYYY và YYYY-MM-DD", () => {
    expect(parseAtTimestamp("08-09-2017").toISOString()).toBe("2017-09-07T17:00:00.000Z");
    expect(parseAtTimestamp("2021-03-27").toISOString()).toBe("2021-03-26T17:00:00.000Z");
  });

  it("đọc RFC 1123 của coupon", () => {
    expect(parseAtTimestamp("Sat, 02 Oct 2021 00:21:04 GMT").toISOString()).toBe("2021-10-02T00:21:04.000Z");
  });

  it("đọc dạng Mongo của coupon_hot", () => {
    expect(parseAtTimestamp({ $date: 1632996182570 }).toISOString()).toBe(new Date(1632996182570).toISOString());
  });

  it("từ chối ngày không tồn tại và chuỗi lạ", () => {
    expect(() => parseAtTimestamp("31-02-2020")).toThrow(RangeError);
    expect(() => parseAtTimestamp("13-45-2020")).toThrow(RangeError);
    expect(() => parseAtTimestamp("hôm qua")).toThrow(RangeError);
    expect(() => parseAtTimestamp(12345)).toThrow(RangeError);
  });
});

describe("toAtIso", () => {
  it("bỏ phần mili-giây", () => {
    expect(toAtIso(new Date("2021-01-01T00:00:00.000Z"))).toBe("2021-01-01T00:00:00Z");
  });
});

describe("parseStringBool", () => {
  it('"False" là false, không phải truthy', () => {
    expect(parseStringBool("False")).toBe(false);
    expect(parseStringBool("True")).toBe(true);
    expect(parseStringBool(true)).toBe(true);
    expect(parseStringBool(0)).toBe(false);
  });

  it("từ chối giá trị lạ", () => {
    expect(() => parseStringBool("yes")).toThrow(RangeError);
    expect(() => parseStringBool(null)).toThrow(RangeError);
  });
});

describe("asId", () => {
  it("giữ nguyên chuỗi 19 chữ số", () => {
    expect(asId("5585194803623188142")).toBe("5585194803623188142");
  });

  it("nhận số nguyên an toàn", () => {
    expect(asId(322)).toBe("322");
  });

  it("từ chối số đã mất chữ số và chuỗi rỗng", () => {
    expect(() => asId(Number("5585194803623188142"), "campaign_id")).toThrow(/campaign_id/);
    expect(() => asId("")).toThrow(RangeError);
    expect(() => asId(null)).toThrow(RangeError);
  });
});
