# AccessTrade Publisher API — Tài liệu tham khảo tích hợp

> Ghi ngày 2026-10-07 từ tài liệu chính thức `developers.accesstrade.vn/api-publisher-vietnamese`.
>
> **Trạng thái: chưa kiểm chứng bằng gọi thật.** Mọi nhận định dưới đây rút ra từ việc đọc tài liệu. Mục 7 liệt kê những điểm bắt buộc phải thử trước khi viết code.

## 1. Thông tin chung

| | |
|---|---|
| Base URL API | `https://api.accesstrade.vn` |
| Trang publisher | `https://pub2.accesstrade.vn` |
| Lấy API key | `https://pub2.accesstrade.vn/profile/api_key` |
| pub_id (Miền Tây Media) | `6236317561687671934` |
| Biến môi trường chứa API key | `ACCESSTRADE_API_KEY` |
| Host affiliate link thật | `go.isclix.com` |

pub_id là định danh công khai: nó nằm trong script SmartTag và trong mọi affiliate link. Dùng cho `pub_id` của SmartTag và `data-accesskey` của widget khuyến mãi.

**API key là bí mật.** Không ghi vào file này, không commit, không dán vào trang HTML. Phía server đọc từ biến môi trường `ACCESSTRADE_API_KEY`.

Đặt biến (chạy trong terminal của bạn, không qua công cụ AI, để key không vào lịch sử chat):

```
setx ACCESSTRADE_API_KEY "<key>"
```

Mở terminal mới để biến có hiệu lực.

## 2. Cảnh báo bảo mật

- **Tài liệu chính thức để lộ một API token thật**, bắt đầu bằng `bg1F-`, xuất hiện 5 lần (trang transactions, TikTok search v1, create link v1, create link v2). Đó là credential của người khác. **Không dùng** — gọi API bằng nó là truy cập trái phép.
- **pubID `4348611760548105593` có trong mọi ví dụ** — tài khoản demo/QA của AccessTrade. Không dùng snippet nào mà chưa thay số này, nếu không hoa hồng chảy về tài khoản đó.
- Widget khuyến mãi: hướng dẫn bảo thay `data-accesskey="1111"`, nhưng code mẫu thật chứa `4348611760548105593`. Đi tìm `1111` sẽ không thấy, rất dễ để nguyên.
- `data-accesskey` (widget) là **pub_id**, công khai. `Authorization: Token <key>` (API) là **khoá bí mật**. Trùng tên, khác hẳn — không bao giờ nhét API key vào HTML.
- Link lấy key trong doc ghi `http://` — luôn tự gõ `https://`.

## 3. Xác thực và quy ước

Mọi request:

```
Authorization: Token <ACCESSTRADE_API_KEY>
Content-Type: application/json
```

- Scheme là `Token`, **không phải** `Bearer`. Sai scheme → 401.
- Vài ví dụ trong doc viết `token` chữ thường; trang Authentication nhấn mạnh `Token`. Dùng `Token`.
- Ví dụ trong doc hay dùng host dev: `api-v1.dev.accesstrade.me`, `tracking.dev.accesstrade.me`, `shorten.dev.accesstrade.me`. **Không hardcode, không validate theo các host này.** Link thật ra `go.isclix.com`.
- Một ví dụ có URL hai dấu gạch (`api.accesstrade.vn//v1/...`) — dùng một gạch.

### Lỗi

Bảng lỗi chính thức:

| HTTP | Ý nghĩa |
|---|---|
| 400 | Request sai |
| 401 | Sai API key |
| 403 | Chỉ dành cho admin |
| 404 | Không tìm thấy API |
| 405 | Sai method |

Nhưng:

- **TikTok Shop trả lỗi bằng HTTP 200** kèm `status: false` (doc ghi rõ). Kiểm tra `response.ok` là không đủ.
- **Không có 429** trong bảng dù có rate limit. Vượt giới hạn thì trả gì: chưa biết.

### Rate limit

| Endpoint | Giới hạn |
|---|---|
| `/v1/transactions` | 10 request / phút |
| `/v1/order-list` | 10 request / phút, cache 1 phút |
| `/v1/order-products` | 10 request / phút |
| Các endpoint khác | Không ghi — vẫn nên điều tiết |

10/phút = một request mỗi 6 giây. Ba endpoint trên nên dùng chung một bộ điều tiết.

## 4. Bảng tổng hợp endpoint

