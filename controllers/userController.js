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
    isStaff: user.isStaff || false,
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
            if (user.isActive === false) {
                res.status(403);
                throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
            }
            res.json(buildAuthResponse(user, res));
        } else if (user && user.googleId) {
            res.status(401);
            throw new Error('Tài khoản này được liên kết với Google. Vui lòng chọn "Đăng nhập bằng Google".');
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
            if (userExists.googleId) {
                throw new Error('Email này đã được liên kết với tài khoản Google. Vui lòng chọn "Đăng nhập bằng Google".');
            }
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
            // Neu user da ton tai nhung khong co googleId
            if (!user.googleId && user.email === normalizedEmail) {
                res.status(400);
                throw new Error('Email nay da duoc dang ky. Vui long dang nhap bang mat khau.');
            }

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

            const updatedUser = await user.save();

            res.json(buildAuthResponse(updatedUser, res));
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
        const staff = await User.find({ isAdmin: true }).select('-password').sort({ createdAt: -1 });
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

        const nameParts = name ? name.split(' ') : ['Admin'];
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

        const staff = await User.create({
            firstName,
            lastName,
            name,
            email,
            password,
            isStaff: true, // Keep isStaff true just in case some other things rely on it
            isAdmin: true
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
            throw new Error('Dữ liệu admin không hợp lệ');
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

        // Tự động nhận diện domain Frontend từ Request Header (Origin/Referer) hoặc ENV
        const requestOrigin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null);
        const frontendUrl = (requestOrigin || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
        const resetUrl = `${frontendUrl}/resetpassword/${resetToken}`;

        const message = `Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu.\n\nHãy truy cập vào đường dẫn sau để đặt lại mật khẩu của bạn:\n\n${resetUrl}`;

        try {
            // Gửi email reset password
            await sendEmail({
                email: user.email,
                subject: 'Yêu cầu đặt lại mật khẩu - DATN Nước Hoa',
                message,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Yêu cầu Đặt Lại Mật Khẩu</h2>
                        <p>Xin chào ${user.name},</p>
                        <p>Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
                        <p style="margin: 20px 0;">
                            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                Đặt Lại Mật Khẩu
                            </a>
                        </p>
                        <p style="color: #666; font-size: 14px;">Hoặc copy link này vào trình duyệt:</p>
                        <p style="color: #666; font-size: 12px; word-break: break-all;">${resetUrl}</p>
                        <p style="color: #666; font-size: 12px; margin-top: 20px;">Link này có hiệu lực trong 10 phút.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #999; font-size: 12px;">Đây là email tự động từ DATN Nước Hoa. Vui lòng không trả lời email này.</p>
                    </div>
                `
            });
            res.status(200).json({ message: 'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email của bạn.' });
        } catch (error) {
            console.error('[ForgotPassword] SMTP error:', error.message);
            if (error.code) console.error('[ForgotPassword] code:', error.code);

            // Dev: giữ token + trả resetUrl để test khi SMTP chậm/chặn (không dùng production)
            if (process.env.NODE_ENV !== 'production') {
                console.warn('[ForgotPassword] DEV fallback — mở link này để reset mật khẩu:');
                console.warn(resetUrl);
                return res.status(200).json({
                    message:
                        'Không gửi được email (môi trường dev). Dùng resetUrl bên dưới hoặc xem console server.',
                    resetUrl,
                    emailError: error.message,
                });
            }

            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            res.status(500);
            throw new Error(`Không thể gửi email: ${error.message || 'Lỗi kết nối SMTP'}. Vui lòng kiểm tra cấu hình SMTP_EMAIL & Mật khẩu ứng dụng Gmail trên Server.`);
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

        res.status(200).json(buildAuthResponse(user, res));
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
