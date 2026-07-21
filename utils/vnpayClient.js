import { VNPay, ProductCode, RefundTransactionType, ignoreLogger } from 'vnpay';

let vnpayInstance = null;

export function getVnpayClient() {
    if (vnpayInstance) return vnpayInstance;

    const tmnCode = process.env.VNP_TMN_CODE?.trim();
    const secureSecret = process.env.VNP_HASH_SECRET?.trim();
    const vnpUrl = process.env.VNP_URL?.trim() || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

    if (!tmnCode || !secureSecret) {
        throw new Error('Chưa cấu hình VNP_TMN_CODE hoặc VNP_HASH_SECRET');
    }

    const vnpayHost = vnpUrl.replace(/\/paymentv2\/vpcpay\.html\/?$/, '');

    vnpayInstance = new VNPay({
        tmnCode,
        secureSecret,
        vnpayHost,
        testMode: vnpUrl.includes('sandbox'),
        hashAlgorithm: 'SHA512',
        enableLog: process.env.NODE_ENV === 'development',
        loggerFn: ignoreLogger,
    });

    return vnpayInstance;
}

export { ProductCode, RefundTransactionType };