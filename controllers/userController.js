import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const buildAuthResponse = (user, res) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    addresses: user.addresses,
    defaultAddress: user.defaultAddress,
    isAdmin: user.isAdmin,
    token: generateToken(res, user._id)
});

const splitName = (fullName, fallbackName = 'Unknown') => {
    const safeName = fullName?.trim() || fallbackName;
    const nameParts = safeName.split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

    return {
        firstName,
        lastName,
        name: safeName
    };
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json(buildAuthResponse(user, res));
        } else {
            res.status(401);
            throw new Error('Email hoặc mật khẩu không chính xác');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400);
            throw new Error('Email này đã được sử dụng');
        }

        const { firstName, lastName, name: normalizedName } = splitName(name);

        const user = await User.create({
            firstName,
            lastName,
            name: normalizedName,
            email,
            password
        });

        if (user) {
            res.status(201).json(buildAuthResponse(user, res));
        } else {
            res.status(400);
            throw new Error('Dữ liệu không hợp lệ');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Authenticate/Register user with Google
// @route   POST /api/users/google
// @access  Public
const authWithGoogle = async (req, res, next) => {
    try {
        const { credential } = req.body;

        if (!process.env.GOOGLE_CLIENT_ID) {
            res.status(500);
            throw new Error('Google login is not configured on the server');
        }

        if (!credential) {
            res.status(400);
            throw new Error('Google credential is required');
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (!payload?.email || !payload.sub) {
            res.status(400);
            throw new Error('Invalid Google account data');
        }

        if (!payload.email_verified) {
            res.status(400);
            throw new Error('Google email is not verified');
        }

        const normalizedEmail = payload.email.toLowerCase().trim();
        const googleProfile = splitName(payload.name || payload.given_name || normalizedEmail.split('@')[0]);

        let user = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { googleId: payload.sub }
            ]
        });

        if (user) {
            user.email = normalizedEmail;
            user.googleId = payload.sub;
            user.googleAvatar = payload.picture || user.googleAvatar;
            user.avatar = user.avatar || payload.picture;

            if (!user.firstName || !user.lastName) {
                user.firstName = googleProfile.firstName;
                user.lastName = googleProfile.lastName;
            }

            if (!user.name) {
                user.name = googleProfile.name;
            }

            await user.save();
        } else {
            user = await User.create({
                firstName: googleProfile.firstName,
                lastName: googleProfile.lastName,
                name: googleProfile.name,
                email: normalizedEmail,
                googleId: payload.sub,
                googleAvatar: payload.picture,
                avatar: payload.picture
            });
        }

        res.status(200).json(buildAuthResponse(user, res));
    } catch (error) {
        next(error);
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                addresses: user.addresses,
                defaultAddress: user.defaultAddress,
                isAdmin: user.isAdmin,
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            if (req.body.name) {
                user.name = req.body.name;
                const nameParts = req.body.name.split(' ');
                user.firstName = nameParts[0];
                user.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];
            }
            
            user.email = req.body.email || user.email;

            if (req.body.phone !== undefined) {
                user.phone = req.body.phone;
            }

            if (req.body.password) {
                if (!req.body.currentPassword) {
                    res.status(400);
                    throw new Error('Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu');
                }
                const isMatch = await user.matchPassword(req.body.currentPassword);
                if (!isMatch) {
                    res.status(400);
                    throw new Error('Mật khẩu hiện tại không đúng');
                }
                user.password = req.body.password;
            }

            if (req.body.addresses) {
                user.addresses = req.body.addresses;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                addresses: updatedUser.addresses,
                defaultAddress: updatedUser.defaultAddress,
                isAdmin: updatedUser.isAdmin,
                token: generateToken(res, updatedUser._id)
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all staff
// @route   GET /api/users/staff
// @access  Private/Admin
const getStaff = async (req, res, next) => {
    try {
        const staff = await User.find({ isStaff: true }).select('-password').sort({ createdAt: -1 });
        res.json(staff);
    } catch (error) {
        next(error);
    }
};

// @desc    Create staff account
// @route   POST /api/users/staff
// @access  Private/Admin
const createStaff = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            throw new Error('Email đã tồn tại');
        }

        const nameParts = name ? name.split(' ') : ['Nhân viên'];
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

        const staff = await User.create({
            firstName,
            lastName,
            name,
            email,
            password,
            isStaff: true,
            isAdmin: false
        });

        if (staff) {
            res.status(201).json({
                _id: staff._id,
                name: staff.name,
                email: staff.email,
                isAdmin: staff.isAdmin,
                isStaff: staff.isStaff
            });
        } else {
            res.status(400);
            throw new Error('Dữ liệu nhân viên không hợp lệ');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Toggle user active status (khoá / mở khoá)
// @route   PUT /api/users/:id/toggle-status
// @access  Private/Admin
const toggleUserStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404);
            throw new Error('Không tìm thấy tài khoản');
        }
        if (user.isAdmin) {
            res.status(400);
            throw new Error('Không thể khoá tài khoản admin');
        }
        user.isActive = !user.isActive;
        await user.save();
        res.json({ _id: user._id, isActive: user.isActive, message: user.isActive ? 'Tài khoản đã mở khoá' : 'Tài khoản đã bị khoá' });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await User.deleteOne({ _id: user._id });
            res.json({ message: 'User removed' });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
            user.isStaff = req.body.isStaff !== undefined ? req.body.isStaff : user.isStaff;

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                isAdmin: updatedUser.isAdmin,
                isStaff: updatedUser.isStaff,
                isActive: updatedUser.isActive
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Forgot Password
// @route   POST /api/users/forgotpassword
// @access  Public
const forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            res.status(404);
            throw new Error('Không có tài khoản nào sử dụng email này');
        }

        // Tạo token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Tạo URL reset password (Thay http://localhost:3000 bằng URL thật khi deploy)
        const resetUrl = `http://localhost:3000/resetpassword/${resetToken}`;

        const message = `Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu.\n\nHãy truy cập vào đường dẫn sau để đặt lại mật khẩu của bạn:\n\n${resetUrl}`;
        
        // Log URL ra console để dễ test trong môi trường dev
        console.log(`\n\n---------------------------------`);
        console.log(`🔗 Link Đặt Lại Mật Khẩu: \n${resetUrl}`);
        console.log(`---------------------------------\n\n`);

        try {
            // Tạm thời comment lại phần gửi mail thực tế để test dễ dàng
            /*
            await sendEmail({
                email: user.email,
                subject: 'Yêu cầu đặt lại mật khẩu',
                message
            });
            */
            // Giả lập gửi thành công
            res.status(200).json({ message: 'Email đã được gửi (Check Terminal để lấy Link)' });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            res.status(500);
            throw new Error('Không thể gửi email');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Reset Password
// @route   PUT /api/users/resetpassword/:token
// @access  Public
const resetPassword = async (req, res, next) => {
    try {
        // Hash lại token từ param để so sánh với db
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            res.status(400);
            throw new Error('Token không hợp lệ hoặc đã hết hạn');
        }

        // Đặt lại mật khẩu (schema sẽ tự hash)
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(res, user._id)
        });
    } catch (error) {
        next(error);
    }
};

export {
    authUser,
    authWithGoogle,
    registerUser,
    getUserProfile,
    updateUserProfile,
    getUsers,
    getStaff,
    createStaff,
    toggleUserStatus,
    deleteUser,
    updateUser,
    forgotPassword,
    resetPassword
};