| # | Method | Path | Mục đích | Vỏ | Phân trang |
|---|---|---|---|---|---|
| 1 | GET | `/v1/campaigns` | Danh sách chiến dịch (bản cũ) | A | `limit`+`page` (không có trong bảng param) |
| 2 | GET | `/v1/cashback/campaigns` | Danh sách chiến dịch chuẩn hoá, có hoa hồng | C | `page`+`page_size`, đọc `meta` |
| 3 | POST | `/v1/product_link/create` | Tạo tracking link | D | — |
| 4 | GET | `/v1/transactions` | Giao dịch (theo từng sản phẩm) | B | `page`+`offset`+`limit` |
| 5 | GET | `/v1/order-list` | Đơn hàng v2 | B | `page`+`limit` (mặc định 30, trần 300) |
| 6 | GET | `/v1/order-products` | Sản phẩm trong một đơn | B | `page`+`limit` |
| 7 | GET | `/v1/product_detail` | Chi tiết sản phẩm đã phát sinh giao dịch | H | — |
| 8 | GET | `/v1/datafeeds` | Datafeed sản phẩm | B | `page`+`limit` (mặc định 50, trần 200) |
| 9 | GET | `/v1/top_products` | Sản phẩm bán chạy | B | — |
| 10 | GET | `/v1/tiktokshop_product_feeds` | TikTok Shop search v1 | E | cursor `page_token` |
| 11 | GET | `/v2/tiktokshop_product_feeds` | TikTok Shop search v2 | E | cursor `page_token` |
| 12 | POST | `/v1/tiktokshop_product_feeds/create_link` | Tạo link TikTok v1 | E | — |
| 13 | POST | `/v2/tiktokshop_product_feeds/create_link` | Tạo link TikTok v2 | E | — |
| 14 | GET | `/v1/offers_informations/keyword_list` | Từ khoá chiến dịch hot | G | — |
| 15 | GET | `/v1/offers_informations/merchant_list` | Nhà cung cấp có khuyến mãi | G | — |
| 16 | GET | `/v1/offers_informations/icontext_list` | Từ khoá voucher của một nhà cung cấp | ? | — |
| 17 | GET | `/v1/offers_informations/coupon` | Voucher — 3 chế độ, xem 5.6 | F | `limit`+`page` |
| 18 | GET | `/v1/offers_informations/list_category_coupons` | Ngành của khuyến mãi | G | — |
| 19 | GET | `/v1/offers_informations/coupon_hot` | Voucher ưu tiên | F | `limit` |
| 20 | GET | `/v1/offers_informations` | Khuyến mãi (bản cũ, **đã ngừng khuyến nghị**) | A | `limit`+`page` |

### Các kiểu vỏ response

| Mã | Dạng | Cách phát hiện lỗi |
|---|---|---|
| A | `{ data: [] }` | Chỉ có HTTP status |
| B | `{ data: [], total }` | Chỉ có HTTP status |
| C | `{ status: "success", data: { campaigns, meta }, message, code: "PX00000" }` | `code !== "PX00000"` |
| D | `{ data: { success_link, error_link, suspend_url }, success: true }` | `success !== true` **và** đối chiếu ba rổ |
| E | `{ data, status: true/false, message }` | `status === false` (HTTP vẫn 200) |
| F | `{ data: { count, …, data: [] }, success: true }` — lồng `data.data` | `success !== true` |
| G | `{ data: [], success: true }` | `success !== true` |
| H | Object trần, không vỏ | Chỉ có HTTP status |

Không viết một hàm bóc vỏ dùng chung.

## 5. Chi tiết theo nhóm

### 5.1 Campaign

**`GET /v1/campaigns`**

Param: `approval=successful` (chỉ chiến dịch đã được duyệt), `campaign_id`. Ví dụ dùng thêm `limit`, `page` dù bảng param không ghi.

Field chính: `id`, `name`, `approval` (`unregistered` / `pending` / `successful`), `status` (`1` = đang chạy, **kiểu số**), `merchant`, `cookie_duration`, `cookie_policy`, `description.*` (HTML), `start_time`, `end_time`, `category`, `sub_category`, `type`, `url`, `logo`, `scope`.

- Bảng mô tả có `total` nhưng response mẫu không có.
- `cookie_duration: 0` trong khi `description.cookie_policy` ghi 30 ngày — không tin field số.
- `category` / `sub_category` rỗng trong mẫu.
- `type: -1` — không có bảng giá trị.

**`GET /v1/cashback/campaigns`** — nên dùng thay bản cũ.

Param: `page` (mặc định 1), `page_size`, `category_id`, `sort_by` (`min_commission` / `max_commission`), `sort_order` (`asc` / `desc`), `sort_by_category` (bool).

