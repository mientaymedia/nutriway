import Link from "next/link";
import { compactCount, discountPercent, formatVnd } from "@/lib/format";

export interface ProductCardData {
  productId: string;
  name: string;
  imageUrl: string | null;
  price: number;
  salePrice: number;
  merchant: string | null;
  soldCount?: number | null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const off = discountPercent(product.price, product.salePrice);
  return (
    <Link
      href={`/san-pham/${encodeURIComponent(product.productId)}`}
      className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-md focus:outline-2 focus:outline-offset-2 focus:outline-brand-600"
    >
      <div className="relative aspect-square bg-neutral-100">
        {product.imageUrl ? (
          /* Ảnh đến từ nhiều CDN của các sàn, danh sách host thay đổi liên tục nên
             dùng thẻ img thường thay vì next/image để không vỡ khi gặp host lạ. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">Chưa có ảnh</div>
        )}
        {off !== null && (
          <span className="absolute right-0 top-0 rounded-bl bg-sale px-1.5 py-0.5 text-xs font-bold text-white">
            -{off}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm text-neutral-800">{product.name}</h3>
        <div className="mt-auto flex items-baseline gap-1.5">
          <span className="font-semibold text-sale">{formatVnd(product.salePrice)}</span>
          {off !== null && (
            <span className="text-xs text-neutral-400 line-through">{formatVnd(product.price)}</span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span className="truncate">{product.merchant ?? ""}</span>
          {typeof product.soldCount === "number" && product.soldCount > 0 && (
            <span className="shrink-0">Đã bán {compactCount(product.soldCount)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
