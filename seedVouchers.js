import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountPercentage: { type: Number, required: true, min: 0, max: 100 },
  maxDiscountAmount: { type: Number, required: true, default: 0 },
  minOrderValue: { type: Number, required: true, default: 0 },
  expirationDate: { type: Date, required: true },
  usageLimit: { type: Number, required: true, default: 1 },
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Voucher = mongoose.model('Voucher', voucherSchema);

const vouchers = [
  {
    code: 'WELCOME10',
    discountPercentage: 10,
    maxDiscountAmount: 50000,
    minOrderValue: 200000,
    expirationDate: new Date('2027-12-31'),
    usageLimit: 500,
    usedCount: 0,
    isActive: true
  },
  {
    code: 'SALE20',
    discountPercentage: 20,
    maxDiscountAmount: 100000,
    minOrderValue: 400000,
    expirationDate: new Date('2027-12-31'),
    usageLimit: 300,
    usedCount: 0,
    isActive: true
  },
  {
    code: 'VIP30',
    discountPercentage: 30,
    maxDiscountAmount: 200000,
    minOrderValue: 800000,
    expirationDate: new Date('2027-12-31'),
    usageLimit: 100,
    usedCount: 0,
    isActive: true
  },
  {
    code: 'FREESHIP',
    discountPercentage: 5,
    maxDiscountAmount: 30000,
    minOrderValue: 150000,
    expirationDate: new Date('2027-12-31'),
    usageLimit: 999,
    usedCount: 0,
    isActive: true
  },
  {
    code: 'SUMMER50',
    discountPercentage: 50,
    maxDiscountAmount: 300000,
    minOrderValue: 1000000,
    expirationDate: new Date('2026-12-31'),
    usageLimit: 50,
    usedCount: 0,
    isActive: true
  },
  {
    code: 'NEWUSER15',
    discountPercentage: 15,
    maxDiscountAmount: 75000,
    minOrderValue: 300000,
    expirationDate: new Date('2027-06-30'),
    usageLimit: 200,
    usedCount: 0,
    isActive: true
  }
];

async function seedVouchers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Kết nối MongoDB thành công');

    let created = 0;
    let skipped = 0;

    for (const v of vouchers) {
      try {
        await Voucher.create(v);
        console.log(`✅ Đã tạo voucher: ${v.code} (${v.discountPercentage}% giảm, tối đa ${v.maxDiscountAmount.toLocaleString('vi-VN')}₫, đơn tối thiểu ${v.minOrderValue.toLocaleString('vi-VN')}₫)`);
        created++;
      } catch (err) {
        if (err.code === 11000) {
          console.log(`⚠️  Voucher ${v.code} đã tồn tại - bỏ qua`);
          skipped++;
        } else {
          throw err;
        }
      }
    }

    console.log(`\n🎉 Hoàn thành! Đã tạo ${created} voucher mới, bỏ qua ${skipped} voucher đã tồn tại.`);
    console.log('\n📋 Danh sách voucher có thể dùng:');
    console.log('   WELCOME10  - Giảm 10%, tối đa 50.000₫, đơn từ 200.000₫');
    console.log('   SALE20     - Giảm 20%, tối đa 100.000₫, đơn từ 400.000₫');
    console.log('   VIP30      - Giảm 30%, tối đa 200.000₫, đơn từ 800.000₫');
    console.log('   FREESHIP   - Giảm 5%,  tối đa 30.000₫,  đơn từ 150.000₫');
    console.log('   SUMMER50   - Giảm 50%, tối đa 300.000₫, đơn từ 1.000.000₫');
    console.log('   NEWUSER15  - Giảm 15%, tối đa 75.000₫,  đơn từ 300.000₫');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Đã ngắt kết nối MongoDB');
  }
}

seedVouchers();