Field chính: `campaign_id`, `name`, `min_commission`, `max_commission`, `commission_type` (`percentage` / `fixed`), `all_commissions[]` (`id`, `category_id`, `category_name`, `is_default`, …), `category_id`, `category_name`, `sub_category`, `categories`, `status` (`"1"` — **kiểu chuỗi**), `cookie_expire` (giây; `2592000` = 30 ngày, khớp mô tả), `merchant`, `adv_code`, `url`, `logo`, `scope`, `approval`, `gross_commission` (không ghi đơn vị), `start_date`, `end_date`, `type`, `description.*` (HTML). Kèm `meta: { per_page, current_page, total }`.

**Không tương thích với bản cũ**: `id` → `campaign_id`, `cookie_duration` → `cookie_expire`, `start_time`/`end_time` → `start_date`/`end_date`, `status` số → chuỗi (`status === 1` thành `false`).

- Ví dụ gửi `page_size=20` nhưng `meta.per_page` trả `50`.
- Cùng `category_id "7016"` mang hai tên: `"E-COMMERCE"` ở ngoài, `"Sức khỏe - Làm đẹp"` trong `all_commissions`. Không dựng bảng tra id → tên từ dữ liệu này.
- `max_commission: 6.24` trong khi `commission_policy` ghi 8.4%. Có thể 6.24 là phần publisher thực nhận — **hỏi AccessTrade trước khi hiển thị cho người dùng.**
- Bảng mô tả có `campaign_type`, response dùng `type`.

### 5.2 Tracking link

**`POST /v1/product_link/create`**

Body: `campaign_id` (bắt buộc), `urls`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `sub1`–`sub4`, `short_domain` (phải đăng ký trước tại `pub2.accesstrade.vn/tool/parking_domain`). Ví dụ có thêm `url_enc: true` — không có trong bảng.

Response: `data.success_link[]` (`aff_link`, `short_link`, `url_origin`, `first_link`), `data.error_link[]`, `data.suspend_url[]`, `success`.

- **`success: true` không có nghĩa mọi link đều tạo được.** Đối chiếu số URL gửi đi với `success_link.length`.
- `suspend_url` không được giải thích ở đâu.
- `urls`: bảng ghi chuỗi phân tách bởi dấu phẩy, ví dụ lại gửi mảng JSON.
- Ví dụ gửi `https://shopee.vn/m/ma-giam-gia` nhưng response trả `url_origin: "https://shopee.vn"` — mất path. **Phải thử.**
- Ví dụ request không có `sub4` nhưng `aff_link` trả về có `sub4=test_sub4` — request và response trong doc không khớp.
- Không tự dựng `aff_link` bằng tay. Cấu trúc: `/deep_link/<pubID>/<campaign_id dài của chiến dịch khớp URL>?…&url=<encoded>`. Segment thứ hai **không** phải `campaign_id` gửi lên — ví dụ gửi `4348614231480407268`, nhận `4751584435713464237` (= "Shopee Việt Nam Smartlink", xác nhận qua dữ liệu voucher ở 5.6).

### 5.3 Đối soát

**`GET /v1/transactions`** — 10 req/phút

Param bắt buộc: `since`, `until` (ISO có `Z`, theo sale time). Tuỳ chọn: `page` (mặc định None), `offset` (mặc định 0), `limit` (mặc định 100), `merchant`, `utm_source`, `utm_campaign`, `utm_medium`, `utm_content`, `status` (0 hold, 1 approved, 2 rejected), `is_confirmed` (0/1), `transaction_id` (nhiều mã phân tách dấu phẩy), `update_time_start`, `update_time_end`, `is_brand_bonus`.

Field chính: `id` (hex 32 ký tự), `transaction_id` (chuỗi chữ-số, vd `230104EETP0VN8`), `conversion_id` (số), `merchant`, `status`, `is_confirmed`, `transaction_value`, `commission`, `product_id`, `product_name`, `product_price`, `product_quantity`, `product_category`, `product_image`, `category_name`, `customer_type`, `conversion_platform`, `click_url`, `click_time`, `transaction_time`, `update_time`, `confirmed_time`, `utm_*`, `utm_term`, `is_brand_bonus`, `reason_rejected`, `_extra` (thiết bị, trình duyệt, `click_user_agent`).

- **Truyền `is_confirmed` mà không truyền `status` → hệ thống tự đặt `status=1`**, mất hết dòng hold và rejected. Luôn truyền `status` tường minh.
- `page`, `offset`, `limit` cùng tồn tại — chưa rõ chúng tương tác thế nào.
- Bảng ghi `reason_reject`, response là `reason_rejected`.
- Response mẫu trong doc bị cắt cụt.
- `_extra` chứa user agent của người click — gần với dữ liệu cá nhân, cân nhắc khi lưu trữ.

