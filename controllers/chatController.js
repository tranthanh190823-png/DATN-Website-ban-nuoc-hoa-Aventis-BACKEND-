import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from "openai";
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// ============================================================
// Helpers
// ============================================================

const loadConfig = () => {
  try {
    const configPath = path.join(__dirname, '../chatbox_configs.json');
    const configContent = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('❌ Error loading config:', error);
    return null;
  }
};

const loadSystemPrompt = () => {
  try {
    const promptPath = path.join(__dirname, '../system-prompt.txt');
    return fs.readFileSync(promptPath, 'utf8');
  } catch (error) {
    console.error('❌ Error loading system prompt:', error);
    return 'Bạn là trợ lý CSKH chuyên nghiệp của cửa hàng nước hoa Aventis.';
  }
};

// ============================================================
// Intent detection — khi nào cần lấy sản phẩm từ DB?
// ============================================================

const PRODUCT_INTENT_KEYWORDS = [
  // Từ khóa trực tiếp
  'sản phẩm', 'nước hoa', 'mùi hương', 'hương thơm', 'chai', 'lọ',
  'gợi ý', 'tư vấn', 'recommend', 'đề xuất', 'phù hợp',
  // Hành vi mua
  'mua', 'chọn', 'tìm', 'cần', 'muốn', 'thích',
  // Nhóm hương
  'gỗ', 'hoa', 'cam chanh', 'tươi', 'ngọt', 'phương đông', 'oriental',
  'floral', 'woody', 'citrus', 'fresh', 'gourmand',
  // Nồng độ
  'edp', 'edt', 'parfum', 'cologne', 'extrait',
  // Dịp sử dụng
  'đi làm', 'hẹn hò', 'tiệc', 'hằng ngày', 'daily', 'office', 'date',
  // Phân khúc
  'nam', 'nữ', 'men', 'women', 'unisex', 'luxury', 'sang', 'cao cấp',
  // Sản phẩm nổi bật
  'hot', 'bán chạy', 'best', 'mới', 'new', 'mới về', 'mới nhất',
  // Giá / khuyến mãi
  'giá', 'rẻ', 'đắt', 'khuyến mãi', 'sale', 'giảm giá', 'voucher',
  // Thương hiệu phổ biến
  'dior', 'chanel', 'gucci', 'ysl', 'versace', 'armani', 'bvlgari',
  'tom ford', 'creed', 'jo malone', 'le labo', 'paco rabanne',
  'davidoff', 'lancôme', 'giorgio',
];

const ORDER_INTENT_KEYWORDS = [
  'đơn hàng', 'đơn của tôi', 'mã đơn', 'order', 'kiểm tra đơn',
  'giao hàng', 'ship', 'vận chuyển', 'theo dõi', 'tracking',
  'đã nhận', 'giao chưa', 'bao giờ nhận',
];

// Từ khóa để detect loại sản phẩm: chiết hay full box
const TYPE_KEYWORDS = {
  'chiết': ['chiết', 'chiet', 'bỏ chai', 'bo chai', 'lọ nhỏ', 'ly nhỏ', 'mini'],
  'full': ['full', 'full box', 'hộp đầy', 'đầy hộp', 'chính hãng', 'nguyên seal', 'mới 100%'],
};

const detectProductType = (text) => {
  const t = text.toLowerCase();
  
  // Check chiết
  if (TYPE_KEYWORDS['chiết'].some(kw => t.includes(kw))) return 'Chiết';
  
  // Check full
  if (TYPE_KEYWORDS['full'].some(kw => t.includes(kw))) return 'Full';
  
  return null; // Không xác định
};

const detectIntent = (text) => {
  const t = text.toLowerCase();
  if (PRODUCT_INTENT_KEYWORDS.some((k) => t.includes(k))) return 'product';
  if (ORDER_INTENT_KEYWORDS.some((k) => t.includes(k))) return 'order';
  return 'general';
};

// ============================================================
// RAG — truy xuất sản phẩm thông minh hơn
// ============================================================

