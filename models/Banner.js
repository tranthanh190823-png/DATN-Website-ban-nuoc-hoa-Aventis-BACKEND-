import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        imageUrl: {
            type: String,
            required: true,
        },
        link: {
            type: String,
            required: false,
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
        order: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
