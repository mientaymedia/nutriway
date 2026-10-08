import { z } from "zod";

/**
 * Biến môi trường phía máy chủ. Đọc lười (lazy) nên thiếu một tích hợp tuỳ chọn
 * cũng không làm sập trang công khai: hàm gọi tự kiểm tra rồi hiện trạng thái
 * "chưa cấu hình". Chỉ biến `NEXT_PUBLIC_*` mới lọt xuống trình duyệt.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),

  /** Khoá bí mật của AccessTrade. Thiếu thì phần sản phẩm hiện trạng thái chưa cấu hình. */
  ACCESSTRADE_API_KEY: z.string().trim().min(1).optional(),
  /** Định danh công khai, nằm sẵn trong mọi link affiliate. */
  ACCESSTRADE_PUB_ID: z.string().trim().regex(/^\d+$/).optional(),

  /** Trang xác nhận đã thông báo website với Bộ Công Thương (online.gov.vn). */
  NEXT_PUBLIC_MOIT_PROFILE_URL: z.string().url().optional().or(z.literal("")),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Biến môi trường không hợp lệ: ${fields}`);
  }
  cached = parsed.data;
  return cached;
}

export function hasAccessTrade(): boolean {
  return Boolean(env().ACCESSTRADE_API_KEY);
}
