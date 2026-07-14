import { generateAIResponse } from '../utils/aiChatService.js';

// @desc    Get chat response from API
// @route   POST /api/chat
// @access  Public
const getChatResponse = async (req, res) => {
  const { messages } = req.body;
  console.log('Incoming chat request with', messages?.length, 'messages');

  try {
    const { text, products, intent, latency } = await generateAIResponse(messages);

    return res.json({
      response: text,
      products,
      intent,
      latency,
    });
  } catch (error) {
    console.error('Error in chat controller:', error);

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