**`GET /v1/order-list`** (đơn hàng v2) — 10 req/phút, cache 1 phút

Param bắt buộc: `since`, `until`. Tuỳ chọn: `page` (từ 1), `limit` (mặc định 30, trần 300 — vượt thì **âm thầm** cắt về 300), `utm_*`, `status`, `merchant`.

Field chính: `order_id` (chuỗi chữ-số), `merchant`, `billing` (**số**), `pub_commission`, `products_count`, `order_pending` / `order_reject` / `order_approved` (số item ở mỗi trạng thái, không phải bool), `is_confirmed`, `click_time`, `sales_time`, `confirmed_time`, `update_time`, `at_product_link`, `browser`, `client_platform`, `category_name`, `product_category`, `landing_page`, `website`, `website_url`, `utm_*`. Kèm `total`.

- Hoa hồng tên `pub_commission` ở đây, `commission` ở transactions.
- Mẫu có `is_confirmed: 0` mà vẫn có `confirmed_time`.

**`GET /v1/order-products`** — 10 req/phút

Param bắt buộc: `order_id` (lấy từ order-list), `merchant`. Tuỳ chọn: `page`, `limit`.

Field chính: `_id`, `campaign_id` (**id ngắn**, vd `"677"`), `merchant`, `billing` / `commission` / `quantity` (**object** `{approved, pending, reject}`), `product_price`, `product_quantity`, `click_time`, `sales_time`, `confirmed_time`, `reason_rejected`, `_at` (`banner_id`, `goods_id`, `commission_type`, …), `_extra`.

- `billing` ở đây là object, ở order-list là số.
- Bảng mô tả nói `product_quantity` có tách approved/pending/reject; thực tế phần tách nằm ở `quantity`.
- JSON mẫu trong doc thiếu dấu phẩy, không parse được.

### 5.4 Sản phẩm

**`GET /v1/product_detail`**

Param bắt buộc: `merchant`, `product_id`, `transaction_id`. → Chỉ tra được sản phẩm **đã phát sinh giao dịch**, không phải tra cứu catalog chung.

Response (object trần): `name`, `price`, `discount` (giá **sau** giảm), `short_desc`, `desc`, `link`, `image`, `category_id`, `category_name`, `brand`, `shop_id`, `shop_name`.

- Ví dụ truy vấn `merchant=fpt_longchau` nhưng response là điện thoại Xiaomi trên Shopee năm 2016 — mẫu ghép, không đối chiếu được.

**`GET /v1/datafeeds`**

Param (tuỳ chọn): `campaign`, `domain`, `price_from` / `price_to`, `discount_from` / `discount_to`, `discount_amount_from` / `discount_amount_to`, `discount_rate_from` / `discount_rate_to`, `status_discount` (0/1), `update_from`, `update_to` (**`DD-MM-YYYY`**), `page`, `limit` (mặc định 50, trần 200).

Field chính: `product_id`, `sku`, `name`, `price` (trước giảm), `discount` (sau giảm), `discount_amount`, `discount_rate`, `status_discount`, `campaign`, `merchant`, `domain`, `cate`, `url`, `aff_link` (encode đúng), `image`, `desc`, `promotion`, `update_time` (**`DD-MM-YYYYTHH:MM:SS`**). Kèm `total`.

**`GET /v1/top_products`**

Param (tuỳ chọn): `date_from`, `date_to` (**`DD-MM-YYYY`**), `merchant`.

Field chính: `product_id`, `name`, `price`, `discount`, `link`, `aff_link`, `image`, `category_id`, `category_name`, `product_category`, `brand`, `desc`, `short_desc`. Kèm `total`.

- Bảng param ví dụ `date_from` = `01-04-2016` sau `date_to` = `01-01-2016` — ngược. Ví dụ URL `date_to=20-07-2020` xác nhận định dạng là ngày-tháng.
- Doc nói mẫu là "1 trong số 50 sản phẩm" nhưng `total: 1`.

### 5.5 TikTok Shop

**Search v1 — `GET /v1/tiktokshop_product_feeds`**

Param trong danh sách: `sort_field` (`commission`, `units_sold`, `product_sales_price`, `commission_rate`), `limit`, `title_keywords` (lặp được nhiều lần), `page_token`. Ví dụ curl còn dùng `sort_order`, `amount_ge`, `amount_lt` — không có trong danh sách param.

