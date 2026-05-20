import express from 'express';
import {
    authUser,
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
} from '../controllers/userController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').post(registerUser).get(protect, admin, getUsers);
router.route('/staff').get(protect, admin, getStaff).post(protect, admin, createStaff);
router.post('/login', authUser);
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);
router.put('/:id/toggle-status', protect, admin, toggleUserStatus);
router.route('/:id')
    .delete(protect, admin, deleteUser)
    .put(protect, admin, updateUser);

export default router;
