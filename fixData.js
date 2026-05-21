import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import products from './data/products.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extraImages = [
    "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800",
    "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800",
    "https://images.unsplash.com/photo-1615397323114-1e0e181e5927?w=800",
    "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800"
];

// To ensure unique names
const nameSet = new Set();
const uniqueSuffixes = ['EDP', 'EDT', 'Parfum', 'Cologne', 'Intense', 'Elixir', 'Absolu', 'L\'eau'];

products.forEach((p, index) => {
    // 1. Fix Names (ensure unique)
    let baseName = p.name;
    let suffixIdx = 0;
    while(nameSet.has(p.name)) {
        p.name = `${baseName} ${uniqueSuffixes[suffixIdx % uniqueSuffixes.length]} ${Math.floor(suffixIdx / uniqueSuffixes.length) > 0 ? Math.floor(suffixIdx / uniqueSuffixes.length) : ''}`.trim();
        suffixIdx++;
    }
    nameSet.add(p.name);

    // 2. Add Images
    if(p.images.length < 3) {
        p.images.push(extraImages[index % extraImages.length]);
        p.images.push(extraImages[(index + 1) % extraImages.length]);
    }

    // 3. Fix Sale Logic
    if (p.isSale) {
        // Must have discount
        if (p.price <= p.salePrice || !p.salePrice) {
            p.salePrice = Math.floor(p.price * 0.85); // 15% off
        }
    } else {
        // Not on sale, salePrice should equal price
        p.salePrice = p.price;
    }

    // 4. Add Variants and fix variant prices
    const has50ml = p.volumes.find(v => v.ml === 50);
    if (!has50ml) {
        const p50ml = Math.floor(p.price * 0.5);
        p.volumes.splice(3, 0, {
            ml: 50,
            label: "50ml (Chiết)",
            price: p50ml,
            salePrice: p.isSale ? Math.floor(p50ml * 0.85) : p50ml,
            stock: 50
        });
    }

    // Fix volumes salePrice
    p.volumes.forEach(v => {
        if (p.isSale) {
            if (v.price <= v.salePrice || !v.salePrice) {
                v.salePrice = Math.floor(v.price * 0.85);
            }
        } else {
            v.salePrice = v.price;
        }
    });
});

const content = `const products = ${JSON.stringify(products, null, 2)};\n\nexport default products;\n`;

fs.writeFileSync(path.join(__dirname, 'data', 'products.js'), content);
console.log("Fixed products.js successfully.");
