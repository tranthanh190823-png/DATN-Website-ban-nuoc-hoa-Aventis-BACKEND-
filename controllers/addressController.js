import User from '../models/User.js';

// @desc    Get user addresses
// @route   GET /api/addresses
// @access  Private
const getMyAddresses = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            res.json(user.addresses || []);
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new address
// @route   POST /api/addresses
// @access  Private
const createAddress = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (user) {
            const { name, phone, company, address, province, district, ward, provinceName, districtName, wardName, isDefault } = req.body;
            
            const newAddress = {
                name,
                phone,
                company,
                address,
                province,
                district,
                ward,
                provinceName,
                districtName,
                wardName,
                isDefault: isDefault || false
            };

            // Nếu mảng địa chỉ rỗng, tự động set địa chỉ đầu tiên làm mặc định
            if (!user.addresses || user.addresses.length === 0) {
                newAddress.isDefault = true;
            }

            // Nếu tạo địa chỉ mặc định mới, bỏ mặc định ở các địa chỉ cũ
            if (newAddress.isDefault && user.addresses && user.addresses.length > 0) {
                user.addresses.forEach(addr => {
                    addr.isDefault = false;
                });
            }

            user.addresses.push(newAddress);
            await user.save();
            
            // Trả về địa chỉ vừa được thêm
            res.status(201).json(user.addresses[user.addresses.length - 1]);
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update an address
// @route   PUT /api/addresses/:id
// @access  Private
const updateAddress = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (user) {
            const addressId = req.params.id;
            const addressIndex = user.addresses.findIndex(a => a._id.toString() === addressId);
            
            if (addressIndex !== -1) {
                const { name, phone, company, address, province, district, ward, provinceName, districtName, wardName, isDefault } = req.body;
                
                if (isDefault) {
                    // Nếu set làm mặc định, bỏ mặc định các địa chỉ khác
                    user.addresses.forEach(addr => {
                        addr.isDefault = false;
                    });
                    user.addresses[addressIndex].isDefault = true;
                }

                if (name !== undefined) user.addresses[addressIndex].name = name;
                if (phone !== undefined) user.addresses[addressIndex].phone = phone;
                if (company !== undefined) user.addresses[addressIndex].company = company;
                if (address !== undefined) user.addresses[addressIndex].address = address;
                if (province !== undefined) user.addresses[addressIndex].province = province;
                if (district !== undefined) user.addresses[addressIndex].district = district;
                if (ward !== undefined) user.addresses[addressIndex].ward = ward;
                if (provinceName !== undefined) user.addresses[addressIndex].provinceName = provinceName;
                if (districtName !== undefined) user.addresses[addressIndex].districtName = districtName;
                if (wardName !== undefined) user.addresses[addressIndex].wardName = wardName;
                
                await user.save();
                res.json(user.addresses[addressIndex]);
            } else {
                res.status(404);
                throw new Error('Address not found');
            }
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Delete an address
// @route   DELETE /api/addresses/:id
// @access  Private
const deleteAddress = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (user) {
            const addressId = req.params.id;
            const addressIndex = user.addresses.findIndex(a => a._id.toString() === addressId);
            
            if (addressIndex !== -1) {
                const isDeletingDefault = user.addresses[addressIndex].isDefault;
                user.addresses.splice(addressIndex, 1);
                
                // Nếu xóa địa chỉ mặc định và vẫn còn địa chỉ khác, gán địa chỉ đầu tiên làm mặc định
                if (isDeletingDefault && user.addresses.length > 0) {
                    user.addresses[0].isDefault = true;
                }
                
                await user.save();
                res.json({ message: 'Address removed' });
            } else {
                res.status(404);
                throw new Error('Address not found');
            }
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

export { getMyAddresses, createAddress, updateAddress, deleteAddress };
