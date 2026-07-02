import request from 'supertest';
import app from '../server.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

describe('Product API Tests', () => {
  const dummyUser = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    // Thêm một vài sản phẩm mẫu trước khi test
    await Product.create([
      {
        name: 'Test Perfume 1',
        brand: 'DIOR',
        gender: 'Nam',
        origin: 'Pháp',
        scentCategory: 'Go',
        user: dummyUser,
        price: 2500000,
        volumes: [{ ml: 100, label: '100ml', price: 2500000, stock: 10 }],
        description: 'Mùi hương mạnh mẽ',
        isActive: true,
      },
      {
        name: 'Test Perfume 2',
        brand: 'CHANEL',
        gender: 'Nu',
        origin: 'Pháp',
        scentCategory: 'Hoa',
        user: dummyUser,
        price: 3500000,
        volumes: [{ ml: 50, label: '50ml', price: 3500000, stock: 5 }],
        description: 'Mùi hương quyến rũ',
        isActive: true,
      }
    ]);
  });

  it('GET /api/products should return list of products', async () => {
    const res = await request(app).get('/api/products');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.products).toBeDefined();
    expect(res.body.products.length).toBe(2);
    const names = res.body.products.map(p => p.name);
    expect(names).toEqual(expect.arrayContaining(['Test Perfume 1', 'Test Perfume 2']));
  });

  it('GET /api/products/:id should return a specific product', async () => {
    const newProduct = await Product.create({
      name: 'Single Product',
      brand: 'GUCCI',
      gender: 'Unisex',
      origin: 'Ý',
      scentCategory: 'Ngot',
      user: dummyUser,
      price: 1500000,
      description: 'Single test product',
      isActive: true,
    });

    const res = await request(app).get(`/api/products/${newProduct._id}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Single Product');
    expect(res.body.brand).toBe('GUCCI');
  });

  it('GET /api/products/:id should return 404 for non-existent product', async () => {
    const fakeId = '507f1f77bcf86cd799439011'; // valid format objectid
    const res = await request(app).get(`/api/products/${fakeId}`);
    
    expect(res.statusCode).toBe(404);
  });
});
