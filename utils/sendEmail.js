import nodemailer from 'nodemailer';

const RETRYABLE_CODES = new Set([
    'ECONNECTION',
    'ETIMEDOUT',
    'ESOCKET',
    'ECONNRESET',
    'ECONNREFUSED',
    'EAI_AGAIN',
    'EACCES',
    'EENVELOPE',
    'ETLS',
    'EDNS',
]);

let transporter = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryable = (error) => {
    if (!error) return false;
    if (error.code && RETRYABLE_CODES.has(error.code)) return true;
    const msg = String(error.message || '').toLowerCase();
    return (
        msg.includes('timeout') ||
        msg.includes('eaccess') ||
        msg.includes('econnreset') ||
        msg.includes('socket') ||
        msg.includes('connection')
    );
};

const createTransporterConfig = (strategyIndex = 0) => {
    const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const user = (process.env.SMTP_EMAIL || '').trim();
    const pass = (process.env.SMTP_PASSWORD || '').trim().replace(/\s+/g, '');
    const isGmail = host.toLowerCase().includes('gmail');

    // Các cấu hình thử nghiệm tương thích với mọi loại mạng/cổng
    // Strategy 0: Cổng 465 (SSL)
    // Strategy 1: Cổng 587 (STARTTLS)
    // Strategy 2: Cổng 25 (Standard SMTP)
    const strategies = [
        { port: 465, secure: true },
        { port: 587, secure: false, requireTLS: true },
        { port: 25, secure: false }
    ];

    const currentStrategy = strategies[strategyIndex % strategies.length];
    const port = Number(process.env.SMTP_PORT) || currentStrategy.port;
    const secure = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) === 465 : currentStrategy.secure;

    const config = {
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        pool: false, // Dùng kết nối đơn lẻ để xoay cổng nhanh hơn khi bị chặn
        connectionTimeout: 4000, // Timeout ngắn 4s để nhanh chuyển cổng khác nếu bị tường lửa chặn
        greetingTimeout: 3000,
        socketTimeout: 5000,
    };

    if (isGmail && strategyIndex === 0 && (!process.env.SMTP_PORT || process.env.SMTP_PORT === '465')) {
        config.service = 'gmail';
    } else {
        config.host = host;
        config.port = port;
        config.secure = secure;
        if (currentStrategy.requireTLS) {
            config.requireTLS = true;
        }
    }

    return nodemailer.createTransport(config);
};

const sendEmail = async (options, { retries = 3 } = {}) => {
    const smtpEmail = (process.env.SMTP_EMAIL || '').trim();
    const fromName = process.env.FROM_NAME || 'Aventis';
    const fromEmail = (process.env.FROM_EMAIL || smtpEmail).trim();

    if (!smtpEmail || !process.env.SMTP_PASSWORD) {
        throw new Error(
            'Chưa cấu hình biến môi trường SMTP_EMAIL hoặc SMTP_PASSWORD.'
        );
    }

    const message = {
        from: `"${fromName}" <${fromEmail}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    let lastError;

    // Thử lần lượt các chiến lược cổng: 465 (SSL) -> 587 (TLS) -> 25 (Standard)
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const currentTransporter = createTransporterConfig(attempt);
            const info = await currentTransporter.sendMail(message);
            console.log(
                `✅ Email sent successfully via strategy ${attempt + 1}: %s`,
                info.messageId
            );
            return info;
        } catch (error) {
            lastError = error;
            console.error(
                `❌ Error sending email (attempt ${attempt + 1}/${retries}):`,
                error.message
            );

            if (error.code === 'EAUTH' || (error.response && error.response.includes('535'))) {
                throw new Error(
                    'Xác thực Gmail thất bại. Vui lòng kiểm tra Mật khẩu ứng dụng 16 ký tự của Google.'
                );
            }

            if (attempt < retries - 1) {
                console.log(`   🔄 Swapping SMTP strategy / port for retry ${attempt + 2}...`);
                await sleep(500);
            }
        }
    }

    throw lastError;
};

export default sendEmail;


