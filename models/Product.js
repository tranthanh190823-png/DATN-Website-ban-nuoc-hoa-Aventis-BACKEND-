import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    salePrice: { type: Number },
    description: { type: String },
    images: [{ type: String }],
    category: { type: String },
    scentNotes: [String],
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    isHot: { type: Boolean, default: false },
    isSale: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
