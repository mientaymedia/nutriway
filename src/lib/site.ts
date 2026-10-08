/**
 * Thông tin pháp lý của doanh nghiệp, khai một nơi rồi dùng chung cho chân trang
 * và các trang chính sách. Luật thương mại điện tử yêu cầu công khai các mục này.
 */
export const COMPANY = {
  legalName: "CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ NUTRIWAY VIỆT NAM",
  shortName: "NutriWay Việt Nam",
  businessId: "0318104064",
  businessIdIssuer: "Sở Tài chính tỉnh An Giang",
  businessIdDate: "16/10/2023",
  address: "12A5 Lê Thị Hồng Gấm, Phường Bình Đức, An Giang",
  phone: "0977504714",
  legalRepresentative: "Đinh Văn Tạo",
} as const;

/** Trang xác nhận đã thông báo website với Bộ Công Thương (online.gov.vn). */
export const MOIT_PROFILE_URL = "https://online.gov.vn/nen-tang/4a1fa158-58a6-4f91-8dbe-252c9e1fbe8d";

/** Số điện thoại dạng bấm gọi được trên di động. */
export const phoneHref = `tel:${COMPANY.phone.replace(/\D/g, "")}`;
