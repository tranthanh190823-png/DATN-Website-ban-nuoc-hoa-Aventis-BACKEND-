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
    // Nodemailer sometimes wraps network errors without a standard code
    const msg = String(error.message || '').toLowerCase();
    return (
        msg.includes('timeout') ||
        msg.includes('eaccess') ||
        msg.includes('econnreset') ||
        msg.includes('socket') ||
        msg.includes('connection')
    );
};

const getTransporter = () => {
    if (transporter) return transporter;

    const port = Number(process.env.SMTP_PORT) || 587;

    // Port 587 + STARTTLS ổn định hơn 465 trên Windows/mạng chặn SSL thuần.
    // family: 4 force IPv4 để tránh lỗi dual-stack (Local undefined:undefined).
    // Timeout dài hơn vì Gmail SMTP trên một số mạng VN rất chậm (60–100s).
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port,
        secure: port === 465,
        requireTLS: port === 587,
        family: 4,
        pool: true,
        maxConnections: 1,
        maxMessages: 20,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
        connectionTimeout: 45000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
    });

    return transporter;
};

const sendEmail = async (options, { retries = 2 } = {}) => {
    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const info = await getTransporter().sendMail(message);
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

            // Auth errors won't fix themselves — fail fast
            if (error.code === 'EAUTH' || !isRetryable(error) || attempt === retries) {
                break;
            }

            // Drop pooled connection so next attempt opens a fresh socket
            try {
                getTransporter().close();
            } catch {
                /* ignore */
            }
            transporter = null;

            const delayMs = 1500 * attempt;
            console.log(`   retrying in ${delayMs}ms...`);
            await sleep(delayMs);
        }
    }

    throw lastError;
};

export default sendEmail;
