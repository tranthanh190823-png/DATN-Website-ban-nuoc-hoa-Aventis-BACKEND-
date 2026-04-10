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

        const category = req.query.category ? { category: req.query.category } : {};
        
        const priceFilter = (req.query.minPrice || req.query.maxPrice) ? {
            salePrice: {
                $gte: Number(req.query.minPrice) || 0,
                $lte: Number(req.query.maxPrice) || 100000000
            }
        } : {};

        const count = await Product.countDocuments({ ...keyword, ...category, ...priceFilter });
        const products = await Product.find({ ...keyword, ...category, ...priceFilter })
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

export { getProducts, getProductById };
