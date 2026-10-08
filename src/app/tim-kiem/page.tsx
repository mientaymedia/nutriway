import type { Metadata } from "next";
import { CatalogSection } from "@/components/catalog-section";
import { getFeaturedProducts, type CatalogResult } from "@/lib/catalog";
import type { DatafeedProduct } from "@/lib/accesstrade/datafeeds";

export const metadata: Metadata = { title: "Tìm kiếm" };

/** Trang phụ thuộc `searchParams` nên không dựng sẵn được. */
export const instant = false;

/** Bỏ dấu để tìm "sua rua mat" ra "sữa rửa mặt". */
function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  // Chưa có cơ sở dữ liệu nên lọc trên danh mục đã tải sẵn. Khi có Postgres thì
  // thay bằng truy vấn toàn văn, lúc đó mới tìm được trên toàn bộ kho 16 triệu sản phẩm.
  const source = await getFeaturedProducts(400);
  const words = fold(query).split(/\s+/).filter(Boolean);
  const items =
    words.length === 0
      ? []
      : source.items.filter((product) => {
          const haystack = fold(`${product.name} ${product.merchant ?? ""} ${product.category ?? ""}`);
          return words.every((word) => haystack.includes(word));
        });

  const result: CatalogResult<DatafeedProduct> = { ...source, items };

  return (
    <div className="py-2">
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <h1 className="text-xl font-bold text-brand-700">
          {query ? `Kết quả cho "${query}"` : "Tìm kiếm sản phẩm"}
        </h1>
        {query ? (
          <p className="mt-1 text-sm text-neutral-600">
            {items.length > 0
              ? `${items.length} sản phẩm`
              : "Không tìm thấy sản phẩm nào khớp. Thử từ khoá ngắn hơn."}
          </p>
        ) : (
          <p className="mt-1 text-sm text-neutral-600">Nhập từ khoá vào ô tìm kiếm ở đầu trang.</p>
        )}
      </div>

      {query && (
        <CatalogSection
          title=""
          result={result}
          toCard={(product) => ({
            productId: product.productId,
            name: product.name,
            imageUrl: product.imageUrl,
            price: product.price,
            salePrice: product.salePrice,
            merchant: product.merchant,
          })}
        />
      )}
    </div>
  );
}