**Search v2 — `GET /v2/tiktokshop_product_feeds`**

Param: `sort_field` — enum **CHỮ HOA**: `RECOMMENDED` (mặc định), `BEST_SELLERS`, `LOW_PRICE`, `HIGH_PRICE`, `NEWLY_RELEASED`, `HIGH_COMMISSION_RATE`. Thêm `product_ids`, `limit`, `title_keywords`, `page_token`.

- v1 và v2 không dùng chung giá trị `sort_field`.
- Doc gõ sai `HIGH_COMMISSIOM_RATE` ở danh sách gạch đầu dòng; bảng ghi `HIGH_COMMISSION_RATE`. Thử bản đúng chính tả.
- Ghi `sort_field` là bắt buộc nhưng lại nói để trống thì mặc định `RECOMMENDED`.
- Phần "Example" của trang v2 vẫn dán URL v1.

Response (v1 và v2): `data.products[]`, `data.next_page_token`, `data.total_count`, `status`.

Mỗi sản phẩm: `id`, `title`, `detail_link`, `main_image_url`, `has_inventory`, `units_sold` (có thể vắng mặt), `sale_region`, `shop.name`, `category_chains[]` (tối đa 3 cấp: `id`, `local_name`, `is_leaf`, `parent_id`), `original_price` / `sales_price` (`{currency, minimum_amount, maximum_amount}` — **chuỗi**), `commission` (`{rate, currency, amount}`).

- `commission.rate` là **phần trăm × 100**: `1000` = 10%, `1500` = 15%, `3587` = 35.87%. Doc tự mâu thuẫn ("tối thiểu 1000" nhưng "khoảng [100, 8000]").
- `commission.amount` là chuỗi với hai quy ước dấu chấm — xem mục 6.
- `next_page_token` trông như opaque nhưng thực ra là base64 của `offset=N` (`b2Zmc2V0PTIw` → `offset=20`). Vẫn coi là opaque, đừng tự dựng.
- `total_count: 10000` tròn đáng ngờ — có thể là trần, không phải tổng thật.

**Create link v1 — `POST /v1/tiktokshop_product_feeds/create_link`**

Body: `product_url`, `product_id` (cả hai bắt buộc), `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `sub1`–`sub4`.

**Create link v2 — `POST /v2/tiktokshop_product_feeds/create_link`**

Body: `product_url` (nhận cả link rút gọn `vt.tiktok.com`), `product_id` (tuỳ chọn), `utm_*`, `sub1`–`sub4`. Query `?minify=true` để bỏ thông tin sản phẩm, trả nhanh hơn.

Response v2 thành công: `data.aff_url`, `data.aff_short_url`, `data.product_id`, `data.product_name`, `data.product_image`, `data.product_price {amount, currency}`, `data.product_commission {amount, currency, rate}`, `message`, `status: true`.

Response thất bại — **vẫn HTTP 200**:

```json
{ "data": {}, "message": "The link is not part of the campaign", "status": false }
```

- Phần mô tả ghi `sub_1`…`sub_4`, body JSON thật dùng `sub1`…`sub4`.
- Body mẫu chứa comment `//` — JSON không hợp lệ.
- Bảng header copy nguyên từ devtools trình duyệt (`origin`, `referer`, `sec-ch-ua`, `user-agent`, …). Có bắt buộc hay không: chưa biết.

### 5.6 Khuyến mãi — `/v1/offers_informations/*`

**`GET /keyword_list`** → `data[]`: `id` (vd `shopee-181427514064896`), `icon_text`, `total_offer`. (Trang doc còn sót câu mẫu "This endpoint allows you to get free cakes.")

**`GET /merchant_list`** → `data[]`: `id` (19 số), `display_name`, `login_name`, `logo`, `total_offer`.

**`GET /icontext_list`** — param `merchant` (id lấy từ merchant_list). Field theo bảng: `icon_text`, `merchant`, `total_offer`. **Response mẫu trong doc để trống.**

**`GET /list_category_coupons`** → `data[]`: `type` (vd `E-COMMERCE`), `count`, `category[]` (`category_name` dạng mã như `EC-29`, `category_name_show`, `category_no`).

**`GET /coupon`** — một path, **ba chế độ** tuỳ param:

| Chế độ | Param |
|---|---|
| Theo từ khoá nhà cung cấp | `icon_text` (bắt buộc), `limit` |
| Danh sách mã | `is_next_day_coupon` (true = sắp diễn ra, false = đang diễn ra), `keyword`, `merchant`, `limit`, `page` |
| Tìm theo link sản phẩm (Shopee, Tiki) | `URL` (bắt buộc, nhận cả link rút gọn) |