const retrieveProducts = async (userText) => {
  try {
    const t = userText.toLowerCase();

    // Detect gender từ câu hỏi (theo schema: 'Nam' | 'Nu' | 'Unisex')
    const wantsMale = /\bnam\b|male|men/.test(t);
    const wantsFemale = /\bnữ\b|\bnu\b|female|women/.test(t);

    // Map scent keyword → value trong DB (schema: 'Hoa' | 'Go' | 'Cam' | 'Ngot')
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

    // Detect price range (VND)
    const priceMatch = t.match(/(\d+)\s*(k|tr|triệu|000|000đ)?/);
    let maxPrice = null;
    if (priceMatch) {
      const num = parseInt(priceMatch[1]);
      const unit = priceMatch[2] || '';
      if (unit.includes('tr') || unit.includes('triệu')) maxPrice = num * 1_000_000;
      else if (unit === 'k') maxPrice = num * 1_000;
      else if (num > 100) maxPrice = num;
    }

    // Detect product type (chiết hay full)
    const productType = detectProductType(t);

    // Build query
    const query = { isActive: true };

    const wantHot = /\bhot\b|bán chạy|\bbest\b|phổ biến|được yêu thích|nổi bật/.test(t);
    const wantNew = /mới về|mới nhất/.test(t);
    const wantSale = /sale|giảm giá|khuyến mãi|voucher/.test(t);

    if (wantHot) query.isBestSeller = true;
    if (wantNew) query.isNewArrival = true;
    if (wantSale) query.isSale = true;

    if (maxPrice) query.price = { $lte: maxPrice };

    // Gender filter theo enum thực tế
    if (wantsMale && !wantsFemale) query.gender = { $in: ['Nam', 'Unisex'] };
    if (wantsFemale && !wantsMale) query.gender = { $in: ['Nu', 'Unisex'] };

    if (matchedFamily) query.scentCategory = matchedFamily;

    // Filter theo type nếu có
    if (productType) {
      query.type = productType;
      console.log(`🔍 Product type detected: ${productType}`);
    }

    let products = await Product.find(query)
      .sort({ isHot: -1, isBestSeller: -1, isNewArrival: -1, rating: -1 })
      .limit(4)
      .lean();

    // Fallback nếu filter quá chặt không ra sản phẩm
    if (products.length === 0) {
      console.log('⚠️ Filter quá chặt, fallback về sản phẩm rating cao');
      products = await Product.find({ isActive: true })
        .sort({ rating: -1 })
        .limit(4)
        .lean();
    }

    return products;
  } catch (error) {
    console.error('❌ Error retrieving products:', error);
    return [];
  }
};

// ============================================================
// Build context message chứa dữ liệu sản phẩm thật
// ============================================================

const buildProductContext = (products) => {
  if (!products || products.length === 0) return '';

  const productList = products
    .map((p, i) => {
      // Lấy giá phù hợp theo type sản phẩm
      let price, originalPrice;
      
      if (p.type === 'Chiết' && p.volumes && p.volumes.length > 0) {
        // Với sản phẩm chiết, lấy giá từ volumes
        price = p.volumes[0].salePrice || p.volumes[0].price;
        originalPrice = p.volumes[0].price > price ? ` (giá gốc ${p.volumes[0].price.toLocaleString('vi-VN')}₫)` : '';
      } else {
        // Với sản phẩm full, lấy giá từ product level
        price = p.salePrice || p.price;
        originalPrice = p.price > price ? ` (giá gốc ${p.price.toLocaleString('vi-VN')}₫)` : '';
      }
      
      // Lấy volume từ volumes array (ưu tiên ml đầu tiên)
      // Nếu có label thì dùng label, nếu không thì dùng ml
      const volumeInfo = p.volumes && p.volumes.length > 0 ? p.volumes[0] : null;
      const volume = volumeInfo ? (volumeInfo.label || `${volumeInfo.ml}ml`) : null;
      const stockInfo =
        typeof p.stock === 'number'
          ? p.stock > 0
            ? `còn hàng`
            : `hết hàng`
          : '';
      return `${i + 1}. **${p.name}** — ${p.brand}${volume ? `, ${volume}` : ''} — ${price.toLocaleString('vi-VN')}₫${originalPrice}${stockInfo ? ` — ${stockInfo}` : ''}${
        p.scentNotes && p.scentNotes.length > 0 ? ` — Notes: ${p.scentNotes.slice(0, 4).join(', ')}` : ''
      }`;
    })
    .join('\n');

  return `\n\n[DỮ LIỆU SẢN PHẨM TỪ DATABASE — dùng thông tin này để tư vấn, không bịa thêm]:\n${productList}`;
};

// ============================================================
// Trim conversation history để tránh vượt token limit
// ============================================================

