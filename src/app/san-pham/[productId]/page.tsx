import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { findProduct, getRelatedProducts, isOfficialMerchant, merchantLabel } from "@/lib/catalog";
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
  if (!product) return { title: "Không tìm thấy sản phẩm" };
  return {
    title: product.name,
    description: `${product.name} — giá ${formatVnd(product.salePrice)}. Mua chính hãng, giao từ gian hàng ${
      product.merchant ?? "đối tác"
    }.`,
  };
}

function Breadcrumb({ name }: { name: string }) {
  return (
    <nav aria-label="Đường dẫn" className="mb-3 text-xs text-neutral-500">
      <Link href="/" className="hover:text-brand-600 hover:underline">
        Trang chủ
      </Link>
      <span className="mx-1.5">›</span>
      <span className="text-neutral-700">{name.length > 60 ? `${name.slice(0, 60)}…` : name}</span>
    </nav>
  );
}

const TRUST = [
  "Chuyển thẳng sang gian hàng chính hãng",
  "Giá và khuyến mãi theo đúng sàn",
  "Đổi trả theo chính sách của sàn",
];

export default async function ProductPage({ params }: PageProps) {
  const { productId } = await params;
  const product = await findProduct(decodeURIComponent(productId));
  if (!product) notFound();

  const off = discountPercent(product.price, product.salePrice);
  const shop = merchantLabel(product.merchant) ?? product.domain ?? "gian hàng đối tác";
  const official = isOfficialMerchant(product.merchant);
  const related = await getRelatedProducts(product.productId, product.merchant, 6);
  const buyHref = `/go/${encodeURIComponent(product.productId)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 pb-24 sm:pb-6">
      <Breadcrumb name={product.name} />

      <div className="grid gap-5 bg-white p-3 sm:grid-cols-[minmax(0,420px)_1fr] sm:gap-8 sm:p-5">
        <div className="aspect-square overflow-hidden bg-neutral-50">
          <ProductImage src={product.imageUrl} alt={product.name} fit="contain" />
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-lg font-medium leading-snug text-neutral-900 sm:text-xl">{product.name}</h1>

          <div className="bg-neutral-50 px-4 py-3">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-medium text-sale sm:text-3xl">{formatVnd(product.salePrice)}</span>
              {off !== null && (
                <>
                  <span className="text-sm text-neutral-400 line-through">{formatVnd(product.price)}</span>
                  <span className="bg-sale px-1.5 py-0.5 text-[11px] font-bold text-white">GIẢM {off}%</span>
                </>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-[88px_1fr] gap-y-2 text-sm">
            <dt className="text-neutral-500">Gian hàng</dt>
            <dd className="text-neutral-800">
              {official && (
                <span className="mr-1.5 inline-block bg-brand-600 px-1.5 py-px text-[10px] font-bold text-white">
                  CHÍNH HÃNG
                </span>
              )}
              {shop}
            </dd>
            {product.category && (
              <>
                <dt className="text-neutral-500">Ngành hàng</dt>
                <dd className="text-neutral-800">{product.category}</dd>
              </>
            )}
            {product.sku && (
              <>
                <dt className="text-neutral-500">Mã sản phẩm</dt>
                <dd className="font-mono text-xs text-neutral-700">{product.sku}</dd>
              </>
            )}
          </dl>

          {/* Nút mua trên máy tính; trên di động dùng thanh cố định bên dưới. */}
          <div className="hidden sm:block">
            <a
              href={buyHref}
              rel="nofollow sponsored noopener"
              className="inline-flex items-center justify-center bg-brand-600 px-10 py-3 font-medium text-white transition hover:bg-brand-500 focus:outline-2 focus:outline-offset-2 focus:outline-brand-700"
            >
              Mua ngay
            </a>
            <p className="mt-1.5 text-xs text-neutral-500">Hoàn tất đơn hàng tại {shop}</p>
          </div>

          <ul className="space-y-1 border-t border-neutral-100 pt-3 text-xs text-neutral-600">
            {TRUST.map((line) => (
              <li key={line} className="flex gap-1.5">
                <span aria-hidden="true" className="text-accent-600">
                  ✓
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {product.description && (
        <section className="mt-3 bg-white p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">Mô tả sản phẩm</h2>
          {/* Mô tả là văn bản thuần từ datafeed, không phải HTML, nên hiển thị trực tiếp. */}
          <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{product.description}</p>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-3">
          <h2 className="mb-3 border-b-2 border-brand-600 pb-2 text-base font-medium uppercase tracking-wide text-brand-600">
            Có thể bạn thích
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((item) => (
              <ProductCard
                key={item.productId}
                product={{
                  productId: item.productId,
                  name: item.name,
                  imageUrl: item.imageUrl,
                  price: item.price,
                  salePrice: item.salePrice,
                  merchant: merchantLabel(item.merchant),
                  official: isOfficialMerchant(item.merchant),
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Thanh mua cố định ở đáy màn hình di động, giống ứng dụng mua sắm. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-neutral-200 bg-white px-3 py-2 sm:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-sale">{formatVnd(product.salePrice)}</p>
          <p className="truncate text-[11px] text-neutral-500">Mua tại {shop}</p>
        </div>
        <a
          href={buyHref}
          rel="nofollow sponsored noopener"
          className="shrink-0 bg-brand-600 px-7 py-2.5 text-sm font-medium text-white"
        >
          Mua ngay
        </a>
      </div>
    </div>
  );
}
