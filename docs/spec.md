# Spec NutriWay

Tài liệu kỹ thuật cho giai đoạn 1 đến 3. Luồng nghiệp vụ nằm ở [business-flow.md](business-flow.md).

## 1. Công nghệ

| Lớp | Chọn |
|---|---|
| Web + admin | Next.js 16 (App Router), TypeScript, Tailwind |
| CSDL | PostgreSQL 17 trong Docker, truy cập qua Drizzle |
| Tác vụ nền | Bảng `jobs` trong Postgres + một container `worker` |
| Ra Internet | Cloudflare Tunnel (`cloudflared`) cho `nutriway.vn` |
| Thanh toán | `PaymentProvider`: MoMo, SePay (VietQR) |
| Hoá đơn | `InvoiceProvider`: P.A Việt Nam, và `ManualInvoiceProvider` (xuất file) |
| Nguồn sản phẩm | `ProductSource`: AccessTrade, Droppii, tự nhập |

**Next.js 16 có thay đổi so với kiến thức cũ.** Đọc `node_modules/next/dist/docs/` trước khi viết code Next (xem `AGENTS.md`).

## 2. Quy ước dữ liệu (bắt buộc)

- **Tiền**: số nguyên đồng (`bigint`), không dùng số thực. Hiển thị mới định dạng.
- **Id từ bên ngoài** (AccessTrade, Droppii, MoMo, Shopee, Lazada): luôn `text`. Id AccessTrade dài 19 chữ số, vượt giới hạn số nguyên an toàn của JavaScript.
- **Thời gian**: `timestamptz`, lưu UTC. Chuẩn hoá ngay tại biên đồng bộ. AccessTrade trả giờ trần không kèm múi giờ, nhiều khả năng là UTC+7 (**cần kiểm chứng**, xem tài liệu tích hợp).
- **Boolean từ ngoài**: chuỗi `"False"` là truthy trong JS. Chuyển đổi tường minh ở biên.
- **HTML từ ngoài** (`description` của AccessTrade, nội dung Droppii): luôn qua bộ lọc (sanitize) trước khi hiển thị.

## 3. Bảng dữ liệu

### Danh mục và sản phẩm

| Bảng | Cột chính |
|---|---|
| `products` | `id`, `source` (`accesstrade`/`droppii`/`own`), `external_id`, `slug`, `name`, `merchant`, `is_mall`, `price`, `sale_price`, `images[]`, `description_html` (đã lọc), `sold_count`, `status` (`pending`/`approved`/`hidden`), `affiliate_campaign_id`, `synced_at` |
| `categories` | `id`, `slug`, `name`, `parent_id`, `sort` |
| `product_categories` | `product_id`, `category_id` |
| `campaigns` | `id`, `at_campaign_id_long`, `at_campaign_id_short`, `merchant`, `cookie_seconds`, `commission_min`, `commission_max`, `commission_type` |
| `vouchers` | `id`, `at_offer_id`, `merchant`, `code`, `description`, `starts_at`, `ends_at`, `target_url` |

Một sản phẩm tự bán (`own`, `droppii`) có thêm bảng `product_variants` (`sku`, `price`, `stock`).

### Affiliate

| Bảng | Cột chính |
|---|---|
| `affiliate_clicks` | `click_id`, `product_id`, `visitor_id`, `utm_source`, `utm_medium`, `utm_campaign`, `referrer`, `created_at` |
| `affiliate_conversions` | `id`, `at_transaction_id`, `click_id` (có thể null), `merchant`, `status` (`hold`/`approved`/`rejected`), `order_value`, `commission`, `sale_time`, `confirmed_time`, `reason_rejected`, `raw` (jsonb) |

### Đơn hàng và thanh toán

