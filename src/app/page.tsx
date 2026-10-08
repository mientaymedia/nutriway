import Link from "next/link";
import { CatalogSection } from "@/components/catalog-section";
import { getBestSellers, getFeaturedProducts, isOfficialMerchant, merchantLabel } from "@/lib/catalog";

/** Dải danh mục, dẫn thẳng vào trang tìm kiếm theo từ khoá. */
const CATEGORIES = [
  { label: "Chăm sóc da", q: "dưỡng da" },
  { label: "Chăm sóc tóc", q: "tóc" },
  { label: "Điện thoại", q: "điện thoại" },
  { label: "Phụ kiện", q: "phụ kiện" },
  { label: "Mẹ và bé", q: "em bé" },
  { label: "Sức khoẻ", q: "sức khoẻ" },
  { label: "Gia dụng", q: "gia dụng" },
  { label: "Thời trang", q: "áo" },
];

function Hero() {
  return (
    <section className="bg-brand-600 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <h1 className="text-xl font-bold sm:text-2xl">Mua sắm tiết kiệm mỗi ngày</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/85">
          Sản phẩm chọn lọc từ các sàn lớn, kèm mã khuyến mãi cập nhật liên tục. Bấm mua là chuyển thẳng
          sang sàn chính hãng, giá bạn trả không đổi.
        </p>
      </div>
    </section>
  );
}

function CategoryStrip() {
  return (
    <section aria-label="Danh mục" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">Danh mục</h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {CATEGORIES.map((category) => (
            <Link
              key={category.label}
              href={`/tim-kiem?q=${encodeURIComponent(category.q)}`}
              className="flex flex-col items-center gap-1.5 rounded-sm p-2 text-center transition hover:bg-brand-50 focus:outline-2 focus:outline-offset-2 focus:outline-brand-600"
            >
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-base font-bold text-brand-600"
              >
                {category.label.charAt(0)}
              </span>
              <span className="text-[11px] leading-tight text-neutral-700">{category.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [featured, bestSellers] = await Promise.all([getFeaturedProducts(24), getBestSellers()]);

  return (
    <>
      <Hero />
      <CategoryStrip />

      <CatalogSection
        title="Gợi ý hôm nay"
        result={featured}
        toCard={(product) => ({
          productId: product.productId,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price,
          salePrice: product.salePrice,
          merchant: merchantLabel(product.merchant),
          official: isOfficialMerchant(product.merchant),
        })}
      />

      <CatalogSection
        title="Bán chạy"
        result={bestSellers}
        toCard={(product) => ({
          productId: product.productId,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price,
          salePrice: product.salePrice,
          merchant: product.categoryName,
        })}
      />
    </>
  );
}
