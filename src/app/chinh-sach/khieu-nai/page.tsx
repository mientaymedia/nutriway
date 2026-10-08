import type { Metadata } from "next";
import { COMPANY, phoneHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Giải quyết khiếu nại",
  description: "Cách tiếp nhận và xử lý khiếu nại, tranh chấp liên quan tới nutriway.vn.",
};

export default function Page() {
  return (
    <>
      <h1>Giải quyết khiếu nại và tranh chấp</h1>

      <h2>Phạm vi</h2>
      <p>NutriWay tiếp nhận và xử lý khiếu nại về:</p>
      <ul>
        <li>Nội dung hiển thị trên nutriway.vn: thông tin sản phẩm, giá, mã khuyến mãi không chính xác.</li>
        <li>Liên kết hỏng hoặc dẫn sai sản phẩm.</li>
        <li>Việc thu thập và sử dụng thông tin cá nhân của bạn trên website này.</li>
      </ul>
      <p>
        Khiếu nại về <strong>đơn hàng đã đặt trên sàn</strong> (giao chậm, hàng lỗi, hoàn tiền) thuộc
        thẩm quyền của sàn, vì sàn giữ đơn hàng và tiền thanh toán. Bạn gửi khiếu nại trong ứng dụng hoặc
        website của sàn đó. NutriWay sẵn sàng hỗ trợ cung cấp thông tin trong khả năng của mình.
      </p>

      <h2>Cách gửi khiếu nại</h2>
      <p>
        Gọi{" "}
        <a href={phoneHref} className="text-brand-600 underline">
          {COMPANY.phone}
        </a>
        , nhắn tin qua Zalo của NutriWay, hoặc gửi văn bản tới {COMPANY.address}.
      </p>
      <p>Để xử lý nhanh, nội dung khiếu nại nên có:</p>
      <ul>
        <li>Họ tên và số điện thoại liên hệ của bạn.</li>
        <li>Đường dẫn trang hoặc tên sản phẩm có vấn đề.</li>
        <li>Mô tả sự việc và ảnh chụp màn hình nếu có.</li>
      </ul>

      <h2>Thời hạn xử lý</h2>
      <ul>
        <li>
          <strong>Trong 3 ngày làm việc:</strong> NutriWay xác nhận đã nhận khiếu nại.
        </li>
        <li>
          <strong>Trong 7 ngày làm việc</strong> kể từ khi xác nhận: trả lời hướng xử lý. Vụ việc phức
          tạp cần xác minh thêm có thể kéo dài hơn, NutriWay sẽ thông báo lý do và thời hạn mới.
        </li>
      </ul>

      <h2>Khi không đạt thoả thuận</h2>
      <p>Nếu hai bên không thống nhất được, bạn có quyền:</p>
      <ul>
        <li>
          Phản ánh tới cơ quan quản lý nhà nước về thương mại điện tử qua Cổng thông tin Quản lý hoạt
          động thương mại điện tử tại{" "}
          <a
            href="https://online.gov.vn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 underline"
          >
            online.gov.vn
          </a>
          .
        </li>
        <li>Phản ánh tới cơ quan bảo vệ quyền lợi người tiêu dùng tại địa phương.</li>
        <li>Khởi kiện tại Toà án có thẩm quyền theo quy định của pháp luật Việt Nam.</li>
      </ul>

      <h2>Đơn vị tiếp nhận</h2>
      <address className="not-italic">
        <p className="font-semibold text-neutral-900">{COMPANY.legalName}</p>
        <p>Địa chỉ: {COMPANY.address}</p>
        <p>
          Điện thoại:{" "}
          <a href={phoneHref} className="text-brand-600 underline">
            {COMPANY.phone}
          </a>
        </p>
        <p>Người chịu trách nhiệm quản lý nội dung: {COMPANY.contentManager}</p>
      </address>
    </>
  );
}
