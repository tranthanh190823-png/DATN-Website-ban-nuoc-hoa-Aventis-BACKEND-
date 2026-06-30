import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import products from './data/products.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const productsFilePath = path.join(__dirname, 'data', 'products.js');

const newProducts = products.map((product) => {
    let style = "Sang trọng, Cuốn hút";
    let phuHop = "Người yêu thích sự quyến rũ, tinh tế, phù hợp cho người trưởng thành.";
    let dipSuDung = "Tiệc đêm, Hẹn hò, Sự kiện quan trọng";
    
    if (product.gender === 'Nam') {
        style = "Nam tính, Lịch lãm, Đẳng cấp";
        phuHop = "Nam giới trưởng thành, nhân viên văn phòng, doanh nhân thành đạt.";
        dipSuDung = "Đi làm, Hội họp, Gặp gỡ đối tác, Tiệc tùng";
    }
    else if (product.gender === 'Nu') {
        style = "Ngọt ngào, Quyến rũ, Thanh lịch";
        phuHop = "Phụ nữ trẻ trung từ 18-35 tuổi, yêu thích phong cách nữ tính, năng động, tự tin.";
        dipSuDung = "Đi làm, Gặp gỡ bạn bè, Dạo phố, Hẹn hò lãng mạn";
    }
    else {
        style = "Hiện đại, Tinh tế, Phi giới tính (Unisex)";
        phuHop = "Mọi độ tuổi yêu thích sự mới mẻ, tự do và cá tính riêng biệt.";
        dipSuDung = "Sử dụng hàng ngày, Đi học, Đi làm, Cà phê cuối tuần";
    }

    let scentGroupName = product.scentCategory;
    if (scentGroupName === 'Go') scentGroupName = 'Hương Gỗ (Woody)';
    if (scentGroupName === 'Hoa') scentGroupName = 'Hương Hoa cỏ (Floral)';
    if (scentGroupName === 'Cam') scentGroupName = 'Hương Cam chanh (Citrus)';
    if (scentGroupName === 'Ngot') scentGroupName = 'Hương Ngọt ngào (Gourmand)';

    const unsplashImages = [
        "https://images.unsplash.com/photo-1594035910387-fea4772749d5?w=800&q=80",
        "https://images.unsplash.com/photo-1523293115678-d2900f52f2a2?w=800&q=80",
        "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80",
        "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80"
    ];
    // Pick one based on product name length to be somewhat consistent
    const generatedImageUrl = unsplashImages[product.name.length % unsplashImages.length];

    // Splitting scentNotes to Top, Middle, Base notes for the infographic effect
    let notes = product.scentNotes || [];
    let topNotes = notes.length > 0 ? notes.slice(0, Math.ceil(notes.length/3)).join(', ') : "Cam Bergamot, Quả chanh vàng";
    let middleNotes = notes.length > 1 ? notes.slice(Math.ceil(notes.length/3), Math.ceil(notes.length/3)*2).join(', ') : "Hoa nhài, Hoa hồng";
    let baseNotes = notes.length > 2 ? notes.slice(Math.ceil(notes.length/3)*2).join(', ') : "Gỗ đàn hương, Xạ hương, Hổ phách";

    const richDescription = `
<div class="not-prose" style="max-width: 1000px; margin: 0 auto; text-align: left;">
    <!-- Top Section: Text and Image -->
    <div style="display: flex; flex-wrap: wrap; gap: 40px; align-items: center; margin-bottom: 20px;">
        
        <!-- Left: Text Content -->
        <div style="flex: 1; min-width: 300px;">
            <h2 style="font-size: 26px; font-weight: bold; line-height: 1.3; text-transform: uppercase; margin-top: 0; margin-bottom: 16px; color: #000; letter-spacing: 0.5px;">
                Hương thơm đẳng cấp mang đến sự quyến rũ tuyệt đối.
            </h2>
            
            <p style="font-size: 15px; line-height: 1.6; color: #111; margin-top: 0; margin-bottom: 12px;">
                Khi sử dụng nước hoa, từng tầng hương đều tạo nên sự khác biệt. <strong>${product.name}</strong> được sáng tạo để giúp những người đam mê hương thơm khẳng định phong cách riêng, mang lại sự tự tin mà không kém phần tinh tế.
            </p>
            
            <p style="font-size: 15px; line-height: 1.6; color: #111; margin-top: 0; margin-bottom: 12px;">
                Từ những buổi họp quan trọng, dạo phố thư giãn đến những đêm tiệc sang trọng, chai nước hoa này được thiết kế để đồng hành cùng bạn trên mọi khoảnh khắc. Sự hòa quyện của <strong>${product.scentNotes.join(', ')}</strong> giúp bạn luôn nổi bật giữa đám đông.
            </p>
            
            <p style="font-size: 15px; line-height: 1.6; color: #111; margin-top: 0; margin-bottom: 0;">
                Dù bạn đang chuẩn bị cho một cuộc hẹn hò lãng mạn hay một ngày làm việc bận rộn, sản phẩm đến từ <strong>${product.brand}</strong> này đáp ứng mọi yêu cầu của những người dùng khó tính nhất. Kết hợp tính năng lưu hương vượt trội mà vẫn giữ phong cách thời thượng.
            </p>
        </div>

        <!-- Right: Image -->
        <div style="flex: 1; min-width: 300px; background-color: #f7f7f7; display: flex; justify-content: center; align-items: center; padding: 20px;">
            <img src="${generatedImageUrl}" alt="${product.name}" style="max-width: 100%; height: auto; object-fit: contain; mix-blend-mode: multiply;" />
        </div>
    </div>

    <!-- Bottom Section: Specs List -->
    <div style="border-top: 1px solid #eee; padding-top: 15px; padding-bottom: 15px;">
        <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #000;">Thông tin chi tiết</h3>
        
        <ul style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 8px 20px; padding-left: 15px; list-style-type: disc; margin: 0; color: #111; font-size: 14px;">
            <li style="margin-bottom: 4px; line-height: 1.4;">Thương hiệu: <strong>${product.brand}</strong></li>
            <li style="margin-bottom: 4px; line-height: 1.4;">Giới tính: <strong>${product.gender === 'Nam' ? 'Nam' : product.gender === 'Nu' ? 'Nữ' : 'Unisex'}</strong></li>
            <li style="margin-bottom: 4px; line-height: 1.4;">Nhóm hương: <strong>${scentGroupName}</strong></li>
            <li style="margin-bottom: 4px; line-height: 1.4;">Phong cách: <strong>${style}</strong></li>
            <li style="margin-bottom: 4px; line-height: 1.4;">Nồng độ: <strong>Eau de Parfum (EDP)</strong></li>
            <li style="margin-bottom: 4px; line-height: 1.4;">Xuất xứ: <strong>${product.origin || 'Chưa cập nhật'}</strong></li>
            <li style="margin-bottom: 4px; line-height: 1.4;">Mã sản phẩm: <strong>${product._id ? product._id.toString().substring(18).toUpperCase() : 'SP' + Math.floor(Math.random() * 10000)}</strong></li>
        </ul>
    </div>
</div>
`.trim();

    // Update product images array with the generated image
    const newImages = [generatedImageUrl];
    if (product.images && product.images.length > 1) {
        newImages.push(...product.images.slice(1));
    }

    return {
        ...product,
        images: newImages,
        description: richDescription
    };
});

const newContent = `const products = ${JSON.stringify(newProducts, null, 2)};\n\nexport default products;\n`;

fs.writeFileSync(productsFilePath, newContent, 'utf-8');
console.log("Successfully updated all product descriptions to use the rich orchard.vn style layout!");
