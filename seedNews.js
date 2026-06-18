import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' }
}, { timestamps: true });

const News = mongoose.models.News || mongoose.model('News', newsSchema);

const newsData = [
  {
    title: "Top 5 Nước Hoa Mùa Hè Dành Cho Nam Giới Năm 2026",
    imageUrl: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800",
    status: "ACTIVE",
    content: `
      <h2>Mùa Hè Gọi Tên Những Mùi Hương Tươi Mát</h2>
      <p>Mùa hè năm 2026 đang đến gần với cái nắng rực rỡ và những chuyến du lịch đầy hứng khởi. Việc lựa chọn cho mình một chai nước hoa phù hợp không chỉ giúp bạn tự tin hơn mà còn tạo ấn tượng mạnh với người đối diện.</p>
      
      <img src="https://images.unsplash.com/photo-1523293111678-5a02be04d169?auto=format&fit=crop&q=80&w=800" alt="Perfume" style="width:100%; border-radius: 12px; margin: 20px 0; object-fit: cover; max-height: 400px;"/>
      
      <h3>1. Creed Aventus - Vị Vua Của Mùa Hè</h3>
      <p>Với sự kết hợp hoàn hảo giữa <strong>dứa thơm, cam bergamot, và rêu sồi</strong>, Creed Aventus luôn là lựa chọn hàng đầu cho những quý ông thành đạt, yêu thích sự nam tính và sang trọng.</p>
      
      <h3>2. Acqua Di Giò Profumo</h3>
      <p>Hương thơm của biển cả quyện cùng hoắc hương nam tính. Đây là một mùi hương mang tính biểu tượng, cực kỳ phù hợp cho những ngày nắng nóng hoặc các buổi tiệc ngoài trời.</p>
      
      <h3>3. Dior Sauvage Eau De Toilette</h3>
      <p>Không bao giờ lỗi mốt, Dior Sauvage mở ra bằng sự cay nồng của tiêu Tứ Xuyên và cam Bergamot tươi mát. Mùi hương đậm chất hoang dã và tự do.</p>
      
      <p><strong>Lời khuyên:</strong> Hãy chọn những nốt hương cam chanh (citrus), hương biển (aquatic) vào ban ngày để mang lại cảm giác sảng khoái nhé!</p>
    `
  },
  {
    title: "Bí Quyết Xịt Nước Hoa Giữ Mùi Lâu Suốt Cả Ngày Dài",
    imageUrl: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=800",
    status: "ACTIVE",
    content: `
      <h2>Đừng Để Mùi Hương Nhanh Chóng Phai Đi</h2>
      <p>Rất nhiều người phàn nàn rằng chai nước hoa đắt tiền của họ bay mùi chỉ sau 2-3 tiếng. Thực tế, cách bạn xịt nước hoa quyết định đến 50% độ bám tỏa của nó.</p>
      
      <img src="https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&q=80&w=800" alt="Spraying Perfume" style="width:100%; border-radius: 12px; margin: 20px 0; object-fit: cover; max-height: 400px;"/>
      
      <h3>Những Điểm Chạm "Vàng" Trên Cơ Thể</h3>
      <p>Hãy tập trung xịt vào những vùng có mạch đập mạnh, nơi cơ thể tỏa nhiệt nhiều nhất. Nhiệt độ cơ thể sẽ giúp tinh dầu nước hoa phát tán một cách tự nhiên và bền bỉ:</p>
      <ul>
        <li>Cổ tay (Tuyệt đối không chà xát 2 cổ tay vào nhau)</li>
        <li>Sau gáy và dưới tai</li>
        <li>Phía bên trong khuỷu tay</li>
        <li>Ngực (giúp bạn tự cảm nhận được mùi hương của chính mình)</li>
      </ul>
      
      <h3>Sử Dụng Kem Dưỡng Ẩm Không Mùi</h3>
      <p>Nước hoa bám trên da ẩm tốt hơn gấp nhiều lần so với da khô. Hãy thoa một lớp kem dưỡng ẩm không mùi hoặc Vaseline lên các điểm xịt trước khi xịt nước hoa. Bạn sẽ bất ngờ với hiệu quả mà nó mang lại!</p>
    `
  },
  {
    title: "Sự Khác Biệt Giữa Eau de Toilette và Eau de Parfum: Nên Chọn Loại Nào?",
    imageUrl: "https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&q=80&w=800",
    status: "ACTIVE",
    content: `
      <h2>Hiểu Về Nồng Độ Nước Hoa</h2>
      <p>Khi mua nước hoa, bạn thường bắt gặp các cụm từ như EDT (Eau de Toilette) hay EDP (Eau de Parfum). Nhưng thực sự chúng có nghĩa là gì?</p>
      
      <img src="https://images.unsplash.com/photo-1557170334-a9632e77c6e4?auto=format&fit=crop&q=80&w=800" alt="Perfume concentration" style="width:100%; border-radius: 12px; margin: 20px 0; object-fit: cover; max-height: 400px;"/>
      
      <h3>Eau de Toilette (EDT)</h3>
      <p>Chứa từ <strong>5% - 15%</strong> tinh dầu nước hoa. Mùi hương của EDT thường tươi mát, nhẹ nhàng và bám trên da khoảng 3 đến 5 tiếng. Phù hợp cho môi trường văn phòng, sử dụng hàng ngày hoặc mùa hè oi bức.</p>
      
      <h3>Eau de Parfum (EDP)</h3>
      <p>Chứa từ <strong>15% - 20%</strong> tinh dầu. Mùi hương của EDP thường đậm đà, sâu sắc hơn và bám mùi tốt (từ 6 đến 8 tiếng). EDP rất phù hợp cho những buổi tiệc tối, hẹn hò hoặc thời tiết thu đông se lạnh.</p>
      
      <h3>Kết Luận</h3>
      <p>Tùy vào hoàn cảnh sử dụng mà bạn có thể chọn cho mình một chai EDT hoặc EDP. Nhiều người yêu nước hoa thường sở hữu cả hai phiên bản của cùng một mùi hương để linh hoạt sử dụng ngày và đêm.</p>
    `
  },
  {
    title: "Xu Hướng Nước Hoa Unisex - Phá Vỡ Mọi Giới Hạn Giới Tính",
    imageUrl: "https://images.unsplash.com/photo-1587403225881-28564db7bd5a?auto=format&fit=crop&q=80&w=800",
    status: "ACTIVE",
    content: `
      <h2>Khi Mùi Hương Không Còn Sự Ranh Giới Giữa Nam Và Nữ</h2>
      <p>Thế kỷ 21 đánh dấu sự trỗi dậy mạnh mẽ của phong cách Unisex, và thế giới mùi hương cũng không ngoại lệ. Nước hoa Unisex được tạo ra để tôn vinh sự độc bản của mỗi cá nhân, thay vì gắn nhãn "dành cho nam" hay "dành cho nữ".</p>
      
      <img src="https://images.unsplash.com/photo-1605553540205-095133af00cb?auto=format&fit=crop&q=80&w=800" alt="Unisex perfume" style="width:100%; border-radius: 12px; margin: 20px 0; object-fit: cover; max-height: 400px;"/>
      
      <h3>Tại Sao Nước Hoa Unisex Lại Được Yêu Thích?</h3>
      <p>Sự kết hợp tinh tế giữa những nốt hương thường mặc định cho phái mạnh (như gỗ tuyết tùng, cỏ hương bài, da thuộc) với những nốt hương mềm mại của phái đẹp (như hoa hồng, vanilla, nhài) tạo ra những kiệt tác mùi hương khó đoán và vô cùng lôi cuốn.</p>
      
      <p>Đặc biệt, cùng một chai nước hoa Unisex, nhưng khi xịt lên da của nam giới và nữ giới, mùi hương sẽ phát triển theo những chiều hướng hoàn toàn khác nhau do sự tương tác sinh hóa của da (Skin Chemistry).</p>
      
      <h3>Những Cái Tên Đình Đám Trong Giới Unisex</h3>
      <ul>
        <li><strong>Le Labo Santal 33:</strong> Mùi hương của xưởng mộc cổ kính, ngai ngái và độc lạ.</li>
        <li><strong>Tom Ford Oud Wood:</strong> Trầm hương sang trọng, bí ẩn và quyền lực.</li>
        <li><strong>Maison Francis Kurkdjian Baccarat Rouge 540:</strong> Ngọt ngào rực rỡ tựa như kẹo bông gòn đun chảy quyện cùng gỗ tuyết tùng.</li>
      </ul>
    `
  }
];

async function seedNews() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Kết nối MongoDB thành công');

    // Xóa dữ liệu cũ
    await News.deleteMany({});
    console.log('🗑️ Đã xóa tin tức cũ');

    // Insert dữ liệu mới
    const createdNews = await News.insertMany(newsData);
    console.log(`🎉 Đã tạo thành công ${createdNews.length} bài tin tức.`);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
  }
}

seedNews();
