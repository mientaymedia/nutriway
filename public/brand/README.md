# File nhận diện thương hiệu

Đặt ba file sau vào đúng tên để website dùng được. Ưu tiên **SVG**; không có thì PNG nền trong suốt.

| Tên file | Dùng ở đâu | Mô tả |
|---|---|---|
| `logo.svg` (hoặc `logo.png`) | Nền sáng | Chữ "nutriway" xanh rừng + "vietnam" xanh lá |
| `logo-dark.svg` (hoặc `.png`) | Nền tối (header, footer) | Bản chữ trắng |
| `../../src/app/icon.png` | Favicon và tab trình duyệt | Icon túi mua sắm, vuông, tối thiểu 512×512 |

Favicon đặt tại `src/app/icon.png` (không phải trong thư mục này) vì Next tự nhận file đó làm biểu tượng trang.

Chép xong thì báo để thay component `src/components/brand-logo.tsx` — hiện đang dựng chữ bằng CSS theo đúng hai màu nhận diện (`#0a5240` và `#7ac143`).

**Lưu ý:** file logo trong `OneDrive/.../CONG TY/NUTRIWAY/` là bộ nhận diện **cũ** (chữ serif kèm nhành lá), không dùng được cho bộ mới.