Doc ghi các param này là "Path Parameters" nhưng thực tế là query param.

**`GET /coupon_hot`** — param `limit`, `date` (1 = hot theo tuần, 2 = theo tháng).

Response của `coupon` và `coupon_hot`: `data.count`, `data.count_current_day_coupon`, `data.count_next_day_coupon`, `data.data[]`. Mỗi voucher: `id`, `name`, `content`, `merchant`, `campaign` (**id ngắn**, vd `"322"`), `campaign_id` (**id dài**, vd `"4751584435713464237"`), `campaign_name`, `coupons[]` (`coupon_code`, `coupon_desc`, `coupon_save`, `coupon_type`), `link`, `prod_link`, `image`, `banner`, `categories[]`, `start_date`, `end_date`, `ctime`, `time_left`, `is_hot`, `percentage_used`, `discount_value`, `discount_percentage`, `coin_cap`, `coin_percentage`, `max_value`, `min_spend`, `shop_id`, `register`, `status`.

- **Mỗi voucher chứa cả hai loại id chiến dịch** — dùng làm bảng ánh xạ id ngắn ↔ id dài.
- `start_date` / `end_date` / `ctime` ở `coupon` là chuỗi RFC 1123 (`"Sat, 02 Oct 2021 00:21:04 GMT"`), ở `coupon_hot` là object Mongo `{"$date": 1632996182570}` (epoch mili-giây).
- `is_hot` là chuỗi `"True"` / `"False"`.
- `prod_link` **không encode** URL đích — xem mục 6.
- `time_left` là câu chữ ("Còn lại 0 ngày 7 giờ 46 phút") tính lúc trả response — không parse, tự tính từ `end_date`.
- `percentage_used: 100` vẫn xuất hiện trong danh sách hot — tự lọc voucher đã hết lượt.
- `discount_value` và `discount_percentage` bằng 0 ngay cả khi mô tả ghi "Giảm 120,000 VNĐ" — số tiền giảm thật nằm ở `coupon_desc` / `coupon_save` (`coupon_save` là chuỗi).
- `shop_id` khi `null`, khi `0`, khi là số.
- `coupon_type` (vd `5`) không có bảng giá trị.
- Bảng mô tả ghi `start_time` / `end_time` / `banners`, response dùng `start_date` / `end_date` / `banner`.

**`GET /v1/offers_informations`** — bản cũ. Doc ghi "vui lòng chuyển sang phiên bản mới", nhưng link "phiên bản mới" lại trỏ tới trang hướng dẫn widget nhúng, không phải một API. Không xây mới trên endpoint này.

Param: `scope=expiring`, `merchant`, `categories` (nhiều giá trị phân tách dấu phẩy), `domain`, `coupon` (1 có mã / 0 không mã), `status` (1 còn hạn / 0 hết hạn), `limit`, `page`. Field: `id`, `name`, `content`, `merchant`, `domain`, `link`, `aff_link` (encode đúng), `image`, `banners`, `categories`, `coupons`, `start_time`, `end_time` (**`YYYY-MM-DD`**).

## 6. Danh mục cạm bẫy

### Tiền

- **`commission.rate` (TikTok) là phần trăm × 100.** Hiển thị thẳng sai gấp 100 lần.
- **`commission.amount` (TikTok) dùng hai quy ước dấu chấm trong cùng một field:**
  - `"5849.900000000001"` — chấm thập phân.
  - `"3.000"` — chấm hàng nghìn, nghĩa là **3000đ**. Kiểm chứng: create link v2 có `product_price "20000"`, `rate 1500` (15%) → 3000đ.
  - `parseFloat("3.000")` = `3` → sai 1000 lần. Cần hàm parse riêng, và **kiểm chứng bằng dữ liệu thật** trước khi tin quy tắc nào.
- **`discount` = giá sau giảm** (product_detail, datafeeds, top_products), không phải số tiền được giảm. Số tiền giảm là `discount_amount`.
- `billing`: số ở order-list, object `{approved, pending, reject}` ở order-products.
- Hoa hồng có ba tên: `commission` (transactions), `pub_commission` (order-list), `commission {approved, pending, reject}` (order-products).
- Giá TikTok là chuỗi.
- `discount_value` của voucher = 0 dù có giảm.

### ID — luôn giữ là chuỗi

