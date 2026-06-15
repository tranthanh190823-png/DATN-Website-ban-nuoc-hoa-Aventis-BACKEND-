import Product from '../../models/Product.js';

export const getAdminReviews = async (req, res) => {
    try {
        const products = await Product.find({ 'reviews.0': { $exists: true } }).select('name reviews');
        let allReviews = [];
        products.forEach(product => {
            product.reviews.forEach(review => {
                allReviews.push({
                    _id: review._id,
                    productId: product._id,
                    productName: product.name,
                    user: review.user,
                    name: review.name,
                    rating: review.rating,
                    comment: review.comment,
                    createdAt: review.createdAt
                });
            });
        });
        allReviews.sort((a, b) => b.createdAt - a.createdAt);
        res.json(allReviews);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const deleteAdminReview = async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if (product) {
            const reviewIndex = product.reviews.findIndex(r => r._id.toString() === req.params.reviewId.toString());
            if (reviewIndex === -1) {
                return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
            }
            product.reviews.splice(reviewIndex, 1);
            product.numReviews = product.reviews.length;
            product.rating = product.reviews.length > 0 ? product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length : 0;
            await product.save();
            res.json({ message: 'Đã xóa đánh giá' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
