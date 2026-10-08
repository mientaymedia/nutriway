/**
 * Khung chung cho các trang chính sách: nền trắng, bề ngang hẹp cho dễ đọc,
 * và cỡ chữ thống nhất.
 */
export default function PolicyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-lg bg-white p-6 text-sm leading-relaxed text-neutral-700 sm:p-8 [&_h1]:mb-4 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-brand-700 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:font-semibold [&_h2]:text-neutral-900 [&_li]:mb-1 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
