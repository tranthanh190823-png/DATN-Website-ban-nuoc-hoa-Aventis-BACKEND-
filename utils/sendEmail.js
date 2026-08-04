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

const createTransporterConfig = (forcePort = null) => {
    const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const port = forcePort || Number(process.env.SMTP_PORT) || 465;
    const user = (process.env.SMTP_EMAIL || '').trim();
    // Tự động loại bỏ khoảng trắng nếu dán Mật khẩu ứng dụng dạng "abcd efgh ijkl mnop"
    const pass = (process.env.SMTP_PASSWORD || '').trim().replace(/\s+/g, '');
    const isGmail = host.toLowerCase().includes('gmail');

    const config = {
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        connectionTimeout: 8000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
    };

    if (isGmail && (port === 465 || !process.env.SMTP_PORT)) {
        config.service = 'gmail';
    } else {
        config.host = host;
        config.port = port;
        config.secure = port === 465;
        if (port === 587) {
            config.requireTLS = true;
        }
    }

    return nodemailer.createTransport(config);
};

const getTransporter = () => {
    if (transporter) return transporter;
    transporter = createTransporterConfig();
    return transporter;
};

const sendEmail = async (options, { retries = 2 } = {}) => {
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

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // Attempt 1 uses default transporter, attempt 2 forces SSL 465 / service: 'gmail'
            const currentTransporter = attempt === 1 ? getTransporter() : createTransporterConfig(465);
            const info = await currentTransporter.sendMail(message);
            console.log(
                `✅ Email sent successfully (attempt ${attempt}/${retries}): %s`,
                info.messageId
            );
            return info;
        } catch (error) {
            lastError = error;
            console.error(
                `❌ Error sending email (attempt ${attempt}/${retries}):`,
                error.message
            );
            if (error.code) console.error('   code:', error.code);
            if (error.command) console.error('   command:', error.command);
            if (error.response) console.error('   response:', error.response);

            if (error.code === 'EAUTH' || (error.response && error.response.includes('535'))) {
                throw new Error(
                    'Xác thực Gmail thất bại. Vui lòng kiểm tra Mật khẩu ứng dụng 16 ký tự của Google.'
                );
            }

            if (!isRetryable(error) || attempt === retries) {
                break;
            }

            try {
                if (transporter) transporter.close();
            } catch {
                /* ignore */
            }
            transporter = null;

            const delayMs = 1000 * attempt;
            console.log(`   Retrying sending email in ${delayMs}ms...`);
            await sleep(delayMs);
        }
    }

    throw lastError;
};

export default sendEmail;


