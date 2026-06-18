import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from "openai";
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Helper to load config
const loadConfig = () => {
  try {
    const configPath = path.join(__dirname, '../chatbox_configs.json');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    return config;
  } catch (error) {
    console.error('❌ Error loading config:', error);
    return null;
  }
};

// Helper to load system prompt
const loadSystemPrompt = () => {  
  try {
    const promptPath = path.join(__dirname, '../system-prompt.txt');
    const prompt = fs.readFileSync(promptPath, 'utf8');
    return prompt;
  } catch (error) {
    console.error('❌ Error loading system prompt:', error);
    return 'Bạn là trợ lý CSKH chuyên nghiệp của cửa hàng nước hoa Aventis.';
  }
};

// @desc    Get chat response from API
// @route   POST /api/chat
// @access  Public
const getChatResponse = async (req, res) => {
  const { messages } = req.body;
  console.log('💬 Incoming chat request with', messages?.length, 'messages');

  try {
    console.log('⏳ Loading config...');
    const chatConfig = loadConfig();
    console.log('⏳ Loading system prompt...');
    const systemPrompt = loadSystemPrompt();

    if (!chatConfig) {
      console.error('❌ No config found');
      return res.status(500).json({ message: 'Failed to load config' });
    }

    // Kiểm tra xem tin nhắn cuối có liên quan đến sản phẩm không
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    let products = [];
    
    if (lastMessage.includes('sản phẩm') || lastMessage.includes('nước hoa') || 
        lastMessage.includes('hot') || lastMessage.includes('bán chạy') ||
        lastMessage.includes('best') || lastMessage.includes('new')) {
      console.log('⏳ Fetching hot products...');
      products = await Product.find({ isActive: true })
        .sort({ isHot: -1, isBestSeller: -1, rating: -1 })
        .limit(4); // Lấy 4 sản phẩm hot nhất
      console.log(`✅ Found ${products.length} products`);
    }

    console.log('⏳ Initializing OpenAI client...');
    const client = new OpenAI({
      apiKey: chatConfig.api_key,
      baseURL: chatConfig.base_url,
    });

    console.log('⏳ Calling API...');
    const startTime = Date.now();
    const response = await client.chat.completions.create({
      model: chatConfig.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt + ' (Trả lời ngắn gọn, tối đa 3-5 câu, không dùng quá nhiều biểu tượng cảm xúc. Nếu đề cập đến sản phẩm, giới thiệu ngắn gọn rồi nói "Dưới đây là một số sản phẩm bạn có thể quan tâm:")',
        },
        ...messages,
      ],
      max_tokens: 500, // Giới hạn độ dài phản hồi
      temperature: 0.7, // Giảm tính ngẫu nhiên để phản hồi nhanh hơn
    });
    const endTime = Date.now();
    console.log(`✅ API responded in ${endTime - startTime}ms`);

    const botResponse = response.choices?.[0]?.message?.content || "Xin lỗi, tôi không thể trả lời bạn lúc này. Vui lòng thử lại sau.";

    console.log('✅ Chat response generated');
    res.json({ 
      response: botResponse,
      products: products.length > 0 ? products.map(p => ({
        _id: p._id,
        name: p.name,
        brand: p.brand,
        images: p.images,
        price: p.salePrice || p.price,
        originalPrice: p.price
      })) : []
    });
  } catch (error) {
    console.error('❌ Error in chat controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export { getChatResponse };