| Bảng | Cột chính |
|---|---|
| `orders` | `id`, `code` (dễ đọc, vd `NW-260001`), `status`, `customer_name`, `phone`, `email`, `ship_address`, `subtotal`, `shipping_fee`, `total`, `needs_invoice`, `invoice_buyer` (jsonb: tên, MST, địa chỉ, email), `created_at`, `paid_at` |
| `order_items` | `order_id`, `product_id`, `variant_id`, `name_snapshot`, `unit_price`, `qty`, `supplier` (`own`/`droppii`), `unit_cost` |
| `payments` | `id`, `order_id`, `provider`, `provider_order_id`, `provider_request_id`, `provider_txn_id`, `amount`, `status`, `attempt`, `raw` (jsonb) |
| `refunds` | `id`, `payment_id`, `amount`, `reason`, `status`, `created_at` |

### Hoá đơn và sổ

| Bảng | Cột chính |
|---|---|
| `invoices` | `id`, `order_id`, `kind` (`original`/`adjust`/`replace`), `provider`, `number`, `series`, `status`, `issued_at`, `pdf_url`, `error`, `idempotency_key` (unique theo `order_id` + `kind`) |
| `ledger_entries` | `id`, `kind` (`thu`/`chi`), `number` (`PT-2026-0001`), `amount`, `category`, `ref_type`, `ref_id`, `occurred_on`, `created_by` |
| `sync_runs` | `id`, `source`, `started_at`, `finished_at`, `ok`, `fetched`, `error` |
| `jobs` | `id`, `type`, `payload`, `run_at`, `attempts`, `last_error`, `locked_by` |

## 4. Trạng thái

**Đơn hàng:** `pending_payment` → `paid` → `fulfilling` → `shipped` → `completed`. Từ `pending_payment` sang `cancelled` khi hết hạn. Từ `paid` trở đi có thể sang `refunded` hoặc `partially_refunded`.

**Thanh toán:** `created` → `succeeded` | `failed` | `expired`; `succeeded` → `refunded`.

**Hoá đơn:** `pending` → `issued` | `failed`; `issued` → `adjusted` hoặc `replaced` (tạo hoá đơn mới, hoá đơn gốc giữ nguyên).

Chuyển trạng thái chỉ đi qua **một hàm duy nhất** cho mỗi thực thể, kiểm tra chuyển hợp lệ, và ghi lại ai/cái gì gây ra.

## 5. Trang

**Công khai:** `/` (trang chủ), `/danh-muc/[slug]`, `/san-pham/[slug]`, `/tim-kiem`, `/voucher`, `/go/[productId]` (chuyển hướng affiliate), `/gio-hang`, `/thanh-toan`, `/don-hang/[code]`, các trang chính sách.

**Quản trị (`/admin`):** duyệt sản phẩm, đơn hàng, hoá đơn chờ xuất, báo cáo affiliate (hold/approved/rejected), sổ thu chi, nhật ký đồng bộ.

**Giao diện:** học bố cục chợ điện tử (thanh tìm kiếm lớn, lưới danh mục, khối Shopee Mall / Lazada Mall, deal hot đếm ngược, thẻ sản phẩm có giá gạch và lượt bán). Dùng nhận diện NutriWay, **không sao chép logo hay hình ảnh của Shopee/Lazada**. Mobile-first.

## 6. API nội bộ

| Đường dẫn | Mục đích |
|---|---|
| `GET /api/health` | Kiểm tra sống (CSDL, hàng đợi), dùng cho health check khi deploy |
| `POST /api/checkout` | Tạo đơn từ giỏ, kiểm tra tồn và giá phía máy chủ |
| `POST /api/payments/momo/ipn` | Nhận IPN MoMo |
| `POST /api/payments/sepay/webhook` | Nhận webhook SePay |
| `GET /go/[productId]` | Ghi click, chuyển hướng |

## 7. Bảo mật (bắt buộc)

