import Banner from '../models/Banner.js';

// @desc    Get all banners
// @route   GET /api/banners
// @access  Public
export const getBanners = async (req, res) => {
    try {
        const banners = await Banner.find({}).sort({ order: 1, createdAt: -1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get active banners
// @route   GET /api/banners/active
// @access  Public
export const getActiveBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a banner
// @route   POST /api/banners
// @access  Private/Admin
export const createBanner = async (req, res) => {
    try {
        const { title, imageUrl, link, isActive, order } = req.body;

        const banner = new Banner({
            title,
            imageUrl,
            link,
            isActive: isActive !== undefined ? isActive : true,
            order: order || 0,
        });

        const createdBanner = await banner.save();
        res.status(201).json(createdBanner);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
export const updateBanner = async (req, res) => {
    try {
        const { title, imageUrl, link, isActive, order } = req.body;

        const banner = await Banner.findById(req.params.id);

        if (banner) {
            banner.title = title || banner.title;
            banner.imageUrl = imageUrl || banner.imageUrl;
            banner.link = link !== undefined ? link : banner.link;
            banner.isActive = isActive !== undefined ? isActive : banner.isActive;
            banner.order = order !== undefined ? order : banner.order;

            const updatedBanner = await banner.save();
            res.json(updatedBanner);
        } else {
            res.status(404).json({ message: 'Banner không tồn tại' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
export const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (banner) {
            await banner.deleteOne();
            res.json({ message: 'Banner đã được xóa' });
        } else {
            res.status(404).json({ message: 'Banner không tồn tại' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
