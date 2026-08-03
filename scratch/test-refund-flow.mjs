/**
 * Integration test: refund request flow
 * Starts BE if needed, creates test order if missing
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE = 'http://localhost:5000/api';

let beProcess = null;

async function api(method, p, { token, body } = {}) {
  const res = await fetch(`${BASE}${p}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function waitForBe(maxMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const r = await fetch(`${BASE}/products?keyword=test`);
      if (r.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function startBeIfNeeded() {
  try {
    const r = await fetch(`${BASE}/products?keyword=test`);
    if (r.ok) {
      console.log('BE already running');
      return;
    }
  } catch {}

  console.log('Starting BE...');
  beProcess = spawn('node', ['server.js'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  beProcess.stdout.on('data', (d) => process.stdout.write(`[BE] ${d}`));
  beProcess.stderr.on('data', (d) => process.stderr.write(`[BE] ${d}`));

  if (!(await waitForBe())) throw new Error('BE failed to start');
  console.log('BE started');
}

async function login(email, password) {
  const { status, data } = await api('POST', '/users/login', { body: { email, password } });
  if (status !== 200 || !data.token) {
    throw new Error(`Login failed ${email}: ${status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function createTestOrder(userToken) {
  const { data: productRes } = await api('GET', '/products?keyword=');
  const product = productRes?.products?.[0];
  if (!product) throw new Error('No products in DB');

  const price = product.salePrice || product.price || 100000;
  const payload = {
    orderItems: [{
      name: product.name,
      qty: 1,
      image: product.images?.[0] || '',
      price,
      product: product._id,
      volume: product.volumes?.[0]?.ml,
    }],
    shippingAddress: {
      address: '123 Test St',
      city: 'Ho Chi Minh',
      postalCode: '700000',
      country: 'Vietnam',
    },
    paymentMethod: 'COD',
    itemsPrice: price,
    shippingPrice: 0,
    totalPrice: price,
  };

  const { status, data } = await api('POST', '/orders', { token: userToken, body: payload });
  if (status !== 201) throw new Error(`Create order failed: ${JSON.stringify(data)}`);
  console.log('Created test order:', data._id);
  return data._id;
}

async function prepareOrder(adminToken, userToken, userId) {
  const { data: orders } = await api('GET', '/orders', { token: adminToken });
  let order = orders.find(
    (o) =>
      (String(o.user?._id) === String(userId) || o.user?.email === 'nguyenvanan@gmail.com') &&
      o.isPaid &&
      !o.isRefunded &&
      !o.isCancelled &&
      ['Đã xử lý', 'Đang giao', 'Đã giao'].includes(o.status) &&
      o.refundRequestStatus !== 'pending'
  );

  let orderId = order?._id;
  if (!orderId) {
    orderId = await createTestOrder(userToken);
    order = { _id: orderId, status: 'Chờ xử lý', isPaid: false };
  }

  if (!order.isPaid) {
    const pay = await api('PUT', `/orders/${orderId}/pay`, { token: userToken, body: { id: 'TEST' } });
    if (pay.status !== 200) throw new Error(`Pay failed: ${JSON.stringify(pay.data)}`);
    order.isPaid = true;
    order.status = order.status || 'Chờ xử lý';
  }

  const transitions = [];
  const st = order.status;
  if (st === 'Chờ xử lý') transitions.push('process', 'ship', 'deliver');
  else if (st === 'Đã xử lý') transitions.push('ship', 'deliver');
  else if (st === 'Đang giao') transitions.push('deliver');

  for (const action of transitions) {
    const path =
      action === 'process' ? `/orders/${orderId}/process` :
      action === 'ship' ? `/orders/${orderId}/ship` :
      `/orders/${orderId}/deliver`;
    const r = await api('PUT', path, { token: adminToken });
    console.log(`  ${action}:`, r.status);
    if (r.status !== 200) throw new Error(`${action} failed: ${JSON.stringify(r.data)}`);
  }

  return orderId;
}

async function main() {
  console.log('--- Refund request flow test ---\n');
  await startBeIfNeeded();

  const user = await login('nguyenvanan@gmail.com', 'User@2026');
  const admin = await login('admin@nuochoa.vn', 'Admin@2026');
  console.log('Logged in:', user.name);

  const orderId = await prepareOrder(admin.token, user.token, user._id);
  console.log('Test order:', orderId, '\n');

  const steps = [
    ['[1] request-refund', 'PUT', `/orders/${orderId}/request-refund`, user.token,
      { reason: 'Sản phẩm không đúng mô tả, yêu cầu hoàn tiền' }, 200],
    ['[2] duplicate request', 'PUT', `/orders/${orderId}/request-refund`, user.token,
      { reason: 'Lý do trùng lặp không được chấp nhận' }, 400],
    ['[3] reject', 'PUT', `/orders/${orderId}/refund-request/reject`, admin.token,
      { note: 'Không đủ điều kiện đổi trả (test)' }, 200],
    ['[4] re-request', 'PUT', `/orders/${orderId}/request-refund`, user.token,
      { reason: 'Giao sai sản phẩm, đề nghị hoàn tiền lần 2' }, 200],
    ['[5] approve', 'PUT', `/orders/${orderId}/refund-request/approve`, admin.token,
      { cancelOrder: true }, 200],
  ];

  let finalOrder = null;
  for (const [label, method, p, token, body, expect] of steps) {
    const r = await api(method, p, { token, body });
    console.log(label + ':', r.status, r.data.message || '');
    if (r.status !== expect) throw new Error(`${label} expected ${expect}, got ${r.status}: ${JSON.stringify(r.data)}`);
    if (label === '[5] approve') finalOrder = r.data.order;
  }

  console.log('\n[RESULT]');
  console.log('  isRefunded:', finalOrder.isRefunded);
  console.log('  refundRequestStatus:', finalOrder.refundRequestStatus);
  console.log('  isCancelled:', finalOrder.isCancelled);
  console.log('  refundAmount:', finalOrder.refundAmount);

  if (!finalOrder.isRefunded) throw new Error('Not refunded');

  console.log('\n✅ All refund flow steps passed');
}

main()
  .catch((err) => {
    console.error('\n❌ Test failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => {
    if (beProcess) beProcess.kill();
  });