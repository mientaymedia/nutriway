/**
 * Danh sách host ảnh được phép đi qua proxy.
 *
 * Proxy ảnh là một cửa SSRF điển hình: nếu nhận URL bất kỳ, người ngoài có thể
 * nhờ máy chủ của mình gọi vào mạng nội bộ hoặc endpoint metadata của nhà cung
 * cấp hạ tầng. Vì vậy chỉ cho đúng các CDN của sàn, khớp theo đuôi tên miền.
 */
const ALLOWED_HOST_SUFFIXES = [
  "shopee.vn",
  "susercontent.com",
  "cellphones.com.vn",
  "lazada.vn",
  "slatic.net",
  "hstatic.net",
  "tiki.vn",
  "tikicdn.com",
  "ibyteimg.com",
  "accesstrade.vn",
] as const;

export function isAllowedImageHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

/**
 * Đổi URL ảnh ngoài thành đường dẫn nội bộ. Host không nằm trong danh sách cho
 * phép thì trả về nguyên URL để trình duyệt tự tải, không ép qua proxy.
 */
export function proxiedImage(url: string | null): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  if (!isAllowedImageHost(parsed.hostname)) return url;
  return `/anh?url=${encodeURIComponent(parsed.toString())}`;
}
