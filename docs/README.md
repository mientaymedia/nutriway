# Tài liệu NutriWay

## Mục lục

| Tài liệu | Nội dung |
|---|---|
| [business-flow.md](business-flow.md) | Luồng nghiệp vụ: affiliate, mua trực tiếp, đơn Droppii, hoàn tiền, hoá đơn |
| [spec.md](spec.md) | Công nghệ, mô hình dữ liệu, trạng thái, trang, API, bảo mật, vận hành |
| [roadmap.md](roadmap.md) | Lộ trình theo giai đoạn và các việc đang chờ |
| [integrations/accesstrade-api.md](integrations/accesstrade-api.md) | AccessTrade Publisher API: 20 endpoint, cạm bẫy, câu hỏi cần kiểm chứng |
| [integrations/momo.md](integrations/momo.md) | Thanh toán MoMo: tạo giao dịch, chuỗi ký, IPN |

## Quy ước

- File `.md` mới đặt trong `docs/` đúng nhóm và thêm một dòng vào mục lục này.
- Xong một tính năng (đã chạy thử) thì cập nhật `roadmap.md` và `CHANGELOG.md` ngay.
- **Không đưa vào repo**: khoá API, mật khẩu, khoá bí mật, giấy tờ công ty, file kế toán. Chỉ dùng `.env.local` (đã bị git bỏ qua) và `.env.example` (chỉ chứa giá trị giả).
- Tài liệu bên thứ ba có thể sai hoặc thiếu. Mục nào chưa thử bằng gọi thật thì ghi **[chưa kiểm chứng]**.
