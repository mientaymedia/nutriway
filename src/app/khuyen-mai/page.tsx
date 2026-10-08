import type { Metadata } from "next";
import { VoucherCard } from "@/components/voucher-card";
import { getActiveVouchers } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Mã khuyến mãi",
  description: "Mã giảm giá và khuyến mãi đang chạy trên Shopee, Lazada và các sàn khác, cập nhật liên tục.",
};

export default async function VoucherPage() {
  const result = await getActiveVouchers(24);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-xl font-bold text-brand-700">Mã khuyến mãi đang chạy</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Mã do các sàn phát hành, số lượt có hạn và có thể hết trước thời gian ghi trên thẻ.
      </p>

      {result.items.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500">
          {result.state === "not_configured"
            ? "Phần khuyến mãi chưa được kết nối. Đặt ACCESSTRADE_API_KEY trên máy chủ để hiển thị mã."
            : result.state === "error"
              ? "Tạm thời chưa tải được mã khuyến mãi. Vui lòng thử lại sau."
              : "Hiện chưa có mã khuyến mãi nào đang chạy."}
        </p>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((voucher) => (
            <VoucherCard key={voucher.id} voucher={voucher} now={result.asOf} />
          ))}
        </div>
      )}
    </div>
  );
}
