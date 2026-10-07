# Luồng nghiệp vụ NutriWay

Website thương mại điện tử của Công ty TNHH Thương mại Dịch vụ Nutriway Việt Nam (`nutriway.vn`) có **hai nguồn doanh thu** chạy song song:

| Nguồn | Khách mua ở đâu | NutriWay thu gì | Hoá đơn |
|---|---|---|---|
| **Affiliate** (Shopee Mall, Lazada Mall qua AccessTrade) | Trên sàn | Hoa hồng từ AccessTrade | Theo kỳ đối soát hoa hồng, **cần kế toán xác nhận** bên nhận hoá đơn |
| **Tự bán** (hàng NutriWay, hàng Droppii) | Trên `nutriway.vn` | Doanh thu bán hàng | NutriWay xuất hoá đơn điện tử cho **từng đơn**, kể cả đơn Droppii |

Mục tiêu xuyên suốt: **theo dõi được từng đồng**, từ lượt bấm đầu tiên đến hoá đơn đã xuất.

## Các bên tham gia

| Bên | Vai trò |
|---|---|
| Khách | Xem sản phẩm, bấm sang sàn, hoặc mua trực tiếp |
| Quản trị | Duyệt sản phẩm lên trang, xử lý đơn, xem báo cáo |
| Kế toán | Xuất và đối chiếu hoá đơn, sổ thu chi |
| AccessTrade | Nguồn sản phẩm và link affiliate, ghi nhận và trả hoa hồng |
| Shopee, Lazada | Nơi khách hoàn tất mua hàng affiliate |
| Droppii | Nhà cung cấp hàng cho đơn tự bán (đã có thoả thuận) |
| MoMo, SePay (VietQR) | Nhận thanh toán đơn tự bán |
| P.A Việt Nam | Phát hành hoá đơn điện tử |

## Luồng A — Affiliate (khách mua trên sàn)

1. Khách xem sản phẩm trên `nutriway.vn` và bấm **"Mua tại Shopee"** (hoặc Lazada).
2. Trình duyệt đi tới `/go/[mã sản phẩm]`. Máy chủ ghi **một lượt click** với `click_id` riêng, kèm nguồn truy cập (UTM, visitor id; bỏ qua nếu khách bật Do Not Track).
3. Máy chủ gọi AccessTrade tạo link với `utm_content = click_id`, rồi chuyển hướng khách sang sàn.
4. Khách mua trên sàn. AccessTrade ghi nhận chuyển đổi.
5. Tác vụ nền đồng bộ chuyển đổi từ AccessTrade, **ghép với click bằng `click_id`**.
6. Báo cáo theo kỳ theo trạng thái: **hold** (chờ), **approved** (duyệt), **rejected** (huỷ). Chỉ approved mới là tiền chắc chắn.
7. AccessTrade thanh toán hoa hồng theo kỳ. Kế toán đối chiếu số tiền nhận được với tổng approved và ghi sổ thu.

Quy tắc:
- Hoa hồng chỉ ghi vào sổ thu **khi tiền đã về**, không ghi khi mới hold hay approved.
- Click không ghép được với chuyển đổi vẫn giữ lại, vì AccessTrade có thể bỏ sót tham số.
- Trang sản phẩm affiliate ghi rõ: *"Liên kết tiếp thị — NutriWay có thể nhận hoa hồng khi bạn mua qua liên kết này."*

## Luồng B — Mua trực tiếp (hàng NutriWay)

1. Khách thêm vào giỏ, vào thanh toán, điền thông tin giao hàng. Có ô tuỳ chọn **"Xuất hoá đơn công ty"** (tên công ty, mã số thuế, địa chỉ, email nhận hoá đơn).
2. Hệ thống tạo đơn ở trạng thái **chờ thanh toán** và khoá giá tại thời điểm đặt.
3. Khách chọn **MoMo** hoặc **chuyển khoản VietQR**. Hệ thống tạo yêu cầu thanh toán.
4. Khách thanh toán. Cổng gọi ngược về máy chủ (IPN của MoMo, webhook của SePay).
5. Máy chủ **xác thực chữ ký**, đối chiếu **số tiền khớp đơn**, rồi đổi đơn sang **đã thanh toán**. Xử lý lặp lại cùng một thông báo không đổi gì thêm.
6. Hệ thống ghi sổ thu, tạo **yêu cầu hoá đơn**, và gửi email xác nhận.
7. Hoá đơn được phát hành qua P.A Việt Nam (hoặc vào hàng chờ xuất tay, xem mục Hoá đơn).
8. Xử lý đơn: đóng gói, giao, hoàn thành.

