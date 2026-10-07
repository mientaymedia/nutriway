# Tích hợp MoMo — thanh toán ví một lần (`captureWallet`)

Nguồn: `developers.momo.vn/v3/vi/docs/payment/api/wallet/onetime/`. Các mục đánh dấu **[chưa kiểm chứng]** chưa được thử bằng gọi thật.

## Khoá và môi trường

| Biến môi trường | Ý nghĩa |
|---|---|
| `MOMO_PARTNER_CODE` | Mã đối tác. **TEST và PRODUCTION là hai mã khác nhau** |
| `MOMO_ACCESS_KEY` | Khoá truy cập, đi vào chuỗi ký |
| `MOMO_SECRET_KEY` | **Bí mật**, dùng ký HMAC-SHA256. Không bao giờ vào repo, log, hay trình duyệt |
| `MOMO_ENDPOINT` | Địa chỉ tạo thanh toán |

| Môi trường | Endpoint tạo thanh toán |
|---|---|
| TEST | `https://test-payment.momo.vn/v2/gateway/api/create` |
| PRODUCTION | `https://payment.momo.vn/v2/gateway/api/create` |

- **Mặc định `.env.example` trỏ endpoint TEST.** Dùng bộ khoá TEST của MoMo khi phát triển. Dùng khoá production với endpoint test (hoặc ngược lại) sẽ bị từ chối, và dùng khoá production ở máy dev sẽ tạo yêu cầu thanh toán thật.
- Bộ khoá production hiện có còn kèm khoá công khai và endpoint `/v2/gateway/api/pos` cho **tích hợp POS**. NutriWay bán online nên **không dùng** phần này.
- Khuyến nghị MoMo: đặt timeout gọi API **tối thiểu 30 giây**.

## Tạo thanh toán

`POST {MOMO_ENDPOINT}`, nội dung JSON.

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `partnerCode` | string(50) | có | |
| `requestType` | string | có | Luôn là `captureWallet` |
| `requestId` | string(50) | có | Duy nhất mỗi yêu cầu |
| `orderId` | string(200) | có | Duy nhất mỗi giao dịch |
| `amount` | số nguyên | có | **1.000 – 50.000.000** (VND) |
| `orderInfo` | string(255) | có | Mô tả đơn |
| `redirectUrl` | string | có | Nơi khách quay lại sau khi thanh toán |
| `ipnUrl` | string | có | Địa chỉ máy chủ nhận thông báo |
| `extraData` | string(1000) | không | JSON mã hoá base64; để trống là chuỗi rỗng |
| `lang` | string | không | `vi` hoặc `en` |
| `signature` | string | có | HMAC-SHA256 |

Các trường tuỳ chọn khác: `storeName`, `storeId`, `orderGroupId`, `items` (tối đa 50), `deliveryInfo`, `userInfo`, `referenceId`, `autoCapture` (mặc định `true`).

### Chuỗi ký khi tạo

Sắp xếp theo thứ tự chữ cái a–z, nối bằng `&`:

```
accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
```

`signature = HMAC_SHA256(chuỗi trên, secretKey)`, mã hoá hex.

### Kết quả

`resultCode = 0` là thành công. Các trường chính: `payUrl` (đưa khách tới trang MoMo), `deeplink` (mở thẳng app MoMo), `qrCodeUrl` (dữ liệu QR, cần thư viện để vẽ), `deeplinkMiniApp`, `responseTime`, `signature`. Bảng đầy đủ các mã `resultCode` nằm ở trang riêng của MoMo **[chưa đọc]**, cần đọc trước khi xử lý lỗi cho người dùng.

## Thông báo IPN

MoMo `POST` về `ipnUrl` khi giao dịch có kết quả.

| Trường | Ghi chú |
|---|---|
| `partnerCode`, `orderId`, `requestId`, `amount` | Echo lại yêu cầu |
| `transId` | Mã giao dịch MoMo (số nguyên). **Dùng làm khoá chống xử lý lặp** |
| `resultCode`, `message` | Kết quả |
| `orderInfo`, `orderType` (`momo_wallet`), `payType` (`webApp`/`app`/`qr`/`miniapp`) | |
| `responseTime`, `extraData` | |
| `signature` | HMAC-SHA256 |
| `partnerUserId`, `storeId`, `paymentOption` (`momo`/`pay_later`), `userFee`, `promotionInfo` | Tuỳ chọn |

### Chuỗi ký khi xác thực IPN

```
accessKey=$accessKey&amount=$amount&extraData=$extraData&message=$message&orderId=$orderId&orderInfo=$orderInfo&orderType=$orderType&partnerCode=$partnerCode&payType=$payType&requestId=$requestId&responseTime=$responseTime&resultCode=$resultCode&transId=$transId
```

Tính lại chữ ký bằng `secretKey` của mình, **so sánh hằng thời gian** với `signature` nhận được.

### Phản hồi IPN

Trả **HTTP 200** để xác nhận đã nhận. Thời hạn phản hồi **[chưa rõ]**: xử lý nhanh, đẩy việc nặng sang hàng đợi.

## Quy tắc trong NutriWay

1. **Trình tự xác thực IPN**: kiểm tra chữ ký → tìm thanh toán theo `orderId` → so `amount` với số tiền đơn → kiểm tra `transId` chưa xử lý → mới đổi trạng thái. Sai ở bước nào thì ghi log rõ lý do và trả lời phù hợp, **không** đánh dấu đã thanh toán.
2. **`redirectUrl` không phải bằng chứng thanh toán.** Trang kết quả chỉ hiển thị trạng thái đơn đã lưu trong CSDL (do IPN hoặc truy vấn trạng thái cập nhật).
3. **Mỗi lần thử thanh toán dùng `orderId` và `requestId` mới**: `<mã đơn>-<lần thử>`. Khách đóng trang rồi bấm thanh toán lại sẽ tạo lần thử mới, không đụng giao dịch cũ.
4. **Chặn đơn ngoài khoảng 1.000 – 50.000.000 đ** ở bước chọn phương thức; đề nghị chuyển khoản VietQR.
5. **Truy vấn trạng thái** (`Kiểm tra trạng thái giao dịch`): dùng để đối soát các thanh toán `created` quá hạn mà chưa có IPN. Endpoint và chữ ký **[chưa đọc]**.
6. **Hoàn tiền** dùng API riêng của MoMo **[chưa đọc]**, ghi vào bảng `refunds` và sổ chi.
7. Không log `secretKey`, chuỗi ký, hay chữ ký đầy đủ.

## Việc còn lại

- [ ] Đọc bảng `resultCode`, API truy vấn trạng thái, API hoàn tiền.
- [ ] Lấy bộ khoá TEST từ MoMo, chạy thử một giao dịch nhỏ end-to-end.
- [ ] Đăng ký `ipnUrl` và `redirectUrl` thật (HTTPS, `nutriway.vn`) khi có domain.
