import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PRODUCT_INTENT_KEYWORDS = [
  'sản phẩm', 'nước hoa', 'mùi hương', 'hương thơm', 'chai', 'lọ',
  'gợi ý', 'tư vấn', 'recommend', 'đề xuất', 'phù hợp',
  'mua', 'chọn', 'tìm', 'cần', 'muốn', 'thích',
  'gỗ', 'hoa', 'cam chanh', 'tươi', 'ngọt', 'phương đông', 'oriental',
  'floral', 'woody', 'citrus', 'fresh', 'gourmand',
  'edp', 'edt', 'parfum', 'cologne', 'extrait',
  'đi làm', 'hẹn hò', 'tiệc', 'hằng ngày', 'daily', 'office', 'date',
  'nam', 'nữ', 'men', 'women', 'unisex', 'luxury', 'sang', 'cao cấp',
  'hot', 'bán chạy', 'best', 'mới', 'new', 'mới về', 'mới nhất',
  'giá', 'rẻ', 'đắt', 'khuyến mãi', 'sale', 'giảm giá', 'voucher',
  'dior', 'chanel', 'gucci', 'ysl', 'versace', 'armani', 'bvlgari',
  'tom ford', 'creed', 'jo malone', 'le labo', 'paco rabanne',
  'davidoff', 'lancôme', 'giorgio',
];

const ORDER_INTENT_KEYWORDS = [
  'đơn hàng', 'đơn của tôi', 'mã đơn', 'order', 'kiểm tra đơn',
  'giao hàng', 'ship', 'vận chuyển', 'theo dõi', 'tracking',
  'đã nhận', 'giao chưa', 'bao giờ nhận',
];

const TYPE_KEYWORDS = {
  chiết: ['chiết', 'chiet', 'bỏ chai', 'bo chai', 'lọ nhỏ', 'ly nhỏ', 'mini'],
  full: ['full', 'full box', 'hộp đầy', 'đầy hộp', 'chính hãng', 'nguyên seal', 'mới 100%'],
};

const loadConfig = () => {
  try {
    const configPath = path.join(__dirname, '../chatbox_configs.json');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    return {
      ...config,
      api_key: process.env.YESCALE_API_KEY || config.api_key,
    };
  } catch (error) {
    console.error('Error loading chat config:', error);
    return null;
  }
};

const loadSystemPrompt = () => {
  try {
    const promptPath = path.join(__dirname, '../system-prompt.txt');
    return fs.readFileSync(promptPath, 'utf8');
  } catch (error) {
    console.error('Error loading system prompt:', error);
    return 'Bạn là trợ lý CSKH chuyên nghiệp của cửa hàng nước hoa Aventis.';
  }
};

const detectProductType = (text) => {
  const t = text.toLowerCase();
  if (TYPE_KEYWORDS.chiết.some((kw) => t.includes(kw))) return 'Chiết';
  if (TYPE_KEYWORDS.full.some((kw) => t.includes(kw))) return 'Full';
  return null;
};

const detectIntent = (text) => {
  const t = text.toLowerCase();
  if (PRODUCT_INTENT_KEYWORDS.some((k) => t.includes(k))) return 'product';
  if (ORDER_INTENT_KEYWORDS.some((k) => t.includes(k))) return 'order';
  return 'general';
};

const retrieveProducts = async (userText) => {
  try {
    const t = userText.toLowerCase();
    const wantsMale = /\bnam\b|male|men/.test(t);
    const wantsFemale = /\bnữ\b|\bnu\b|female|women/.test(t);

    const familyMap = [
      { kw: 'gỗ', val: 'Go' },
      { kw: 'hoa', val: 'Hoa' },
      { kw: 'cam chanh', val: 'Cam' },
      { kw: 'cam', val: 'Cam' },
      { kw: 'ngọt', val: 'Ngot' },
    ];

    let matchedFamily = null;
    for (const { kw, val } of familyMap) {
      if (t.includes(kw)) {
        matchedFamily = val;
        break;
      }
    }

    const priceMatch = t.match(/(\d+)\s*(k|tr|triệu|000|000đ)?/);
    let maxPrice = null;
    if (priceMatch) {
      const num = parseInt(priceMatch[1]);
      const unit = priceMatch[2] || '';
      if (unit.includes('tr') || unit.includes('triệu')) maxPrice = num * 1_000_000;
      else if (unit === 'k') maxPrice = num * 1_000;
      else if (num > 100) maxPrice = num;
    }

    const productType = detectProductType(t);
    const query = { isActive: true };

    const wantHot = /\bhot\b|bán chạy|\bbest\b|phổ biến|được yêu thích|nổi bật/.test(t);
    const wantNew = /mới về|mới nhất/.test(t);
    const wantSale = /sale|giảm giá|khuyến mãi|voucher/.test(t);

    if (wantHot) query.isBestSeller = true;
    if (wantNew) query.isNewArrival = true;
    if (wantSale) query.isSale = true;
    if (maxPrice) query.price = { $lte: maxPrice };
    if (wantsMale && !wantsFemale) query.gender = { $in: ['Nam', 'Unisex'] };
    if (wantsFemale && !wantsMale) query.gender = { $in: ['Nu', 'Unisex'] };
    if (matchedFamily) query.scentCategory = matchedFamily;
    if (productType) query.type = productType;

    let products = await Product.find(query)
      .sort({ isHot: -1, isBestSeller: -1, isNewArrival: -1, rating: -1 })
      .limit(4)
      .lean();

    if (products.length === 0) {
      products = await Product.find({ isActive: true })
        .sort({ rating: -1 })
        .limit(4)
        .lean();
    }

    return products;
  } catch (error) {
    console.error('Error retrieving products:', error);
    return [];
  }
};

