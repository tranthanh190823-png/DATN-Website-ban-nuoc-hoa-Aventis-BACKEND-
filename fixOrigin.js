import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './configs/db.js';
import Product from './models/Product.js';
import products from './data/products.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const brandOriginMap = {
    'AFNAN': 'UAE',
    'CHANEL': 'Pháp',
    'GUCCI': 'Ý',
    'HERMES': 'Pháp',
    'YSL': 'Pháp',
    'DIOR': 'Pháp'
};

const updateOrigins = async () => {
    try {
        await connectDB();

        // Update database
        for (const brand of Object.keys(brandOriginMap)) {
            const origin = brandOriginMap[brand];
            await Product.updateMany({ brand: brand }, { $set: { origin: origin } });
            console.log(`Updated all ${brand} products in DB to origin: ${origin}`);
        }

        // Update local data file
        products.forEach(p => {
            if (brandOriginMap[p.brand]) {
                p.origin = brandOriginMap[p.brand];
            }
        });

        const content = `const products = ${JSON.stringify(products, null, 2)};\n\nexport default products;\n`;
        fs.writeFileSync(path.join(__dirname, 'data', 'products.js'), content);
        console.log("Updated data/products.js successfully.");

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

updateOrigins();
