import News from '../models/News.js';

// @desc    Get all news
// @route   GET /api/news
// @access  Public
const getNews = async (req, res, next) => {
    try {
        const news = await News.find({}).sort({ createdAt: -1 });
        res.json(news);
    } catch (error) {
        next(error);
    }
};

// @desc    Create a news
// @route   POST /api/news
// @access  Private/Admin
const createNews = async (req, res, next) => {
    try {
        const { title, content, imageUrl, status } = req.body;
        const news = new News({
            title,
            content,
            imageUrl,
            status: status || 'ACTIVE'
        });
        const createdNews = await news.save();
        res.status(201).json(createdNews);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a news
// @route   PUT /api/news/:id
// @access  Private/Admin
const updateNews = async (req, res, next) => {
    try {
        const { title, content, imageUrl, status } = req.body;
        const news = await News.findById(req.params.id);

        if (news) {
            news.title = title || news.title;
            news.content = content || news.content;
            news.imageUrl = imageUrl || news.imageUrl;
            news.status = status || news.status;

            const updatedNews = await news.save();
            res.json(updatedNews);
        } else {
            res.status(404);
            throw new Error('Không tìm thấy tin tức');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a news
// @route   DELETE /api/news/:id
// @access  Private/Admin
const deleteNews = async (req, res, next) => {
    try {
        const news = await News.findById(req.params.id);
        if (news) {
            await news.deleteOne();
            res.json({ message: 'Đã xóa tin tức' });
        } else {
            res.status(404);
            throw new Error('Không tìm thấy tin tức');
        }
    } catch (error) {
        next(error);
    }
};

export { getNews, createNews, updateNews, deleteNews };
