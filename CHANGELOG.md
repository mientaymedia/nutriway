# Changelog

Theo định dạng [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/). Cập nhật ngay khi xong mỗi tính năng.

## [Chưa phát hành]

### Thêm
- Khung dự án Next.js 16 + TypeScript + Tailwind.
- Tài liệu giai đoạn 0: luồng nghiệp vụ, spec, lộ trình.
- Tài liệu tích hợp AccessTrade Publisher API (20 endpoint, cạm bẫy, câu hỏi cần kiểm chứng).
- Tài liệu tích hợp thanh toán MoMo (tạo giao dịch, chuỗi ký, IPN).
- `.env.example` với giá trị giả; `.gitignore` chặn `.env*`, giấy tờ và file kế toán.
- Lõi gọi AccessTrade (`src/lib/accesstrade/`): chuẩn hoá tiền (`"3.000"` và `"5849.9"`), 7 định dạng thời gian, id dạng chuỗi; bóc 8 kiểu vỏ response, lỗi HTTP 200 của TikTok Shop; bộ điều tiết 10 request/phút; client `cashback/campaigns` và `product_link/create` đối chiếu đủ ba rổ link. Có 59 test, đã kiểm tra bằng cách cố tình phá code để chắc test bắt được lỗi.
- Script `npm test` (vitest) và `npm run typecheck`.
- Endpoint `datafeeds` (`listDatafeeds`): `discount` hiểu đúng là giá sau giảm, ngày `DD-MM-YYYY` theo giờ Việt Nam, `hasMore` dựa vào số bản ghi, `limit` 1 đến 200.
- Endpoint `top_products` (`listTopProducts`): không phân trang, `total` không đáng tin, từ chối `from` sau `to`.
- `normalize.ts`: hàm chuẩn hoá dùng chung; bản ghi hỏng không làm hỏng cả trang mà được ghi vào `skipped` kèm lý do; link chỉ nhận http(s).

### Đổi
- `@types/node` nâng từ `^20` lên `^24` cho khớp Node 24 và vitest 5.
