import Link from "next/link";
import { compactCount, discountPercent, formatVnd } from "@/lib/format";
import { ProductImage } from "./product-image";

export interface ProductCardData {
  productId: string;
  name: string;
  imageUrl: string | null;
  price: number;
  salePrice: number;
  merchant: string | null;
  soldCount?: number | null;
  /** Hàng từ nhà bán lẻ chính hãng, tương đương nhãn Mall của các sàn. */
  official?: boolean;
}

/** Thẻ sản phẩm theo bố cục quen thuộc của chợ điện tử: ảnh vuông, tên 2 dòng, giá nổi bật. */
export function ProductCard({ product }: { product: ProductCardData }) {
  const off = discountPercent(product.price, product.salePrice);

  return (
    <Link
      href={`/san-pham/${encodeURIComponent(product.productId)}`}
      className="group flex flex-col overflow-hidden rounded-sm border border-transparent bg-white transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-brand-600"
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-50">
        <ProductImage src={product.imageUrl} />
        {off !== null && (
          <span className="absolute right-0 top-0 bg-amber-300/95 px-1 py-0.5 text-center text-[11px] font-bold leading-tight text-sale">
            {off}%
            <br />
            GIẢM
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-2">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-5 text-neutral-800">
          {product.official && (
            <span className="mr-1 inline-block bg-brand-600 px-1 py-px align-[2px] text-[10px] font-bold text-white">
              CHÍNH HÃNG
            </span>
          )}
          {product.name}
        </h3>

        <div className="mt-auto flex items-baseline gap-1">
          <span className="text-[15px] font-medium text-sale">{formatVnd(product.salePrice)}</span>
          {off !== null && (
            <span className="text-[11px] text-neutral-400 line-through">{formatVnd(product.price)}</span>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-500">
          <span className="truncate">{product.merchant ?? ""}</span>
          {typeof product.soldCount === "number" && product.soldCount > 0 && (
            <span className="shrink-0">Đã bán {compactCount(product.soldCount)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
