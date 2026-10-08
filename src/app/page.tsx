import { CatalogSection } from "@/components/catalog-section";
import { getBestSellers, getFeaturedProducts } from "@/lib/catalog";

function Hero() {
  return (
    <section className="bg-brand-600 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <h1 className="text-2xl font-bold sm:text-3xl">Mua sắm tiết kiệm mỗi ngày</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-100 sm:text-base">
          Sản phẩm chọn lọc từ Shopee Mall và Lazada Mall, kèm mã khuyến mại cập nhật liên tục. Bấm mua
          là chuyển thẳng sang sàn chính hãng, giá bạn trả không đổi.
        </p>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [featured, bestSellers] = await Promise.all([getFeaturedProducts(12), getBestSellers()]);

  return (
    <>
      <Hero />

      <CatalogSection
        title="Đang giảm giá"
        result={featured}
        toCard={(product) => ({
          productId: product.productId,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price,
          salePrice: product.salePrice,
          merchant: product.merchant,
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
