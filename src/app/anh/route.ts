import { isAllowedImageHost } from "@/lib/image-proxy";

/**
 * Lấy ảnh sản phẩm hộ trình duyệt.
 *
 * CDN của các sàn chặn hotlink: ảnh gọi thẳng từ tên miền khác bị từ chối. Máy
 * chủ lấy giúp rồi phục vụ lại từ chính nutriway.vn thì không vướng.
 *
 * Giới hạn an toàn, vì proxy ảnh là cửa SSRF điển hình:
 *  - chỉ host trong danh sách cho phép (xem image-proxy.ts)
 *  - chỉ nhận lại nội dung có kiểu image/*
 *  - chặn ảnh quá lớn
 *  - có thời hạn chờ, không treo tiến trình
 *  - không chuyển tiếp cookie hay header của khách
 */
const MAX_BYTES = 8 * 1024 * 1024;
const TIMEOUT_MS = 12_000;

function fail(status: number, reason: string): Response {
  return new Response(reason, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request): Promise<Response> {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) return fail(400, "thiếu tham số url");

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return fail(400, "url không hợp lệ");
  }
  if (target.protocol !== "https:" && target.protocol !== "http:") return fail(400, "chỉ nhận http hoặc https");
  if (!isAllowedImageHost(target.hostname)) return fail(403, "host không nằm trong danh sách cho phép");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const upstream = await fetch(target, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // Một số CDN chặn khi thiếu User-Agent hoặc khi Referer là tên miền lạ.
        "User-Agent": "Mozilla/5.0 (compatible; NutriWayBot/1.0; +https://nutriway.vn)",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      },
    });
    if (!upstream.ok) return fail(502, `nguồn trả về ${upstream.status}`);

    const type = upstream.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return fail(415, "nội dung không phải ảnh");

    const length = Number(upstream.headers.get("content-length") ?? 0);
    if (length > MAX_BYTES) return fail(413, "ảnh quá lớn");

    const body = await upstream.arrayBuffer();
    if (body.byteLength > MAX_BYTES) return fail(413, "ảnh quá lớn");

    return new Response(body, {
      headers: {
        "Content-Type": type,
        "Content-Length": String(body.byteLength),
        // Ảnh sản phẩm hiếm khi đổi; cache lâu để đỡ gọi lại CDN.
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return fail(504, "không lấy được ảnh");
  } finally {
    clearTimeout(timer);
  }
}
