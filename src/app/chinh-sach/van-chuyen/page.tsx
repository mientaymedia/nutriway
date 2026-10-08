import type { Metadata } from "next";
import { COMPANY, phoneHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Chính sách vận chuyển",
  description: "Việc giao nhận hàng hoá với đơn đặt qua liên kết trên nutriway.vn.",
};

export default function Page() {
  return (
    <>
      <h1>Chính sách vận chuyển và giao nhận</h1>

      <h2>Đơn hàng đặt trên sàn</h2>
      <p>
        Hiện nutriway.vn giới thiệu sản phẩm và chuyển bạn sang sàn để đặt hàng. Việc đóng gói, vận
        chuyển và giao nhận <strong>do sàn và người bán trên sàn thực hiện</strong>, theo chính sách vận
        chuyển của sàn đó.
      </p>
      <ul>
        <li>Phí vận chuyển, thời gian giao dự kiến và đơn vị vận chuyển hiển thị trên sàn khi bạn đặt hàng.</li>
        <li>Theo dõi hành trình đơn hàng trong mục đơn hàng của ứng dụng hoặc website sàn.</li>
        <li>
          Khi giao hàng chậm, thiếu hoặc hư hỏng, bạn khiếu nại trực tiếp với sàn vì sàn giữ đơn hàng và
          tiền thanh toán.
        </li>
      </ul>
      <p>
        NutriWay không nhận đơn, không thu tiền và không trực tiếp vận chuyển với nhóm đơn hàng này, nên
        không thể can thiệp vào quá trình giao nhận.
      </p>

      <h2>Khi NutriWay trực tiếp bán hàng</h2>
      <p>
        Website đang chuẩn bị chức năng bán hàng trực tiếp. Trước khi nhận đơn đầu tiên, phần dưới đây sẽ
        được công bố đầy đủ tại trang này:
      </p>
      <ul>
        <li>Phạm vi giao hàng và đơn vị vận chuyển hợp tác.</li>
        <li>Biểu phí vận chuyển và điều kiện miễn phí (nếu có).</li>
        <li>Thời gian xử lý đơn và thời gian giao dự kiến theo khu vực.</li>
        <li>Quy định kiểm tra hàng khi nhận và xử lý khi hàng hư hỏng do vận chuyển.</li>
      </ul>

      <h2>Liên hệ</h2>
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
