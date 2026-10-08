import Link from "next/link";
import { cacheLife } from "next/cache";
import { BrandLogo } from "./brand-logo";

/**
 * Next 16 không cho đọc thẳng `new Date()` khi prerender vì giá trị đổi theo
 * thời gian. Bọc trong `'use cache'` để năm bản quyền được tính sẵn và làm mới
 * mỗi ngày.
 */
async function currentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function SiteFooter() {
  return (
    <footer className="mt-10 bg-brand-700 text-neutral-200">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div className="space-y-3">
          <BrandLogo tone="dark" />
          <p className="text-sm leading-relaxed">
            Công ty TNHH Thương mại Dịch vụ Nutriway Việt Nam.
          </p>
        </div>

        <nav aria-label="Chính sách" className="space-y-2 text-sm">
          <h2 className="font-semibold text-white">Chính sách</h2>
          <ul className="space-y-1">
            <li>
              <Link href="/chinh-sach/bao-mat" className="hover:text-accent-400">
                Bảo mật thông tin
              </Link>
            </li>
            <li>
              <Link href="/chinh-sach/doi-tra" className="hover:text-accent-400">
                Đổi trả và hoàn tiền
              </Link>
            </li>
            <li>
              <Link href="/chinh-sach/lien-ket-tiep-thi" className="hover:text-accent-400">
                Công bố liên kết tiếp thị
              </Link>
            </li>
          </ul>
        </nav>

        <div className="space-y-2 text-sm">
          <h2 className="font-semibold text-white">Lưu ý</h2>
          {/* Bắt buộc với sản phẩm thực phẩm chức năng. */}
          <p className="leading-relaxed">
            Thực phẩm này không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh.
          </p>
          <p className="leading-relaxed">
            Một số liên kết trên trang là liên kết tiếp thị. NutriWay có thể nhận hoa hồng khi bạn mua
            hàng qua các liên kết này, giá bạn trả không thay đổi.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs">
        © {await currentYear()} Nutriway Việt Nam
      </div>
    </footer>
  );
}
