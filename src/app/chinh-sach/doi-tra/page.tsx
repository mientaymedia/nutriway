import type { Metadata } from "next";
import { COMPANY, phoneHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Chính sách đổi trả",
  description: "Cách đổi trả và hoàn tiền với đơn hàng phát sinh qua liên kết trên nutriway.vn.",
};

export default function Page() {
  return (
    <>
      <h1>Chính sách đổi trả và hoàn tiền</h1>

      <h2>Đơn hàng mua qua liên kết trên trang này</h2>
      <p>
        Hiện tại nutriway.vn giới thiệu sản phẩm và chuyển bạn sang sàn để hoàn tất mua hàng. Người bán
        trong giao dịch là <strong>sàn và nhà bán hàng trên sàn</strong>, không phải NutriWay.
      </p>
      <p>Vì vậy, việc đổi trả và hoàn tiền áp dụng theo chính sách của sàn nơi bạn đặt hàng:</p>
      <ul>
        <li>Mở ứng dụng hoặc website của sàn, vào mục đơn hàng của bạn.</li>
        <li>Chọn đơn cần đổi trả và làm theo hướng dẫn của sàn.</li>
        <li>Thời hạn và điều kiện đổi trả do sàn và nhà bán hàng quy định.</li>
      </ul>
      <p>
        NutriWay không giữ đơn hàng, không thu tiền và không có quyền can thiệp vào đơn của bạn trên
        sàn, nên không thể xử lý đổi trả thay bạn.
      </p>

      <h2>Khi NutriWay trực tiếp bán hàng</h2>
      <p>
        Trang đang chuẩn bị chức năng bán hàng trực tiếp. Khi chức năng này mở, chính sách đổi trả riêng
        của NutriWay sẽ được công bố tại đây trước khi nhận đơn đầu tiên, bao gồm thời hạn đổi trả, điều
        kiện sản phẩm, chi phí vận chuyển chiều trả và thời gian hoàn tiền.
      </p>

      <h2>Liên hệ</h2>
      <p>Thắc mắc về nội dung trên trang, liên hệ:</p>
      <address className="not-italic">
        <p className="font-semibold text-neutral-900">{COMPANY.legalName}</p>
        <p>Địa chỉ: {COMPANY.address}</p>
        <p>
          Điện thoại:{" "}
          <a href={phoneHref} className="text-brand-600 underline">
            {COMPANY.phone}
          </a>
        </p>
      </address>
    </>
  );
}
