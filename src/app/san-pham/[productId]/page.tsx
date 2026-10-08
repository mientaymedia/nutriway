import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductImage } from "@/components/product-image";
import { findProduct } from "@/lib/catalog";
import { discountPercent, formatVnd } from "@/lib/format";

interface PageProps {
  params: Promise<{ productId: string }>;
}

/**
 * Toàn bộ nội dung trang phụ thuộc `params` nên không dựng sẵn được. Với Cache
 * Components, `instant = false` cho phép route chờ dữ liệu rồi mới trả về.
 */
export const instant = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await findProduct(decodeURIComponent(productId));
  return product ? { title: product.name } : { title: "Không tìm thấy sản phẩm" };
}

export default async function ProductPage({ params }: PageProps) {
  const { productId } = await params;
  const product = await findProduct(decodeURIComponent(productId));
  if (!product) notFound();

  const off = discountPercent(product.price, product.salePrice);
  const shop = product.merchant ?? product.domain ?? "sàn thương mại điện tử";

  return (
    <article className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-6 rounded-lg bg-white p-4 sm:grid-cols-2 sm:p-6">
        <div className="aspect-square overflow-hidden rounded bg-neutral-100">
          <ProductImage src={product.imageUrl} alt={product.name} fit="contain" />
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold text-neutral-900">{product.name}</h1>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-bold text-sale">{formatVnd(product.salePrice)}</span>
            {off !== null && (
              <>
                <span className="text-neutral-400 line-through">{formatVnd(product.price)}</span>
                <span className="rounded bg-sale px-1.5 py-0.5 text-xs font-bold text-white">-{off}%</span>
              </>
            )}
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-neutral-600">
            <dt>Gian hàng</dt>
            <dd className="text-neutral-800">{shop}</dd>
            {product.category && (
              <>
                <dt>Ngành hàng</dt>
                <dd className="text-neutral-800">{product.category}</dd>
              </>
            )}
          </dl>

          <a
            href={`/go/${encodeURIComponent(product.productId)}`}
            rel="nofollow sponsored noopener"
            className="rounded bg-accent-500 px-6 py-3 text-center font-semibold text-brand-700 transition hover:bg-accent-400 focus:outline-2 focus:outline-offset-2 focus:outline-brand-600"
          >
            Mua tại {shop}
          </a>

          <p className="text-xs leading-relaxed text-neutral-500">
            Đây là liên kết tiếp thị. Bạn sẽ được chuyển sang sàn để hoàn tất đơn hàng; NutriWay có thể
            nhận hoa hồng, giá bạn trả không thay đổi. Giá và khuyến mại do sàn quyết định và có thể đã
            thay đổi so với lúc hiển thị.
          </p>
        </div>
      </div>
    </article>
  );
}
