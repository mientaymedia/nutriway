import type { Metadata } from "next";
import { COMPANY, phoneHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Chính sách thanh toán",
  description: "Các phương thức thanh toán áp dụng với đơn hàng liên quan tới nutriway.vn.",
};

export default function Page() {
  return (
    <>
      <h1>Chính sách thanh toán</h1>

      <h2>Đơn hàng đặt trên sàn</h2>
      <p>
        Với sản phẩm bạn mua qua liên kết trên nutriway.vn, việc thanh toán diễn ra{" "}
        <strong>trên sàn</strong>, theo các phương thức mà sàn đó hỗ trợ: thanh toán khi nhận hàng, thẻ
        ngân hàng, ví điện tử, chuyển khoản.
      </p>
      <p>
        <strong>NutriWay không thu tiền của bạn</strong> và không lưu thông tin thẻ hay tài khoản ngân
        hàng trong nhóm giao dịch này. Mọi dữ liệu thanh toán bạn nhập đều do sàn và đơn vị trung gian
        thanh toán của sàn xử lý.
      </p>
      <p>
        Cảnh báo: NutriWay <strong>không bao giờ</strong> yêu cầu bạn chuyển khoản vào tài khoản cá nhân
        để mua hàng trên sàn. Nếu gặp đề nghị như vậy, đó là lừa đảo.
      </p>

      <h2>Khi NutriWay trực tiếp bán hàng</h2>
      <p>
        Chức năng bán hàng trực tiếp đang được chuẩn bị. Khi mở, trang này sẽ công bố đầy đủ trước khi
        nhận đơn đầu tiên:
      </p>
      <ul>
        <li>Các phương thức thanh toán được chấp nhận và đơn vị trung gian thanh toán.</li>
        <li>Thời hạn giữ đơn chờ thanh toán.</li>
        <li>Quy trình xuất hoá đơn điện tử cho đơn hàng.</li>
        <li>Cách xử lý khi thanh toán lỗi hoặc trừ tiền trùng.</li>
      </ul>

      <h2>Hoá đơn</h2>
      <p>
        Với đơn hàng đặt trên sàn, hoá đơn do người bán trên sàn phát hành. Bạn yêu cầu xuất hoá đơn
        trong lúc đặt hàng trên sàn.
      </p>

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
