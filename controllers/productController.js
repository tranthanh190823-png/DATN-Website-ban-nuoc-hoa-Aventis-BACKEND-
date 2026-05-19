import Product from '../models/Product.js';

// Lấy danh sách sản phẩm
const getProducts = async (req, res) => {
    try {
        const pageSize = 12;
        const page = Number(req.query.pageNumber) || 1;

        const keyword = req.query.keyword ? {
            name: {
                $regex: req.query.keyword,
                $options: 'i'
            }
        } : {};

        let categoryFilter = {};
        if (req.query.category) {
            const cat = req.query.category;
            if (cat === 'Nam' || cat === 'nam') {
                categoryFilter = { gender: 'Nam' };
            } else if (cat === 'Nữ' || cat === 'Nu' || cat === 'nữ' || cat === 'nu') {
                categoryFilter = { gender: 'Nu' };
            } else if (cat === 'Unisex' || cat === 'unisex') {
                categoryFilter = { gender: 'Unisex' };
            } else {
                categoryFilter = { scentCategory: cat };
            }
        }
        
        // Lọc theo dung tích (10, 20, 30, 100)
        let volumeFilter = {};
        if (req.query.volume) {
            const vol = req.query.volume.toLowerCase() === 'full' ? 100 : Number(req.query.volume);
            volumeFilter = { 'volumes.ml': vol };
        }

        const priceFilter = (req.query.minPrice || req.query.maxPrice) ? {
            salePrice: {
                $gte: Number(req.query.minPrice) || 0,
                $lte: Number(req.query.maxPrice) || 100000000
            }
        } : {};

        const filter = { ...keyword, ...categoryFilter, ...priceFilter, ...volumeFilter };

        const count = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({ products, page, pages: Math.ceil(count / pageSize) });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu sản phẩm' });
    }
};

// Lấy chi tiết 1 sản phẩm
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// @desc    Xóa sản phẩm
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await Product.deleteOne({ _id: product._id });
            res.json({ message: 'Sản phẩm đã được xóa' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi xóa sản phẩm' });
    }
};

// @desc    Tạo 1 sản phẩm mới (dữ liệu rỗng mặc định để frontend edit sau)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        const product = new Product({
            name: 'Tên sản phẩm rỗng',
            price: 0,
            user: req.user._id,
            images: ['https://via.placeholder.com/600'],
            category: 'Chưa phân loại',
            stock: 0,
            salePrice: 0,
            description: 'Mô tả sản phẩm rỗng',
            size: 'N/A'
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tạo sản phẩm mới' });
    }
};

// @desc    Cập nhật dữ liệu sản phẩm
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const {
            name,
            brand,
            price,
            salePrice,
            description,
            images,
            category,
            scentNotes,
            stock,
            rating,
            isHot,
            isSale
        } = req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            product.name = name !== undefined ? name : product.name;
            product.brand = brand !== undefined ? brand : product.brand;
            product.price = price !== undefined ? price : product.price;
            product.salePrice = salePrice !== undefined ? salePrice : product.salePrice;
            product.description = description !== undefined ? description : product.description;
            product.images = images !== undefined ? images : product.images;
            product.category = category !== undefined ? category : product.category;
            product.scentNotes = scentNotes !== undefined ? scentNotes : product.scentNotes;
            product.stock = stock !== undefined ? stock : product.stock;
            product.rating = rating !== undefined ? rating : product.rating;
            product.isHot = isHot !== undefined ? isHot : product.isHot;
            product.isSale = isSale !== undefined ? isSale : product.isSale;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật sản phẩm' });
    }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            const alreadyReviewed = product.reviews.find(
                (r) => r.user.toString() === req.user._id.toString()
            );

            if (alreadyReviewed) {
                return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này rồi' });
            }

            const review = {
                name: req.user.name,
                rating: Number(rating),
                comment,
                user: req.user._id,
            };

            product.reviews.push(review);
            product.numReviews = product.reviews.length;

            product.rating =
                product.reviews.reduce((acc, item) => item.rating + acc, 0) /
                product.reviews.length;

            await product.save();
            res.status(201).json({ message: 'Đã thêm đánh giá' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi thêm đánh giá' });
    }
};

// @desc    Get top rated products
// @route   GET /api/products/top
// @access  Public
const getTopProducts = async (req, res) => {
    try {
        const products = await Product.find({}).sort({ rating: -1 }).limit(4);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy sản phẩm nổi bật' });
    }
};

export { 
    getProducts, 
    getProductById, 
    deleteProduct, 
    createProduct, 
    updateProduct,
    createProductReview,
    getTopProducts
};
