import { NextResponse } from "next/server";
import { findProduct } from "@/lib/catalog";

/**
 * Chuyển hướng sang sàn qua link affiliate.
 *
 * Chỉ chuyển tới `affLink` của đúng sản phẩm trong danh mục. KHÔNG bao giờ nhận
 * URL đích từ tham số truy vấn, nếu không trang sẽ thành bàn đạp chuyển hướng
 * (open redirect) cho người khác dùng.
 *
 * Chưa có cơ sở dữ liệu nên lượt click chưa được lưu; khi có bảng
 * `affiliate_clicks` thì sinh `click_id` ở đây và truyền qua `utm_content`.
 */
export async function GET(request: Request, context: { params: Promise<{ productId: string }> }) {
  const { productId } = await context.params;
  const product = await findProduct(decodeURIComponent(productId));

  if (!product) {
    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
  }
  return NextResponse.redirect(product.affLink, { status: 302 });
}
