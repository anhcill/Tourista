package vn.tourista.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.tourista.dto.request.ValidatePromoRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.PromotionResponse;
import vn.tourista.dto.response.PromoValidationResponse;
import vn.tourista.service.PromotionService;

import java.util.List;

@RestController
@RequestMapping("/api")
public class PromotionController {

    @Autowired
    private PromotionService promotionService;

    @GetMapping("/promotions")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> getActivePromotions() {
        List<PromotionResponse> promotions = promotionService.getActivePromotions();
        return ResponseEntity.ok(ApiResponse.success(promotions));
    }

    @PostMapping("/promotions/validate")
    public ResponseEntity<ApiResponse<PromoValidationResponse>> validatePromo(
            @Valid @RequestBody ValidatePromoRequest request) {
        PromoValidationResponse result = promotionService.validatePromo(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