- Id 19 chữ số (`campaign_id`, id merchant, pub_id) vượt `Number.MAX_SAFE_INTEGER` (≈ 9.0 × 10¹⁵). `Number()`, `parseInt()`, `+id` đều làm hỏng âm thầm — vd `5585194803623188142` thành `5585194803623188000`. Lưu DB dạng `text`.
- `transaction_id`, `order_id` là chuỗi chữ-số lẫn lộn.
- `product_id` là chuỗi ghép (`224_AN273FAAA1FXLXVNAMZ-2293380`, `brand_bonus_12333534959@shopee@bonus`).
- **Hai hệ `campaign_id`:** ngắn (`"322"`, `"677"` — ở order-products và field `campaign` của voucher) và dài 19 số (campaign API, product_link, field `campaign_id` của voucher). Không join hai hệ trực tiếp.

### Ngày giờ — 7 định dạng

| Định dạng | Ở đâu |
|---|---|
| ISO có `Z` (`2021-01-01T00:00:00Z`) | Param `since` / `until` của transactions, order-list |
| ISO trần, không múi giờ (`2023-03-30T19:51:57`) | Response transactions, order-list, order-products, cashback — **nghi là giờ VN (+07), chưa kiểm chứng** |
| `DD-MM-YYYYTHH:MM:SS` | `update_time` của datafeeds |
| `DD-MM-YYYY` | Param của datafeeds, top_products |
| RFC 1123 (`Sat, 02 Oct 2021 00:21:04 GMT`) | `/offers_informations/coupon` |
| Mongo `{"$date": <epoch ms>}` | `/offers_informations/coupon_hot` |
| `YYYY-MM-DD` | `/offers_informations` bản cũ |

Gửi UTC nhưng nhận giờ trần: nếu đúng là +07 thì đối soát theo ngày lệch 7 tiếng.

### Boolean dạng chuỗi

`is_hot: "False"` — trong JavaScript `"False"` là truthy. So sánh `=== "True"`.

### Filter và mặc định âm thầm

- transactions: `is_confirmed` không kèm `status` → ép `status=1`.
- order-list: `limit > 300` tự cắt về 300.
- cashback: `page_size` có thể không được tôn trọng.
- SmartTag: `utm_source` trên URL của khách đè lên `utm_source` cấu hình trong script.

### Thành công một phần

`product_link/create` trả `success: true` cả khi có link rơi vào `error_link` hoặc `suspend_url`.

### URL không encode

`prod_link` của voucher có dạng:

```
https://go.isclix.com/deep_link/<pubID>?url=https://shopee.vn/search?promotionId=…&signature=…&voucherCode=…
```

URL đích không encode, nên `signature`, `voucherCode`, `ref` có thể bị đọc thành param của link ngoài và rơi khỏi trang đích → voucher không tự áp. Đối chiếu: `aff_link` của datafeeds và offers bản cũ encode đúng (`url=https%3A%2F%2F…`). **Phải thử.** Nếu đúng là mất, tự dựng lại bằng `encodeURIComponent`.

### Tên field lệch giữa bảng mô tả và response

| Bảng mô tả | Response thật | Endpoint |
|---|---|---|
| `reason_reject` | `reason_rejected` | transactions, order-products |
| `campaign_type` | `type` | cashback/campaigns |
| `product_quantity` (có tách trạng thái) | `quantity` | order-products |
| `start_time` / `end_time` | `start_date` / `end_date` | offers coupon |
| `banners` | `banner` | offers coupon |
| `sub_1` … `sub_4` | `sub1` … `sub4` | TikTok create_link |
| `total` | (không có) | `/v1/campaigns` |

Code theo response thật, không theo bảng.

### HTML thô

`description.*` của campaign chứa HTML từ bên thứ ba (`<table>`, `<img>`, `<a target="_blank">`, inline style). Render thẳng là lỗ XSS. Luôn qua sanitizer (vd DOMPurify) hoặc strip về text.

## 7. Câu hỏi phải kiểm chứng bằng gọi thật

Làm trước khi viết code tích hợp. Ghi kết quả ngay vào đây.

1. `product_link/create` có cắt path của URL không? (**Quan trọng nhất** — nếu có, mọi deep link sản phẩm đều hỏng.)
2. `urls` nhận mảng JSON hay chuỗi phân tách dấu phẩy?
3. Endpoint TikTok có bắt buộc header trình duyệt (`origin`, `referer`, `sec-ch-*`) không?
4. Timestamp trần trong response là UTC hay UTC+7? (Đối chiếu một đơn biết giờ đặt.)
5. `page_size` của cashback/campaigns có được tôn trọng không?
6. Endpoint ngoài TikTok báo lỗi bằng HTTP 4xx hay HTTP 200 kèm cờ?
7. Vượt rate limit trả về gì?
8. `prod_link` không encode có làm mất `voucherCode` ở trang đích không?
9. `suspend_url` nghĩa là gì? (Hỏi AccessTrade.)
10. `max_commission` của cashback/campaigns là tỷ lệ publisher thực nhận hay tỷ lệ gộp? (Hỏi AccessTrade.)
11. `commission.amount` của TikTok: quy tắc dấu chấm thực tế là gì?

