import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const brands = ['AFNAN', 'CHANEL', 'GUCCI', 'HERMES', 'YSL', 'DIOR'];
const genders = ['Nam', 'Nu', 'Unisex'];
const origins = ['Pháp', 'Ý', 'Mỹ', 'Anh', 'Tây Ban Nha', 'UAE'];

const scentData = [
  { category: 'Hoa', notes: ['Hoa hồng', 'Hoa nhài'] },
  { category: 'Go', notes: ['Đàn hương', 'Tuyết tùng'] },
  { category: 'Cam', notes: ['Cam tươi', 'Cam Bergamot'] },
  { category: 'Ngot', notes: ['Vanilla', 'Caramel'] }
];

const adjectives = ['Intense', 'Bloom', 'L\'eau', 'Absolu', 'Noir', 'Blanc', 'Sport', 'Gold', 'Blue', 'Elixir', 'Parfum', 'Cologne', 'Oud', 'Classic', 'Velvet', 'Rouge', 'Nuit', 'Jour', 'Fraiche', 'Extreme', 'Magic', 'Royal'];
const suffixes = ['EDP', 'EDT', 'Pour Homme', 'Pour Femme', 'Unisex', 'Edition'];

const imagesList = [
    "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800",
    "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800",
    "https://images.unsplash.com/photo-1615397323114-1e0e181e5927?w=800",
    "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800",
    "https://images.unsplash.com/photo-1595425959632-ce1517441865?w=800",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800"
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const products = [];
const nameSet = new Set();

for (const brand of brands) {
    for (let i = 0; i < 20; i++) {
        // Generate unique name
        let name = '';
        while (true) {
            const adj = getRandomItem(adjectives);
            const suff = getRandomItem(suffixes);
            name = `${brand} ${adj} ${suff}`;
            if (!nameSet.has(name)) {
                nameSet.add(name);
                break;
            }
        }

        const gender = getRandomItem(genders);
        const origin = getRandomItem(origins);
        
        const scent = getRandomItem(scentData);
        const scentCategory = scent.category;
        const scentNotes = scent.notes; // always 2 notes

        const isChiet = Math.random() > 0.3; // 70% chance co chiet, 30% khong chiet
        const type = isChiet ? 'Chiết' : 'Full';
        
        // Pricing
        // Base price for 100ml
        const basePrice = Math.floor(getRandomInt(15, 60)) * 100000; // 1tr5 to 6tr
        const isSale = Math.random() > 0.6; // 40% chance is on sale
        const discountRate = isSale ? (getRandomInt(10, 25) / 100) : 0;
        
        const salePrice = isSale ? Math.floor(basePrice * (1 - discountRate)) : basePrice;

        const volumes = [];
        
        if (isChiet) {
            const price10 = Math.floor(basePrice * 0.1) + 50000;
            const price20 = Math.floor(basePrice * 0.2) + 60000;
            const price30 = Math.floor(basePrice * 0.3) + 70000;

            volumes.push({
                ml: 10,
                label: "10ml (Chiết)",
                price: price10,
                salePrice: isSale ? Math.floor(price10 * (1 - discountRate)) : price10,
                stock: getRandomInt(20, 100)
            });
            volumes.push({
                ml: 20,
                label: "20ml (Chiết)",
                price: price20,
                salePrice: isSale ? Math.floor(price20 * (1 - discountRate)) : price20,
                stock: getRandomInt(10, 80)
            });
            volumes.push({
                ml: 30,
                label: "30ml (Chiết)",
                price: price30,
                salePrice: isSale ? Math.floor(price30 * (1 - discountRate)) : price30,
                stock: getRandomInt(10, 80)
            });
        }
        
        volumes.push({
            ml: 100,
            label: "100ml (Full box)",
            price: basePrice,
            salePrice: salePrice,
            stock: getRandomInt(5, 30)
        });

        // 3 random images
        const imgs = [];
        let tempImages = [...imagesList];
        for (let k = 0; k < 3; k++) {
            const rIdx = Math.floor(Math.random() * tempImages.length);
            imgs.push(tempImages.splice(rIdx, 1)[0]);
        }

        const product = {
            name,
            brand,
            gender,
            type,
            scentCategory,
            scentNotes,
            origin,
            description: `Sản phẩm ${name} cao cấp đến từ thương hiệu ${brand}. Mùi hương đặc trưng của ${scentCategory === 'Go' ? 'Gỗ' : scentCategory === 'Ngot' ? 'Ngọt' : scentCategory} đem lại sự sang trọng và lôi cuốn, phù hợp với ${gender === 'Nam' ? 'nam giới' : gender === 'Nu' ? 'nữ giới' : 'cả nam và nữ'}.`,
            images: imgs,
            volumes,
            price: basePrice,
            salePrice: salePrice,
            stock: volumes[volumes.length - 1].stock, // lay stock cua 100ml làm stock chung root
            rating: getRandomInt(35, 50) / 10, // 3.5 to 5.0
            isHot: Math.random() > 0.7,
            isSale: isSale
        };
        
        products.push(product);
    }
}

const content = `const products = ${JSON.stringify(products, null, 2)};\n\nexport default products;\n`;

fs.writeFileSync(path.join(__dirname, 'data', 'products.js'), content);
console.log("Successfully generated 120 products in products.js");
