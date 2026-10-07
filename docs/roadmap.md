# Lộ trình NutriWay

Cập nhật ngay khi xong mỗi tính năng (đã chạy thử). Chi tiết thiết kế ở [spec.md](spec.md).

## Giai đoạn 0 — Spec và khung dự án

- [x] Khung Next.js 16 + TypeScript + Tailwind
- [x] Khởi tạo git, `.gitignore` chặn `.env*`, giấy tờ, file kế toán
- [x] `docs/business-flow.md`, `docs/spec.md`
- [x] Tài liệu tích hợp AccessTrade và MoMo
- [x] `.env.example` (chỉ giá trị giả)
- [ ] Cấu hình tên và email người commit cho git
- [ ] Commit đầu tiên
- [ ] Tạo repo `mientaymedia/nutriway` (private) trên GitHub, nối remote, push

## Giai đoạn 1 — Danh mục và affiliate

- [ ] Kết nối Postgres, Drizzle, migration đầu tiên
- [x] Lõi gọi AccessTrade (`src/lib/accesstrade/`): chuẩn hoá tiền, thời gian, id; bóc vỏ 8 kiểu response; bộ điều tiết 10 request/phút; client `cashback/campaigns` và `product_link/create` (59 test)
- [ ] Các endpoint còn lại: `datafeeds`, `top_products`, voucher, `transactions`, `order-list`, `order-products`
- [ ] Đồng bộ định kỳ vào Postgres: `cashback/campaigns`, `datafeeds`, `top_products`, voucher
- [ ] Chạy thử các câu hỏi cần kiểm chứng ở `integrations/accesstrade-api.md` mục 7
- [ ] Quản trị duyệt sản phẩm
- [ ] `/go/[productId]`: ghi click, tạo link, chuyển hướng
- [ ] Giao diện kiểu chợ điện tử: trang chủ, danh mục, chi tiết, voucher, tìm kiếm
- [ ] SEO: sitemap, meta, dữ liệu có cấu trúc

## Giai đoạn 2 — Tự bán

- [ ] Giỏ hàng, thanh toán, thông tin xuất hoá đơn công ty
- [ ] `PaymentProvider` + MoMo (IPN, chữ ký, idempotent)
- [ ] SePay VietQR + webhook
- [ ] Quản trị đơn hàng

## Giai đoạn 3 — Hoá đơn và đối soát

- [ ] Màn hình "Hoá đơn chờ xuất" + xuất file cho kế toán
- [ ] `InvoiceProvider` P.A Việt Nam (khi có tài liệu API)
- [ ] Hoàn tiền và hoá đơn điều chỉnh
- [ ] Đồng bộ hoa hồng AccessTrade, báo cáo hold / approved / rejected
- [ ] Sổ thu chi, xuất CSV

## Giai đoạn 4 — Droppii

- [ ] `ProductSource` Droppii dùng nguồn dữ liệu chính thức theo thoả thuận
- [ ] Đặt hàng với Droppii từ quản trị, ghi giá vốn

## Giai đoạn 5 — Triển khai và vận hành

- [ ] Docker Compose: `web`, `worker`, `postgres`, `cloudflared`
- [ ] `/harden` trên `mientaysoft` (user deploy, SSH khoá, tường lửa, fail2ban)
- [ ] `scripts/deploy.sh <tag>` có health check và quay lui
- [ ] Sao lưu Postgres ra ngoài máy, thử khôi phục
- [ ] Log có cấu trúc, theo dõi

## Đang chờ từ chủ dự án

1. Cấu hình tên và email người commit cho git (hoặc cho biết dùng danh tính nào).
2. Tạo repo trống `mientaymedia/nutriway` (private) trên GitHub.
3. Đổi API key AccessTrade và đặt vào `ACCESSTRADE_API_KEY` (trong terminal của bạn).
4. Bộ khoá MoMo **TEST** để phát triển (bộ production chỉ dùng khi lên thật).
5. Tài liệu API hoá đơn điện tử của P.A Việt Nam và tài khoản môi trường thử.
6. Nguồn dữ liệu chính thức từ Droppii theo thoả thuận.
7. Cổng thanh toán của ứng dụng "NUTRIWAY" (HMAC-SHA256, hoàn tiền 180 ngày) là cổng nào.
8. Trỏ DNS `nutriway.vn` về Cloudflare.
9. Thông báo website với Bộ Công Thương; giấy xác nhận nội dung quảng cáo thực phẩm chức năng.