const trimHistory = (messages, maxTurns = 10) => {
  if (!Array.isArray(messages)) return [];
  // Giữ system + N turn gần nhất
  const trimmed = messages.slice(-maxTurns);
  return trimmed;
};

// ============================================================
// Main controller
// ============================================================

// @desc    Get chat response from API
// @route   POST /api/chat
// @access  Public
const getChatResponse = async (req, res) => {
  const startTime = Date.now();
  const { messages } = req.body;
  console.log('💬 Incoming chat request with', messages?.length, 'messages');

  try {
    const chatConfig = loadConfig();
    const systemPrompt = loadSystemPrompt();

    if (!chatConfig) {
      console.error('❌ No config found');
      return res.status(500).json({ message: 'Failed to load config' });
    }

    // Lấy tin nhắn user mới nhất
    const lastUserMessage =
      [...(messages || [])].reverse().find((m) => m.role === 'user')?.content || '';

    // Detect intent & retrieve products nếu cần
    const intent = detectIntent(lastUserMessage);
    let products = [];
    let productContext = '';

    if (intent === 'product') {
      console.log('🔍 Intent: product — fetching from DB');
      products = await retrieveProducts(lastUserMessage);
      productContext = buildProductContext(products);
      console.log(`✅ Found ${products.length} products`);
    } else {
      console.log('ℹ️ Intent:', intent, '— skipping product retrieval');
    }

    // Build final system prompt (kèm context sản phẩm nếu có)
    const finalSystemPrompt = systemPrompt + productContext;

    // Trim history
    const trimmedMessages = trimHistory(messages, 12);

    // Gọi DeepSeek V3 (qua OpenAI-compatible API)
    console.log('⏳ Calling DeepSeek API...');
    const client = new OpenAI({
      apiKey: chatConfig.api_key,
      baseURL: chatConfig.base_url,
    });

    const response = await client.chat.completions.create({
      model: chatConfig.model,
      messages: [
        { role: 'system', content: finalSystemPrompt },
        ...trimmedMessages,
      ],
      max_tokens: 800, // Tăng từ 500 → 800 để có chỗ cho tư vấn chi tiết
      temperature: 0.8, // Tăng nhẹ từ 0.7 → 0.8 để tự nhiên hơn
      top_p: 0.9,
      presence_penalty: 0.3, // Khuyến khích đa dạng từ ngữ, tránh lặp
      frequency_penalty: 0.2, // Giảm lặp từ
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ API responded in ${elapsed}ms`);

    const botResponse =
      response.choices?.[0]?.message?.content ||
      'Xin lỗi anh/chị, mình chưa phản hồi được. Anh/chị thử lại hoặc nhắn fanpage giúp mình nhé.';

    // Trả về response + products (nếu có) để frontend render card
    return res.json({
      response: botResponse,
      products: products.length > 0
        ? products.map((p) => {
            // Lấy giá phù hợp theo type sản phẩm
            let price, originalPrice;
            
            if (p.type === 'Chiết' && p.volumes && p.volumes.length > 0) {
              // Với sản phẩm chiết, lấy giá từ volumes
              price = p.volumes[0].salePrice || p.volumes[0].price;
              originalPrice = p.volumes[0].price > price ? p.volumes[0].price : null;
            } else {
              // Với sản phẩm full, lấy giá từ product level
              price = p.salePrice || p.price;
              originalPrice = p.price > price ? p.price : null;
            }
            
            return {
              _id: p._id,
              name: p.name,
              brand: p.brand,
              images: p.images,
              price: price,
              originalPrice: originalPrice,
            };
          })
        : [],
      intent,
      latency: elapsed,
    });
  } catch (error) {
    console.error('❌ Error in chat controller:', error);

    // Phân loại lỗi để fallback thông minh
    const isApiError = error?.status >= 400 || error?.code === 'insufficient_quota';

    let userMessage = 'Xin lỗi anh/chị, mình gặp chút trục trặc. Anh/chị thử lại sau ít phút nhé.';
    if (isApiError) {
      userMessage =
        'Hệ thống tư vấn đang bảo trì. Anh/chị liên hệ fanpage hoặc hotline để được hỗ trợ ngay nha.';
    }

    return res.status(500).json({
      message: 'Server error',
      error: error.message,
      fallbackResponse: userMessage,
    });
  }
};

export { getChatResponse };
