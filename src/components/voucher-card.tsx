import type { Voucher } from "@/lib/accesstrade/offers";

function remaining(endsAt: Date | null, now: number): string | null {
  if (!endsAt) return null;
  const hours = Math.floor((endsAt.getTime() - now) / 3_600_000);
  if (hours < 0) return null;
  if (hours < 24) return `Còn ${hours} giờ`;
  return `Còn ${Math.floor(hours / 24)} ngày`;
}

export function VoucherCard({ voucher, now }: { voucher: Voucher; now: number }) {
  const left = remaining(voucher.endsAt, now);
  const code = voucher.codes[0]?.code ?? null;

  return (
    <article className="flex flex-col gap-2 rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-neutral-800">{voucher.name}</h3>
        {voucher.merchant && (
          <span className="shrink-0 rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-600">
            {voucher.merchant}
          </span>
        )}
      </div>

      {code && <p className="font-mono text-lg font-bold tracking-wide text-sale">{code}</p>}
      {voucher.codes[0]?.description && (
        <p className="text-xs leading-relaxed text-neutral-600">{voucher.codes[0].description}</p>
      )}

      <div className="mt-auto flex items-center justify-between pt-2 text-xs text-neutral-500">
        <span>{left ?? "Không ghi hạn"}</span>
        {voucher.percentageUsed > 0 && <span>Đã dùng {voucher.percentageUsed}%</span>}
      </div>

      <a
        href={voucher.affLink}
        rel="nofollow sponsored noopener"
        target="_blank"
        className="rounded bg-accent-500 px-4 py-2 text-center text-sm font-semibold text-brand-700 transition hover:bg-accent-400 focus:outline-2 focus:outline-offset-2 focus:outline-brand-600"
      >
        Dùng mã
      </a>
    </article>
  );
}
