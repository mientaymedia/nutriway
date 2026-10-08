import type { CatalogResult } from "@/lib/catalog";
import { ProductCard, type ProductCardData } from "./product-card";

/** Thông báo khi danh mục chưa có dữ liệu, thay vì hiện lưới trống không giải thích. */
function EmptyNote({ state }: { state: CatalogResult<unknown>["state"] }) {
  const text =
    state === "not_configured"
      ? "Danh mục sản phẩm chưa được kết nối. Đặt ACCESSTRADE_API_KEY trên máy chủ để hiển thị sản phẩm."
      : state === "error"
        ? "Tạm thời chưa tải được sản phẩm. Vui lòng thử lại sau."
        : "Chưa có sản phẩm nào trong mục này.";
  return (
    <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
      {text}
    </p>
  );
}

export function CatalogSection<T>({
  title,
  result,
  toCard,
}: {
  title: string;
  result: CatalogResult<T>;
  toCard: (item: T) => ProductCardData;
}) {
  // Gọi được API nhưng mục này không có hàng thì ẩn hẳn, đỡ phải hiện một ô
  // trống không nói lên điều gì. Chỉ báo khi thiếu cấu hình hoặc gặp lỗi.
  if (result.state === "ok" && result.items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      {title && (
        <h2 className="mb-3 border-b-2 border-brand-600 pb-2 text-base font-medium uppercase tracking-wide text-brand-600">
          {title}
        </h2>
      )}
      {result.items.length === 0 ? (
        <EmptyNote state={result.state} />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {result.items.map((item) => {
            const card = toCard(item);
            return <ProductCard key={card.productId} product={card} />;
          })}
        </div>
      )}
    </section>
  );
}