- **Chữ ký**: IPN MoMo và webhook SePay đều xác thực HMAC-SHA256, so sánh **hằng thời gian**. Sai chữ ký trả 401, không đổi dữ liệu.
- **Idempotent**: nhận cùng một thông báo nhiều lần chỉ đổi trạng thái một lần. Khoá theo `provider_txn_id`.
- **Đối chiếu số tiền**: số tiền trong thông báo phải **bằng** số tiền đơn, khác thì ghi lỗi, không đánh dấu đã thanh toán.
- **Giá lấy từ máy chủ**: không tin giá, số lượng, phí ship do trình duyệt gửi.
- **Bí mật**: chỉ ở biến môi trường, parse bằng `zod` lúc khởi động. Thiếu biến của tích hợp tuỳ chọn thì tắt tích hợp đó, không làm sập site. Không log khoá, chữ ký đầy đủ, hay dữ liệu thẻ.
- **Nhập liệu**: kiểm tra mọi dữ liệu từ khách bằng `zod`. Giới hạn tốc độ cho `/api/checkout`, `/go/*`, đăng nhập quản trị.
- **Quản trị**: đăng nhập riêng, phân quyền theo vai trò (quản trị, kế toán). Kế toán không sửa được sản phẩm; quản trị không xoá được hoá đơn.
- **Redirect affiliate**: `/go/*` chỉ chuyển tới link do AccessTrade tạo cho sản phẩm đã duyệt, **không** nhận URL đích từ tham số truy vấn (tránh open redirect).
- **Quyền riêng tư**: không đặt cookie theo dõi khi khách bật Do Not Track.

## 8. Đồng bộ AccessTrade

Tuân theo toàn bộ các cạm bẫy trong [integrations/accesstrade-api.md](integrations/accesstrade-api.md), đặc biệt:

- Mỗi endpoint một hàm bóc vỏ response riêng, kiểm tra cờ lỗi đúng kiểu. `response.ok` không đủ.
- Giữ mọi id ở dạng chuỗi.
- Bộ điều tiết chung cho nhóm có giới hạn **10 request/phút** (transactions, order-list, order-products).
- Tạo link: đối chiếu `success_link`, `error_link`, `suspend_url`. `success: true` không có nghĩa mọi link đều tạo được.
- `prod_link` của voucher không encode URL đích: tự encode lại trước khi dùng.
- Nhật ký mỗi lần chạy vào `sync_runs`.

## 9. Thanh toán MoMo

Chi tiết ở [integrations/momo.md](integrations/momo.md). Điểm thiết kế:

- Mỗi lần thử thanh toán một đơn tạo `orderId` và `requestId` **mới** (`<mã đơn>-<lần thử>`), vì MoMo yêu cầu duy nhất theo giao dịch.
- Biến môi trường tách TEST và PRODUCTION (mã đối tác và endpoint khác nhau). Mặc định trỏ endpoint **test**.

## 10. Vận hành

- Docker Compose: `web`, `worker`, `postgres`, `cloudflared`.
- Deploy theo tag từ máy dev qua SSH (cùng mạng LAN với `mientaysoft`), có health check và tự quay lui.
- **Chạy `/harden` trước khi mở cho người dùng**: tạo user deploy thay `root`, chỉ cho SSH bằng khoá, tường lửa, fail2ban.
- Sao lưu Postgres hằng đêm **ra ngoài máy chủ**, kiểm tra khôi phục định kỳ.
- Log JSON có cấu trúc, có `request_id`.

## 11. Pháp lý

- Thông báo website TMĐT với Bộ Công Thương (online.gov.vn), gắn biểu tượng đã thông báo ở chân trang.
- Thực phẩm chức năng: có giấy xác nhận nội dung quảng cáo, và dòng cảnh báo *"Thực phẩm này không phải là thuốc, không có tác dụng thay thế thuốc chữa bệnh"* ở trang sản phẩm.
- Trang chính sách: bảo mật, đổi trả, vận chuyển, công bố liên kết tiếp thị.
