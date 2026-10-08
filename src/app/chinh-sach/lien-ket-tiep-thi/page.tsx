import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Công bố liên kết tiếp thị",
  description: "NutriWay Việt Nam công bố việc sử dụng liên kết tiếp thị và cách nhận hoa hồng.",
};

export default function Page() {
  return (
    <>
      <h1>Công bố liên kết tiếp thị</h1>

      <p>
        Nhiều liên kết sản phẩm trên nutriway.vn là <strong>liên kết tiếp thị</strong> (affiliate).
        Trang này giải thích rõ điều đó có nghĩa gì với bạn.
      </p>

      <h2>Chúng tôi nhận được gì</h2>
      <p>
        Khi bạn bấm vào một liên kết sản phẩm và hoàn tất mua hàng trên sàn (Shopee, Lazada và các sàn
        khác), NutriWay có thể nhận một khoản hoa hồng từ sàn thông qua nền tảng tiếp thị liên kết
        AccessTrade.
      </p>

      <h2>Bạn trả thêm bao nhiêu</h2>
      <p>
        <strong>Không đồng nào.</strong> Giá bạn trả cho sàn hoàn toàn giống như khi bạn tự vào sàn mua.
        Hoa hồng do sàn chi trả, không cộng thêm vào giá bán.
      </p>

      <h2>Giao dịch diễn ra ở đâu</h2>
      <p>
        NutriWay chỉ giới thiệu sản phẩm. Mọi đơn hàng, thanh toán, vận chuyển và bảo hành đều do sàn và
        người bán trên sàn thực hiện. Khi cần hỗ trợ về đơn hàng, bạn liên hệ trực tiếp với sàn nơi đã
        đặt hàng.
      </p>

      <h2>Về giá và khuyến mãi hiển thị</h2>
      <p>
        Giá, phần trăm giảm và mã khuyến mãi trên trang được lấy tự động từ dữ liệu sàn cung cấp và có
        độ trễ nhất định. Sàn có thể thay đổi giá hoặc kết thúc khuyến mãi bất cứ lúc nào.{" "}
        <strong>Giá cuối cùng là giá hiển thị trên sàn tại thời điểm bạn đặt hàng.</strong>
      </p>

      <h2>Chúng tôi chọn sản phẩm thế nào</h2>
      <p>
        Việc có hoa hồng không làm thay đổi nội dung mô tả sản phẩm, vì các thông tin này lấy trực tiếp
        từ dữ liệu của sàn và người bán.
      </p>
    </>
  );
}
