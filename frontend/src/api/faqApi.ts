import axios from './axiosClient';

const faqApi = {
    /**
     * GET /api/faqs?context=HOTEL|TOUR|GENERAL
     * Lấy danh sách FAQ theo context.
     */
    getFaqs: (context?: string) =>
        axios.get('/faqs', {
            params: context ? { context } : {},
        }),

    /**
     * POST /api/faqs/ask
     * Hỏi AI trả lời câu hỏi tùy ý.
     */
    askQuestion: (question: string, context?: string, conversationContext?: string) =>
        axios.post('/faqs/ask', {
            question,
            context: context || null,
            conversationContext: conversationContext || null,
        }),
};

export default faqApi;