## 8. Tích hợp phía website

| | SmartTag | Widget khuyến mãi | Gọi API |
|---|---|---|---|
| Làm gì | Tự đổi link merchant thành affiliate link khi khách click | Hiển thị danh sách voucher | Toàn quyền dữ liệu và giao diện |
| Phụ thuộc | Một script | jQuery 1.11.1, Bootstrap CSS toàn cục, slick, Font Awesome | Không |
| Ảnh hưởng site | Script bên thứ ba chặn mọi click | Đè CSS cả trang, phải tắt WP Rocket | Không |
| Khuyến nghị | **Hợp nhất cho site nội dung** | Tránh | Khi cần dữ liệu, đối soát, hiển thị tuỳ biến |

### SmartTag (Autolink)

Tự "tìm" các link trỏ tới merchant trong hệ thống AccessTrade và đổi thành affiliate link khi khách click. Đặt trong `<head>`:

```html
<script type="text/javascript">
  var __atsmarttag = {
    pub_id: '6236317561687671934',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    new_tab: 0
  };
  (function () {
    var script = document.createElement('script');
    script.src = 'https://static.accesstrade.vn/js/v2/atsmarttag.min.js?v=1.1.0';
    script.type = 'text/javascript';
    script.async = true;
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
  })();
</script>
```

- Bản gốc dùng URL tương đối giao thức `//static.accesstrade.vn/…` — ở trên đã đổi sang `https://`.
- `new_tab: 0` = mở cùng tab. **Để trống hoặc giá trị khác = mở tab mới** (ngược với trực giác).
- `utm_source` trên URL của khách sẽ đè `utm_source` cấu hình ở đây.
- Script bên thứ ba có quyền với mọi link trên trang; không gắn được SRI vì nội dung có thể đổi.

### Widget khuyến mãi (và 2 hướng dẫn WordPress)

Hai cách gắn trên WordPress: plugin **Ad Inserter**, hoặc block **Custom HTML** trên một trang riêng. Cả hai nhúng cùng một đoạn code nên mang theo cùng các vấn đề:

- **jQuery 1.11.1** (2014), dính CVE-2020-11022, CVE-2020-11023 (XSS qua thao tác DOM), CVE-2019-11358 (prototype pollution), CVE-2015-9251 (XSS qua ajax cross-domain).
- `bootstrap.min.css` đè style toàn trang, dễ vỡ theme.
- Phải tắt WP Rocket (chính doc thừa nhận).
- Chèn `<meta name="description" content="Default Description">` và `<meta name="robots">` vào giữa body; viewport `maximum-scale=1.0` chặn zoom trên mobile (vi phạm WCAG 1.4.4).
- **Code mẫu chứa pubID của người khác** — xem mục 2.
- Tham số tracking: `data-sub1` … `data-sub5`, `data-utm-source`, `data-utm-medium`, `data-utm-campaign`, `data-utm-content`. `data-filters` có trong code nhưng không được mô tả.

## 9. Checklist khi bắt đầu tích hợp

- [ ] Đã đổi API key (key cũ đã lộ trong lịch sử chat) và đặt key mới vào `ACCESSTRADE_API_KEY`.
- [ ] Đã chạy thử 11 câu hỏi ở mục 7 và ghi kết quả vào file này.
- [ ] Bộ điều tiết request dùng chung cho transactions / order-list / order-products (≤ 10 request/phút).
- [ ] Mỗi endpoint một hàm bóc vỏ riêng, kiểm tra cờ lỗi đúng kiểu (mục 4).
- [ ] Mọi id giữ dạng chuỗi; DB dùng `text`.
- [ ] Hàm parse tiền riêng cho TikTok; `rate / 100`.
- [ ] Chuẩn hoá mọi mốc thời gian về UTC ngay tại biên.
- [ ] `product_link/create`: đối chiếu đủ ba rổ.
- [ ] Sanitize HTML `description.*` trước khi render.
- [ ] Không dùng token có tiền tố `bg1F-` và pubID `4348611760548105593` từ ví dụ trong doc.
