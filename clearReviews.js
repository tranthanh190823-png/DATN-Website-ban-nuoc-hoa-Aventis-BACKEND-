import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

import Product from './models/Product.js';

const clearReviews = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const result = await Product.updateMany(
            {},
            { 
                $set: { 
                    reviews: [],
                    rating: 0,
                    numReviews: 0
                } 
            }
        );

        console.log(`Đã xóa tất cả đánh giá cho ${result.modifiedCount} sản phẩm.`);
        process.exit(0);
    } catch (error) {
        console.error('Lỗi:', error);
        process.exit(1);
    }
};

clearReviews();
