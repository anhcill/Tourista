package vn.tourista.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.service.FaqService;

import java.util.List;

/**
 * REST API cung cấp FAQ cho frontend hotel/tour detail pages.
 *
 * GET /api/faqs?context=HOTEL   → FAQ theo loại
 * GET /api/faqs?context=TOUR
 * GET /api/faqs                 → Tất cả FAQ
 *
 * POST /api/faqs/ask            → Hỏi Gemini trả lời câu hỏi tùy ý
 */
@RestController
@RequestMapping("/api/faqs")
@RequiredArgsConstructor
public class FaqController {

    private final FaqService faqService;

    /**
     * GET /api/faqs?context=HOTEL|TOUR|GENERAL
     * Lấy danh sách FAQ theo context cho trang chi tiết.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<?>>> getFaqs(
            @RequestParam(required = false) String context) {
        List<?> faqs = faqService.getFaqs(context);
        String source = (context == null || context.isBlank())
                ? "Tat ca FAQ"
                : "FAQ - " + context.toUpperCase();
        return ResponseEntity.ok(ApiResponse.ok(source, faqs));
    }

    /**
     * POST /api/faqs/ask
     * Hỏi AI (Gemini) trả lời câu hỏi tùy ý về hotel/tour.
     * Body: { "question": "...", "context": "HOTEL|TOUR", "conversationContext": "..." }
     */
    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<String>> askQuestion(
            @RequestBody AskFaqRequest req) {
        if (req.question == null || req.question.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("Câu hỏi không được trống"));
        }

        // Luôn dùng keyword matching cục bộ — KHÔNG gọi Gemini
        String answer = faqService.answerQuestion(req.question, req.context, req.conversationContext);
        if (answer == null || answer.isBlank()) {
            answer = faqService.findClosestFaqAnswer(req.question, req.context);
        }

        return ResponseEntity.ok(ApiResponse.ok("Câu trả lời", answer));
    }

    public record AskFaqRequest(
            String question,
            String context,
            String conversationContext
    ) {}
}
