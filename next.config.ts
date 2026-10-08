import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 không cache `fetch` theo mặc định. Bật Cache Components để dùng
  // `'use cache'` + `cacheLife` trong src/lib/catalog.ts, tránh gọi AccessTrade
  // mỗi lượt xem trang (API có giới hạn request).
  cacheComponents: true,
};

export default nextConfig;
