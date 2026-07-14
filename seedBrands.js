import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './configs/db.js';
import User from './models/User.js';
import Product from './models/Product.js';

dotenv.config();

const brands = ['AFNAN', 'CHANEL', 'GUCCI', 'HERMES', 'YSL', 'DIOR'];
const genders = ['Nam', 'Nu', 'Unisex'];
const scentCategories = ['Hoa', 'Go', 'Cam', 'Ngot'];

const generateProducts = (adminId) => {
    const newProducts = [];
    
    for (const brand of brands) {
        for (let i = 1; i <= 20; i++) {
            const gender = genders[Math.floor(Math.random() * genders.length)];
            const scentCategory = scentCategories[Math.floor(Math.random() * scentCategories.length)];
            const price = Math.floor(Math.random() * 50 + 10) * 100000; // 1tr - 6tr
            const hasSale = Math.random() > 0.7;
            const salePrice = hasSale ? price * 0.8 : price;

            newProducts.push({
                user: adminId,
                name: `${brand} Perfume Collection ${i}`,
                brand: brand,
                gender: gender,
                type: 'Full',
                scentCategory: scentCategory,
                scentNotes: ['Cam Bergamot', 'Hoa Hồng', 'Xạ Hương', 'Hổ Phách'].sort(() => 0.5 - Math.random()).slice(0, 3),
                origin: ['Pháp', 'Ý', 'UAE', 'Anh'].sort(() => 0.5 - Math.random())[0],
                description: `Đây là sản phẩm nước hoa cao cấp đến từ thương hiệu ${brand}. Mang lại sự quyến rũ và tự tin cho người sử dụng. Sản phẩm chỉ bán Full box nguyên seal.`,
                images: [
                    'https://borcen-store-newdemo.myshopify.com/cdn/shop/files/s29-1_1.jpg?v=1756867089',
                    'https://borcen-store-newdemo.myshopify.com/cdn/shop/files/s29-2_1.jpg?v=1756868462'
                ],
                volumes: [
                    { ml: 100, label: '100ml (Full box)', price: price, salePrice: salePrice, stock: Math.floor(Math.random() * 50) + 10 }
                ],
                price: price,
                salePrice: salePrice,
                stock: Math.floor(Math.random() * 50) + 10,
                rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
                numReviews: Math.floor(Math.random() * 50),
                isHot: Math.random() > 0.8,
                isSale: hasSale,
                isBestSeller: Math.random() > 0.7,
                isNewArrival: Math.random() > 0.7,
                isActive: true
            });
        }
    }
    return newProducts;
};

const runSeeder = async () => {
    try {
        await connectDB();
        
        // Find admin user
        const admin = await User.findOne({ isAdmin: true }) || await User.findOne({});
        if (!admin) {
            console.error('Khong tim thay user de gan san pham!');
            process.exit(1);
        }

        console.log(`Dang xoa du lieu cu cua cac brand: ${brands.join(', ')}...`);
        await Product.deleteMany({ brand: { $in: brands } });

        console.log(`Dang tao data cho cac brand...`);
        const productsToInsert = generateProducts(admin._id);
        
        await Product.insertMany(productsToInsert);
        console.log(`✅ Da theem thanh cong ${productsToInsert.length} san pham chi co Full box!`);
        
        process.exit();
    } catch (error) {
        console.error('Loi:', error);
        process.exit(1);
    }
};

runSeeder();