const buildProductContext = (products) => {
  if (!products || products.length === 0) return '';

  const productList = products
    .map((p, i) => {
      let price;
      let originalPrice = '';

      if (p.type === 'Chiết' && p.volumes && p.volumes.length > 0) {
        price = p.volumes[0].salePrice || p.volumes[0].price;
        originalPrice =
          p.volumes[0].price > price
            ? ` (giá gốc ${p.volumes[0].price.toLocaleString('vi-VN')}₫)`
            : '';
      } else {
        price = p.salePrice || p.price;
        originalPrice =
          p.price > price ? ` (giá gốc ${p.price.toLocaleString('vi-VN')}₫)` : '';
      }

      const volumeInfo = p.volumes && p.volumes.length > 0 ? p.volumes[0] : null;
      const volume = volumeInfo ? volumeInfo.label || `${volumeInfo.ml}ml` : null;
      const stockInfo =
        typeof p.stock === 'number' ? (p.stock > 0 ? 'còn hàng' : 'hết hàng') : '';

      return `${i + 1}. **${p.name}** — ${p.brand}${volume ? `, ${volume}` : ''} — ${price.toLocaleString('vi-VN')}₫${originalPrice}${stockInfo ? ` — ${stockInfo}` : ''}${
        p.scentNotes && p.scentNotes.length > 0
          ? ` — Notes: ${p.scentNotes.slice(0, 4).join(', ')}`
          : ''
      }`;
    })
    .join('\n');

  return `\n\n[DỮ LIỆU SẢN PHẨM TỪ DATABASE — dùng thông tin này để tư vấn, không bịa thêm]:\n${productList}`;
};

const trimHistory = (messages, maxTurns = 12) => {
  if (!Array.isArray(messages)) return [];
  return messages.slice(-maxTurns);
};

let cachedModel = null;
let cachedModelAt = 0;
const MODEL_CACHE_TTL_MS = 5 * 60 * 1000;
let circuitOpenUntil = 0;

const isCircuitOpen = () => Date.now() < circuitOpenUntil;

const markCircuitOpen = (durationMs = 5 * 60 * 1000) => {
  circuitOpenUntil = Date.now() + durationMs;
};

const isRetryableAIError = (error) => {
  if (error?.status === 503) return false;

  const retryableStatuses = [429, 500, 502, 504];
  if (retryableStatuses.includes(error?.status)) return true;

  const message = (error?.message || '').toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('overloaded') ||
    message.includes('rate limit')
  );
};

const resolveAvailableModel = async (client, preferredModel) => {
  const now = Date.now();
  if (cachedModel && now - cachedModelAt < MODEL_CACHE_TTL_MS) {
    return cachedModel;
  }

  try {
    const listed = await client.models.list();
    const available = (listed?.data || []).map((item) => item.id).filter(Boolean);

    if (available.length === 0) {
      return preferredModel;
    }

    const resolved = available.includes(preferredModel) ? preferredModel : available[0];
    cachedModel = resolved;
    cachedModelAt = now;
    return resolved;
  } catch (error) {
    console.warn('Could not list AI models, using configured model:', error.message);
    return preferredModel;
  }
};

