import { ZALO_CHAT_URL } from "@/lib/site";

/**
 * Nút chat Zalo nổi ở góc phải dưới.
 *
 * Dùng liên kết thường tới Zalo OA thay vì nhúng script widget của Zalo: không
 * kéo mã bên thứ ba vào mọi trang, không đặt cookie theo dõi (đúng với cam kết
 * ở trang chính sách bảo mật), và vẫn mở đúng cửa sổ chat trên cả di động lẫn
 * máy tính.
 */
export function ZaloChat() {
  return (
    <a
      href={ZALO_CHAT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat với NutriWay qua Zalo"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-[#0068ff] py-3 pl-3 pr-4 text-sm font-semibold text-white shadow-lg transition hover:bg-[#0055d4] focus:outline-2 focus:outline-offset-2 focus:outline-brand-600"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
        <path d="M12 2C6.5 2 2 5.9 2 10.7c0 2.7 1.4 5.2 3.7 6.8-.1.6-.5 2.1-.6 2.4 0 0-.1.3.1.4.2.1.4 0 .4 0 .3-.1 2.4-1.4 3.1-1.8 1 .3 2.1.4 3.3.4 5.5 0 10-3.9 10-8.7S17.5 2 12 2Z" />
      </svg>
      Chat Zalo
    </a>
  );
}
