import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ZaloChat } from "@/components/zalo-chat";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NutriWay Việt Nam — Mua sắm tiết kiệm mỗi ngày",
    template: "%s · NutriWay Việt Nam",
  },
  description:
    "Sản phẩm chọn lọc từ Shopee Mall và Lazada Mall cùng mã khuyến mại cập nhật liên tục, do NutriWay Việt Nam tổng hợp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#noi-dung"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-brand-700"
        >
          Tới nội dung chính
        </a>
        <SiteHeader />
        <main id="noi-dung" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <ZaloChat />
      </body>
    </html>
  );
}
