"use client";

import { useState } from "react";
import { proxiedImage } from "@/lib/image-proxy";

/**
 * Ảnh sản phẩm lấy từ CDN của nhà cung cấp.
 *
 * Ba điểm xử lý riêng, vì nguồn ảnh nằm ngoài tầm kiểm soát:
 *
 * 1. `referrerPolicy="no-referrer"` — nhiều CDN của sàn chặn hotlink bằng cách
 *    xem header Referer. Không gửi Referer thì ảnh tải được bình thường.
 * 2. Dùng thẻ `img` thường thay vì `next/image` — danh sách host ảnh của các sàn
 *    thay đổi liên tục, khai trước trong `remotePatterns` sẽ vỡ khi gặp host lạ.
 * 3. Ảnh hỏng hoặc đã bị xoá thì hiện ô thay thế, thay vì biểu tượng ảnh vỡ.
 */
export function ProductImage({
  src,
  alt = "",
  className = "",
  fit = "cover",
}: {
  src: string | null;
  alt?: string;
  className?: string;
  fit?: "cover" | "contain";
}) {
  const [failed, setFailed] = useState(false);
  const url = proxiedImage(src);

  if (!url || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-xs text-neutral-400">
        Chưa có ảnh
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
    />
  );
}
