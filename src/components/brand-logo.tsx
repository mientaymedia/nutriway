import Image from "next/image";
import logoLight from "../../public/brand/logo.png";
import logoDark from "../../public/brand/logo-dark.png";

/**
 * Chữ ký thương hiệu NutriWay, dùng đúng file logo chính thức.
 * `tone="light"` cho nền sáng (chữ xanh), `tone="dark"` cho nền tối (chữ trắng).
 */
export function BrandLogo({ tone = "light", height = 34 }: { tone?: "light" | "dark"; height?: number }) {
  const src = tone === "light" ? logoLight : logoDark;
  return (
    <Image
      src={src}
      alt="NutriWay Việt Nam"
      height={height}
      // Ảnh gốc tỷ lệ 2,5:1; đặt chiều cao rồi để chiều rộng tự theo.
      style={{ height, width: "auto" }}
      priority
    />
  );
}
