# Đưa nutriway.vn lên Vercel

Giai đoạn 1 chỉ là danh mục affiliate: **không có dữ liệu khách hàng, không có đơn hàng, không có hoá đơn**. Vì vậy chạy trên Vercel là hợp lý và nhanh nhất. Khi sang giai đoạn 2 (giỏ hàng, thanh toán, hoá đơn) thì xem lại nơi đặt cơ sở dữ liệu.

## 1. Nối repo

1. Vào `vercel.com` → **Add New** → **Project**.
2. **Import Git Repository** → chọn `mientaymedia/nutriway`. Cần cấp quyền cho tổ chức `mientaymedia` nếu Vercel chưa thấy repo.
3. Framework Vercel tự nhận là **Next.js**. Giữ nguyên mọi thiết lập build mặc định — repo không cần cấu hình riêng.
4. **Chưa bấm Deploy vội**, sang bước 2 đặt biến môi trường trước, để lần build đầu đã có sản phẩm.

## 2. Biến môi trường

Trong màn hình Import (hoặc sau đó ở **Settings → Environment Variables**):

| Tên | Giá trị | Môi trường |
|---|---|---|
| `ACCESSTRADE_API_KEY` | Khoá lấy ở `pub2.accesstrade.vn/profile/api_key` | Production, Preview, Development |
| `ACCESSTRADE_PUB_ID` | `6236317561687671934` | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | `https://nutriway.vn` | Production |

Lưu ý:

- `ACCESSTRADE_API_KEY` là **khoá bí mật**. Chỉ dán vào ô Environment Variables của Vercel, không đưa vào repo, không gửi qua chat.
- Thiếu khoá thì trang vẫn chạy bình thường, chỉ hiện dòng "Danh mục sản phẩm chưa được kết nối" thay cho lưới sản phẩm. Không sập trang.
- Mỗi lần đổi biến phải **Redeploy** thì giá trị mới có hiệu lực.

## 3. Tên miền

1. **Settings → Domains** → thêm `nutriway.vn` và `www.nutriway.vn`.
2. Vercel cấp một địa chỉ CNAME riêng cho dự án này:

   ```
   cb6acb2a98cd0a54.vercel-dns-017.com
   ```

3. Trong Cloudflare, mục **DNS → Records**, thêm đúng hai bản ghi:

   | Type | Name | Target | Proxy status |
   |---|---|---|---|
   | CNAME | `@` | `cb6acb2a98cd0a54.vercel-dns-017.com` | **DNS only** (mây xám) |
   | CNAME | `www` | `cb6acb2a98cd0a54.vercel-dns-017.com` | **DNS only** (mây xám) |

   - Cloudflare tự làm phẳng CNAME ở tên miền gốc nên đặt CNAME cho `@` được, không cần bản ghi A.
   - **Phải để DNS only.** Bật proxy (mây cam) thì Vercel không xác minh được tên miền và không cấp được chứng chỉ, trang sẽ lỗi 525 hoặc lặp chuyển hướng.
   - Nếu `@` hoặc `www` đã có bản ghi A, AAAA hay CNAME cũ thì **xoá trước**, vì trùng tên sẽ xung đột.

4. Quay lại Vercel, chờ trạng thái tên miền chuyển sang **Valid**. Thường vài phút, chậm nhất là theo thời gian TTL cũ.

> Muốn dùng tính năng của Cloudflare (cache, WAF) thì phải đổi cách: trỏ proxy về Vercel và đặt SSL/TLS ở chế độ **Full (strict)**. Chưa cần ở giai đoạn này vì Vercel đã có CDN sẵn.

## 4. Kiểm tra sau khi deploy

- `https://nutriway.vn` trả 200, hiện thương hiệu và mục "Đang giảm giá".
- Nếu đã đặt `ACCESSTRADE_API_KEY`: lưới sản phẩm có hàng. Nếu chưa: hiện dòng "chưa được kết nối" (đúng như thiết kế).
- Bấm một sản phẩm → trang chi tiết → nút "Mua tại …" phải chuyển sang `go.isclix.com` kèm **pub_id của NutriWay** (`6236317561687671934`), **không phải** `4348611760548105593` (tài khoản demo trong tài liệu AccessTrade).
- Thử `nutriway.vn/go/khong-ton-tai` → phải quay về trang chủ, không báo lỗi và không chuyển đi đâu khác.

## 5. Việc còn lại trước khi quảng bá rộng

- [ ] Thông báo website thương mại điện tử với Bộ Công Thương (online.gov.vn), rồi gắn biểu tượng đã thông báo vào chân trang.
- [ ] Viết nội dung ba trang chính sách đang để liên kết trống: bảo mật, đổi trả, công bố liên kết tiếp thị.
- [ ] Với sản phẩm thực phẩm chức năng: có giấy xác nhận nội dung quảng cáo trước khi đăng.
- [ ] Thêm `sitemap.xml`, `robots.txt` và xác minh Google Search Console.

## Tự host (để dành)

Repo đã có `Dockerfile` dùng `output: "standalone"`, chạy bằng người dùng thường. Khi cần chuyển sang VPS:

```
docker build -t nutriway .
docker run -p 3000:3000 -e ACCESSTRADE_API_KEY=... nutriway
```

Khoá bí mật truyền lúc chạy, không bao giờ đưa vào ảnh Docker.
