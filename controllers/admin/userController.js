import User from '../../models/User.js';

export const getAdminUsers = async (req, res) => {
    try {
        const users = await User.find({ isAdmin: false }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const getAdminStaffs = async (req, res) => {
    try {
        const staffs = await User.find({ isStaff: true }).select('-password');
        res.json(staffs);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const createAdminStaff = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }
        const user = await User.create({ firstName, lastName, email, password, isStaff: true });
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isStaff: user.isStaff
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.isActive = !user.isActive;
            await user.save();
            res.json({ message: 'Cập nhật trạng thái thành công' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy user' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const deleteAdminUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await User.deleteOne({ _id: user._id });
            res.json({ message: 'Đã xóa người dùng' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy user' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
