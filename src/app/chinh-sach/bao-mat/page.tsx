import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách bảo mật",
  description: "NutriWay Việt Nam thu thập và sử dụng thông tin gì khi bạn truy cập nutriway.vn.",
};

export default function Page() {
  return (
    <>
      <h1>Chính sách bảo mật thông tin</h1>

      <h2>Chúng tôi thu thập gì</h2>
      <p>
        Ở phiên bản hiện tại, nutriway.vn <strong>không yêu cầu bạn đăng ký tài khoản</strong> và không
        thu thập tên, số điện thoại, địa chỉ hay thông tin thanh toán của bạn.
      </p>
      <p>Như mọi website, máy chủ ghi nhận dữ liệu kỹ thuật cơ bản khi bạn truy cập:</p>
      <ul>
        <li>Địa chỉ IP và loại trình duyệt, phục vụ vận hành và chống lạm dụng.</li>
        <li>Trang bạn xem và liên kết bạn bấm, để biết nội dung nào hữu ích.</li>
      </ul>

      <h2>Khi bạn bấm sang sàn</h2>
      <p>
        Bấm nút mua hàng sẽ chuyển bạn sang sàn (Shopee, Lazada và các sàn khác) qua nền tảng tiếp thị
        liên kết AccessTrade. Từ thời điểm đó,{" "}
        <strong>chính sách bảo mật của sàn và của AccessTrade được áp dụng</strong>. Việc mua hàng, thanh
        toán và dữ liệu cá nhân bạn nhập trên sàn do sàn quản lý, NutriWay không nhìn thấy.
      </p>
      <p>
        NutriWay chỉ nhận lại từ AccessTrade thông tin đối soát hoa hồng ở mức đơn hàng (mã đơn, giá trị,
        trạng thái duyệt), <strong>không có tên, địa chỉ hay số điện thoại của người mua</strong>.
      </p>

      <h2>Cookie và theo dõi</h2>
      <p>
        Trang tôn trọng tín hiệu <em>Do Not Track</em> và <em>Global Privacy Control</em> của trình duyệt:
        khi bạn bật các tín hiệu này, trang không đặt cookie phục vụ việc theo dõi.
      </p>
      <p>
        Sàn và nền tảng tiếp thị liên kết có thể đặt cookie riêng để ghi nhận nguồn giới thiệu đơn hàng.
        Bạn có thể xoá cookie trong trình duyệt bất cứ lúc nào.
      </p>

      <h2>Chia sẻ thông tin</h2>
      <p>
        Chúng tôi không bán và không trao đổi dữ liệu của bạn. Thông tin chỉ được cung cấp khi có yêu cầu
        hợp pháp của cơ quan nhà nước có thẩm quyền.
      </p>

      <h2>Quyền của bạn</h2>
      <p>
        Bạn có quyền yêu cầu biết thông tin nào liên quan đến mình đang được lưu, yêu cầu sửa hoặc xoá.
        Liên hệ theo thông tin dưới đây.
      </p>

      <h2>Thay đổi chính sách</h2>
      <p>
        Khi trang mở chức năng bán hàng trực tiếp (giỏ hàng, thanh toán, xuất hoá đơn), chính sách này sẽ
        được cập nhật trước khi chức năng đó hoạt động, vì khi đó chúng tôi mới thu thập thông tin giao
        hàng và thông tin xuất hoá đơn.
      </p>

      <h2>Liên hệ</h2>
      <p>
        Công ty TNHH Thương mại Dịch vụ Nutriway Việt Nam.
        {/* TODO: bổ sung địa chỉ, mã số thuế, email và số điện thoại trước khi quảng bá rộng. */}
      </p>
    </>
  );
}
