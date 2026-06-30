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
<h3 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #111;">Chi tiết về sản phẩm</h3>
<table style="width: 100%; margin-bottom: 30px; font-size: 15px; border-collapse: separate; border-spacing: 0 10px;">
    <tr><td style="font-weight: bold; width: 30%; color: #333;">Phân loại:</td><td style="color: #666;">Nước hoa ${product.gender === 'Nam' ? 'Nam' : product.gender === 'Nu' ? 'Nữ' : 'Unisex'}</td></tr>
    <tr><td style="font-weight: bold; color: #333;">Xuất xứ:</td><td style="color: #666;">${product.origin || 'Chưa cập nhật'}</td></tr>
    <tr><td style="font-weight: bold; color: #333;">Nồng độ:</td><td style="color: #666;">Eau de Parfum (EDP)</td></tr>
    <tr><td style="font-weight: bold; color: #333;">Nhóm hương:</td><td style="color: #4a90e2;">${scentGroupName}</td></tr>
    <tr><td style="font-weight: bold; color: #333;">Phong cách:</td><td style="color: #666;">${style}</td></tr>
    <tr><td style="font-weight: bold; color: #333;">Dịp sử dụng:</td><td style="color: #666;">${dipSuDung}</td></tr>
</table>

<p style="line-height: 1.8; color: #444; margin-bottom: 20px;">
    <strong>${product.name}</strong> là dòng nước hoa cao cấp đến từ thương hiệu <strong>${product.brand}</strong>. Mang trong mình tinh thần hiện đại và tự do, sản phẩm mở ra một không gian hương thơm tinh tế, lưu giữ trọn vẹn những nốt hương đặc trưng nhất. Sự hòa quyện của <strong>${product.scentNotes.join(', ')}</strong> tạo nên cảm giác vừa tươi mới, vừa quyến rũ như một khu vườn tràn ngập sức sống.
</p>

<h3 style="font-size: 20px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; color: #111;">${product.name}: Biểu tượng của sự đẳng cấp</h3>
<p style="line-height: 1.8; color: #444; margin-bottom: 30px;">
    ${product.brand} luôn nổi bật với sự kết hợp giữa nét cổ điển và hiện đại, tạo dấu ấn đậm nét trong làng nước hoa toàn cầu. <strong>${product.name}</strong> không chỉ là một mùi hương, mà còn là một thông điệp tôn vinh vẻ đẹp tự nhiên và bản lĩnh của người sử dụng.
</p>

<div style="background-color: #fcfcfc; padding: 30px 20px; border-radius: 12px; margin-bottom: 40px; text-align: center; border: 1px solid #eee;">
    <h3 style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 25px; text-transform: uppercase;">Cấu trúc 3 tầng hương</h3>
    
    <div style="display: flex; flex-direction: column; md:flex-row; justify-content: space-between; gap: 20px;">
        <div style="flex: 1;">
            <div style="background-color: #ffb8b8; color: #c0392b; font-weight: bold; padding: 8px 15px; border-radius: 20px; display: inline-block; margin-bottom: 10px; font-size: 14px;">Hương đầu (5 - 15 phút)</div>
            <div style="color: #555; font-size: 14px; font-weight: 500;">🌿 ${topNotes}</div>
        </div>
        
        <div style="flex: 1;">
            <div style="background-color: #ffcccc; color: #c0392b; font-weight: bold; padding: 8px 15px; border-radius: 20px; display: inline-block; margin-bottom: 10px; font-size: 14px;">Hương giữa (20 - 60 phút)</div>
            <div style="color: #555; font-size: 14px; font-weight: 500;">🌸 ${middleNotes}</div>
        </div>
        
        <div style="flex: 1;">
            <div style="background-color: #ffd6d6; color: #c0392b; font-weight: bold; padding: 8px 15px; border-radius: 20px; display: inline-block; margin-bottom: 10px; font-size: 14px;">Hương cuối (>6 tiếng)</div>
            <div style="color: #555; font-size: 14px; font-weight: 500;">🪵 ${baseNotes}</div>
        </div>
    </div>
</div>

<h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #111;">Ai phù hợp với mùi hương này?</h3>
<ul style="list-style-type: disc; margin-left: 20px; line-height: 1.8; color: #444; margin-bottom: 30px;">
    <li>${phuHop}</li>
    <li>Người thích sự lưu hương dai dẳng, muốn để lại dấu ấn ở mọi nơi mình bước qua.</li>
</ul>

<h3 style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #111;">Thích hợp dùng khi nào?</h3>
<ul style="list-style-type: disc; margin-left: 20px; line-height: 1.8; color: #444; margin-bottom: 40px;">
    <li><strong>Đi làm, đi học:</strong> Tạo cảm giác tươi sáng, năng lượng tích cực mà không quá nồng gắt.</li>
    <li><strong>Gặp gỡ bạn bè:</strong> Dịu dàng, cuốn hút nhưng không lấn át không gian xung quanh.</li>
    <li><strong>Sự kiện, tiệc tùng:</strong> Tôn vinh nét sang trọng và đẳng cấp của bạn.</li>
</ul>

<div style="text-align: center; margin-bottom: 24px;">
    <img src="${generatedImageUrl}" alt="${product.name}" style="max-width: 100%; max-height: 500px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); object-fit: cover; margin: 0 auto; display: block;" />
    <p style="text-align: center; font-style: italic; color: #666; margin-top: 12px; font-size: 0.95em;">Hình ảnh minh họa cho ${product.name}</p>
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
