import Link from "next/link";
import { BrandLogo } from "./brand-logo";

const NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/khuyen-mai", label: "Khuyến mãi" },
];

export function SiteHeader() {
  return (
    <header className="bg-brand-600 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
        <Link href="/" aria-label="NutriWay Việt Nam, về trang chủ" className="shrink-0">
          <BrandLogo tone="dark" />
        </Link>

        <form action="/tim-kiem" className="flex flex-1 overflow-hidden rounded bg-white">
          <label htmlFor="q" className="sr-only">
            Tìm sản phẩm
          </label>
          <input
            id="q"
            name="q"
            type="search"
            placeholder="Tìm sản phẩm, thương hiệu…"
            className="w-full px-3 py-2 text-sm text-neutral-800 outline-none"
          />
          <button
            type="submit"
            className="bg-accent-500 px-4 text-sm font-semibold text-brand-700 transition hover:bg-accent-400"
          >
            Tìm
          </button>
        </form>

        <nav aria-label="Chính" className="flex gap-4 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap hover:text-accent-400">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