const callChatCompletionWithRetry = async (client, requestPayload, model, maxRetries = 1) => {
  const baseDelayMs = 1000;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await client.chat.completions.create({ ...requestPayload, model });
    } catch (error) {
      lastError = error;

      if (error?.status === 503) {
        cachedModel = null;
        cachedModelAt = 0;
        markCircuitOpen();
        console.warn(`Model ${model} unavailable (503) — circuit breaker ON, no retry`);
        throw error;
      }

      if (!isRetryableAIError(error) || attempt > maxRetries) {
        throw error;
      }

      console.warn(
        `Model ${model} error (${error.status || 'unknown'}), retry ${attempt}/${maxRetries} in ${baseDelayMs}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs));
    }
  }

  throw lastError || new Error('AI model is unavailable');
};

const buildFallbackResult = (intent, products, lastUserMessage, startTime) => {
  const fallback = buildLocalFallbackResponse(intent, products, lastUserMessage);
  return {
    text: fallback.text,
    products: fallback.products,
    intent,
    latency: Date.now() - startTime,
    source: 'fallback',
  };
};

const formatProductsForClient = (products) => {
  if (!products || products.length === 0) return [];

  return products.map((p) => {
    let price;
    let originalPrice = null;

    if (p.type === 'Chiết' && p.volumes && p.volumes.length > 0) {
      price = p.volumes[0].salePrice || p.volumes[0].price;
      originalPrice = p.volumes[0].price > price ? p.volumes[0].price : null;
    } else {
      price = p.salePrice || p.price;
      originalPrice = p.price > price ? p.price : null;
    }

    return {
      _id: p._id,
      name: p.name,
      brand: p.brand,
      images: p.images,
      price,
      originalPrice,
    };
  });
};

const buildLocalFallbackResponse = (intent, products, lastUserMessage) => {
  const formattedProducts = formatProductsForClient(products);

  if (intent === 'product' && formattedProducts.length > 0) {
    const list = formattedProducts
      .map((p, i) => {
        const priceText = `${p.price.toLocaleString('vi-VN')}₫`;
        const saleText =
          p.originalPrice && p.originalPrice > p.price
            ? ` (giá gốc ${p.originalPrice.toLocaleString('vi-VN')}₫)`
            : '';
        return `${i + 1}. **${p.name}** — ${p.brand} — ${priceText}${saleText}`;
      })
      .join('\n');

    return {
      text:
        `Dạ em xin gợi ý một vài mùi hương phù hợp cho anh/chị ạ:\n\n${list}\n\n` +
        'Anh/chị bấm vào sản phẩm bên dưới để xem chi tiết, hoặc nhắn thêm sở thích (nam/nữ, ngân sách, mùi hương) để em tư vấn kỹ hơn nhé!',
      products: formattedProducts,
    };
  }

  if (intent === 'order') {
    return {
      text:
        'Dạ để kiểm tra đơn hàng, anh/chị vui lòng đăng nhập tài khoản và vào mục **Đơn hàng của tôi** trên website. ' +
        'Nếu cần hỗ trợ gấp, anh/chị liên hệ hotline hoặc fanpage Aventis để nhân viên hỗ trợ ngay ạ.',
      products: [],
    };
  }

  if (lastUserMessage) {
    return {
      text:
        `Dạ em đã nhận được tin nhắn của anh/chị: "${lastUserMessage}". ` +
        'Hiện hệ thống AI đang quá tải, em tạm chưa phản hồi chi tiết được. ' +
        'Anh/chị có thể hỏi về **nước hoa**, **gợi ý mùi hương**, hoặc liên hệ hotline/fanpage để được hỗ trợ ngay ạ.',
      products: [],
    };
  }

  return {
    text:
      'Dạ chào anh/chị! Em là trợ lý Aventis. Anh/chị cần tư vấn nước hoa, gợi ý mùi hương hay hỗ trợ đơn hàng ạ?',
    products: [],
  };
};

export const generateAIResponse = async (messages) => {
  const startTime = Date.now();
  const chatConfig = loadConfig();
  const systemPrompt = loadSystemPrompt();

  if (!chatConfig?.api_key) {
    throw new Error('AI chat config or API key not found');
  }

  const lastUserMessage =
    [...(messages || [])].reverse().find((m) => m.role === 'user')?.content || '';

  const intent = detectIntent(lastUserMessage);

  if (isCircuitOpen()) {
    const remainingSec = Math.ceil((circuitOpenUntil - Date.now()) / 1000);
    console.log(`Circuit breaker active (${remainingSec}s left) — instant fallback, no API call`);
    const products =
      intent === 'product' ? await retrieveProducts(lastUserMessage) : [];
    return buildFallbackResult(intent, products, lastUserMessage, startTime);
  }

  let products = [];
  let productContext = '';

  if (intent === 'product') {
    products = await retrieveProducts(lastUserMessage);
    productContext = buildProductContext(products);
  }

  const finalSystemPrompt =
    systemPrompt +
    (chatConfig.language ? `\n\nNgôn ngữ trả lời bắt buộc: ${chatConfig.language}` : '') +
    productContext;

  const trimmedMessages = trimHistory(messages, 12);

  const client = new OpenAI({
    apiKey: chatConfig.api_key,
    baseURL: chatConfig.base_url,
    timeout: chatConfig.ai_timeout_ms || 12000,
  });

  const requestPayload = {
    messages: [{ role: 'system', content: finalSystemPrompt }, ...trimmedMessages],
    max_tokens: 800,
    temperature: 0.8,
    top_p: 0.9,
    presence_penalty: 0.3,
    frequency_penalty: 0.2,
  };

  try {
    const model = await resolveAvailableModel(client, chatConfig.model);
    const response = await callChatCompletionWithRetry(
      client,
      requestPayload,
      model,
      chatConfig.max_retries ?? 0
    );

    const text =
      response.choices?.[0]?.message?.content ||
      'Xin lỗi anh/chị, mình chưa phản hồi được. Anh/chị thử lại hoặc nhắn fanpage giúp mình nhé.';

    return {
      text,
      products: formatProductsForClient(products),
      intent,
      latency: Date.now() - startTime,
      source: 'ai',
    };
  } catch (error) {
    console.error('AI API failed, using local fallback:', error.message);
    return buildFallbackResult(intent, products, lastUserMessage, startTime);
  }
};