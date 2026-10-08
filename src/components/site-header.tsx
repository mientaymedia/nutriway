import Link from "next/link";
import { BrandLogo } from "./brand-logo";

const TOP_LINKS = [
  { href: "/khuyen-mai", label: "Mã khuyến mãi" },
  { href: "/chinh-sach/lien-ket-tiep-thi", label: "Về liên kết tiếp thị" },
];

/** Từ khoá gợi ý dưới ô tìm kiếm, giống dải "tìm kiếm phổ biến" của chợ điện tử. */
const SUGGESTIONS = ["Sữa rửa mặt", "Máy sấy tóc", "Điện thoại", "Thực phẩm chức năng", "Tai nghe"];

export function SiteHeader() {
  return (
    <header className="bg-brand-600 text-white">
      {/* Dải trên cùng, chỉ hiện trên màn hình rộng như cách Shopee làm. */}
      <div className="mx-auto hidden max-w-6xl justify-end gap-4 px-4 pt-1.5 text-xs sm:flex">
        {TOP_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="opacity-90 hover:opacity-100 hover:underline">
            {link.label}
          </Link>
        ))}
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pb-3 pt-2 sm:flex-row sm:items-center sm:gap-8">
        <Link href="/" aria-label="NutriWay Việt Nam, về trang chủ" className="shrink-0">
          <BrandLogo tone="dark" height={38} />
        </Link>

        <div className="flex-1">
          <form action="/tim-kiem" className="flex overflow-hidden rounded-sm bg-white p-0.5">
            <label htmlFor="q" className="sr-only">
              Tìm sản phẩm
            </label>
            <input
              id="q"
              name="q"
              type="search"
              placeholder="Tìm sản phẩm, thương hiệu…"
              className="w-full px-3 py-1.5 text-sm text-neutral-800 outline-none"
            />
            <button
              type="submit"
              aria-label="Tìm"
              className="shrink-0 rounded-sm bg-brand-600 px-5 text-white transition hover:bg-brand-500"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
                <path d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5Zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z" />
              </svg>
            </button>
          </form>

          <div className="mt-1.5 hidden flex-wrap gap-3 text-xs sm:flex">
            {SUGGESTIONS.map((word) => (
              <Link
                key={word}
                href={`/tim-kiem?q=${encodeURIComponent(word)}`}
                className="opacity-85 hover:opacity-100 hover:underline"
              >
                {word}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
