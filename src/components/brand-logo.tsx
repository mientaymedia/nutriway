/**
 * Chữ ký thương hiệu NutriWay.
 *
 * TẠM THỜI dựng bằng chữ theo đúng hai màu nhận diện, vì file logo trong thư
 * mục công ty là bộ nhận diện CŨ (chữ serif kèm nhành lá), không khớp bộ mới.
 * Khi có file thật, thay phần bên dưới bằng <Image src="/brand/logo.svg" …>.
 */
export function BrandLogo({ tone = "light" }: { tone?: "light" | "dark" }) {
  // "light" là logo cho nền sáng (chữ xanh đậm); "dark" cho nền tối (chữ trắng).
  const word = tone === "light" ? "text-brand-600" : "text-white";
  const sub = tone === "light" ? "text-accent-500" : "text-accent-400";
  return (
    <span className="inline-flex items-baseline gap-1.5 leading-none select-none">
      <span className={`text-2xl font-bold tracking-tight ${word}`}>nutriway</span>
      <span className={`text-sm font-semibold ${sub}`}>vietnam</span>
    </span>
  );
}