Quy tắc:
- **Không bao giờ** tin trang `redirectUrl` để kết luận đã thanh toán. Chỉ thông báo có chữ ký, hoặc truy vấn trạng thái trực tiếp từ cổng, mới đổi trạng thái đơn.
- Đơn chưa thanh toán **tự huỷ** sau thời hạn cấu hình (mặc định 30 phút kể từ khi tạo yêu cầu thanh toán).
- MoMo giới hạn **1.000 – 50.000.000 đ** mỗi giao dịch. Đơn ngoài khoảng này chỉ cho chuyển khoản VietQR.

## Luồng C — Đơn hàng Droppii (NutriWay là người bán)

Giống luồng B ở phía khách, khác ở phía nhập hàng:

1. Khách thanh toán cho NutriWay. NutriWay là **người bán trên hoá đơn**.
2. Sau khi đơn đã thanh toán, NutriWay đặt hàng với Droppii và để Droppii giao cho khách. Giai đoạn đầu đặt hàng **thủ công** từ màn hình quản trị.
3. Giá vốn (số tiền NutriWay trả Droppii) ghi vào **sổ chi**, gắn với đơn để tính lãi gộp từng đơn.
4. Nếu Droppii huỷ hoặc hết hàng: huỷ đơn, hoàn tiền (luồng D), không phát hành hoá đơn hoặc phát hành hoá đơn điều chỉnh nếu đã xuất.

## Luồng D — Hoàn tiền

1. Quản trị tạo yêu cầu hoàn tiền cho một đơn đã thanh toán, ghi lý do.
2. Hoàn qua đúng cổng đã thu (MoMo hoàn trong hạn của cổng; VietQR hoàn thủ công và ghi sổ chi).
3. Nếu hoá đơn đã phát hành: sinh yêu cầu **hoá đơn điều chỉnh hoặc thay thế**. **Không sửa hay xoá hoá đơn gốc.**

## Hoá đơn điện tử

- Nhà cung cấp: **P.A Việt Nam**. Chưa có tài liệu API công khai nên cần xin từ P.A.
- **Trước khi có API**: màn hình *"Hoá đơn chờ xuất"* liệt kê đơn đã thanh toán cần xuất. Kế toán xuất file, nhập vào hệ thống P.A, rồi quay lại điền **số và ký hiệu hoá đơn** để đơn chuyển sang *"đã xuất"*.
- **Sau khi có API**: tự phát hành khi đơn đã thanh toán, lưu số, ký hiệu, PDF. Có khoá chống phát hành trùng theo mã đơn, và tự thử lại khi lỗi mạng.
- Hoá đơn lưu **mã số thuế người mua** và địa chỉ đúng như khách nhập tại thời điểm đặt hàng, không đọc lại từ hồ sơ khách sau này.

## Việc cần xác nhận

| # | Câu hỏi | Ai trả lời |
|---|---|---|
| 1 | Hoa hồng AccessTrade: NutriWay xuất hoá đơn cho ai, theo mẫu nào, chu kỳ nào? | Kế toán |
| 2 | Droppii: đặt hàng bằng tay hay có API/feed? Thoả thuận có cho hiển thị lại tên, ảnh, giá sản phẩm không? | Droppii |
| 3 | P.A Việt Nam: tài liệu API, môi trường thử, mẫu hoá đơn | P.A |
| 4 | Ứng dụng "NUTRIWAY" đã đăng ký cổng thanh toán (HMAC-SHA256, hoàn tiền 180 ngày) là cổng nào? | Chủ dự án |
| 5 | Phí và đơn vị vận chuyển, chính sách đổi trả | Chủ dự án |
| 6 | Thực phẩm chức năng: đã có giấy xác nhận nội dung quảng cáo cho từng sản phẩm chưa? | Chủ dự án |
