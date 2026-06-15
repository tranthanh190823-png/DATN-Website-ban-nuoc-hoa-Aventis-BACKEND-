import Product from '../../models/Product.js';

export const getAdminProducts = async (req, res) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách sản phẩm' });
    }
};

export const createAdminProduct = async (req, res) => {
    try {
        const product = new Product({
            name: 'Tên sản phẩm rỗng',
            price: 0,
            user: req.user._id,
            images: ['https://via.placeholder.com/600'],
            category: 'Chưa phân loại',
            stock: 0,
            salePrice: 0,
            description: 'Mô tả sản phẩm rỗng'
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tạo sản phẩm' });
    }
};

export const updateAdminProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            Object.assign(product, req.body);
            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật sản phẩm' });
    }
};

export const deleteAdminProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await Product.deleteOne({ _id: product._id });
            res.json({ message: 'Đã xóa sản phẩm' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi xóa sản phẩm' });
    }
};
