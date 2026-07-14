import FlashSale from '../models/FlashSale.js';

// @desc    Get all flash sales
// @route   GET /api/flash-sales
// @access  Public
const getFlashSales = async (req, res, next) => {
    try {
        const flashSales = await FlashSale.find({}).sort({ createdAt: -1 });
        res.json(flashSales);
    } catch (error) {
        next(error);
    }
};

// @desc    Create a flash sale
// @route   POST /api/flash-sales
// @access  Private/Admin
const createFlashSale = async (req, res, next) => {
    try {
        const { name, startTime, endTime, productIds, status } = req.body;
        const flashSale = new FlashSale({
            name,
            startTime,
            endTime,
            productIds: productIds || [],
            status: status || 'UPCOMING'
        });
        const created = await flashSale.save();
        res.status(201).json(created);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a flash sale
// @route   PUT /api/flash-sales/:id
// @access  Private/Admin
const updateFlashSale = async (req, res, next) => {
    try {
        const { name, startTime, endTime, productIds, status } = req.body;
        const flashSale = await FlashSale.findById(req.params.id);

        if (flashSale) {
            flashSale.name = name || flashSale.name;
            flashSale.startTime = startTime || flashSale.startTime;
            flashSale.endTime = endTime || flashSale.endTime;
            flashSale.status = status || flashSale.status;
            if (productIds) flashSale.productIds = productIds;

            const updated = await flashSale.save();
            res.json(updated);
        } else {
            res.status(404);
            throw new Error('Không tìm thấy Flash Sale');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a flash sale
// @route   DELETE /api/flash-sales/:id
// @access  Private/Admin
const deleteFlashSale = async (req, res, next) => {
    try {
        const flashSale = await FlashSale.findById(req.params.id);
        if (flashSale) {
            await flashSale.deleteOne();
            res.json({ message: 'Đã xóa Flash Sale' });
        } else {
            res.status(404);
            throw new Error('Không tìm thấy Flash Sale');
        }
    } catch (error) {
        next(error);
    }
};

export { getFlashSales, createFlashSale, updateFlashSale, deleteFlashSale };
