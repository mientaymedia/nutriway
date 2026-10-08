import type { Metadata } from "next";
import { COMPANY, phoneHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng",
  description: "Điều kiện giao dịch chung khi sử dụng website nutriway.vn.",
};

export default function Page() {
  return (
    <>
      <h1>Điều khoản sử dụng</h1>
      <p>
        Khi truy cập và sử dụng nutriway.vn, bạn đồng ý với các điều khoản dưới đây. Nếu không đồng ý,
        vui lòng ngừng sử dụng website.
      </p>

      <h2>1. Về website này</h2>
      <p>
        nutriway.vn do {COMPANY.legalName} vận hành. Website giới thiệu sản phẩm và chuyển người dùng
        sang các sàn thương mại điện tử để hoàn tất việc mua hàng.
      </p>
      <p>
        <strong>NutriWay không phải là bên bán</strong> trong các giao dịch phát sinh trên sàn. Hợp đồng
        mua bán được xác lập giữa bạn và người bán trên sàn.
      </p>

      <h2>2. Thông tin sản phẩm và giá</h2>
      <ul>
        <li>Tên, hình ảnh, mô tả, giá và khuyến mãi được lấy tự động từ dữ liệu do sàn cung cấp.</li>
        <li>
          Dữ liệu có độ trễ. Giá và tình trạng còn hàng <strong>có thể đã thay đổi</strong> so với lúc
          hiển thị.
        </li>
        <li>
          Giá có hiệu lực là giá hiển thị trên sàn tại thời điểm bạn đặt hàng, không phải giá trên trang
          này.
        </li>
      </ul>

      <h2>3. Nghĩa vụ của người dùng</h2>
      <ul>
        <li>Không dùng website vào mục đích trái pháp luật.</li>
        <li>Không can thiệp hoặc làm gián đoạn hoạt động của website bằng công cụ tự động.</li>
        <li>Không sao chép nội dung website cho mục đích thương mại khi chưa được đồng ý.</li>
      </ul>

      <h2>4. Giới hạn trách nhiệm</h2>
      <p>NutriWay chịu trách nhiệm về nội dung do mình đăng tải. NutriWay không chịu trách nhiệm về:</p>
      <ul>
        <li>Chất lượng, nguồn gốc và tình trạng hàng hoá do người bán trên sàn cung cấp.</li>
        <li>Việc giao hàng, thanh toán, đổi trả và bảo hành do sàn và người bán thực hiện.</li>
        <li>Thiệt hại do sử dụng sản phẩm không theo hướng dẫn của nhà sản xuất.</li>
      </ul>

      <h2>5. Sản phẩm thực phẩm bảo vệ sức khoẻ</h2>
      <p>
        Với nhóm thực phẩm chức năng và thực phẩm bảo vệ sức khoẻ:{" "}
        <strong>sản phẩm không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh.</strong> Bạn
        nên đọc kỹ hướng dẫn sử dụng và hỏi ý kiến bác sĩ hoặc dược sĩ trước khi dùng.
      </p>

      <h2>6. Sửa đổi điều khoản</h2>
      <p>
        NutriWay có thể cập nhật các điều khoản này. Bản mới có hiệu lực kể từ khi đăng trên website.
      </p>

      <h2>7. Luật áp dụng</h2>
      <p>
        Các điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Tranh chấp giải quyết theo{" "}
        <a href="/chinh-sach/khieu-nai" className="text-brand-600 underline">
          cơ chế giải quyết khiếu nại
        </a>
        ; nếu không đạt thoả thuận, vụ việc được đưa ra Toà án có thẩm quyền.
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
