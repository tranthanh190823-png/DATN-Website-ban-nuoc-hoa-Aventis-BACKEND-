import request from 'supertest';
import app from '../server.js';
import User from '../models/User.js';

describe('User API Tests', () => {

  beforeEach(async () => {
    await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      phone: '0900000000',
      isAdmin: false
    });
  });

  it('GET /api/users/profile - Yêu cầu token', async () => {
    const res = await request(app).get('/api/users/profile');
    
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Not authorized, no token');
  });

  it('POST /api/users/login - Đăng nhập sai mật khẩu', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });
    
    expect(res.statusCode).toBe(401);
  });
});
