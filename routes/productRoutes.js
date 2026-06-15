import express from 'express';
import { 
    getProducts, 
    getProductById, 
    deleteProduct, 
    createProduct, 
    updateProduct,
    createProductReview,
    getTopProducts,
    getAllReviews,
    updateReviewStatus
} from '../controllers/productController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(getProducts).post(protect, admin, createProduct);
router.get('/top', getTopProducts);
router.get('/reviews/all', protect, admin, getAllReviews);
router.put('/:productId/reviews/:reviewId/status', protect, admin, updateReviewStatus);
router.route('/:id/reviews').post(protect, createProductReview);
router.route('/:id')
    .get(getProductById)
    .delete(protect, admin, deleteProduct)
    .put(protect, admin, updateProduct);

export default router;
