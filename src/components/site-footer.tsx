import Image from "next/image";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { COMPANY, MOIT_PROFILE_URL, phoneHref } from "@/lib/site";
import { BrandLogo } from "./brand-logo";
import moitBadge from "../../public/brand/da-thong-bao-bct.png";

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

const POLICIES = [
  { href: "/chinh-sach/bao-mat", label: "Bảo mật thông tin" },
  { href: "/chinh-sach/doi-tra", label: "Đổi trả và hoàn tiền" },
  { href: "/chinh-sach/lien-ket-tiep-thi", label: "Công bố liên kết tiếp thị" },
];

export async function SiteFooter() {
  return (
    <footer className="mt-10 bg-brand-700 text-neutral-200">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3 sm:col-span-2 lg:col-span-1">
          <BrandLogo tone="dark" />
          <address className="space-y-1 text-sm not-italic leading-relaxed">
            <p className="font-semibold text-white">{COMPANY.legalName}</p>
            <p>{COMPANY.address}</p>
            <p>
              Điện thoại:{" "}
              <a href={phoneHref} className="hover:text-accent-400">
                {COMPANY.phone}
              </a>
            </p>
          </address>
        </div>

        <div className="space-y-1 text-sm">
          <h2 className="font-semibold text-white">Thông tin doanh nghiệp</h2>
          <p>
            Giấy chứng nhận đăng ký doanh nghiệp số {COMPANY.businessId}, do{" "}
            {COMPANY.businessIdIssuer} cấp ngày {COMPANY.businessIdDate}.
          </p>
          <p>Người đại diện pháp luật: {COMPANY.legalRepresentative}</p>
        </div>

        <nav aria-label="Chính sách" className="space-y-2 text-sm">
          <h2 className="font-semibold text-white">Chính sách</h2>
          <ul className="space-y-1">
            {POLICIES.map((policy) => (
              <li key={policy.href}>
                <Link href={policy.href} className="hover:text-accent-400">
                  {policy.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3 text-sm">
          <h2 className="font-semibold text-white">Lưu ý</h2>
          {/* Bắt buộc với sản phẩm thực phẩm chức năng. */}
          <p className="leading-relaxed">
            Thực phẩm này không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh.
          </p>
          <p className="leading-relaxed">
            Một số liên kết trên trang là liên kết tiếp thị. NutriWay có thể nhận hoa hồng khi bạn mua
            hàng qua các liên kết này, giá bạn trả không thay đổi.
          </p>
          <a
            href={MOIT_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Image
              src={moitBadge}
              alt="Đã thông báo website thương mại điện tử với Bộ Công Thương"
              width={150}
              height={56}
              unoptimized
            />
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs">
        © {await currentYear()} {COMPANY.shortName}
      </div>
    </footer>
  );
}
